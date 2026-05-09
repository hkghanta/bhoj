'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Loader2, X, ChevronDown, ChevronRight, MapPin, Users, Wallet, CalendarDays,
  ArrowRight, Megaphone, Clock, Flame, Truck, UtensilsCrossed,
  MessageSquare, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react'
import { vendorTypeToSlug } from '@/lib/service-slugs'

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_META: Record<string, { label: string; emoji: string; accent: string; badge: string }> = {
  CATERER:            { label: 'Catering',             emoji: '🍽️',  accent: 'bg-brand',        badge: 'bg-brand/10 text-brand ring-brand/20' },
  PHOTOGRAPHER:       { label: 'Photography',          emoji: '📸',  accent: 'bg-blue-500',     badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  VIDEOGRAPHER:       { label: 'Videography',          emoji: '🎥',  accent: 'bg-indigo-500',   badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  DECORATOR:          { label: 'Decoration',           emoji: '🎨',  accent: 'bg-pink-500',     badge: 'bg-pink-50 text-pink-700 ring-pink-200' },
  DJ:                 { label: 'DJ',                   emoji: '🎵',  accent: 'bg-purple-500',   badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  FLORIST:            { label: 'Florist',              emoji: '💐',  accent: 'bg-emerald-500',  badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  MEHENDI_ARTIST:     { label: 'Mehendi Artist',       emoji: '🌿',  accent: 'bg-green-500',    badge: 'bg-green-50 text-green-700 ring-green-200' },
  MAKEUP_HAIR:        { label: 'Makeup & Hair',        emoji: '💄',  accent: 'bg-rose-500',     badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  DHOL_PLAYER:        { label: 'Dhol Player',          emoji: '🥁',  accent: 'bg-amber-500',    badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  LIVE_BAND:          { label: 'Live Band',            emoji: '🎸',  accent: 'bg-violet-500',   badge: 'bg-violet-50 text-violet-700 ring-violet-200' },
  CHOREOGRAPHER:      { label: 'Choreographer',        emoji: '💃',  accent: 'bg-fuchsia-500',  badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
  PANDIT_OFFICIANT:   { label: 'Pandit / Officiant',   emoji: '🪔',  accent: 'bg-yellow-600',   badge: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
  MC_HOST:            { label: 'MC / Host',            emoji: '🎤',  accent: 'bg-sky-500',      badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  BARTENDER:          { label: 'Bartender',            emoji: '🍹',  accent: 'bg-teal-500',     badge: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CHAI_STATION:       { label: 'Chai Station',         emoji: '☕',  accent: 'bg-amber-700',    badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  GAMES_ENTERTAINMENT:{ label: 'Entertainment',        emoji: '🎮',  accent: 'bg-cyan-500',     badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  INVITATION_DESIGNER:{ label: 'Invitations',          emoji: '✉️',  accent: 'bg-slate-500',    badge: 'bg-slate-50 text-slate-700 ring-slate-200' },
  CLASSICAL_MUSICIAN: { label: 'Classical Music',      emoji: '🎻',  accent: 'bg-purple-700',   badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  TRANSPORT:          { label: 'Transport',            emoji: '🚗',  accent: 'bg-text-3',       badge: 'bg-cream text-text-3 ring-brand-border' },
  TENT_MARQUEE:       { label: 'Tent / Marquee',       emoji: '⛺',  accent: 'bg-stone-500',    badge: 'bg-stone-50 text-stone-700 ring-stone-200' },
  FOOD_TRUCK:         { label: 'Food Truck',           emoji: '🚚',  accent: 'bg-brand-hover',  badge: 'bg-brand/10 text-brand ring-brand/20' },
  DESSERT_VENDOR:     { label: 'Desserts',             emoji: '🍰',  accent: 'bg-pink-400',     badge: 'bg-pink-50 text-pink-700 ring-pink-200' },
  LIGHTING:           { label: 'Lighting',             emoji: '💡',  accent: 'bg-yellow-500',   badge: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
  SECURITY:           { label: 'Security',             emoji: '🛡️',  accent: 'bg-slate-600',    badge: 'bg-slate-50 text-slate-700 ring-slate-200' },
}
const DEFAULT_META = { label: 'Service', emoji: '📋', accent: 'bg-text-4', badge: 'bg-cream text-text-3 ring-brand-border' }

const EVENT_LABELS: Record<string, string> = {
  WEDDING: 'Wedding', BIRTHDAY_PARTY: 'Birthday', ENGAGEMENT: 'Engagement',
  ANNIVERSARY: 'Anniversary', BABY_SHOWER: 'Baby Shower', CORPORATE: 'Corporate',
  RELIGIOUS_CEREMONY: 'Religious', GRADUATION: 'Graduation',
  MEHNDI: 'Mehndi', SANGEET: 'Sangeet', RECEPTION: 'Reception',
  NAMING_CEREMONY: 'Naming Ceremony', FAREWELL: 'Farewell', REUNION: 'Reunion', OTHER: 'Other',
}

const CUISINE_LABEL_MAP: Record<string, string> = {
  'north-indian': 'North Indian', 'south-indian': 'South Indian', 'punjabi': 'Punjabi',
  'gujarati': 'Gujarati', 'bengali': 'Bengali', 'rajasthani': 'Rajasthani',
  'mughlai': 'Mughlai', 'indo-chinese': 'Indo-Chinese', 'continental': 'Continental',
  'mediterranean': 'Mediterranean', 'street-food': 'Street Food',
}

const COUNTRY_DISPLAY: Record<string, string> = {
  US: 'USA', GB: 'UK', IN: 'India', CA: 'Canada', AU: 'Australia',
  NZ: 'NZ', SG: 'Singapore', AE: 'UAE', ZA: 'South Africa', MY: 'Malaysia',
}

const BUDGET_OPTIONS = [
  { label: 'Any budget', min: undefined, max: undefined },
  { label: 'Under $1,000', min: undefined, max: 1000 },
  { label: '$1,000 – $2,500', min: 1000, max: 2500 },
  { label: '$2,500 – $5,000', min: 2500, max: 5000 },
  { label: '$5,000 – $10,000', min: 5000, max: 10000 },
  { label: '$10,000 – $20,000', min: 10000, max: 20000 },
  { label: '$20,000+', min: 20000, max: undefined },
]

const GUEST_OPTIONS = [
  { label: 'Any size', min: undefined, max: undefined },
  { label: 'Under 50', min: undefined, max: 50 },
  { label: '50 – 100', min: 50, max: 100 },
  { label: '100 – 250', min: 100, max: 250 },
  { label: '250 – 500', min: 250, max: 500 },
  { label: '500+', min: 500, max: undefined },
]

const POSTED_OPTIONS = [
  { label: 'Any time', hours: undefined },
  { label: 'Last 24 hours', hours: 24 },
  { label: 'Last 3 days', hours: 72 },
  { label: 'Last week', hours: 168 },
  { label: 'Last 2 weeks', hours: 336 },
]

const DATE_OPTIONS = [
  { label: 'Any date', from: undefined, to: undefined },
  { label: 'Next 2 weeks', from: undefined, to: addDays(14) },
  { label: 'Next month', from: undefined, to: addDays(30) },
  { label: 'Next 3 months', from: undefined, to: addDays(90) },
  { label: '3+ months out', from: addDays(90), to: undefined },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'soonest', label: 'Soonest event' },
  { value: 'budget_high', label: 'Highest budget' },
  { value: 'budget_low', label: 'Lowest budget' },
  { value: 'guests_high', label: 'Most guests' },
]

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'jain', label: 'Jain' },
]

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getEventLabel(raw: string) { return EVENT_LABELS[raw] ?? EVENT_LABELS[raw.toUpperCase()] ?? raw.replace(/_/g, ' ') }
function countryDisplay(code: string) { return COUNTRY_DISPLAY[code] ?? code }

// ── Types ─────────────────────────────────────────────────────────────────────

type BoardItem = {
  id: string; vendor_type: string; public_token: string; response_count: number
  posted_at: string; service_notes: string | null
  event: { event_type: string; city: string; state: string | null; country: string; guest_count: number; budget_band: string; time_label: string }
  dietary: { is_halal: boolean; is_vegetarian: boolean; is_jain: boolean; is_vegan: boolean }
  cuisines: string[]; service_style: string | null; logistics: string[]
}
type CityOption = { city: string; country: string }
type Meta = { cities: CityOption[]; services: { value: string; count: number }[]; eventTypes: { value: string; count: number }[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

function citySlug(city: string) { return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}
function isNew(dateStr: string) { return Date.now() - new Date(dateStr).getTime() < 24 * 3600000 }
function isUrgent(timeLabel: string) { return timeLabel === 'This month' }

// ── Filters state ─────────────────────────────────────────────────────────────

type Filters = {
  service: string
  city: string
  budgetIdx: number
  guestsIdx: number
  postedIdx: number
  dateIdx: number
  eventType: string
  dietary: string[]
  sort: string
}

const INITIAL_FILTERS: Filters = {
  service: '', city: '', budgetIdx: 0, guestsIdx: 0, postedIdx: 0, dateIdx: 0,
  eventType: '', dietary: [], sort: 'newest',
}

function countActiveFilters(f: Filters): number {
  let n = 0
  if (f.service) n++
  if (f.city) n++
  if (f.budgetIdx > 0) n++
  if (f.guestsIdx > 0) n++
  if (f.postedIdx > 0) n++
  if (f.dateIdx > 0) n++
  if (f.eventType) n++
  if (f.dietary.length > 0) n++
  return n
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BoardPage() {
  const [items, setItems]       = useState<BoardItem[]>([])
  const [cursor, setCursor]     = useState<string | null>(null)
  const [hasMore, setHasMore]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [meta, setMeta]         = useState<Meta>({ cities: [], services: [], eventTypes: [] })
  const [filters, setFilters]   = useState<Filters>(INITIAL_FILTERS)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // City autocomplete
  const [cityInput, setCityInput]             = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([])
  const [showCityDrop, setShowCityDrop]       = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetch('/api/board/meta').then(r => r.json()).then(setMeta) }, [])

  useEffect(() => {
    if (!showCityDrop) return
    const q = cityInput.toLowerCase().trim()
    const filtered = q ? meta.cities.filter(c => c.city.toLowerCase().includes(q)) : meta.cities
    setCitySuggestions(filtered.slice(0, 8))
  }, [cityInput, meta.cities, showCityDrop])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDrop(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const buildParams = useCallback((f: Filters, c?: string) => {
    const params = new URLSearchParams()
    if (f.service) params.set('service', f.service)
    if (f.city) params.set('city', f.city)
    if (f.sort !== 'newest') params.set('sort', f.sort)

    const budget = BUDGET_OPTIONS[f.budgetIdx]
    if (budget.min !== undefined) params.set('budgetMin', String(budget.min))
    if (budget.max !== undefined) params.set('budgetMax', String(budget.max))

    const guests = GUEST_OPTIONS[f.guestsIdx]
    if (guests.min !== undefined) params.set('guestsMin', String(guests.min))
    if (guests.max !== undefined) params.set('guestsMax', String(guests.max))

    const posted = POSTED_OPTIONS[f.postedIdx]
    if (posted.hours !== undefined) params.set('postedWithin', String(posted.hours))

    const date = DATE_OPTIONS[f.dateIdx]
    if (date.from) params.set('eventDateFrom', date.from)
    if (date.to) params.set('eventDateTo', date.to)

    if (f.eventType) params.set('eventType', f.eventType)
    if (f.dietary.length > 0) params.set('dietary', f.dietary.join(','))
    if (c) params.set('cursor', c)
    return params
  }, [])

  useEffect(() => {
    setLoading(true); setItems([]); setCursor(null)
    fetch(`/api/board?${buildParams(filters)}`)
      .then(r => r.json())
      .then(data => { setItems(data.items ?? []); setCursor(data.nextCursor); setHasMore(!!data.nextCursor) })
      .finally(() => setLoading(false))
  }, [filters, buildParams])

  async function loadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetch(`/api/board?${buildParams(filters, cursor)}`).then(r => r.json())
    setItems(prev => [...prev, ...(data.items ?? [])])
    setCursor(data.nextCursor); setHasMore(!!data.nextCursor); setLoadingMore(false)
  }

  function selectCity(opt: CityOption) {
    setFilters(f => ({ ...f, city: opt.city }))
    setCityInput(`${opt.city}, ${countryDisplay(opt.country)}`)
    setShowCityDrop(false)
  }
  function clearCity() {
    setFilters(f => ({ ...f, city: '' }))
    setCityInput(''); setShowCityDrop(false)
  }
  function clearAll() {
    setFilters(INITIAL_FILTERS)
    setCityInput('')
  }
  function toggleDietary(val: string) {
    setFilters(f => ({
      ...f,
      dietary: f.dietary.includes(val) ? f.dietary.filter(d => d !== val) : [...f.dietary, val],
    }))
  }

  const totalCount = meta.services.reduce((sum, s) => sum + s.count, 0)
  const activeCount = countActiveFilters(filters)

  // ── Sidebar filter content (shared between desktop sidebar and mobile sheet)
  const filterContent = (
    <div className="space-y-6">
      {/* Service type */}
      <FilterSection title="Service type" count={filters.service ? 1 : 0}>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          <FilterRadio label="All services" checked={!filters.service}
            onClick={() => setFilters(f => ({ ...f, service: '' }))} />
          {meta.services.map(s => {
            const m = SERVICE_META[s.value]
            return (
              <FilterRadio key={s.value}
                label={<span className="flex items-center gap-1.5"><span>{m?.emoji}</span>{m?.label ?? s.value}</span>}
                count={s.count}
                checked={filters.service === s.value}
                onClick={() => setFilters(f => ({ ...f, service: s.value }))}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* City */}
      <FilterSection title="City" count={filters.city ? 1 : 0}>
        <div ref={cityRef} className="relative">
          <input type="text" placeholder="Search city..." value={cityInput}
            onChange={e => { setCityInput(e.target.value); setShowCityDrop(true) }}
            onFocus={() => setShowCityDrop(true)}
            onKeyDown={e => { if (e.key === 'Escape') setShowCityDrop(false); if (e.key === 'Enter' && citySuggestions.length > 0) { selectCity(citySuggestions[0]); e.preventDefault() } }}
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-text-1 placeholder:text-text-4"
          />
          {filters.city && (
            <button onClick={clearCity} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-4 hover:text-text-2"><X className="w-3.5 h-3.5" /></button>
          )}
          {showCityDrop && citySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-cream-2 border border-brand-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {citySuggestions.map(opt => (
                <button key={`${opt.city}|${opt.country}`} onMouseDown={() => selectCity(opt)}
                  className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-cream transition-colors flex items-center justify-between">
                  <span className="font-medium">{opt.city}</span>
                  <span className="text-xs text-text-4">{countryDisplay(opt.country)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* Budget */}
      <FilterSection title="Budget" count={filters.budgetIdx > 0 ? 1 : 0}>
        <div className="space-y-0.5">
          {BUDGET_OPTIONS.map((opt, i) => (
            <FilterRadio key={i} label={opt.label} checked={filters.budgetIdx === i}
              onClick={() => setFilters(f => ({ ...f, budgetIdx: i }))} />
          ))}
        </div>
      </FilterSection>

      {/* Guest count */}
      <FilterSection title="Guest count" count={filters.guestsIdx > 0 ? 1 : 0}>
        <div className="space-y-0.5">
          {GUEST_OPTIONS.map((opt, i) => (
            <FilterRadio key={i} label={opt.label} checked={filters.guestsIdx === i}
              onClick={() => setFilters(f => ({ ...f, guestsIdx: i }))} />
          ))}
        </div>
      </FilterSection>

      {/* Event date */}
      <FilterSection title="Event date" count={filters.dateIdx > 0 ? 1 : 0}>
        <div className="space-y-0.5">
          {DATE_OPTIONS.map((opt, i) => (
            <FilterRadio key={i} label={opt.label} checked={filters.dateIdx === i}
              onClick={() => setFilters(f => ({ ...f, dateIdx: i }))} />
          ))}
        </div>
      </FilterSection>

      {/* Event type */}
      {meta.eventTypes.length > 0 && (
        <FilterSection title="Event type" count={filters.eventType ? 1 : 0}>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            <FilterRadio label="All types" checked={!filters.eventType}
              onClick={() => setFilters(f => ({ ...f, eventType: '' }))} />
            {meta.eventTypes.map(et => (
              <FilterRadio key={et.value}
                label={EVENT_LABELS[et.value] ?? et.value.replace(/_/g, ' ')}
                count={et.count}
                checked={filters.eventType === et.value}
                onClick={() => setFilters(f => ({ ...f, eventType: et.value }))}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Dietary */}
      <FilterSection title="Dietary" count={filters.dietary.length}>
        <div className="space-y-1">
          {DIETARY_OPTIONS.map(d => (
            <label key={d.value} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cream transition-colors cursor-pointer">
              <input type="checkbox" checked={filters.dietary.includes(d.value)} onChange={() => toggleDietary(d.value)}
                className="w-3.5 h-3.5 rounded border-brand-border text-text-1 focus:ring-text-1/20" />
              <span className="text-sm text-text-2">{d.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Posted */}
      <FilterSection title="Posted" count={filters.postedIdx > 0 ? 1 : 0}>
        <div className="space-y-0.5">
          {POSTED_OPTIONS.map((opt, i) => (
            <FilterRadio key={i} label={opt.label} checked={filters.postedIdx === i}
              onClick={() => setFilters(f => ({ ...f, postedIdx: i }))} />
          ))}
        </div>
      </FilterSection>

      {/* Clear all */}
      {activeCount > 0 && (
        <button onClick={clearAll} className="w-full text-sm font-semibold text-text-3 hover:text-text-1 transition-colors py-2">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="py-2">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0904] to-[#3d1f10] px-6 py-8 sm:px-10 sm:py-10 mb-6">
        <div className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 90% 20%, #e85510 0%, transparent 50%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live board</span>
              {totalCount > 0 && (
                <span className="text-xs font-medium text-white/40 bg-white/10 px-2.5 py-0.5 rounded-full">{totalCount} open</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white tracking-tight mb-2">Open requests</h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg">
              Event hosts looking for vendors right now. Browse, respond, and win new business — free, no commission.
            </p>
          </div>
          <Link href="/register/vendor"
            className="shrink-0 text-sm font-bold text-white bg-brand hover:bg-brand-hover px-5 py-2.5 rounded-xl transition-colors hidden sm:block">
            List my business
          </Link>
        </div>
      </div>

      {/* ── Customer CTA ─────────────────────────────────────────── */}
      <div className="bg-cream border border-brand-border rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-1">Planning an event?</p>
            <p className="text-xs text-text-3">Post your requirements and let vendors come to you with quotes.</p>
          </div>
        </div>
        <Link href="/register/customer" className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors whitespace-nowrap">
          Post request <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Main layout: sidebar + content ───────────────────────── */}
      <div className="flex gap-6">
        {/* Left sidebar — desktop only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-extrabold tracking-tight text-text-1 uppercase tracking-wide flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeCount > 0 && (
                    <span className="text-[11px] bg-text-1 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {activeCount}
                    </span>
                  )}
                </h2>
              </div>
              {filterContent}
            </div>
          </div>
        </aside>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button + Sort bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Mobile filter trigger */}
            <button onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-cream-2 border border-brand-border rounded-xl text-sm font-semibold text-text-1 hover:bg-cream transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeCount > 0 && (
                <span className="text-[11px] bg-brand text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeCount}</span>
              )}
            </button>

            {/* Result count */}
            <p className="text-xs text-text-4 hidden lg:block">
              {loading ? '...' : `${items.length}${hasMore ? '+' : ''} request${items.length !== 1 ? 's' : ''}`}
            </p>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-4" />
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="text-sm font-semibold text-text-1 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-6 -mr-2">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filters chips — desktop */}
          {activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {filters.service && (
                <FilterChip label={`${SERVICE_META[filters.service]?.emoji} ${SERVICE_META[filters.service]?.label}`}
                  onRemove={() => setFilters(f => ({ ...f, service: '' }))} />
              )}
              {filters.city && <FilterChip label={filters.city} onRemove={clearCity} />}
              {filters.budgetIdx > 0 && <FilterChip label={BUDGET_OPTIONS[filters.budgetIdx].label} onRemove={() => setFilters(f => ({ ...f, budgetIdx: 0 }))} />}
              {filters.guestsIdx > 0 && <FilterChip label={`${GUEST_OPTIONS[filters.guestsIdx].label} guests`} onRemove={() => setFilters(f => ({ ...f, guestsIdx: 0 }))} />}
              {filters.dateIdx > 0 && <FilterChip label={DATE_OPTIONS[filters.dateIdx].label} onRemove={() => setFilters(f => ({ ...f, dateIdx: 0 }))} />}
              {filters.eventType && <FilterChip label={EVENT_LABELS[filters.eventType] ?? filters.eventType} onRemove={() => setFilters(f => ({ ...f, eventType: '' }))} />}
              {filters.dietary.map(d => <FilterChip key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} onRemove={() => toggleDietary(d)} />)}
              {filters.postedIdx > 0 && <FilterChip label={POSTED_OPTIONS[filters.postedIdx].label} onRemove={() => setFilters(f => ({ ...f, postedIdx: 0 }))} />}
              <button onClick={clearAll} className="text-xs text-text-4 hover:text-text-2 underline ml-1">Clear all</button>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cream-2" />
                    <div className="flex-1 space-y-2"><div className="h-4 w-48 bg-cream-2 rounded" /><div className="h-3 w-32 bg-cream-2 rounded" /></div>
                  </div>
                  <div className="h-10 bg-cream rounded-lg mb-3" />
                  <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(j => <div key={j} className="h-8 bg-cream-2 rounded-lg" />)}</div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-brand-border rounded-2xl bg-white dark:bg-cream-2">
              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-7 h-7 text-text-4" />
              </div>
              <p className="text-text-1 font-bold text-lg mb-1">No requests match</p>
              <p className="text-sm text-text-3 mb-5 max-w-sm mx-auto">
                {activeCount > 0 ? 'Try adjusting your filters or check back later.' : 'New requests are posted daily. Check back soon!'}
              </p>
              {activeCount > 0 && <button onClick={clearAll} className="text-text-2 text-sm font-semibold hover:underline">Clear all filters</button>}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item => <BoardCard key={item.id} item={item} />)}
            </div>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center mt-8">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-cream-2 border border-brand-border rounded-xl text-sm font-bold text-text-1 hover:bg-cream hover:border-brand/30 hover:shadow-md transition-all duration-200 disabled:opacity-50">
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? 'Loading...' : 'Show more requests'}
              </button>
            </div>
          )}

          {/* Bottom vendor CTA */}
          {!loading && items.length > 0 && (
            <div className="mt-12 bg-cream border border-brand-border rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-all duration-200">
              <h2 className="text-lg font-extrabold tracking-tight text-text-1 mb-1.5">Want requests like these sent to you?</h2>
              <p className="text-sm text-text-3 mb-5 max-w-md mx-auto">
                Create your free vendor profile and get notified when new requests match your service area.
              </p>
              <Link href="/register/vendor"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
                List my business free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter sheet ───────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-cream-2 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <h2 className="text-base font-extrabold tracking-tight text-text-1 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {activeCount > 0 && (
                  <span className="text-[11px] bg-brand text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeCount}</span>
                )}
              </h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {filterContent}
            </div>
            <div className="px-5 py-4 border-t border-brand-border">
              <button onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Show {loading ? '...' : items.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Filter sub-components ────────────────────────────────────────────────────

function FilterSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-bold text-text-1 uppercase tracking-wide mb-2 hover:text-text-2 transition-colors">
        <span className="flex items-center gap-1.5">
          {title}
          {count > 0 && <span className="text-[10px] bg-text-1/10 text-text-1 rounded-full w-4 h-4 flex items-center justify-center font-bold">{count}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  )
}

function FilterRadio({ label, checked, count, onClick }: {
  label: React.ReactNode; checked: boolean; count?: number; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
        checked ? 'bg-cream-2 text-text-1 font-semibold' : 'text-text-2 hover:bg-cream'
      }`}>
      <span className="flex items-center gap-1.5">
        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-text-1' : 'border-brand-border'}`}>
          {checked && <span className="w-1.5 h-1.5 rounded-full bg-text-1" />}
        </span>
        <span>{label}</span>
      </span>
      {count !== undefined && <span className="text-xs text-text-4">{count}</span>}
    </button>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-text-1/8 text-text-1 text-xs font-semibold rounded-full">
      {label}
      <button onClick={onRemove}><X className="w-3 h-3" /></button>
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function BoardCard({ item }: { item: BoardItem }) {
  const meta       = SERVICE_META[item.vendor_type] ?? DEFAULT_META
  const eventLabel = getEventLabel(item.event.event_type)
  const href       = `/requests/${vendorTypeToSlug(item.vendor_type)}/${citySlug(item.event.city)}/${item.public_token}`
  const location   = [item.event.city, item.event.state].filter(Boolean).join(', ')
  const countryTag = countryDisplay(item.event.country)

  const fresh = isNew(item.posted_at)
  const urgent = isUrgent(item.event.time_label)

  const dietaryTags = [
    item.dietary.is_halal && 'Halal', item.dietary.is_vegetarian && 'Vegetarian',
    item.dietary.is_jain && 'Jain', item.dietary.is_vegan && 'Vegan',
  ].filter(Boolean) as string[]

  const cuisineLabels = item.cuisines.slice(0, 3).map(c => CUISINE_LABEL_MAP[c] ?? c)

  const summaryParts: string[] = []
  if (cuisineLabels.length > 0) summaryParts.push(cuisineLabels.join(', ') + ' cuisine')
  if (item.service_style) summaryParts.push(item.service_style.toLowerCase() + ' style')
  if (item.logistics.length > 0) summaryParts.push(item.logistics.join(', ').toLowerCase() + ' needed')
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : null

  const notePreview = item.service_notes
    ? (item.service_notes.length > 140 ? item.service_notes.slice(0, 140) + '...' : item.service_notes)
    : null

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="group relative bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/5 hover:border-brand/20 transition-all duration-200 block">
      <div className="p-5 sm:p-6">
        {/* Row 1: Icon + Title */}
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-cream-2">
            <span className="text-xl">{meta.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-[15px] font-extrabold tracking-tight text-text-1 group-hover:text-text-2 transition-colors">
                {meta.label} for {eventLabel}
              </h3>
              {fresh && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <Flame className="w-3 h-3" />NEW
                </span>
              )}
              {urgent && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" />URGENT
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-3 flex-wrap">
              <MapPin className="w-3 h-3 text-text-4 shrink-0" />
              <span className="font-medium">{location}</span>
              <span className="text-text-4">·</span>
              <span>{countryTag}</span>
              <span className="text-text-4">·</span>
              <span className="text-text-4">{timeAgo(item.posted_at)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Description */}
        {(notePreview || summary) && (
          <div className="mb-3 bg-cream/60 rounded-xl px-4 py-2.5">
            {notePreview ? (
              <p className="text-sm text-text-2 leading-relaxed line-clamp-2">&ldquo;{notePreview}&rdquo;</p>
            ) : summary ? (
              <p className="text-sm text-text-3 leading-relaxed">{summary}</p>
            ) : null}
          </div>
        )}

        {/* Row 3: Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <DetailChip icon={<Users className="w-3.5 h-3.5" />} label="Guests" value={item.event.guest_count.toLocaleString()} />
          <DetailChip icon={<Wallet className="w-3.5 h-3.5" />} label="Budget" value={item.event.budget_band} />
          <DetailChip icon={<CalendarDays className="w-3.5 h-3.5" />} label="When" value={item.event.time_label} />
          <DetailChip icon={<MessageSquare className="w-3.5 h-3.5" />} label="Style"
            value={item.service_style ?? 'Flexible'} />
        </div>

        {/* Row 4: Tags */}
        {(dietaryTags.length > 0 || cuisineLabels.length > 0 || item.logistics.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cuisineLabels.map(c => (
              <span key={c} className="inline-flex items-center gap-1 text-xs font-medium bg-brand/10 text-brand border border-brand/20 rounded-full px-2.5 py-0.5">
                <UtensilsCrossed className="w-3 h-3" />{c}
              </span>
            ))}
            {dietaryTags.map(t => (
              <span key={t} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">{t}</span>
            ))}
            {item.logistics.map(l => (
              <span key={l} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                <Truck className="w-3 h-3" />{l}
              </span>
            ))}
          </div>
        )}

        {/* Row 5: Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-border">
          <span className="text-xs text-text-4">{timeAgo(item.posted_at)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-text-3 group-hover:text-text-1 group-hover:gap-2 transition-all">
            View details <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </a>
  )
}

function DetailChip({ icon, label, value, highlight = false }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${highlight ? 'bg-emerald-50/60 border border-emerald-100' : 'bg-cream/60 border border-transparent'}`}>
      <div className={`${highlight ? 'text-emerald-600' : 'text-text-4'}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-4 font-semibold uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-bold truncate ${highlight ? 'text-emerald-700' : 'text-text-1'}`}>{value}</p>
      </div>
    </div>
  )
}
