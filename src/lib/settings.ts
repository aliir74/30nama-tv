import { useSyncExternalStore } from 'react'

// Viewer preferences, kept on the TV in localStorage.
export type Settings = {
  subLang: 'fa' | 'en' | 'off'
  subSize: 's' | 'm' | 'l'
  // Preferred audio channels when a title offers stereo and 5.1.
  audio: '2' | '6'
  // 0 = automatic, otherwise the highest video height to start at.
  quality: 0 | 1080 | 720 | 480
}

const KEY = '30nama.settings'
const LEGACY_SUB_KEY = '30nama.subLang'
const defaults: Settings = { subLang: 'fa', subSize: 'm', audio: '2', quality: 0 }

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Settings>
    const legacySub = localStorage.getItem(LEGACY_SUB_KEY) as Settings['subLang'] | null
    return { ...defaults, ...(legacySub ? { subLang: legacySub } : {}), ...saved }
  } catch {
    return defaults
  }
}

let current = load()
const listeners = new Set<() => void>()

export const settings = {
  get: () => current,
  set: (patch: Partial<Settings>) => {
    current = { ...current, ...patch }
    localStorage.setItem(KEY, JSON.stringify(current))
    listeners.forEach((l) => l())
  },
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export const useSettings = () => useSyncExternalStore(settings.subscribe, settings.get)
