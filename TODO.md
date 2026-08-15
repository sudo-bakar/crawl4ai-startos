# TODO

Items deferred from the initial v1 release. The scaffold checklist has been
worked end-to-end; this file tracks the items that came up during packaging
and were deliberately postponed.

## Pending verification

- [ ] **Backup → uninstall → restore has never been exercised.** Blocked on
      this box: `start-cli backup target list` returns `{}` (no backup target
      configured), so a backup cannot be created. Run this once a target
      exists and confirm `outputs/` artifacts and the stored API token in
      `store.json` survive the round trip.

## Verified (kept as evidence, not pending work)

- [x] **Verified on 0.9.2:0** (StartOS 0.4.0.1, x86_64):
      in-place update from `0.9.1:2` completed; `/health` returns
      `{"status":"ok","version":"0.9.2"}` unauthenticated; **Set API Token**
      action returns a token and the daemon restarts onto it (`/hooks/info`
      → `200` with the Bearer header); a real `/crawl` of `https://example.com`
      succeeded (proves Playwright launches); `/screenshot` wrote an artifact
      to `outputs/`; a service restart preserved both the artifact and the
      token; MCP SSE completed a full `initialize` + `tools/list` round trip
      through the StartOS proxy (7 tools) — `initialize` →
      `notifications/initialized` → `tools/list` over `/mcp/sse` with a Bearer
      header, each POST answered on the open GET stream, `401` without a
      token. Per AGENTS.md, a clean `tsc` + `s9pk pack` does NOT prove the
      service runs — these are runtime observations.
- [x] **Verified 0.9.2 upstream fixes on the box:** `/config/dump` returns
      `200` with `{"type": …, "code": …}` and `400` without `type` (the
      playground "Advanced Config" fix), and `/monitor/ws` upgrades with
      `101 Switching Protocols` using `?token=` (`403` without) — the
      router-level `token_dep` 500 is gone.
- [x] **Verified the 0.9.1 headless-shell workaround is obsolete.** The
      running 0.9.2 container has a real 189 MB
      `chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`
      (not a symlink), and no `Executable doesn't exist` appears in the logs.
      The `setupMain` symlink patch was removed — do not reintroduce it.
- [x] **Verified:** `appuser` is UID `999` / GID `999` (system user, created
      with `-r`). `PYTHON_ENV=production` is baked into the image. The
      `fix-permissions` oneshot chowns by name (`appuser:appuser`) so the
      numeric UID never affects correctness — keep that.
- [x] **Resolved:** the `cache` volume mount was removed in `0.9.0:1`.
      Mounting `/home/appuser/.cache` shadowed the baked-in Playwright
      browsers and broke the web UI. They are now served from the image's
      read-only layer on every boot, so they add nothing to backup size — the
      backup-bloat concern that used to be tracked here no longer applies.

## Future v2 work

- [ ] Track upstream for a streamable-HTTP `/mcp` endpoint. As of crawl4ai
      `main`, `mcp_bridge.attach_mcp` mounts only `/mcp/sse` (SSE) and `/mcp/ws`
      (WebSocket) — there is no streamable-HTTP transport. If/when upstream adds
      one, recommend it as the primary MCP transport: request/response over a
      single connection avoids the SSE dual-flow fragility entirely.
- [ ] Expose the artifact TTL / quota as StartOS configuration. Upstream's
      `artifacts.py` treats `/var/lib/crawl4ai/outputs` as a TTL'd cache:
      `CRAWL4AI_ARTIFACT_TTL_SECONDS` (default `3600`),
      `CRAWL4AI_ARTIFACT_QUOTA_BYTES` (2 GiB), `CRAWL4AI_MAX_ARTIFACT_BYTES`
      (50 MiB). A janitor (`server.py` `_artifact_janitor`, every 300 s) and
      `resolve_artifact` on read both unlink expired files. The package pins
      none of these, so screenshots/PDFs vanish after an hour regardless of
      available disk — which makes backing up `outputs/` near-pointless and
      surprised a verification run (an artifact written 8 h earlier was gone,
      initially mistaken for reinstall data loss). All three are plain env
      vars, so this is a store-backed action plus a spill into the daemon
      `env` in `main.ts`, mirroring how `CRAWL4AI_API_TOKEN` is handled.
      Update `README.md` §Volume and Data Layout and `instructions.md` when
      done.
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
- [x] **Icon replaced with a vector SVG (2026-08).** `icon.svg` is now a
      512×512 path-based vector with no embedded raster (the previous `<image>`
      wrap of the upstream 32×32 PNG is gone). Provenance of the vector is
      unrecorded — if upstream ever ships an official vector logo, prefer it.
- [ ] Consider JWT mode (`CRAWL4AI_JWT_ENABLED=true`) instead of the static
      token, for multi-user scenarios. Requires a `SECRET_KEY` and
      `security.jwt_enabled: true` in `config.yml`.
- [x] **Resolved: `/playground` no longer needs a header-injection workaround
      (2026-08).** Upstream 0.9.x now serves the playground HTML **without**
      auth-gating the page (`GET /playground` → 307 → `200` HTML). The page
      carries a client-side token bar that stores the token in `sessionStorage`
      and attaches `Authorization: Bearer <token>` per request — so a plain
      browser navigation works once the user pastes the API token into the bar.
      No browser extension or API-client-only fallback is required. Doc updates
      in `instructions.md` already describe pasting the token into the token
      field.
