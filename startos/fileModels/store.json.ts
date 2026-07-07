import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  // Auto-generated API token (admin scope). Written by the setApiToken
  // action, read by setupMain as the daemon env var CRAWL4AI_API_TOKEN.
  // The image's entrypoint.sh only binds gunicorn to a non-loopback
  // interface when this credential is present; without it the StartOS
  // reverse proxy cannot reach the container.
  apiToken: z.string().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
