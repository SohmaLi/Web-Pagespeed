#!/usr/bin/env python3
"""Call one tool of the vietnix-pagespeed MCP server over JSON-RPC (when the MCP tools are not
loaded in the agent, or to send a large CSS file without copying it into the chat).

URL and headers come from ~/.claude.json (mcpServers.vietnix-pagespeed); the token is never printed.

Usage:
  mcp-call.py <tool> '<json arguments>' [css_file]   css_file goes into arguments.css
  mcp-call.py w3tc_get_status '{}'
  mcp-call.py vnx_save_critical_css '{"type":"post","source_id":"48","mobile":"false","dry_run":true}' page-desktop.css
Prints the tool result text (JSON). Exit 1 when the tool returns isError.
"""
import json
import os
import sys
import urllib.request

NAME = os.environ.get('VNX_MCP_NAME', 'vietnix-pagespeed')


def find_server(obj):
    if isinstance(obj, dict):
        servers = obj.get('mcpServers')
        if isinstance(servers, dict) and NAME in servers:
            return servers[NAME]
        for value in obj.values():
            found = find_server(value)
            if found:
                return found
    return None


def post(server, body, session=None):
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
    headers.update(server.get('headers', {}))
    if session:
        headers['Mcp-Session-Id'] = session
    req = urllib.request.Request(server['url'], data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=180) as res:
        return res.headers.get('Mcp-Session-Id'), res.read().decode()


def parse(raw):
    # Plain JSON or an SSE "data: {...}" line.
    for line in raw.splitlines():
        if line.startswith('data:'):
            raw = line[5:].strip()
            break
    return json.loads(raw[raw.index('{'):])


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    tool, args = sys.argv[1], json.loads(sys.argv[2])
    if len(sys.argv) > 3:
        args['css'] = open(sys.argv[3], encoding='utf-8').read()
    server = find_server(json.load(open(os.path.expanduser('~/.claude.json'))))
    if not server:
        sys.exit(f'MCP server {NAME} not found in ~/.claude.json')
    session, _ = post(server, {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {
        'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'pagespeed-shared', 'version': '1'}}})
    try:
        post(server, {'jsonrpc': '2.0', 'method': 'notifications/initialized'}, session)
    except Exception:
        pass
    _, raw = post(server, {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call',
                           'params': {'name': tool, 'arguments': args}}, session)
    res = parse(raw)
    if 'error' in res:
        print(json.dumps(res['error'], ensure_ascii=False))
        sys.exit(1)
    result = res['result']
    print('\n'.join(c.get('text', '') for c in result.get('content', [])))
    sys.exit(1 if result.get('isError') else 0)


if __name__ == '__main__':
    main()
