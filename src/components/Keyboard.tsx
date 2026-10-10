import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState } from 'react'

type Layout = 'fa' | 'en' | 'num'

const LAYOUTS: Record<Layout, string[][]> = {
  fa: [
    ['ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح'],
    ['خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش'],
    ['ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق'],
    ['ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'],
    ['آ', 'ئ', 'ء', 'أ', '‌'],
  ],
  en: [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],
    ['q', 'r', 's', 't', 'u', 'v', 'w', 'x'],
    ['y', 'z', "'", '-', '.', ':', '&', '!'],
  ],
  num: [
    ['1', '2', '3', '4', '5'],
    ['6', '7', '8', '9', '0'],
  ],
}

// A focusable grid keyboard. The TV's own IME fights spatial navigation and the Back key,
// so search never opens it.
export function Keyboard({ value, onChange, focusKey }: { value: string; onChange: (v: string) => void; focusKey: string }) {
  const [layout, setLayout] = useState<Layout>('fa')
  const { ref, focusKey: key } = useFocusable({ focusKey, trackChildren: true, saveLastFocusedChild: true })
  const type = (c: string) => onChange(value + c)

  return (
    <FocusContext.Provider value={key}>
      <div ref={ref} className="keyboard" dir={layout === 'fa' ? 'rtl' : 'ltr'}>
        {LAYOUTS[layout].map((row, r) => (
          <div key={`${layout}-${r}`} className="kb-row">
            {row.map((c, i) => (
              <Key key={c} focusKey={r === 0 && i === 0 ? `${focusKey}-first` : undefined} label={c === '‌' ? 'نیم‌فاصله' : c} wide={c === '‌'} onPress={() => type(c)} />
            ))}
          </div>
        ))}
        <div className="kb-row" dir="rtl">
          <Key label="فاصله" wide onPress={() => value && !value.endsWith(' ') && type(' ')} />
          <Key label="⌫" onPress={() => onChange(value.slice(0, -1))} />
          <Key label="پاک" onPress={() => onChange('')} />
          <Key label={layout === 'fa' ? 'EN' : 'فا'} onPress={() => setLayout(layout === 'fa' ? 'en' : 'fa')} />
          <Key label={layout === 'num' ? 'abc' : '۱۲۳'} onPress={() => setLayout(layout === 'num' ? 'fa' : 'num')} />
        </div>
      </div>
    </FocusContext.Provider>
  )
}

function Key({ label, onPress, wide, focusKey }: { label: string; onPress: () => void; wide?: boolean; focusKey?: string }) {
  const { ref, focused } = useFocusable({ focusKey, onEnterPress: onPress })
  return (
    <div ref={ref} className={`key ${wide ? 'wide' : ''} ${focused ? 'focused' : ''} ${/^[\x20-\x7e]+$/.test(label) ? 'latin' : ''}`} onClick={onPress}>
      {label}
    </div>
  )
}
