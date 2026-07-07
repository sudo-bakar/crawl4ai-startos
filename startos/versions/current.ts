import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:0',
  releaseNotes: {
    en_US: 'Initial release. Wraps upstream Crawl4AI 0.9.0.',
    es_ES: 'Versión inicial. Envuelve Crawl4AI 0.9.0 upstream.',
    de_DE: 'Erstveröffentlichung. Wrappt Upstream-Crawl4AI 0.9.0.',
    pl_PL: 'Pierwsze wydanie. Opatuje upstream Crawl4AI 0.9.0.',
    fr_FR: 'Version initiale. Encapsule Crawl4AI 0.9.0 en amont.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
