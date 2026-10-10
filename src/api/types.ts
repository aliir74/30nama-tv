// v2 shapes, taken from live responses of world.hana-api.com (2026-10-10).

type Sizes = { small?: string; medium?: string; large?: string; big?: string }
type Formats = { webp?: string; jpg?: string }

export type TitleImage = {
  poster?: { preview?: string; webp?: Sizes; jpg?: Sizes }
  cover?: Formats
}

export type Score = { score: number | null; votes?: number | null; link?: string }

// One Title shape is shared by home rows, search, archive, lists and detail.
export type Title = {
  id: number
  post_type: 'title' | string
  options: {
    title_type: 'movie' | 'series' | 'anime' | string
    stream: boolean
    is_series: boolean
    persian_subtitle: boolean
    exclusive_subtitle?: boolean
    coming_soon: boolean
    free_stream: boolean
  }
  info: {
    seasons?: number | null
    year?: number | null
    year_end?: number | null
    age?: string | null
    time?: { default?: number | null }
  }
  title: { english: string; local: string | null }
  plot?: { english?: string | null; local?: string | null }
  genre?: ({ name: string; slug: string } | string)[]
  cast?: Person[]
  crew?: { director?: Person[] | null; creator?: Person[] | null; writer?: Person[] | null }
  image?: TitleImage
  score?: { '30nama'?: Score; imdb?: Score; rottentomatoes?: Score; metacritic?: Score; myanimelist?: Score }
  network?: string[] | null
  country?: { name: string; code: string }[] | null
  air?: {
    air_status?: string | null
    next_episode_caption?: string | null
    next_episode_date?: { g?: string; j?: string } | null
  }
  list?: { watchlist?: number; favorite?: number }
  // continue_watching entries only
  data?: ContinueData
}

// Entry in the continue_watching list. `id` is the title's post id, not an episode file.
export type ContinueData = {
  id: number
  episode_title?: string
  season?: number
  episode?: number
  time: number
  display_time?: string
  progress: number | string
}

// Resume point inside a stream response; `file_id` identifies the episode or movie file.
export type StreamResume = {
  post_id: number
  file_id: number
  time: number
  progress?: number
  season?: number
  episode_number?: number
  episode_name?: string
}

export type Person = {
  id?: number | null
  name: string
  as?: string
  imdb?: string
  image?: { poster?: string | Formats }
}

export type Page = { posts: Title[]; page?: number; pages?: number; total?: number }

export type HomeStream = {
  hero_header?: Page
  suggested?: Page
  movies?: Page
  series?: Page
  anime?: Page
}

export type MenuItem = {
  id: number
  name: string
  slug: string
  count?: number
  image?: { webp?: { thumb?: string; full?: string }; jpg?: { thumb?: string; full?: string } }
}
export type Menu = { genres: MenuItem[]; categories: MenuItem[] }

export type User = {
  user_id: number
  user_name: string
  user_type: string
  user_allowed_to_stream: boolean
  user_avatar?: string
  user_expire?: { days: number; g?: string; j?: string }
}

export type QualitySource = { label: string; default: string; '2ch'?: string; '6ch'?: string }

export type StreamItem = {
  info: { file_id: number; season?: number; episode?: string; episode_number?: number; episode_name?: string }
  file: { m3u8: QualitySource[]; subtitle?: Partial<Record<'fa' | 'en', string>> | null }
  options: {
    intro_start?: string | null
    intro_end?: string | null
    previously_start?: string | null
    previously_end?: string | null
    end?: string | null
    token: string
  }
}

export type Stream = {
  info: { post_id: number; title: { english: string; local: string | null } }
  image?: TitleImage
  continue_watching?: StreamResume | null
  hls: StreamItem[]
}

export type QrCode = { code: string; url: string }

// No notification has been seen live yet, so every field is optional and read defensively.
export type Notification = {
  id: number
  title?: string
  text?: string
  message?: string
  content?: string
  read?: boolean | number
  date?: string | { g?: string; j?: string }
  post_id?: number
}
export type Notifications = { notifications: Notification[]; total_unread?: number; page?: number; pages?: number }

type Option = { name: string; value: string | number }
export type AdvancedParameters = {
  genre: Option[]
  type: Option[]
  imdb_rate: Option[]
  country: Option[]
  language: Option[]
  min_year: number
  max_year: number
}
export type MyLists = Record<'favorite' | 'watchlist' | 'downloadlist' | 'notify', { post: number[] }>

export function nameOf(t: { title: { english: string; local: string | null } }): string {
  return t.title.local?.trim() || t.title.english
}

// True when a string has no Persian/Arabic letters, so it should render with Latin digits.
export const isLatin = (s: string) => !/[\u0600-\u06FF]/.test(s)

export function posterOf(t: Title, size: keyof Sizes = 'large'): string | undefined {
  const p = t.image?.poster
  return p?.webp?.[size] || p?.jpg?.[size]
}

export function coverOf(t: { image?: TitleImage }): string | undefined {
  return t.image?.cover?.webp || t.image?.cover?.jpg
}

// "00:01:30" → 90
export function hms(s?: string | null): number | null {
  if (!s) return null
  const parts = s.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}
