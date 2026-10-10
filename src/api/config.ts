// Identity of the official 30nama TV client (tv.30app.store, Android TV app v3.2.3).
// Values can rotate; keep them in this one file.
export const API_BASE = 'https://world.hana-api.com/api/v2/action/'
// The client key is never committed. Builds from source take it from VITE_API_KEY in .env.local
// (git-ignored); release builds ship without it and read config.json from the package instead.
export let API_KEY: string = import.meta.env.VITE_API_KEY ?? ''

export async function loadRuntimeConfig(): Promise<void> {
  if (API_KEY) return
  try {
    const cfg = JSON.parse(await readPackageFile('./config.json')) as { apiKey?: string }
    API_KEY = cfg.apiKey?.trim() ?? ''
  } catch {
    // No config.json (dev server, or a build that has the key compiled in).
  }
  if (!API_KEY) console.error('No client key: set VITE_API_KEY in .env.local or apiKey in config.json; see README')
}
export const CLIENT_VERSION = '1.2.0'
export const LANGUAGE = 'fa'

export const QR_POLL_MS = 5000
export const QR_TTL_MS = 60 * 1000
export const OBSERVER_EVERY_S = 30

// XHR, not fetch: on the TV the app runs from file://, which Chromium's fetch refuses.
function readPackageFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', path)
    xhr.onload = () => (xhr.status === 200 || (xhr.status === 0 && xhr.responseText) ? resolve(xhr.responseText) : reject(new Error(`${xhr.status}`)))
    xhr.onerror = () => reject(new Error('unreadable'))
    xhr.send()
  })
}
