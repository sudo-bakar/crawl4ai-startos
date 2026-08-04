# Updating the upstream version

This package wraps the upstream prebuilt Docker image
`unclecode/crawl4ai:<tag>`. There is no fork and no source build — a version
bump is just a tag bump in two files plus a multi-arch sanity check.

## Determining the upstream version

Upstream tags are Docker Hub tags, not git release tags:

```bash
curl -s "https://hub.docker.com/v2/repositories/unclecode/crawl4ai/tags?page_size=25" \
  | jq -r '.results[].name'
```

Pick a stable numeric tag (`0.9.0`, `0.9.1`, …). Avoid `latest` and pre-release
designators (`rc1`, `r1`, `0.6.0rc1-r2`) — those track in-development builds
and have historically shifted. Match the tag against the upstream
[CHANGELOG.md](https://github.com/unclecode/crawl4ai/blob/main/CHANGELOG.md)
and the [migration guide](https://github.com/unclecode/crawl4ai/blob/main/deploy/docker/MIGRATION.md)
before bumping — `0.x.0` releases have carried breaking config changes
(e.g. 0.9.0 added the secure-by-default `CRAWL4AI_API_TOKEN` bind behavior
this package depends on).

Confirm the tag is multi-arch before pinning:

```bash
docker manifest inspect unclecode/crawl4ai:<new-tag> \
  | jq -r '.manifests[].platform | "\(.architecture) \(.os)"'
```

Both `amd64 linux` and `arm64 linux` must be present (the manifest
additionally lists two `unknown/unknown` attestation entries — those are
normal).

## Applying the bump

Two edits, both pinned:

1. `startos/manifest/index.ts` — update
   `images.crawl4ai.source.dockerTag` from `unclecode/crawl4ai:<old>` to
   `unclecode/crawl4ai:<new>`.
2. `startos/versions/current.ts` — bump `version` to `<new-tag>:0` (or
   `:<new-tag>:1`, `:2`, … if the package revision needs to bump within the
   same upstream version) and update the `releaseNotes` block. Per
   `versions.md`, spin off a new version file **only** when the bump carries
   a migration; an in-place edit of `current.ts` is the common case.

Then:

- Re-read `deploy/docker/entrypoint.sh`,
  `deploy/docker/supervisord.conf`, and `deploy/docker/config.yml` from
  upstream at the new tag. Confirm the assumptions baked into
  `startos/main.ts` still hold:
  - `entrypoint.sh` still resolves `GUNICORN_BIND` from `CRAWL4AI_API_TOKEN`
    (loopback without it, `[::]:<port>` with it).
  - The single external port is still `11235`.
  - The user is still `appuser` (`USER appuser` at end of Dockerfile) and the
    `chown -R appuser:appuser` targets in `main.ts`'s `fix-permissions`
    oneshot are still correct.
  - `/var/lib/crawl4ai/outputs` is still the persistent artifact path. Note:
    Playwright Chromium is **not** mounted from the volume — it is baked into
    the image at `/home/appuser/.cache/ms-playwright/`. Do NOT re-add a volume
    mount at `/home/appuser/.cache`; it would shadow the baked-in binary and
    break the web UI. Only re-introduce a cache mount if a future image stops
    baking Chromium (and then prefer an oneshot running
    `playwright install chromium` rather than masking the path).
- If those have changed, update `main.ts` (`CRAWL4AI_API_TOKEN` env var,
  mounts, oneshot chown targets) and `interfaces.ts` (port) accordingly.
- Re-run `make` (which runs `tsc` and `start-cli s9pk pack`), install on a
  StartOS box, and exercise the [verification checklist from
  CRAWL4AI_PLAN.md §6](../CRAWL4AI_PLAN.md) before publishing.
