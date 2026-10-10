import { API_BASE, API_KEY, CLIENT_VERSION, LANGUAGE } from './config'

const TOKEN_KEY = '30nama.v2.token'

export type ApiErrorKind = 'challenge' | 'unauthorized' | 'rejected' | 'network'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

type Envelope<T> = { status: number; success: boolean; error: boolean; msg: string | null; result: T }

export const session = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

type Form = Record<string, string | number | boolean | null | undefined>

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function call<T>(action: string, form: Form = {}, opts: { retries?: number } = {}): Promise<Envelope<T>> {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) if (v !== undefined && v !== null) body.append(k, String(v))

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'c-api-key': API_KEY,
    'c-version-number': CLIENT_VERSION,
    'c-language': LANGUAGE,
  }
  const token = session.get()
  if (token) headers['c-token'] = token

  const retries = opts.retries ?? 2
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_BASE + action, { method: 'POST', headers, body })
      const text = await res.text()
      // Fire-and-forget actions such as `observer` answer 204 with no body.
      if (res.status === 204 || (res.ok && !text.trim()))
        return { status: res.status, success: true, error: false, msg: null, result: null as T }
      // Cloudflare answers blocked clients with an HTML challenge page instead of JSON.
      if (text.trimStart().startsWith('<')) throw new ApiError('challenge', 'سرور سی‌نما درخواست را مسدود کرد', res.status)
      const json = JSON.parse(text) as Envelope<T>
      if (json.status === 401 || json.status === 403) throw new ApiError('unauthorized', json.msg || 'دسترسی ندارید', json.status)
      return json
    } catch (e) {
      if (e instanceof ApiError) throw e
      lastError = e
      if (attempt < retries) await sleep(1500 * (attempt + 1))
    }
  }
  throw new ApiError('network', lastError instanceof Error ? lastError.message : 'اتصال برقرار نشد')
}

// Most screens only want the result and treat success:false as an error.
export async function result<T>(action: string, form: Form = {}): Promise<T> {
  const env = await call<T>(action, form)
  if (!env.success) throw new ApiError('rejected', env.msg || 'خطای ناشناخته', env.status)
  return env.result
}
