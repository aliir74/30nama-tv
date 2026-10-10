// On-screen diagnostic log. On the TV there is no console, so each network step reports
// here and the Red key (or "r" on desktop) shows it for a photo.
export type LogLine = { at: string; step: string; ok: boolean; detail?: string }

let lines: LogLine[] = []
const listeners = new Set<() => void>()

export function log(step: string, ok: boolean, detail?: unknown) {
  const text = detail === undefined ? undefined : detail instanceof Error ? detail.message : String(detail)
  // A new array per change keeps useSyncExternalStore snapshots stable between changes.
  lines = [...lines.slice(-59), { at: new Date().toLocaleTimeString('en-GB'), step, ok, detail: text?.slice(0, 160) }]
  listeners.forEach((l) => l())
}

export const logStore = {
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  snapshot: () => lines,
}
