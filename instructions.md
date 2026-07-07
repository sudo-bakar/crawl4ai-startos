# Crawl4AI

## Documentation

- [Crawl4AI self-hosting guide](https://docs.crawl4ai.com/core/self-hosting/) — how the Docker server is configured upstream and what each endpoint does.
- [Model Context Protocol on Crawl4AI](https://docs.crawl4ai.com/api/mcp) — pointing an MCP client at the server's `/mcp/sse` endpoint.
- [Upstream README](https://github.com/unclecode/crawl4ai#readme) — feature overview and quick-start.

## What you get on StartOS

Crawl4AI on StartOS runs the upstream Docker server behind the StartOS reverse
proxy. You get a single web address that serves:

- `/playground` — interactive playground for ad-hoc crawls and LLM extractions.
- `/monitor` — real-time monitor for active crawls, queues, and stats.
- `/crawl`, `/html`, `/screenshot`, `/pdf`, `/execute_js`, `/md`, `/llm`,
  `/schema`, `/health`, `/metrics`, `/hooks/info` — the REST API surface.
- `/mcp/sse` and `/mcp/ws` — Model Context Protocol endpoints for direct
  integration with tools like Claude Code.

Crawled artifacts (screenshots, PDFs) persist across restarts in the `main`
volume, and the Playwright Chromium cache persists too so the browser does not
re-download on every restart.

## Getting set up

1. Open the service from your **Dashboard** and find the **Set API Token**
   critical task. Click it, then click **Run**.
2. Copy the masked **Token** value that comes back. You will need it for every
   API and MCP call. The token is shown once — if you lose it, run the action
   again to rotate it.
3. The service restarts automatically with the token applied and the web
   interface will report **running** once `https://<startos-host>.local/crawl4ai/health`
   responds `{"status":"healthy"}`.
4. Open `https://<startos-host>.local/crawl4ai/playground` in a browser to
   confirm the playground loads (the upstream `trusted_hosts` is `["*"]`, so
   the StartOS-injected Host header is accepted).

## Using Crawl4AI

### Web interface

Bookmark `https://<startos-host>.local/crawl4ai/playground` for interactive
testing of crawl, screenshot, PDF, and JavaScript-execution endpoints. Open
`/monitor` alongside it to watch active crawls in real time.

### REST API

Send `Authorization: Bearer <token>` on every request except `GET /health`. A
minimal crawl looks like:

```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"]}' \
  https://<startos-host>.local/crawl4ai/crawl
```

### MCP integration

Point an MCP-compatible client (Claude Code, Cursor, etc.) at:

```
https://<startos-host>.local/crawl4ai/mcp/sse?token=<your-token>
```

The `?token=` query form is supported for clients that cannot set headers.

### Actions

- **Set API Token** — generate or rotate the API token. Also reachable from
  the **Actions** tab on the service page once the initial critical task has
  been completed.

## Limitations

The `/md` and `/llm` extraction endpoints (and any LLM-backed behaviour
controlled via `LLM_PROVIDER` / `LLM_BASE_URL`) return an error until an LLM
provider API key is present in the environment. Provider-key configuration is
not yet surfaced through StartOS — set it inside the upstream container
directly for now, or wait for a follow-up release that adds a config action
for it. All non-LLM endpoints (`/crawl`, `/html`, `/screenshot`, `/pdf`,
`/execute_js`, `/playground`) work without any LLM key.
