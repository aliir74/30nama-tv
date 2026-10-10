import { call, result } from './client'
import type { AdvancedParameters, HomeStream, Menu, MyLists, Notifications, Page, QrCode, Stream, Title, User } from './types'

// v2 actions, mirrored from the official TV client's SDK (tv.30app.store bundle).
export const api = {
  // auth
  qrCode: () => result<QrCode>('qrlogin_code'),
  // Resolves to the token once the code is approved, null while pending (msg CODE_NOT_USED).
  qrLogin: async (code: string) => {
    const env = await call<{ token?: string } | null>('qrlogin_login', { auth_code: code }, { retries: 0 })
    return env.result?.token ?? null
  },
  user: () => result<User>('user'),
  logout: () => call('logout'),

  // browse
  home: () => result<HomeStream>('home'),
  homeStream: () => result<HomeStream>('home_stream'),
  menu: () => result<Menu>('menu'),
  single: (postId: number) => result<Title>('single', { post_id: postId }),
  // `streamonly` must be the string "true"; the server ignores 1 and returns unplayable titles.
  search: (query: string, page = 1, streamOnly = true) =>
    result<Page>('search', { query, streamonly: String(streamOnly), page }),
  archive: (slugs: string, page = 1, orderBy = 'relevant', order = 'desc', streamOnly = true) =>
    result<Page>('archive', { slugs, streamonly: String(streamOnly), page, orderby: orderBy, order }),
  advancedSearchParameters: () => result<AdvancedParameters>('advanced_search_parameters'),
  // List fields take arrays (genre: ['drama']); people (actor, director) take an IMDb id such as nm0000206.
  advancedSearch: (parameters: object, page = 1, orderBy = 'relevant', order = 'desc') =>
    result<Page>('advanced_search', { parameters: JSON.stringify(parameters), orderby: orderBy, order, page }),
  notifications: (page = 1) => result<Notifications>('notification', { page }),
  readNotification: (id: number) => call('notification_read', { notification_id: id }),

  // playback
  stream: (postId: number, freeStream = false) =>
    result<Stream>('stream', { post_id: postId, free_stream: freeStream ? 1 : undefined }),
  continueWatching: () => result<Page>('continue_watching'),
  dismissContinue: (id: number) => call('continue_watching_dismiss', { id }),
  observer: (postId: number, fileId: number, userId: number, time: number, duration: number, token: string) =>
    call('observer', { post_id: postId, file_id: fileId, user_id: userId, time, duration, token }, { retries: 0 }),

  // library
  myLists: () => result<MyLists>('user_mylist'),
  list: (group: string, page = 1, orderBy = 'add_list', order = 'DESC') =>
    result<Page>('user_list', { action: 'list', group, page, orderby: orderBy, order }),
  // `add` toggles: a second call removes the title again.
  toggleList: (group: string, postId: number) => call('user_list', { action: 'add', group, post_id: postId }),
}
