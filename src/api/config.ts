// Identity of the official 30nama TV client (tv.30app.store, Android TV app v3.2.3).
// Values can rotate; keep them in this one file.
export const API_BASE = 'https://world.hana-api.com/api/v2/action/'
// The client key is not committed: put VITE_API_KEY=... in .env.local (git-ignored) before building.
export const API_KEY: string = import.meta.env.VITE_API_KEY ?? ''
if (!API_KEY) console.error('VITE_API_KEY is missing; see README')
export const CLIENT_VERSION = '1.2.0'
export const LANGUAGE = 'fa'

export const QR_POLL_MS = 5000
export const QR_TTL_MS = 60 * 1000
export const OBSERVER_EVERY_S = 30
