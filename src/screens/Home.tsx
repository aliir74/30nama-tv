import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { api } from '../api/endpoints'
import { coverOf, isLatin, nameOf, type Title } from '../api/types'
import { Button } from '../components/Button'
import { Row } from '../components/Row'
import { Screen } from '../components/Screen'
import { SideMenu } from '../components/SideMenu'
import { useStack } from '../nav/stack'

export function Home({ active }: { active: boolean }) {
  const { push } = useStack()
  const home = useQuery({ queryKey: ['home_stream'], queryFn: api.homeStream, staleTime: 15 * 60_000 })
  const cw = useQuery({ queryKey: ['continue_watching'], queryFn: api.continueWatching, staleTime: 0, enabled: active })

  const open = (t: Title) => push({ name: 'title', id: t.id })
  // The player resolves the episode and position from the stream's resume point.
  const resume = (t: Title) => push({ name: 'player', id: t.id })
  const shown = home.data?.hero_header?.posts[0] ?? null
  const scrollRef = useRef<HTMLDivElement>(null)
  // The hero is taller than the screen's "nearest" scroll, so going back up shows all of it.
  const toTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  if (home.isError) return <p className="error center">{(home.error as Error).message}</p>

  return (
    <Screen id="home" active={active} initialFocus="hero-play">
      {/* The rail sits outside the scroller so it stays put while home scrolls. */}
      <div className="page has-rail">
        <SideMenu current="home" />
        <div className="home" ref={scrollRef}>
        {shown && (
          <header className="hero" style={{ backgroundImage: `url(${coverOf(shown)})` }}>
            <div className="hero-shade" />
            <div className="hero-body">
              <h1 className={`hero-title ${isLatin(nameOf(shown)) ? 'latin' : ''}`}>{nameOf(shown)}</h1>
              <div className="meta">
                {!!shown.info.year && <span>{shown.info.year}</span>}
                {!!shown.score?.imdb?.score && <span className="imdb">IMDb {shown.score.imdb.score}</span>}
                {shown.info.age && <span>{shown.info.age}</span>}
              </div>
              <p className="hero-plot">{shown.plot?.local || shown.plot?.english}</p>
              <div className="actions">
                <Button focusKey="hero-play" variant="primary" onFocus={toTop} onPress={() => (shown.options.is_series ? open(shown) : push({ name: 'player', id: shown.id }))}>
                  ▶ پخش
                </Button>
                <Button onFocus={toTop} onPress={() => open(shown)}>
                  جزئیات
                </Button>
              </div>
            </div>
          </header>
        )}
        {cw.data && <Row title="ادامه تماشا" items={cw.data.posts} onOpen={resume} />}
        {home.data && (
          <>
            <Row title="پیشنهاد ویژه" items={home.data.hero_header?.posts ?? []} onOpen={open} />
            <Row title="پیشنهادی" items={home.data.suggested?.posts ?? []} onOpen={open} />
            <Row title="فیلم" items={home.data.movies?.posts ?? []} onOpen={open} />
            <Row title="سریال" items={home.data.series?.posts ?? []} onOpen={open} />
            <Row title="انیمه" items={home.data.anime?.posts ?? []} onOpen={open} />
          </>
        )}
        {home.isLoading && <div className="spinner center" />}
        </div>
      </div>
    </Screen>
  )
}
