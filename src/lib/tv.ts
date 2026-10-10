// Samsung remote key codes (Tizen TV) plus desktop equivalents for development.
export const Keys = {
  Back: [10009, 8, 27], // Return, Backspace, Escape
  Enter: [13],
  PlayPause: [10252, 32], // MediaPlayPause, Space
  Play: [415],
  Pause: [19],
  Stop: [413],
  FastForward: [417, 190], // MediaFastForward, "."
  Rewind: [412, 188], // MediaRewind, ","
  NextTrack: [10233, 78], // MediaTrackNext, "n"
  PrevTrack: [10232, 80], // MediaTrackPrevious, "p"
  Red: [403, 82], // ColorF0Red, "r" opens the debug log
} as const

export const is = (e: KeyboardEvent, k: keyof typeof Keys) => (Keys[k] as readonly number[]).includes(e.keyCode)

type TizenInput = { registerKey: (name: string) => void }
type TizenApp = { getCurrentApplication: () => { exit: () => void } }
type AppCommon = { setScreenSaver: (state: number) => void; AppCommonScreenSaverState: { SCREEN_SAVER_OFF: number; SCREEN_SAVER_ON: number } }
declare global {
  interface Window {
    tizen?: { tvinputdevice?: TizenInput; application?: TizenApp }
    // Samsung product API, loaded by index.html from $WEBAPIS on the TV only.
    webapis?: { appcommon?: AppCommon }
  }
}

export const isTizen = () => typeof window.tizen !== 'undefined'

// Media and color keys are not delivered to web apps until they are registered.
export function registerTvKeys() {
  const input = window.tizen?.tvinputdevice
  if (!input) return
  for (const name of ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind', 'MediaTrackNext', 'MediaTrackPrevious', 'ColorF0Red']) {
    try {
      input.registerKey(name)
    } catch {
      // Older firmware lacks some keys; the remote still works without them.
    }
  }
}

// Scroll areas are real scrollers (for GPU scrolling), so the browser would also scroll them on
// arrow keys. Spatial navigation owns the arrows; the browser's default is switched off.
export function blockNativeArrowScroll() {
  window.addEventListener('keydown', (e) => {
    if (e.keyCode >= 37 && e.keyCode <= 40) e.preventDefault()
  })
}

// The TV starts its screensaver after a few idle minutes, even over HTML5 video.
export function setScreenSaver(on: boolean) {
  const app = window.webapis?.appcommon
  if (!app) return
  try {
    const s = app.AppCommonScreenSaverState
    app.setScreenSaver(on ? s.SCREEN_SAVER_ON : s.SCREEN_SAVER_OFF)
  } catch {
    // Not every firmware exposes it; playback works without it.
  }
}

export function exitApp() {
  window.tizen?.application?.getCurrentApplication().exit()
}
