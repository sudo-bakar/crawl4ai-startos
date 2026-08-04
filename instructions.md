# Crawl4AI

## Documentation

- [Crawl4AI self-hosting guide](https://docs.crawl4ai.com/core/self-hosting/) — how the Docker server is configured upstream and what each endpoint does.
- [Model Context Protocol on Crawl4AI](https://docs.crawl4ai.com/core/self-hosting/#what-is-mcp) — pointing an MCP client at the server's `/mcp/sse` endpoint.
- [Upstream README](https://github.com/unclecode/crawl4ai#readme) — feature overview and quick-start.

## What you get on StartOS

Crawl4AI on StartOS runs the upstream Docker server behind the StartOS reverse
proxy. You get a single web address that serves:

- `/playground` — interactive playground for ad-hoc crawls, screenshots, PDFs,
  and Markdown extraction.
- `/dashboard` — real-time monitor for active crawls, queues, and stats.
- `/crawl`, `/html`, `/screenshot`, `/pdf`, `/execute_js`, `/md`, `/llm`,
  `/schema`, `/health`, `/metrics`, `/hooks/info` — the REST API surface, with
  the current package limitations noted below.
- `/mcp/sse` and `/mcp/ws` — Model Context Protocol endpoints for direct
  integration with tools like Claude Code.

Crawled artifacts (screenshots, PDFs) persist across restarts in the `main`
volume. The Playwright Chromium browser is bundled inside the Docker image,
so it is available on every start with no download.

## Getting set up

> **`<service-base>`** below means the **Web Interface** URL shown by StartOS
> with the final `/playground` removed. Keep its scheme, hostname, optional
> port, and any preceding path. Append endpoint paths such as `/crawl`,
> `/mcp/sse`, or `/health` to that base.

1. Open the service from your **Dashboard** and find the **Set API Token**
   critical task. Click it, then click **Run**.
2. Copy the masked **Token** value that comes back. You will need it for every
   API and MCP call. The token is shown once — if you lose it, run the action
   again to rotate it.
3. The service restarts automatically with the token applied. Wait for the
   **Web Interface** health check to report that it is ready.
4. Confirm the token works by requesting the authenticated hooks-information
   endpoint:

   ```bash
   curl -H "Authorization: Bearer <your-token>" \
     <service-base>/hooks/info
   ```

   A valid token returns the available declarative hook actions. `GET /health`
   is public and can confirm readiness, but it does not validate your token.

## Using Crawl4AI

### Web interface

Open the **Web Interface** to reach the playground. It provides an interactive
UI for crawl, screenshot, PDF, and Markdown endpoints. Paste your API token
into the token field before making requests. The dashboard at
`<service-base>/dashboard` uses the same token.

### REST API

Send `Authorization: Bearer <token>` on every API request except `GET /health`.
A minimal crawl looks like:

```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"]}' \
  <service-base>/crawl
```

### MCP integration

Crawl4AI exposes two MCP transports on the same port:

| Transport | URL | How the client authenticates |
|---|---|---|
| **SSE** | `<service-base>/mcp/sse` | `Authorization: Bearer <your-token>` header on **both** the GET stream and the JSON-RPC POST |
| **WebSocket** | Use the same host and path `<service-base>/mcp/ws`, with the WebSocket scheme (`ws` or `wss`) | `?token=<your-token>` query works here, or the `Authorization: Bearer` header |

For SSE, configure your MCP client to send the Bearer header. Do not append
`?token=` to the SSE URL; query-token authentication works only with WebSocket.
If your client cannot set HTTP headers, use the WebSocket transport instead.

### Actions

- **Set API Token** — generate or rotate the API token. Also reachable from
  the **Actions** tab on the service page once the initial critical task has
  been completed.

## Limitations

- LLM provider credentials are not configurable in this package. The `/llm`
  endpoint, LLM extraction, and the `fit`, `bm25`, and `llm` modes of `/md`
  may fail without a provider key. Use `/md` with `{"f":"raw"}` for Markdown
  generation that does not require an LLM provider.
- `/execute_js` and declarative crawl hooks are disabled because their upstream
  opt-in settings are not exposed by this package. The `/hooks/info` endpoint
  remains available for authentication checks and schema inspection.
