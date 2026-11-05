import { Buffer } from "node:buffer";

const endpoint = process.env.VNX_MCP_URL;
const authorization = process.env.VNX_MCP_AUTHORIZATION;
const pagespeedKey = process.env.VNX_MCP_PAGESPEED_KEY;

if (!endpoint || !authorization || !pagespeedKey) {
  console.error("Missing VNX_MCP_URL, VNX_MCP_AUTHORIZATION, or VNX_MCP_PAGESPEED_KEY");
  process.exit(1);
}

let sessionId = "";
let protocolVersion = "";
let buffer = Buffer.alloc(0);

function writeMessage(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function forward(message) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: authorization,
    "X-Pagespeed-Api-Key": pagespeedKey,
  };

  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }
  if (protocolVersion) {
    headers["MCP-Protocol-Version"] = protocolVersion;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });

  const nextSession = response.headers.get("mcp-session-id");
  if (nextSession) {
    sessionId = nextSession;
  }

  if (response.status === 202 || response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    if (message.id === undefined) {
      return null;
    }
    return {
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32000, message: `Upstream HTTP ${response.status}` },
    };
  }

  if (message.method === "initialize" && parsed.result) {
    const requested = message.params?.protocolVersion;
    if (requested) {
      parsed.result.protocolVersion = requested;
      protocolVersion = requested;
    }
  }

  return parsed;
}

function readMessage() {
  if (buffer.length === 0) {
    return null;
  }

  if (buffer[0] === 0x7b) {
    const end = buffer.indexOf(0x0a);
    if (end === -1) {
      return null;
    }
    const line = buffer.subarray(0, end).toString("utf8").replace(/\r$/, "");
    buffer = buffer.subarray(end + 1);
    if (!line.trim()) {
      return readMessage();
    }
    return JSON.parse(line);
  }

  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    return null;
  }

  const header = buffer.subarray(0, headerEnd).toString("utf8");
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    throw new Error("Missing Content-Length");
  }

  const length = Number(match[1]);
  const start = headerEnd + 4;
  if (buffer.length < start + length) {
    return null;
  }

  const body = buffer.subarray(start, start + length).toString("utf8");
  buffer = buffer.subarray(start + length);
  return JSON.parse(body);
}

async function drain() {
  while (true) {
    const message = readMessage();
    if (!message) {
      return;
    }

    try {
      const result = await forward(message);
      if (result) {
        writeMessage(result);
      }
    } catch (error) {
      if (message.id !== undefined) {
        writeMessage({
          jsonrpc: "2.0",
          id: message.id,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : "Bridge request failed",
          },
        });
      }
    }
  }
}

let pending = Promise.resolve();

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  pending = pending.then(drain).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
  });
});

process.stdin.on("end", () => {
  pending.finally(() => process.exit(0));
});
