#!/usr/bin/env node
/**
 * One measurement pass for a URL: PageSpeed Insights and a real Chrome load run together.
 * A second pass is a failed run, not a way to collect a missing LCP.
 */

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9341;
const PAGE_URL_FLAG = "--url";
const CLS_SETTLE_MS = 3000;

const PROFILES = [
  {
    name: "desktop",
    width: 1350,
    height: 900,
    dpr: 1,
    mobile: false,
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  },
  {
    name: "mobile",
    width: 412,
    height: 823,
    dpr: 1.75,
    mobile: true,
    ua: "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  },
];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return fallback;
  return process.argv[i + 1];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readPagespeedKey(doPath) {
  const text = fs.readFileSync(doPath, "utf8");
  const line = text.split("\n").find((row) => /^\|\s*API key PageSpeed/.test(row));
  if (!line) return "";
  const cell = (line.split("|")[2] || "").replace(/[`\s]/g, "");
  if (!cell || cell.startsWith("[")) return "";
  return cell;
}

function redact(text, key) {
  let out = String(text || "");
  if (key) out = out.split(key).join("[redacted]");
  return out.replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted]");
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
  });
}

function runCurl(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stderr }));
  });
}

class Cdp {
  constructor() {
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.buf = Buffer.alloc(0);
    this.opened = false;
  }

  connect(wsUrl) {
    const endpoint = new URL(wsUrl);
    return new Promise((resolve, reject) => {
      this.socket = net.connect(Number(endpoint.port), "127.0.0.1", () => {
        const key = crypto.randomBytes(16).toString("base64");
        this.socket.write(
          `GET ${endpoint.pathname} HTTP/1.1\r\n` +
            `Host: 127.0.0.1:${endpoint.port}\r\n` +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            `Sec-WebSocket-Key: ${key}\r\n` +
            "Sec-WebSocket-Version: 13\r\n\r\n"
        );
      });
      this.socket.on("error", reject);
      this.socket.on("data", (chunk) => {
        this.buf = Buffer.concat([this.buf, chunk]);
        if (!this.opened) {
          const idx = this.buf.indexOf("\r\n\r\n");
          if (idx < 0) return;
          const head = this.buf.slice(0, idx).toString();
          if (!/101/.test(head)) {
            reject(new Error(head.slice(0, 180)));
            return;
          }
          this.opened = true;
          this.buf = this.buf.slice(idx + 4);
          resolve();
        }
        this.drain();
      });
    });
  }

  drain() {
    while (this.buf.length >= 2) {
      const op = this.buf[0] & 0x0f;
      const masked = (this.buf[1] & 0x80) !== 0;
      let len = this.buf[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (this.buf.length < 4) return;
        len = this.buf.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) return;
        len = Number(this.buf.readBigUInt64BE(2));
        off = 10;
      }
      const maskLen = masked ? 4 : 0;
      if (this.buf.length < off + maskLen + len) return;
      let payload = this.buf.slice(off + maskLen, off + maskLen + len);
      if (masked) {
        const mask = this.buf.slice(off, off + 4);
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
      }
      this.buf = this.buf.slice(off + maskLen + len);
      if (op === 9) {
        this.sendRaw(Buffer.alloc(0), 0x8a);
        continue;
      }
      if (op !== 1) continue;
      let msg;
      try {
        msg = JSON.parse(payload.toString());
      } catch (err) {
        continue;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const waiter = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) waiter.reject(new Error(JSON.stringify(msg.error)));
        else waiter.resolve(msg.result || {});
      } else if (msg.method) {
        this.events.push(msg);
      }
    }
  }

  sendRaw(data, firstByte) {
    const mask = crypto.randomBytes(4);
    const len = data.length;
    let header;
    if (len < 126) header = Buffer.from([firstByte, 0x80 | len]);
    else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = firstByte;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = firstByte;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4];
    this.socket.write(Buffer.concat([header, mask, masked]));
  }

  send(method, params = {}, timeout = 40000) {
    const id = ++this.id;
    const body = Buffer.from(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error("timeout " + method));
      }, timeout);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.sendRaw(body, 0x81);
    });
  }

  async waitEvent(method, timeout = 40000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const index = this.events.findIndex((event) => event.method === method);
      if (index >= 0) return this.events.splice(index, 1)[0];
      await sleep(40);
    }
    throw new Error("timeout event " + method);
  }
}

const LCP_BOOT = `window.__vnx={lcp:[],shifts:[],dcl:null};
const describe=(el)=>{
  if (!el || !el.tagName) return "";
  const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/).slice(0, 3).join(".") : "";
  return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (cls ? "." + cls : "");
};
new PerformanceObserver((list)=>{
  for (const entry of list.getEntries()) {
    window.__vnx.shifts.push({
      t: entry.startTime,
      value: entry.value,
      input: entry.hadRecentInput,
      nodes: (entry.sources || []).map((source) => describe(source.node)).filter(Boolean).slice(0, 2)
    });
  }
}).observe({type:"layout-shift", buffered:true});
new PerformanceObserver((list)=>{
  for (const entry of list.getEntries()) {
    const el = entry.element;
    window.__vnx.lcp.push({
      t: entry.renderTime || entry.startTime,
      size: entry.size,
      url: entry.url || "",
      tag: el ? el.tagName : "",
      id: el ? el.id : "",
      className: el && el.className ? String(el.className).slice(0, 180) : "",
      src: el ? (el.currentSrc || el.getAttribute("src") || "") : "",
      text: el && el.tagName !== "IMG" ? (el.innerText || "").slice(0, 80) : ""
    });
  }
}).observe({type:"largest-contentful-paint", buffered:true});
document.addEventListener("DOMContentLoaded", () => {
  const delay = document.getElementById("vnx-inline-delay-css");
  window.__vnx.dcl = {
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    delayed: document.querySelectorAll("[vnx-css-delayed]").length,
    critical: !!document.getElementById("vnx-critical-css-inline"),
    delayType: delay ? (delay.getAttribute("type") || "") : ""
  };
});`;

const COLLECT = `(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const observed = (window.__vnx && window.__vnx.lcp) || [];
  const lcp = observed.length ? observed[observed.length - 1] : null;
  const resources = performance.getEntriesByType("resource");
  const lcpUrl = lcp && lcp.url;
  const lcpResource = resources.find((row) => lcpUrl && row.name.split("?")[0] === lcpUrl.split("?")[0]);
  const hero = document.querySelector("img[data-vnx-lcp='1']") || document.querySelector("img[fetchpriority='high']");
  const top = (el) => (el ? Math.round(el.getBoundingClientRect().top) : null);
  const main = document.querySelector("main");
  const first = document.querySelector("main section, section");
  // CLS as Lighthouse and web-vitals count it: largest session window (gap < 1 s, span < 5 s), input shifts excluded.
  const shifts = ((window.__vnx && window.__vnx.shifts) || []).filter((s) => !s.input);
  let cls = 0, windowSum = 0, windowStart = 0, windowLast = 0;
  for (const s of shifts) {
    if (windowSum && s.t - windowLast < 1000 && s.t - windowStart < 5000) windowSum += s.value;
    else { windowSum = s.value; windowStart = s.t; }
    windowLast = s.t;
    cls = Math.max(cls, windowSum);
  }
  const clsShifts = shifts
    .filter((s) => s.value >= 0.01)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((s) => ({ t: Math.round(s.t), value: Math.round(s.value * 1000) / 1000, nodes: s.nodes }));
  return {
    href: location.href,
    ttfb: nav ? Math.round(nav.responseStart) : null,
    dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    load: nav ? Math.round(nav.loadEventEnd) : null,
    lcp: lcp ? Math.round(lcp.t) : null,
    lcpElement: lcp ? { tag: lcp.tag, id: lcp.id, className: lcp.className, url: lcp.url, src: lcp.src, text: lcp.text } : null,
    lcpRequestStart: lcpResource ? Math.round(lcpResource.startTime) : null,
    cls: Math.round(cls * 1000) / 1000,
    clsShifts,
    hero: hero ? {
      id: hero.id,
      src: hero.currentSrc || hero.getAttribute("src") || "",
      lazy: hero.getAttribute("data-vnx-lazy"),
      lcpFlag: hero.getAttribute("data-vnx-lcp")
    } : null,
    dclMarkers: (window.__vnx && window.__vnx.dcl) || null,
    tops: { main: top(main), first: top(first), hero: hero ? top(hero) : null },
    bodyClass: document.body.className
  };
})()`;

function roundShift(before, after) {
  const shift = {};
  for (const key of Object.keys(before || {})) {
    if (before[key] == null || !after || after[key] == null) shift[key] = null;
    else shift[key] = after[key] - before[key];
  }
  return shift;
}

function isSvgPlaceholder(src) {
  return typeof src === "string" && src.startsWith("data:image/svg");
}

async function evalJs(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 300));
  }
  return result.result ? result.result.value : null;
}

async function shot(cdp, file) {
  const image = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true }, 60000);
  fs.writeFileSync(file, Buffer.from(image.data, "base64"));
}

async function measureProfile(cdp, profile, pageUrl, assetsDir) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: profile.width,
    height: profile.height,
    deviceScaleFactor: profile.dpr,
    mobile: profile.mobile,
  });
  await cdp.send("Network.setUserAgentOverride", { userAgent: profile.ua });
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  cdp.events.length = 0;
  await cdp.send("Page.navigate", { url: pageUrl });
  await cdp.waitEvent("Page.loadEventFired");
  cdp.events.length = 0;
  const cacheHeaders = [];
  const originalPush = cdp.events.push.bind(cdp.events);
  cdp.events.push = (event) => {
    originalPush(event);
    if (event.method !== "Network.responseReceived") return;
    const response = event.params && event.params.response;
    if (!response || event.params.type !== "Document") return;
    cacheHeaders.push({ url: response.url, status: response.status, headers: response.headers || {} });
  };
  await cdp.send("Network.clearBrowserCache");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Page.reload", { ignoreCache: true });
  await cdp.waitEvent("Page.loadEventFired");
  cdp.events.push = originalPush;
  await sleep(200);
  const afterLoad = await evalJs(cdp, COLLECT);
  if (assetsDir) {
    await shot(cdp, path.join(assetsDir, `load-${profile.name}-after-load.png`));
    const lcpSrc = afterLoad.lcpElement && afterLoad.lcpElement.src;
    if (isSvgPlaceholder(lcpSrc) || isSvgPlaceholder(afterLoad.hero && afterLoad.hero.src)) {
      await sleep(4500);
      await shot(cdp, path.join(assetsDir, `load-${profile.name}-after-4s.png`));
    }
  }
  // Sliders and lazy widgets often shift after the load event; let them settle before reading CLS.
  await sleep(CLS_SETTLE_MS);
  const settled = await evalJs(cdp, COLLECT);
  const beforeTops = settled.tops;
  await evalJs(cdp, `document.body && document.body.dispatchEvent(new MouseEvent("mouseover", {bubbles:true}))`);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: Math.round(profile.width / 2),
    y: 160,
  });
  await sleep(1500);
  const afterInteract = await evalJs(cdp, COLLECT);
  const doc = cacheHeaders[0] || {};
  const headers = {};
  for (const [name, value] of Object.entries(doc.headers || {})) headers[name.toLowerCase()] = value;
  return {
    device: profile.name,
    viewport: { width: profile.width, height: profile.height, dpr: profile.dpr },
    ua: profile.ua,
    ttfb: afterLoad.ttfb,
    dcl: afterLoad.dcl,
    load: afterLoad.load,
    lcp: afterLoad.lcp,
    lcpElement: afterLoad.lcpElement,
    lcpRequestStart: afterLoad.lcpRequestStart,
    cls: settled.cls,
    clsShifts: settled.clsShifts,
    hero: afterLoad.hero,
    dclMarkers: afterLoad.dclMarkers,
    bodyClass: afterLoad.bodyClass,
    shiftPx: roundShift(beforeTops, afterInteract.tops),
    cache: headers["x-litespeed-cache"] || headers["cf-cache-status"] || null,
  };
}

async function runBrowser(pageUrl, assetsDir) {
  if (!fs.existsSync(CHROME)) throw new Error("Chrome not found");
  fs.rmSync("/tmp/vnx-chrome-measure", { recursive: true, force: true });
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--password-store=basic",
      "--use-mock-keychain",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=/tmp/vnx-chrome-measure",
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  try {
    let list = null;
    for (let i = 0; i < 40; i++) {
      try {
        list = JSON.parse(await httpGet(`http://127.0.0.1:${PORT}/json/list`));
        if (list.find((target) => target.type === "page")) break;
      } catch (err) {
        list = null;
      }
      await sleep(200);
    }
    const page = list && list.find((target) => target.type === "page");
    if (!page) throw new Error("chrome debug port not ready");
    const cdp = new Cdp();
    await cdp.connect(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: LCP_BOOT });
    const devices = [];
    for (const profile of PROFILES) devices.push(await measureProfile(cdp, profile, pageUrl, assetsDir));
    return devices;
  } finally {
    chrome.kill();
  }
}

async function runPsi(pageUrl, key, scratch) {
  const strategies = ["mobile", "desktop"];
  await Promise.all(
    strategies.map(async (strategy) => {
      const file = path.join(scratch, `psi-${strategy}.json`);
      const result = await runCurl([
        "-sS",
        "-G",
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
        "--data-urlencode",
        `url=${pageUrl}`,
        "-d",
        `strategy=${strategy}`,
        "-d",
        "category=performance",
        "-d",
        `key=${key}`,
        "-o",
        file,
        "-w",
        "%{http_code}",
      ]);
      const raw = fs.readFileSync(file, "utf8");
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(strategy + " invalid json " + redact(result.stderr, key).slice(0, 180));
      }
      if (data.error) {
        const message = redact(data.error.message || "", key);
        throw new Error(strategy + " " + data.error.code + " " + message.slice(0, 240));
      }
    })
  );
  return strategies.map((strategy) => summarizePsi(strategy, path.join(scratch, `psi-${strategy}.json`)));
}

function summarizePsi(strategy, file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const audits = data.lighthouseResult.audits;
  const pick = (id) => {
    const audit = audits[id] || {};
    return { display: audit.displayValue || null, numeric: audit.numericValue ?? null, score: audit.score ?? null };
  };
  const failing = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (typeof audit.score === "number" && audit.score < 0.9) {
      failing.push({
        id,
        score: audit.score,
        title: audit.title,
        display: audit.displayValue || null,
      });
    }
  }
  failing.sort((a, b) => a.score - b.score);
  const lcpNode = (((audits["lcp-breakdown-insight"] || {}).details || {}).items || []).find((item) => item.type === "node");
  return {
    strategy,
    score: Math.round((data.lighthouseResult.categories.performance.score || 0) * 100),
    fetchTime: data.lighthouseResult.fetchTime,
    fcp: pick("first-contentful-paint"),
    lcp: pick("largest-contentful-paint"),
    tbt: pick("total-blocking-time"),
    cls: pick("cumulative-layout-shift"),
    speedIndex: pick("speed-index"),
    ttfb: pick("server-response-time"),
    lcpSelector: lcpNode ? lcpNode.selector : null,
    failing,
  };
}

async function main() {
  const pageUrl = arg(PAGE_URL_FLAG, "");
  const scratch = arg("--scratch", "/tmp/vnx-measure");
  const assets = arg("--assets", "");
  const doPath = arg("--do", "audit-website/Do.md");
  const skipPsi = process.argv.includes("--skip-psi");
  const skipBrowser = process.argv.includes("--skip-browser");
  if (!pageUrl) {
    console.error("missing --url");
    process.exit(1);
  }
  fs.mkdirSync(scratch, { recursive: true });
  if (assets) fs.mkdirSync(assets, { recursive: true });
  const started = Date.now();
  const summary = { url: pageUrl, psi: null, browser: null, errors: [] };

  const tasks = [];
  if (!skipPsi) {
    const key = readPagespeedKey(doPath);
    if (!key) summary.errors.push("pagespeed key missing");
    else {
      tasks.push(
        runPsi(pageUrl, key, scratch)
          .then((psi) => {
            summary.psi = psi;
          })
          .catch((err) => summary.errors.push(redact(err.message, key)))
      );
    }
  }
  if (!skipBrowser) {
    tasks.push(
      runBrowser(pageUrl, assets || null)
        .then((browser) => {
          summary.browser = browser;
        })
        .catch((err) => summary.errors.push(String(err.message || err)))
    );
  }
  await Promise.all(tasks);
  summary.elapsedMs = Date.now() - started;
  const outFile = path.join(scratch, "summary.json");
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  if (summary.errors.length) process.exit(summary.psi || summary.browser ? 2 : 1);
}

main().catch((err) => {
  console.error(redact(err.message || err, ""));
  try {
    spawn("pkill", ["-f", `remote-debugging-port=${PORT}`], { stdio: "ignore" });
  } catch (killErr) {
    /* chrome already gone */
  }
  process.exit(1);
});
