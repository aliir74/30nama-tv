import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OBSERVER_EVERY_S } from '../api/config'
import { api } from '../api/endpoints'
import { hms, nameOf, type StreamItem } from '../api/types'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { log } from '../lib/log'
import { settings, useSettings } from '../lib/settings'
import { is } from '../lib/tv'
import { useStack } from '../nav/stack'
import { streamQuery } from '../screens/TitleScreen'
import { attach, type Engine, type Level } from './engine'
import { cueAt, loadCues, type Cue } from './subtitles'

type SubLang = 'fa' | 'en' | 'off'
type Panel = 'main' | 'quality' | 'subs'

const HIDE_AFTER_MS = 5000

const clock = (s: number) => {
  if (!Number.isFinite(s)) return '--:--'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function Player({ id, fileId, active }: { id: number; fileId?: number; active: boolean }) {
  const { back, replace } = useStack()
  const stream = useQuery(streamQuery(id))
  const user = useQuery({ queryKey: ['user'], queryFn: api.user, staleTime: 60 * 60_000 })

  const items = stream.data?.hls ?? []
  // No explicit file means "resume": use the stream's saved episode, else the first file.
  const target = fileId ?? stream.data?.continue_watching?.file_id
  const index = Math.max(0, target ? items.findIndex((i) => i.info.file_id === target) : 0)
  const item: StreamItem | undefined = items[index]
  const next = items[index + 1]

  const videoRef = useRef<HTMLVideoElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [level, setLevel] = useState(-1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(NaN)
  const [paused, setPaused] = useState(true)
  const [buffering, setBuffering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controls, setControls] = useState(true)
  const [panel, setPanel] = useState<Panel>('main')
  const prefs = useSettings()
  const subLang = prefs.subLang
  const [cues, setCues] = useState<Cue[]>([])
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const introStart = hms(item?.options.intro_start)
  const introEnd = hms(item?.options.intro_end)
  const creditsAt = hms(item?.options.end)
  const inIntro = introEnd !== null && time >= (introStart ?? 0) && time < introEnd - 1
  const inCredits = !!next && creditsAt !== null && time >= creditsAt

  // ---- media setup -------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current
    const url = item?.file.m3u8[0]?.default
    if (!video || !url) return
    setError(null)
    setBuffering(true)
    log('stream', true, `file ${item.info.file_id}`)
    // Read once per file: a settings change applies from the next title, not mid-stream.
    const { audio, quality } = settings.get()
    const engine = attach(video, url, { channels: audio, maxHeight: quality }, (msg) => {
      log('playback', false, msg)
      setError(msg)
    })
    engineRef.current = engine

    const resume = stream.data?.continue_watching
    const startAt = resume && resume.file_id === item.info.file_id && resume.time > 0 ? resume.time : 0
    const onMeta = () => {
      if (startAt) video.currentTime = startAt
      setLevels(engine.levels())
      setLevel(engine.currentLevel())
      setDuration(video.duration)
      video.play().catch((e) => log('autoplay', false, e))
    }
    video.addEventListener('loadedmetadata', onMeta, { once: true })
    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      engine.destroy()
      engineRef.current = null
    }
  }, [item, stream.data?.continue_watching])

  useEffect(() => {
    const url = subLang !== 'off' ? item?.file.subtitle?.[subLang] : undefined
    setCues([])
    if (!url) return
    loadCues(url)
      .then((c) => {
        setCues(c)
        log(`subtitle ${subLang}`, true, `${c.length} cues`)
      })
      .catch((e) => log(`subtitle ${subLang}`, false, e))
  }, [item, subLang])

  // ---- progress reporting ------------------------------------------------------------------
  const lastReport = useRef(0)
  const report = useCallback(() => {
    const video = videoRef.current
    const uid = user.data?.user_id
    if (!video || !item || !uid || !(video.currentTime > 0)) return
    lastReport.current = video.currentTime
    api
      .observer(id, item.info.file_id, uid, Math.floor(video.currentTime), Math.floor(video.duration || 0), item.options.token)
      .then((r) => log('observer', r.success, Math.floor(video.currentTime)))
      .catch((e) => log('observer', false, e))
  }, [id, item, user.data?.user_id])

  useEffect(() => () => report(), [report])

  const onTime = () => {
    const video = videoRef.current
    if (!video) return
    setTime(video.currentTime)
    if (Math.abs(video.currentTime - lastReport.current) >= OBSERVER_EVERY_S) report()
  }

  // ---- controls ----------------------------------------------------------------------------
  const showControls = useCallback(() => {
    setControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) {
        setControls(false)
        setPanel('main')
      }
    }, HIDE_AFTER_MS)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch((e) => log('play', false, e))
    else v.pause()
  }, [])

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v || !Number.isFinite(v.duration)) return
    v.currentTime = Math.max(0, Math.min(v.duration - 1, v.currentTime + delta))
  }, [])

  const playNext = useCallback(() => {
    if (!next) return
    report()
    replace({ name: 'player', id, fileId: next.info.file_id })
  }, [next, id, replace, report])

  const skipIntro = useCallback(() => {
    if (introEnd !== null && videoRef.current) videoRef.current.currentTime = introEnd
  }, [introEnd])

  useEffect(() => {
    if (controls && active) setTimeout(() => setFocus(panel === 'main' ? 'pl-play' : `pl-${panel}-0`), 0)
  }, [controls, panel, active])

  // Captures keys before spatial navigation and the stack, so the hidden-controls
  // state can map arrows to seeking and Back to "hide controls" first.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const stop = () => {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
      if (is(e, 'PlayPause') || is(e, 'Play') || is(e, 'Pause')) return stop(), togglePlay(), showControls()
      if (is(e, 'FastForward')) return stop(), seekBy(30), showControls()
      if (is(e, 'Rewind')) return stop(), seekBy(-30), showControls()
      if (is(e, 'Stop')) return stop(), back()
      if (is(e, 'Back')) {
        stop()
        if (controls && panel !== 'main') setPanel('main')
        else if (controls && !videoRef.current?.paused) setControls(false)
        else back()
        return
      }
      if (controls) {
        showControls()
        return
      }
      stop()
      if (is(e, 'Enter')) {
        if (inIntro) skipIntro()
        else if (inCredits) playNext()
        else togglePlay()
        showControls()
        // The timeline is drawn left-to-right, so Right moves forward even in the RTL UI.
      } else if (e.keyCode === 39) seekBy(10)
      else if (e.keyCode === 37) seekBy(-10)
      else showControls()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, controls, panel, inIntro, inCredits, togglePlay, seekBy, showControls, skipIntro, playNext, back])

  const cue = useMemo(() => cueAt(cues, time), [cues, time])
  const title = stream.data ? nameOf(stream.data.info) : ''
  const pct = Number.isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0

  if (stream.isError) return <p className="error center">{(stream.error as Error).message}</p>

  return (
    <Screen id={`player-${id}`} active={active}>
      <div className="player">
        <video
          ref={videoRef}
          className="video"
          onTimeUpdate={onTime}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => {
            setPaused(false)
            showControls()
          }}
          onPause={() => {
            setPaused(true)
            setControls(true)
            report()
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onEnded={() => (next ? playNext() : back())}
        />
        {cue && (
          <div className={`subtitle size-${prefs.subSize} ${controls ? 'raised' : ''}`} dir="auto">
            {cue.text.split('\n').map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
        {buffering && !error && <div className="spinner center" />}
        {error && <p className="error center">خطای پخش: {error}</p>}

        {!controls && inIntro && <div className="prompt">OK: رد کردن تیتراژ</div>}
        {!controls && inCredits && <div className="prompt">OK: قسمت بعد</div>}

        {controls && (
          <div className="osd">
            <div className="osd-top">
              <h1>{title}</h1>
              {item?.info.episode_name && <h2>{item.info.episode_name}</h2>}
            </div>
            <div className="osd-bottom">
              <div className="timeline" dir="ltr">
                <span>{clock(time)}</span>
                <div className="bar">
                  <div style={{ width: `${pct}%` }} />
                </div>
                <span>{clock(duration)}</span>
              </div>
              {panel === 'main' && (
                <div className="osd-actions">
                  <Button focusKey="pl-play" variant="primary" onPress={togglePlay}>
                    {paused ? '▶ پخش' : '❚❚ توقف'}
                  </Button>
                  <Button onPress={() => seekBy(-10)}>۱۰ ثانیه عقب</Button>
                  <Button onPress={() => seekBy(10)}>۱۰ ثانیه جلو</Button>
                  {inIntro && <Button onPress={skipIntro}>رد کردن تیتراژ</Button>}
                  {next && <Button onPress={playNext}>قسمت بعد</Button>}
                  <Button onPress={() => setPanel('subs')}>زیرنویس: {subLang === 'fa' ? 'فارسی' : subLang === 'en' ? 'انگلیسی' : 'خاموش'}</Button>
                  {levels.length > 0 && (
                    <Button onPress={() => setPanel('quality')}>
                      کیفیت: {level === -1 ? 'خودکار' : `${levels[level]?.height}p`}
                    </Button>
                  )}
                </div>
              )}
              {panel === 'subs' && (
                <div className="osd-actions">
                  {(['fa', 'en', 'off'] as SubLang[]).map((l, i) => (
                    <Button
                      key={l}
                      focusKey={`pl-subs-${i}`}
                      className={l === subLang ? 'selected' : ''}
                      onPress={() => {
                        settings.set({ subLang: l })
                        setPanel('main')
                      }}
                    >
                      {l === 'fa' ? 'فارسی' : l === 'en' ? 'انگلیسی' : 'خاموش'}
                    </Button>
                  ))}
                </div>
              )}
              {panel === 'quality' && (
                <div className="osd-actions">
                  {[{ index: -1, height: 0 }, ...[...levels].reverse()].map((l, i) => (
                    <Button
                      key={l.index}
                      focusKey={`pl-quality-${i}`}
                      className={l.index === level ? 'selected' : ''}
                      onPress={() => {
                        engineRef.current?.setLevel(l.index)
                        setLevel(l.index)
                        setPanel('main')
                      }}
                    >
                      {l.index === -1 ? 'خودکار' : `${l.height}p`}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Screen>
  )
}
