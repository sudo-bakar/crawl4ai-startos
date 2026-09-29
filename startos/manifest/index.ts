import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'crawl4ai',
  title: 'Crawl4AI',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9-Community/crawl4ai-startos',
  upstreamRepo: 'https://github.com/unclecode/crawl4ai',
  marketingUrl: 'https://docs.crawl4ai.com',
  donationUrl: 'https://github.com/sponsors/unclecode',
  description: { short, long },
  volumes: ['main'],
  images: {
    crawl4ai: {
      source: { dockerTag: 'unclecode/crawl4ai:0.9.4' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  // Chromium + the gunicorn worker pool need this much to launch a browser.
  hardwareRequirements: {
    ram: 2 * 1024 ** 3,
  },
  dependencies: {},
})
