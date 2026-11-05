import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

export type SearchableOption = {
  id: string
  name: string
  postal_code?: string | null
}

type SearchableSelectProps = {
  id: string
  label: string
  value: string | null
  options: SearchableOption[]
  isLoading: boolean
  disabled?: boolean
  error?: string
  errorMessage?: string
  placeholder?: string
  onRetry?: () => void
  onChange: (option: SearchableOption | null) => void
}

export function SearchableSelect({
  id,
  label,
  value,
  options,
  isLoading,
  disabled = false,
  error,
  errorMessage,
  placeholder,
  onRetry,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const message = errorMessage ?? error
  const messageId = `${id}-message`
  const blocked = disabled || Boolean(error)

  const filtered = options.filter((option) =>
    option.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }

    setQuery('')
    setActiveIndex(0)
    setOpen(true)
  }

  function select(option: SearchableOption) {
    onChange(option)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[activeIndex]
      if (option) select(option)
    }
  }

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={blocked || isLoading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? messageId : undefined}
          onClick={toggleOpen}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-left text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
            message ? 'border-destructive' : 'border-input',
          )}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {isLoading ? 'Memuat...' : (value ?? placeholder ?? `Pilih ${label.toLowerCase()}`)}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {open && !blocked ? (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
            <div className="flex items-center gap-2 border-b px-3">
              <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Cari ${label.toLowerCase()}...`}
                aria-label={`Cari ${label.toLowerCase()}`}
                aria-autocomplete="list"
                aria-controls={listId}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto p-1">
              {value ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    <X aria-hidden="true" className="size-4" />
                    Kosongkan pilihan
                  </button>
                </li>
              ) : null}

              {filtered.length === 0 ? (
                <li className="px-2 py-3 text-sm text-muted-foreground">Tidak ada hasil.</li>
              ) : (
                filtered.map((option, index) => (
                  <li key={option.id} role="option" aria-selected={option.name === value}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(option)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm',
                        index === activeIndex ? 'bg-muted' : 'hover:bg-muted',
                        option.name === value && 'font-medium text-primary',
                      )}
                    >
                      <span>{option.name}</span>
                      {option.postal_code ? (
                        <span className="text-xs text-muted-foreground">{option.postal_code}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {message ? (
        <p id={messageId} role="alert" className="text-sm text-destructive">
          {message}
          {error && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 underline underline-offset-2 hover:text-foreground"
            >
              Coba lagi
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
