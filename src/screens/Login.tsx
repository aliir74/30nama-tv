import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { session } from '../api/client'
import { QR_POLL_MS, QR_TTL_MS } from '../api/config'
import { api } from '../api/endpoints'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { log } from '../lib/log'

type State = { kind: 'loading' } | { kind: 'code'; url: string; image: string } | { kind: 'error'; message: string }

export function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let poll: ReturnType<typeof setInterval> | undefined
    let expire: ReturnType<typeof setTimeout> | undefined

    ;(async () => {
      try {
        const qr = await api.qrCode()
        log('qrlogin_code', true, qr.code)
        const image = await QRCode.toDataURL(qr.url, { margin: 1, width: 420, color: { dark: '#0b0b0f', light: '#ffffff' } })
        if (cancelled) return
        setState({ kind: 'code', url: qr.url, image })

        poll = setInterval(async () => {
          try {
            const token = await api.qrLogin(qr.code)
            if (!token || cancelled) return
            clearInterval(poll)
            clearTimeout(expire)
            session.set(token)
            log('qrlogin_login', true, 'approved')
            onLoggedIn()
          } catch (e) {
            log('qrlogin_login', false, e)
          }
        }, QR_POLL_MS)
        // Codes are short-lived; issue a fresh one instead of polling a dead code.
        expire = setTimeout(() => setAttempt((a) => a + 1), QR_TTL_MS)
      } catch (e) {
        log('qrlogin_code', false, e)
        if (!cancelled) setState({ kind: 'error', message: e instanceof Error ? e.message : 'خطا' })
      }
    })()

    return () => {
      cancelled = true
      clearInterval(poll)
      clearTimeout(expire)
    }
  }, [attempt, onLoggedIn])

  return (
    <Screen id="login" active initialFocus="login-retry">
      <div className="login">
        <div className="login-text">
          <h1 className="brand">سی‌نما</h1>
          <h2>ورود به حساب</h2>
          <ol>
            <li>با گوشی یا کامپیوتری که در سی‌نما وارد حساب‌تان شده‌اید، کد QR را اسکن کنید.</li>
            <li>در صفحه‌ای که باز می‌شود، ورود این تلویزیون را تأیید کنید.</li>
          </ol>
          {state.kind === 'code' && <p className="login-url latin">{state.url}</p>}
          {state.kind === 'error' && <p className="error">{state.message}</p>}
          <Button focusKey="login-retry" onPress={() => setAttempt((a) => a + 1)}>
            کد جدید
          </Button>
        </div>
        <div className="login-qr">
          {state.kind === 'code' ? <img src={state.image} alt="" /> : <div className="spinner" />}
        </div>
      </div>
    </Screen>
  )
}
