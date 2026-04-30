'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function toDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

function toISO(fr: string) {
  const p = fr.replace(/[^\d]/g, '/').split('/').filter(Boolean)
  return p.length === 3 && p[2].length === 4
    ? `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
    : ''
}

const DateInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, className, name, disabled, required }, ref) => {
    const [display, setDisplay] = useState(() => toDisplay(value ?? ''))
    const hiddenRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      setDisplay(toDisplay(value ?? ''))
      if (hiddenRef.current) hiddenRef.current.value = value ?? ''
    }, [value])

    const emit = (iso: string) => {
      if (hiddenRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(hiddenRef.current, iso)
        hiddenRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        hiddenRef.current.value = iso
      }
      onChange?.({ target: { value: iso, name: name ?? '' } } as React.ChangeEvent<HTMLInputElement>)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d/]/g, '')
      raw = raw.replace(/^(\d{2})(\d)/, '$1/$2')
      raw = raw.replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')
      if (raw.length > 10) raw = raw.slice(0, 10)
      setDisplay(raw)
      emit(toISO(raw))
    }

    return (
      <>
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
          value={display}
          onChange={handleChange}
          onBlur={onBlur}
          maxLength={10}
          disabled={disabled}
          className={cn(
            'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className
          )}
        />
      </>
    )
  }
)

DateInput.displayName = 'DateInput'
export { DateInput }
