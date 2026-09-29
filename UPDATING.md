# Updating the upstream version

This package wraps the prebuilt
[Crawl4AI](https://github.com/unclecode/crawl4ai) Docker image,
`unclecode/crawl4ai`. There is no fork and no source build.

## Determining the upstream version

Upstream ships to Docker Hub, and its tags — not the GitHub release tags — are
what this package pins:

```sh
curl -s "https://hub.docker.com/v2/repositories/unclecode/crawl4ai/tags?page_size=25" \
  | jq -r '.results[].name'
```

Take a stable numeric tag; avoid `latest` and any pre-release suffix. Confirm it
is multi-arch before pinning it:

```sh
docker buildx imagetools inspect unclecode/crawl4ai:<new version> \
  --format '{{range .Manifest.Manifests}}{{.Platform.OS}}/{{.Platform.Architecture}} {{end}}'
```

Both `linux/amd64` and `linux/arm64` must be present. The current pin lives in
`startos/manifest/index.ts` at `images.crawl4ai.source.dockerTag`.

Read the upstream [CHANGELOG](https://github.com/unclecode/crawl4ai/blob/main/CHANGELOG.md)
and [migration guide](https://github.com/unclecode/crawl4ai/blob/main/deploy/docker/MIGRATION.md)
against the tag. Minor releases here have carried breaking configuration
changes.

## Applying the bump

- Bump `dockerTag` in `startos/manifest/index.ts`.
- Set `version` in `startos/versions/current.ts` to `<new version>:0` and
  rewrite `releaseNotes` in every locale.
- Re-read `deploy/docker/entrypoint.sh`, `supervisord.conf`, and `config.yml`
  from upstream at the new tag, and confirm what this package depends on:
  - the entrypoint still resolves the gunicorn bind from `CRAWL4AI_API_TOKEN`,
    binding loopback when it is empty — this is what makes the token task
    `critical`;
  - the entrypoint still ends in `exec supervisord`, which is what `runAsInit`
    is for;
  - the port in `startos/utils.ts` still matches;
  - the server still runs as `appuser` and still writes
    `/var/lib/crawl4ai/outputs`, which the `fix-permissions` oneshot chowns.
- Confirm the browsers are still baked into the image, since the package mounts
  nothing for them:

  ```sh
  docker run --rm --entrypoint sh unclecode/crawl4ai:<new version> \
    -c 'ls /home/appuser/.cache/ms-playwright/'
  ```

  If a future image stops shipping them, install them from a oneshot rather than
  mounting a volume at that path.
- Check whether the artifact TTL and quota defaults moved; `README.md` and
  `instructions.md` both state them, and both are user-visible promises.
- Check whether the per-crawl `limits.wall_clock_s` default moved; `README.md`
  and `instructions.md` state the current 5-minute limit.
