'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from './input'
import { MAJOR_METROS } from '@/lib/geo/metros'

type CityMeta = { state?: string; country?: string }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestMetro(lat: number, lng: number, country?: string) {
  const candidates = country
    ? MAJOR_METROS.filter(m => m.country === country)
    : MAJOR_METROS
  let nearest: typeof MAJOR_METROS[0] | null = null
  let minDist = Infinity
  for (const metro of candidates) {
    const dist = haversineKm(lat, lng, metro.lat, metro.lng)
    if (dist < 160 && dist < minDist) { // 160km ≈ 100 miles
      minDist = dist
      nearest = metro
    }
  }
  return nearest
}

type Props = {
  value: string
  onChange: (city: string, meta?: CityMeta) => void
  placeholder?: string
  required?: boolean
  className?: string
}

type Suggestion = { label: string; city: string; state?: string; country?: string }

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function CityInput({ value, onChange, placeholder = 'Search city…', required, className }: Props) {
  const [displayValue, setDisplayValue] = useState(value)
  const [detected, setDetected] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [userEdited, setUserEdited] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const once = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const debounced = useDebounce(displayValue, 300)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-detect city on mount
  useEffect(() => {
    if (once.current) return
    once.current = true
    if (value) return
    setDetecting(true)
    fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const lat = data?.latitude as number | undefined
        const lng = data?.longitude as number | undefined
        const rawCity = data?.city as string | undefined
        const region = data?.region as string | undefined
        const countryCode = data?.country_code as string | undefined

        // Snap to nearest major metro if within 100 miles
        const metro = (lat && lng) ? findNearestMetro(lat, lng, countryCode) : null

        const city = metro?.city ?? rawCity
        const state = metro?.state ?? region
        const country = metro?.country ?? countryCode

        if (city) {
          const display = [city, state].filter(Boolean).join(', ')
          setDetected(display)
          setDisplayValue(display)
          onChange(city, { state, country })
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (!userEdited || debounced.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setFetching(true)
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(debounced)}&limit=6&layer=city`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then(r => r.ok ? r.json() : { features: [] })
      .then((data: { features: Array<{ properties: { name: string; state?: string; country?: string } }> }) => {
        const seen = new Set<string>()
        const results: Suggestion[] = []
        for (const f of data.features ?? []) {
          const p = f.properties
          if (!p.name) continue
          const parts = [p.name, p.state, p.country].filter(Boolean)
          const label = parts.join(', ')
          if (seen.has(label)) continue
          seen.add(label)
          results.push({ label, city: p.name, state: p.state, country: p.country })
        }
        setSuggestions(results)
        setOpen(results.length > 0)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [debounced, userEdited])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserEdited(true)
    setDisplayValue(e.target.value)
    // While typing, pass raw text as city (state gets set on pick)
    onChange(e.target.value)
  }

  function pick(s: Suggestion) {
    setUserEdited(true)
    const display = [s.city, s.state].filter(Boolean).join(', ')
    setDisplayValue(display)
    onChange(s.city, { state: s.state, country: s.country })
    setSuggestions([])
    setOpen(false)
  }

  const showBadge = detected && !userEdited && displayValue === detected

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-4 pointer-events-none" />
        {(detecting || fetching) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-4 animate-spin pointer-events-none" />
        )}
        <Input
          value={displayValue}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={detecting ? 'Detecting…' : placeholder}
          required={required}
          className="pl-8"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-cream flex items-center gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-text-4 flex-shrink-0" />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}

      {showBadge && (
        <p className="text-xs text-text-4 mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Auto-detected · <button type="button" className="underline hover:text-text-3" onClick={() => { setUserEdited(true); setDisplayValue(''); onChange('') }}>change</button>
        </p>
      )}
    </div>
  )
}
