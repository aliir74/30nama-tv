import Hls from 'hls.js'

export type Level = { index: number; height: number }

export type Engine = {
  levels: () => Level[]
  // -1 = automatic
  setLevel: (index: number) => void
  currentLevel: () => number
  destroy: () => void
}

export type Prefs = {
  // Audio channel count to prefer when a quality offers stereo and 5.1 ("2" or "6").
  channels: string
  // 0 = automatic; otherwise the highest height to start at and stay on.
  maxHeight: number
}

// hls.js over MSE where available (desktop, Tizen 6.5+) gives quality control;
// otherwise the platform player takes the master playlist directly.
export function attach(video: HTMLVideoElement, url: string, prefs: Prefs, onFatal: (msg: string) => void): Engine {
  if (Hls.isSupported()) {
    const hls = new Hls({
      maxBufferLength: 30,
      backBufferLength: 30,
      capLevelToPlayerSize: false,
      // Without an estimate hls.js starts on the first variant (240p) and climbs slowly.
      abrEwmaDefaultEstimate: 5_000_000,
    })
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
      else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
      else onFatal(`${data.type}: ${data.details}`)
    })
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!prefs.maxHeight) return
      // Highest variant at or below the preferred height.
      let pick = -1
      hls.levels.forEach((l, i) => {
        if (l.height <= prefs.maxHeight && (pick === -1 || l.height > hls.levels[pick].height)) pick = i
      })
      if (pick >= 0) {
        hls.startLevel = pick
        hls.currentLevel = pick
      }
    })
    // Each quality carries its own audio group, so the choice is re-applied after every switch.
    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_e, data) => {
      const i = data.audioTracks.findIndex((t) => t.channels === prefs.channels)
      if (i >= 0 && hls.audioTrack !== i) hls.audioTrack = i
    })
    hls.loadSource(url)
    hls.attachMedia(video)
    return {
      levels: () => hls.levels.map((l, index) => ({ index, height: l.height })),
      setLevel: (i) => (hls.currentLevel = i),
      currentLevel: () => (hls.autoLevelEnabled ? -1 : hls.currentLevel),
      destroy: () => hls.destroy(),
    }
  }
  video.src = url
  video.onerror = () => onFatal(`native: ${video.error?.code ?? '?'}`)
  return { levels: () => [], setLevel: () => undefined, currentLevel: () => -1, destroy: () => video.removeAttribute('src') }
}
