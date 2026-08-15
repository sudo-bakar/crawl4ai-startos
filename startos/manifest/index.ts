import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'crawl4ai',
  title: 'Crawl4AI',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9Labs/crawl4ai-startos',
  upstreamRepo: 'https://github.com/unclecode/crawl4ai',
  marketingUrl: 'https://docs.crawl4ai.com',
  donationUrl: 'https://github.com/sponsors/unclecode',
  description: { short, long },
  volumes: ['main'],
  images: {
    crawl4ai: {
      source: { dockerTag: 'unclecode/crawl4ai:0.9.2' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  // The upstream image's own HEALTHCHECK exits 1 when `free -m` < 2048, so the
  // service cannot start below 2 GB. Surface that as a hard install floor.
  hardwareRequirements: {
    ram: 2048,
  },
  dependencies: {},
})
