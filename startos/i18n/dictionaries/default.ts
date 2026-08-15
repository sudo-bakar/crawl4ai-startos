export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Crawl4AI': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,
  // actions/setApiToken.ts
  'Set API Token': 4,
  'Generate or rotate the Crawl4AI API token. Required for the server to bind a non-loopback interface so StartOS can reach it.': 5,
  'API Token': 6,
  'Use this token as `Authorization: Bearer <token>` on every API request. The service restarts automatically to pick up the new token.': 7,
  Token: 8,
  // init/watchApiToken.ts
  'Set the API token so the server binds a non-loopback interface and StartOS can reach it.': 9,
  // interfaces.ts
  'Playground, API, monitor, and MCP endpoints on a single HTTP port.': 10,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
