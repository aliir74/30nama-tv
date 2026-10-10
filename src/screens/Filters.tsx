import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/endpoints'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { useStack } from '../nav/stack'

type Choice = { label: string; value: string | number }
type Decade = { label: string; min: number; max: number }

const DECADES: Decade[] = [
  { label: 'دهه ۲۰۲۰', min: 2020, max: 2029 },
  { label: 'دهه ۲۰۱۰', min: 2010, max: 2019 },
  { label: 'دهه ۲۰۰۰', min: 2000, max: 2009 },
  { label: 'دهه ۱۹۹۰', min: 1990, max: 1999 },
  { label: 'قدیمی‌تر', min: 1890, max: 1989 },
]

// The parameter list is long (87 countries); the TV shows the most useful slice of each.
const COUNTRIES = 16
const RATES = 6

export function Filters({ active }: { active: boolean }) {
  const { push } = useStack()
  const params = useQuery({ queryKey: ['advanced_search_parameters'], queryFn: api.advancedSearchParameters, staleTime: 6 * 60 * 60_000 })
  const [types, setTypes] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [rate, setRate] = useState<number | null>(null)
  const [decade, setDecade] = useState<Decade | null>(null)

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const reset = () => {
    setTypes([])
    setGenres([])
    setCountries([])
    setRate(null)
    setDecade(null)
  }
  const show = () => {
    // Only streamable titles: the TV app cannot download.
    const p: Record<string, unknown> = { stream: 'true' }
    if (types.length) p.type = types
    if (genres.length) p.genre = genres
    if (countries.length) p.country = countries
    if (rate !== null) p.imdb_rate = rate
    if (decade) Object.assign(p, { min_year: decade.min, max_year: decade.max })
    push({ name: 'list', title: 'نتایج جستجوی پیشرفته', source: { kind: 'filter', params: p } })
  }

  const d = params.data
  const opts = (xs: { name: string; value: string | number }[]): Choice[] => xs.map((x) => ({ label: x.name, value: x.value }))

  return (
    <Screen id="filters" active={active} initialFocus="filters-show">
      <div className="page">
        <div className="scroll-page">
          <div className="page-head">
            <h1>جستجوی پیشرفته</h1>
            <div className="chips">
              <Button focusKey="filters-show" variant="primary" onPress={show}>
                نمایش نتایج
              </Button>
              <Button onPress={reset}>پاک کردن</Button>
            </div>
          </div>
          {params.isError && <p className="error">{(params.error as Error).message}</p>}
          {params.isLoading && <div className="spinner center" />}
          {d && (
            <>
              <ChoiceRow title="نوع" choices={opts(d.type)} isOn={(v) => types.includes(String(v))} onPick={(v) => toggle(types, setTypes, String(v))} />
              <ChoiceRow title="ژانر" choices={opts(d.genre)} isOn={(v) => genres.includes(String(v))} onPick={(v) => toggle(genres, setGenres, String(v))} />
              <ChoiceRow title="امتیاز IMDb" choices={opts(d.imdb_rate.slice(0, RATES))} isOn={(v) => rate === v} onPick={(v) => setRate(rate === v ? null : Number(v))} />
              <ChoiceRow
                title="سال ساخت"
                choices={DECADES.map((x) => ({ label: x.label, value: x.min }))}
                isOn={(v) => decade?.min === v}
                onPick={(v) => setDecade(decade?.min === v ? null : DECADES.find((x) => x.min === v) ?? null)}
              />
              <ChoiceRow title="کشور" choices={opts(d.country.slice(0, COUNTRIES))} isOn={(v) => countries.includes(String(v))} onPick={(v) => toggle(countries, setCountries, String(v))} />
            </>
          )}
        </div>
      </div>
    </Screen>
  )
}

function ChoiceRow({ title, choices, isOn, onPick }: { title: string; choices: Choice[]; isOn: (v: string | number) => boolean; onPick: (v: string | number) => void }) {
  const { ref, focusKey } = useFocusable({ saveLastFocusedChild: true })
  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className="choice-row">
        <h2 className="section-title">{title}</h2>
        <div className="chips wrap">
          {choices.map((c) => (
            <Chip key={String(c.value)} label={c.label} on={isOn(c.value)} onPress={() => onPick(c.value)} />
          ))}
        </div>
      </section>
    </FocusContext.Provider>
  )
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { ref, focused } = useFocusable({ onEnterPress: onPress, onFocus: () => ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }) })
  return (
    <div ref={ref} className={`chip ${on ? 'on' : ''} ${focused ? 'focused' : ''}`} onClick={onPress}>
      {on && '✓ '}
      {label}
    </div>
  )
}
