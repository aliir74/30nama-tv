import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { session } from '../api/client'
import { api } from '../api/endpoints'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Sheet } from '../components/Sheet'
import { SideMenu } from '../components/SideMenu'
import { log } from '../lib/log'
import { settings, useSettings, type Settings } from '../lib/settings'

const PLANS: Record<string, string> = { golden: 'طلایی', silver: 'نقره‌ای', bronze: 'برنزی', free: 'رایگان' }

type Option<K extends keyof Settings> = { value: Settings[K]; label: string }

export function Profile({ active }: { active: boolean }) {
  const user = useQuery({ queryKey: ['user'], queryFn: api.user, staleTime: 60 * 60_000 })
  const s = useSettings()
  const [confirm, setConfirm] = useState(false)
  const u = user.data

  const logout = () =>
    api
      .logout()
      .catch((e) => log('logout', false, e))
      .finally(() => {
        session.clear()
        // A reload drops every cached query and lands on the QR screen.
        location.reload()
      })

  return (
    <Screen id="profile" active={active} initialFocus="settings-subLang">
      <div className="page has-rail">
        <SideMenu current="profile" />
        <div className="scroll-page">
          <div className="page-head">
            <h1>حساب و تنظیمات</h1>
          </div>
          {u && (
            <div className="account">
              {u.user_avatar && <img className="avatar" src={u.user_avatar} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />}
              <div>
                <div className="account-name latin">{u.user_name}</div>
                <div className="meta">
                  <span>اشتراک {PLANS[u.user_type] ?? u.user_type}</span>
                  {u.user_expire && <span>{u.user_expire.days} روز باقی‌مانده</span>}
                  {u.user_expire?.j && <span>تا {u.user_expire.j.split(' ')[0]}</span>}
                  {!u.user_allowed_to_stream && <span className="error">پخش آنلاین برای این حساب فعال نیست</span>}
                </div>
              </div>
            </div>
          )}

          <SettingRow<'subLang'> name="subLang" title="زیرنویس پیش‌فرض" value={s.subLang} options={[
            { value: 'fa', label: 'فارسی' },
            { value: 'en', label: 'انگلیسی' },
            { value: 'off', label: 'خاموش' },
          ]} />
          <SettingRow<'subSize'> name="subSize" title="اندازه زیرنویس" value={s.subSize} options={[
            { value: 's', label: 'کوچک' },
            { value: 'm', label: 'متوسط' },
            { value: 'l', label: 'بزرگ' },
          ]} />
          <SettingRow<'audio'> name="audio" title="صدا" value={s.audio} options={[
            { value: '2', label: 'استریو (۲ کاناله)' },
            { value: '6', label: 'فراگیر ۵.۱ (۶ کاناله)' },
          ]} />
          <SettingRow<'quality'> name="quality" title="کیفیت تصویر" value={s.quality} options={[
            { value: 0, label: 'خودکار' },
            { value: 1080, label: '1080p' },
            { value: 720, label: '720p' },
            { value: 480, label: '480p' },
          ]} />

          <div className="actions">
            <Button onPress={() => setConfirm(true)}>خروج از حساب</Button>
          </div>
        </div>
        {confirm && (
          <Sheet
            id="logout-sheet"
            title="از حساب سی‌نما در این تلویزیون خارج شوید؟"
            onClose={() => setConfirm(false)}
            actions={[
              { label: 'انصراف', onPress: () => undefined },
              { label: 'خروج', variant: 'primary', onPress: logout },
            ]}
          />
        )}
      </div>
    </Screen>
  )
}

function SettingRow<K extends keyof Settings>({ name, title, value, options }: { name: K; title: string; value: Settings[K]; options: Option<K>[] }) {
  const { ref, focusKey } = useFocusable({ focusKey: `settings-${name}`, saveLastFocusedChild: true })
  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className="setting">
        <h2 className="section-title">{title}</h2>
        <div className="chips">
          {options.map((o) => (
            <Button
              key={String(o.value)}
              className={`${o.value === value ? 'selected' : ''} ${/^[\x20-\x7e]+$/.test(o.label) ? 'latin' : ''}`}
              onPress={() => settings.set({ [name]: o.value } as Partial<Settings>)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </section>
    </FocusContext.Provider>
  )
}
