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
  Red: [403, 82], // ColorF0Red, "r" opens the debug log
} as const

export const is = (e: KeyboardEvent, k: keyof typeof Keys) => (Keys[k] as readonly number[]).includes(e.keyCode)

type TizenInput = { registerKey: (name: string) => void }
type TizenApp = { getCurrentApplication: () => { exit: () => void } }
declare global {
  interface Window {
    tizen?: { tvinputdevice?: TizenInput; application?: TizenApp }
  }
}

export const isTizen = () => typeof window.tizen !== 'undefined'

// Media and color keys are not delivered to web apps until they are registered.
export function registerTvKeys() {
  const input = window.tizen?.tvinputdevice
  if (!input) return
  for (const name of ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind', 'ColorF0Red']) {
    try {
      input.registerKey(name)
    } catch {
      // Older firmware lacks some keys; the remote still works without them.
    }
  }
}

export function exitApp() {
  window.tizen?.application?.getCurrentApplication().exit()
}
