# TODO

Items deferred from the initial v1 release. The scaffold checklist has been
worked end-to-end; this file tracks the items that came up during packaging
and were deliberately postponed.

## Pending verification

- [ ] Install on a real StartOS box and exercise the §6 checklist in
      `../CRAWL4AI_PLAN.md` (token critical task surfaces, health passes,
      `/playground` loads, `/crawl` POST returns a successful crawl with the
      bearer token, `/health` reachable without auth, `/monitor` loads,
      restart preserves `outputs/` + `cache/`, backup → uninstall → restore
      preserves artifacts). Per AGENTS.md, a clean `tsc` + `s9pk pack` does
      NOT prove the service runs.
- [ ] Confirm the actual numeric UID of `appuser` inside the running image
      (`start-cli package attach crawl4ai -n crawl4ai-sub -- id -u appuser`).
      The `fix-permissions` oneshot chowns by name (`appuser:appuser`) so the
      exact UID does not matter for correctness, but record it for future
      reference if a name-based chown ever breaks (e.g. a slim image without
      `getent`).
- [ ] After the first real backup, measure the `cache/` (Playwright Chromium
      binaries, ~500 MB) contribution to backup size. If it bloats backups
      unacceptably, switch `startos/backups.ts` to incremental rsync that
      excludes `cache/` (see `recipe-backups.md` — `sdk.Backups.of().addSync`).

## Future v2 work

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
