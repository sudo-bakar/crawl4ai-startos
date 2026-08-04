# TODO

Items deferred from the initial v1 release. The scaffold checklist has been
worked end-to-end; this file tracks the items that came up during packaging
and were deliberately postponed.

## Pending verification

- [ ] Install on a real StartOS box and exercise the §6 checklist in
      `../CRAWL4AI_PLAN.md` (token critical task surfaces, health passes,
      `/playground` loads, `/crawl` POST returns a successful crawl with the
      bearer token, `/health` reachable without auth, `/dashboard` loads,
      restart preserves `outputs/`, backup → uninstall → restore
      preserves artifacts). Per AGENTS.md, a clean `tsc` + `s9pk pack` does
      NOT prove the service runs.
- [x] **Verified:** `appuser` is UID `999` / GID `999` (system user, created
      with `-r`). `PYTHON_ENV=production` is baked into the image. The
      `fix-permissions` oneshot chowns by name (`appuser:appuser`) so the
      numeric UID never affects correctness — keep that.
- [x] **Resolved:** the `cache` volume mount was removed in `0.9.0:1`.
      Mounting `/home/appuser/.cache` shadowed the baked-in Playwright
      Chromium binary and broke the web UI. Chromium is now served from the
      image's read-only layer on every boot, so it adds nothing to backup
      size — the backup-bloat concern that used to be tracked here no longer
      applies.

## Future v2 work

- [ ] **MCP SSE transport behind the StartOS proxy — needs runtime verification.**
      An end-to-end MCP handshake (`initialize` → `tools/list` over the GET SSE
      stream, JSON-RPC POST to `/mcp/messages/?session_id=…` answered on the
      GET stream) has NOT been exercised through the StartOS reverse proxy.
      Code-only findings so far (verified against
      `unclecode/crawl4ai:0.9.0`, `mcp` Python SDK, and the Rust hyper proxy in
      `start-core/src/net/http.rs`):
        - gunicorn runs `--workers 1` (supervisord.conf). The "session
          affinity broken across workers" theory is FALSE.
        - The MCP SDK pops the session from its in-memory dict the instant the
          GET `/mcp/sse` stream closes (`sse.py` `finally`). The `404 "Could
          not find session"` seen in two-step curl probes (GET → close → POST)
          is therefore a **test artifact**, not a server bug.
        - The proxy streams response bodies through unbuffered (`box_incoming`)
          and does not kill active streams (`header_read_timeout` is disarmed
          while a body/upgrade is in flight). Its HTTP/1.1 path uses a single
          shared upstream `SendRequest` guarded by a `Mutex`; whether a client
          that reuses one TCP connection for the GET stream and the POST could
          stall under that single-connection serialization has not been
          reproduced with a real client.
      Action when a StartOS box and a working MCP client (Hermes/SSE, or a WS
      client) are available: run `curl -v` against `/mcp/sse` to record the
      negotiated HTTP version, confirm `?token=` → `401` and Bearer → `200`,
      then drive a full `initialize` + `tools/list` round trip and confirm the
      responses actually arrive over the SSE stream inside the client's timeout.
      If a real client (e.g. Hermes) still times out with a correct Bearer
      header, capture the proxy→upstream HTTP version and connection reuse.
- [ ] Track upstream for a streamable-HTTP `/mcp` endpoint. As of crawl4ai
      `main`, `mcp_bridge.attach_mcp` mounts only `/mcp/sse` (SSE) and `/mcp/ws`
      (WebSocket) — there is no streamable-HTTP transport. If/when upstream adds
      one, recommend it as the primary MCP transport: request/response over a
      single connection avoids the SSE dual-flow fragility entirely.
- [ ] LLM-provider API-key config action(s). Add a config action (or several)
      that lets the user paste `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
      `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `TOGETHER_API_KEY`,
      `MISTRAL_API_KEY`, `GEMINI_API_TOKEN`, plus global `LLM_PROVIDER` /
      `LLM_TEMPERATURE` / `LLM_BASE_URL`, into `store.json` and spill them
      onto the daemon env in `main.ts`. Without this, `/md` and `/llm`
      extraction return an error (documented in `instructions.md`).
- [ ] Mount an override `config.yml` to set
      `rate_limiting.trusted_proxies: ["10.0.3.1"]` (the StartOS reverse
      proxy IP) for correct per-client rate-limit accounting under the proxy.
      Per `recipe-prebuilt-image.md`, a mount completely replaces the file,
      so the override must be a complete valid config — copy the upstream
      default and only change the `trusted_proxies` line. File-model this as
      `FileHelper.yaml` (see `file-models.md`).
- [ ] Replace the embedded PNG in `icon.svg` with a vector SVG if/when
      upstream ships one. Currently `icon.svg` embeds the upstream 32×32 PNG
      (`deploy/docker/static/assets/crawl4ai-logo.png`) inside an SVG
      `<image>` element, since upstream has no vector form of the logo.
- [ ] Consider JWT mode (`CRAWL4AI_JWT_ENABLED=true`) instead of the static
      token, for multi-user scenarios. Requires a `SECRET_KEY` and
      `security.jwt_enabled: true` in `config.yml`.
- [ ] Investigate making `/playground` browser-accessible. Upstream 0.9.0 is
      secure-by-default and auth-gates the playground HTML page itself (the
      `?token=` query form works only for WebSocket/MCP clients, not HTTP page
      loads). A plain browser navigation to
      `https://<host>/crawl4ai/playground` returns `401` because the browser
      cannot send `Authorization: Bearer <token>` on a page load. The current
      stopgap (documented in `instructions.md`) is a header-injection browser
      extension or an API client. A real fix likely requires an upstream
      change (cookie auth, a login form, or a `?token=` path for the HTML page)
      or a reverse-proxy header-injection layer; the `config.yml` `security`
      section exposes no path-exemption option.
