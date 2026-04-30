'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string   // YYYY-MM-DDTHH:MM[:SS]
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function splitISO(iso: string) {
  if (!iso) return { date: '', time: '' }
  const [dp, tp] = iso.split('T')
  const [y, m, d] = (dp ?? '').split('-')
  return {
    date: y && m && d ? `${d}/${m}/${y}` : '',
    time: (tp ?? '').slice(0, 5),
  }
}

function toISO(dateFr: string, time: string) {
  const p = dateFr.replace(/[^\d]/g, '/').split('/').filter(Boolean)
  return p.length === 3 && p[2].length === 4 && time
    ? `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}T${time}:00`
    : ''
}

const DateTimeInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, className, name, disabled, required }, ref) => {
    const init = splitISO(value ?? '')
    const [dateFr, setDateFr] = useState(init.date)
    const [time,   setTime]   = useState(init.time)
    const hiddenRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      const { date, time } = splitISO(value ?? '')
      setDateFr(date); setTime(time)
      if (hiddenRef.current) hiddenRef.current.value = value ?? ''
    }, [value])

    const emit = (d: string, t: string) => {
      const iso = toISO(d, t)
      if (hiddenRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(hiddenRef.current, iso)
        hiddenRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        hiddenRef.current.value = iso
      }
      onChange?.({ target: { value: iso, name: name ?? '' } } as React.ChangeEvent<HTMLInputElement>)
    }

    const handleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d/]/g, '')
      raw = raw.replace(/^(\d{2})(\d)/, '$1/$2')
      raw = raw.replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')
      if (raw.length > 10) raw = raw.slice(0, 10)
      setDateFr(raw); emit(raw, time)
    }

    const handleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTime(e.target.value); emit(dateFr, e.target.value)
    }

    const cls = 'h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

    return (
      <div className="flex gap-2">
        <input
          ref={(node) => {
            hiddenRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.RefObject<HTMLInputElement | null>).current = node
          }}
          type="hidden"
          name={name}
          defaultValue={value ?? ''}
          disabled={disabled}
          required={required}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="jj/mm/aaaa"
          value={dateFr}
          onChange={handleDate}
          onBlur={onBlur}
          maxLength={10}
          disabled={disabled}
          className={cn(cls, 'w-full', className)}
        />
        <input
          type="time"
          value={time}
          onChange={handleTime}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(cls, 'w-32 shrink-0')}
        />
      </div>
    )
  }
)

DateTimeInput.displayName = 'DateTimeInput'
export { DateTimeInput }
