export type Cue = { start: number; end: number; text: string }

function toSeconds(ts: string): number {
  const [hms, ms = '0'] = ts.trim().replace(',', '.').split('.')
  const parts = hms.split(':').map(Number)
  const secs = parts.reduce((acc, n) => acc * 60 + n, 0)
  return secs + Number(`0.${ms}`)
}

// Parses WebVTT and SRT alike: both are blocks of "start --> end" followed by text lines.
export function parseCues(raw: string): Cue[] {
  const cues: Cue[] = []
  const blocks = raw.replace(/\r/g, '').replace(/^﻿/, '').split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.split('\n')
    const at = lines.findIndex((l) => l.includes('-->'))
    if (at < 0) continue
    const [start, rest] = lines[at].split('-->')
    const end = rest.trim().split(/\s+/)[0]
    const text = lines
      .slice(at + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .replace(/﻿/g, '')
      .trim()
    if (text) cues.push({ start: toSeconds(start), end: toSeconds(end), text })
  }
  return cues
}

export async function loadCues(url: string): Promise<Cue[]> {
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok || text.trimStart().startsWith('<')) throw new Error(`subtitle ${res.status}`)
  return parseCues(text)
}

// Cues are sorted; a binary search keeps per-frame lookups cheap on TV hardware.
export function cueAt(cues: Cue[], t: number): Cue | null {
  let lo = 0
  let hi = cues.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cues[mid].end < t) lo = mid + 1
    else if (cues[mid].start > t) hi = mid - 1
    else return cues[mid]
  }
  return null
}
