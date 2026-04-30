'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronRight, ChevronDown, ChevronUp, Star, ExternalLink,
  CheckCircle2, Globe, MapPin, Sparkles, AlertCircle, Send, Plus, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceConfig = {
  vendor_type: string
  label: string
  icon: string
  service_class: string
  is_enabled: boolean
}

type EventRequest = {
  id: string
  service_notes: string | null
  public_token: string
  public_status: string
  menu_preference: Record<string, unknown> | null
  match_count: number
  response_count: number
}

type Vendor = {
  id: string
  business_name: string
  city: string
  profile_type: string
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  avg_rating: number | null
  is_verified: boolean
  score: number
  price_per_head_min: number | null
  price_per_head_max: number | null
  currency: string
}

type PageData = {
  service_config: ServiceConfig
  event_request: EventRequest | null
  vendors: Vendor[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function vendorDisplayName(v: Vendor) {
  if (v.profile_type === 'INDIVIDUAL' && v.first_name)
    return `${v.first_name}${v.last_name ? ` ${v.last_name}` : ''}`
  return v.business_name
}
function formatPrice(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return null
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)} /head`
  if (min !== null) return `From ${fmt(min)} /head`
  return `Up to ${fmt(max!)} /head`
}
function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-brand'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-gray-300'
}

// ── Pill toggle helper ────────────────────────────────────────────────────────

function PillToggle({
  options, selected, onChange, multi = true,
}: {
  options: { value: string; label: string; emoji?: string }[]
  selected: string[]
  onChange: (next: string[]) => void
  multi?: boolean
}) {
  const toggle = (val: string) => {
    if (multi) {
      onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
    } else {
      onChange(selected.includes(val) ? [] : [val])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              on
                ? 'bg-brand text-white border-brand shadow-[0_2px_8px_rgba(232,85,16,0.25)]'
                : 'bg-white text-text-2 border-brand-border hover:border-brand/50 hover:bg-cream'
            }`}
          >
            {o.emoji && <span>{o.emoji}</span>}
            {o.label}
            {on && <X className="h-3 w-3 ml-0.5 opacity-70" />}
          </button>
        )
      })}
    </div>
  )
}

// ── Catering Form ─────────────────────────────────────────────────────────────

type CateringState = {
  serviceStyles: string[]
  liveStations: string[]
  customStation: string
  letCatererDecideMenu: boolean
  startersCount: string
  mainsCount: string
  breadRiceCount: string
  dessertsCount: string
  selectedDishes: string[]
  dishSearch: string
  dietary: string[]
  cuisines: string[]
  letCatererDecideCuisine: boolean
  notes: string
}

const DEFAULT_CATERING: CateringState = {
  serviceStyles: [],
  liveStations: [],
  customStation: '',
  letCatererDecideMenu: true,
  startersCount: '',
  mainsCount: '',
  breadRiceCount: '',
  dessertsCount: '',
  selectedDishes: [],
  dishSearch: '',
  dietary: [],
  cuisines: [],
  letCatererDecideCuisine: true,
  notes: '',
}

const SERVICE_STYLE_OPTIONS = [
  { value: 'buffet', label: 'Buffet', emoji: '🍽️' },
  { value: 'sit-down', label: 'Sit-down / Plated', emoji: '🪑' },
  { value: 'live-stations', label: 'Live Cooking Stations', emoji: '🔥' },
  { value: 'cocktail', label: 'Cocktail / Canapés', emoji: '🥂' },
  { value: 'family-style', label: 'Family Style', emoji: '🫕' },
  { value: 'grazing-table', label: 'Grazing Table', emoji: '🧀' },
]

const LIVE_STATION_OPTIONS = [
  { value: 'chai', label: 'Chai & Coffee', emoji: '☕' },
  { value: 'dosa', label: 'Dosa Station', emoji: '🥞' },
  { value: 'pav-bhaji', label: 'Pav Bhaji', emoji: '🫓' },
  { value: 'chaat', label: 'Chaat Station', emoji: '🥗' },
  { value: 'grill-bbq', label: 'Grill / BBQ', emoji: '🔥' },
  { value: 'pasta', label: 'Pasta / Noodle', emoji: '🍝' },
  { value: 'ice-cream', label: 'Ice Cream / Kulfi', emoji: '🍦' },
  { value: 'soup', label: 'Soup / Dal', emoji: '🥣' },
  { value: 'biryani', label: 'Live Biryani', emoji: '🍲' },
  { value: 'jalebi', label: 'Jalebi / Sweets', emoji: '🍬' },
]

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌿' },
  { value: 'vegan', label: 'Vegan', emoji: '🥦' },
  { value: 'halal', label: 'Halal', emoji: '☪️' },
  { value: 'jain', label: 'Jain', emoji: '✋' },
  { value: 'kosher', label: 'Kosher', emoji: '✡️' },
  { value: 'nut-free', label: 'Nut-free', emoji: '🚫' },
  { value: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-free', emoji: '🥛' },
  { value: 'egg-free', label: 'Egg-free', emoji: '🥚' },
]

const CUISINE_OPTIONS = [
  { value: 'north-indian', label: 'North Indian', emoji: '🫕' },
  { value: 'south-indian', label: 'South Indian', emoji: '🍛' },
  { value: 'punjabi', label: 'Punjabi', emoji: '🌾' },
  { value: 'gujarati', label: 'Gujarati', emoji: '🟡' },
  { value: 'bengali', label: 'Bengali', emoji: '🐟' },
  { value: 'rajasthani', label: 'Rajasthani', emoji: '🏜️' },
  { value: 'mughlai', label: 'Mughlai', emoji: '👑' },
  { value: 'indo-chinese', label: 'Indo-Chinese', emoji: '🥢' },
  { value: 'continental', label: 'Continental', emoji: '🥗' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'street-food', label: 'Street Food', emoji: '🛺' },
]

// ── Dish library (loaded from admin-managed global library) ───────────────────

type ApiDish = {
  id: string
  name: string
  category: string
  is_vegetarian: boolean
  is_vegan: boolean
  is_halal: boolean
  is_jain: boolean
}

type DishCategory = { label: string; emoji: string; key: string; dishes: string[] }

const MENU_CATEGORY_MAP: { key: string; label: string; emoji: string }[] = [
  { key: 'SOUP_SALAD',    label: 'Soups & Salads',    emoji: '🥣' },
  { key: 'APPETIZER',     label: 'Starters',           emoji: '🥗' },
  { key: 'MAIN_COURSE',   label: 'Mains',              emoji: '🍛' },
  { key: 'BREAD',         label: 'Breads',             emoji: '🫓' },
  { key: 'RICE_BIRYANI',  label: 'Rice & Biryani',     emoji: '🍚' },
  { key: 'DAL',           label: 'Dal & Lentils',      emoji: '🫕' },
  { key: 'DESSERT',       label: 'Desserts',           emoji: '🍮' },
  { key: 'LIVE_COUNTER',  label: 'Live Counters',      emoji: '🔥' },
  { key: 'BEVERAGE',      label: 'Beverages',          emoji: '🥤' },
  { key: 'OTHER',         label: 'Other',              emoji: '🍽️' },
]

function groupDishesIntoCategories(dishes: ApiDish[]): DishCategory[] {
  const map = new Map<string, Set<string>>()
  for (const d of dishes) {
    if (!map.has(d.category)) map.set(d.category, new Set())
    map.get(d.category)!.add(d.name)
  }
  return MENU_CATEGORY_MAP
    .filter(c => map.has(c.key))
    .map(c => ({ ...c, dishes: Array.from(map.get(c.key)!) }))
}

function buildSummary(f: CateringState): string {
  const parts: string[] = []
  if (f.serviceStyles.length > 0)
    parts.push(f.serviceStyles.map(s => SERVICE_STYLE_OPTIONS.find(o => o.value === s)?.label ?? s).join(', '))
  const stations = [...f.liveStations, ...(f.customStation.trim() ? [f.customStation.trim()] : [])]
  if (stations.length > 0)
    parts.push(`Live stations: ${stations.map(s => LIVE_STATION_OPTIONS.find(o => o.value === s)?.label ?? s).join(', ')}`)
  if (f.letCatererDecideMenu) {
    parts.push('Menu to be decided by caterer')
  } else {
    const counts: string[] = []
    if (f.startersCount) counts.push(`${f.startersCount} starter${Number(f.startersCount) !== 1 ? 's' : ''}`)
    if (f.mainsCount) counts.push(`${f.mainsCount} main${Number(f.mainsCount) !== 1 ? 's' : ''}`)
    if (f.breadRiceCount) counts.push(`${f.breadRiceCount} bread/rice`)
    if (f.dessertsCount) counts.push(`${f.dessertsCount} dessert${Number(f.dessertsCount) !== 1 ? 's' : ''}`)
    if (counts.length > 0) parts.push(counts.join(', '))
    if (f.selectedDishes.length > 0) parts.push(`Dishes: ${f.selectedDishes.join(', ')}`)
  }
  if (f.dietary.length > 0)
    parts.push(f.dietary.map(d => DIETARY_OPTIONS.find(o => o.value === d)?.label ?? d).join(', '))
  if (!f.letCatererDecideCuisine && f.cuisines.length > 0)
    parts.push(`Cuisine: ${f.cuisines.map(c => CUISINE_OPTIONS.find(o => o.value === c)?.label ?? c).join(', ')}`)
  if (f.notes.trim()) parts.push(f.notes.trim())
  return parts.join(' · ')
}

function buildCateringPrefs(f: CateringState) {
  const allStations = [...f.liveStations, ...(f.customStation.trim() ? [f.customStation.trim()] : [])]
  return {
    menu_mode: f.letCatererDecideMenu ? 'CATERER_PROPOSES' : 'CUSTOMER_SPECIFIES',
    service_styles: f.serviceStyles,
    cuisines: f.letCatererDecideCuisine ? [] : f.cuisines,
    customer_tray_requests: allStations,
    selected_dishes: f.letCatererDecideMenu ? [] : f.selectedDishes,
    appetizer_count: f.startersCount ? parseInt(f.startersCount) : null,
    main_count: f.mainsCount ? parseInt(f.mainsCount) : null,
    bread_count: f.breadRiceCount ? parseInt(f.breadRiceCount) : null,
    dessert_count: f.dessertsCount ? parseInt(f.dessertsCount) : null,
    is_vegetarian: f.dietary.includes('vegetarian') || f.dietary.includes('vegan'),
    is_vegan: f.dietary.includes('vegan'),
    is_halal: f.dietary.includes('halal'),
    is_jain: f.dietary.includes('jain'),
    is_kosher: f.dietary.includes('kosher'),
    nut_free: f.dietary.includes('nut-free'),
    gluten_free: f.dietary.includes('gluten-free'),
    dairy_free: f.dietary.includes('dairy-free'),
    egg_free: f.dietary.includes('egg-free'),
    special_notes: f.notes.trim() || null,
    pricing_preference: 'NO_PREFERENCE',
  }
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-black text-text-1 mb-2.5">{children}</p>
}

function DishPicker({
  categories,
  selected,
  searchQuery,
  onToggle,
  onSearchChange,
  onAddCustom,
  onRemove,
}: {
  categories: DishCategory[]
  selected: string[]
  searchQuery: string
  onToggle: (dish: string) => void
  onSearchChange: (v: string) => void
  onAddCustom: (dish: string) => void
  onRemove: (dish: string) => void
}) {
  const [activeTab, setActiveTab] = useState(0)
  const allLibraryDishes = categories.flatMap(c => c.dishes)
  const customDishes = selected.filter(d => !allLibraryDishes.includes(d))
  const isSearching = searchQuery.trim().length > 0

  // Search results across all categories
  const searchResults = isSearching
    ? categories.flatMap(c =>
        c.dishes
          .filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(d => ({ dish: d, category: c.label, emoji: c.emoji }))
      )
    : []

  const exactMatch = allLibraryDishes.some(d => d.toLowerCase() === searchQuery.toLowerCase().trim())
  const alreadySelected = selected.some(d => d.toLowerCase() === searchQuery.toLowerCase().trim())
  const canAddCustom = isSearching && searchQuery.trim() && !alreadySelected && !exactMatch

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (searchResults.length === 1) {
                onToggle(searchResults[0].dish)
                onSearchChange('')
              } else if (canAddCustom) {
                onAddCustom(searchQuery.trim())
                onSearchChange('')
              }
            }
          }}
          placeholder="Search dishes or type your own…"
          className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm bg-white text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 pr-24"
        />
        {isSearching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {canAddCustom && (
              <button
                type="button"
                onClick={() => { onAddCustom(searchQuery.trim()); onSearchChange('') }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-semibold border border-brand/20 hover:bg-brand/15 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
            <button type="button" onClick={() => onSearchChange('')} className="text-text-4 hover:text-text-2 p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="flex flex-wrap gap-2">
          {searchResults.length === 0 ? (
            <p className="text-xs text-text-4 italic py-1">No dishes found — press Enter or click Add to add as custom</p>
          ) : (
            searchResults.map(({ dish, category, emoji }) => {
              const on = selected.includes(dish)
              return (
                <button
                  key={dish}
                  type="button"
                  onClick={() => { onToggle(dish); onSearchChange('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    on
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-text-2 border-brand-border hover:border-brand/50 hover:bg-cream'
                  }`}
                >
                  <span>{emoji}</span> {dish}
                  <span className="opacity-50 font-normal">· {category}</span>
                  {on && <X className="h-3 w-3 ml-0.5 opacity-70" />}
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Category tabs — shown when not searching */}
      {!isSearching && (
        <>
          {categories.length === 0 ? (
            <p className="text-xs text-text-4 italic">Loading dish library…</p>
          ) : (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((cat, i) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                      activeTab === i
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-text-2 border-brand-border hover:border-brand/50'
                    }`}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(categories[activeTab]?.dishes ?? []).map(dish => {
                  const on = selected.includes(dish)
                  return (
                    <button
                      key={dish}
                      type="button"
                      onClick={() => onToggle(dish)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on
                          ? 'bg-brand text-white border-brand shadow-[0_2px_8px_rgba(232,85,16,0.2)]'
                          : 'bg-white text-text-2 border-brand-border hover:border-brand/50 hover:bg-cream'
                      }`}
                    >
                      {dish}
                      {on && <X className="h-3 w-3 ml-0.5 opacity-70" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Custom dishes chips (not in library) */}
      {customDishes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-xs text-text-4 self-center mr-1">Custom:</span>
          {customDishes.map(d => (
            <span key={d} className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-semibold">
              {d}
              <button type="button" onClick={() => onRemove(d)} className="hover:text-amber-900 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <p className="text-xs text-text-4">{selected.length} dish{selected.length !== 1 ? 'es' : ''} selected</p>
      )}
    </div>
  )
}

// Contextual suggestions — other vendor types often booked separately
const CATERING_SUGGESTIONS: {
  triggerStyles?: string[]
  triggerStations?: string[]
  triggerDessertsCount?: boolean
  label: string
  emoji: string
  tip: string
  slug: string
}[] = [
  {
    triggerStyles: ['cocktail'],
    label: 'Bartender',
    emoji: '🍹',
    tip: 'Cocktail & bar service is usually a separate hire',
    slug: 'bartender',
  },
  {
    triggerStations: ['chai'],
    label: 'Chai Station',
    emoji: '☕',
    tip: 'Specialist chai vendors often do a better job',
    slug: 'chai-station',
  },
  {
    triggerDessertsCount: true,
    label: 'Dessert Vendor',
    emoji: '🍰',
    tip: 'Wedding cakes & mithai are often from dedicated dessert vendors',
    slug: 'dessert-vendor',
  },
]

function CateringForm({
  initial,
  onSave,
  saving,
  eventId,
}: {
  initial: CateringState
  onSave: (summary: string, prefs: Record<string, unknown>) => Promise<void>
  saving: boolean
  eventId: string
}) {
  const [f, setF] = useState<CateringState>(initial)
  const [dishCategories, setDishCategories] = useState<DishCategory[]>([])
  const up = (patch: Partial<CateringState>) => setF(prev => ({ ...prev, ...patch }))

  useEffect(() => { setF(initial) }, [initial.serviceStyles.join()])

  // Load admin-managed dish library once
  useEffect(() => {
    fetch('/api/dishes')
      .then(r => r.ok ? r.json() : [])
      .then((dishes: ApiDish[]) => {
        const grouped = groupDishesIntoCategories(dishes)
        setDishCategories(grouped)
      })
      .catch(() => {/* silently use empty */})
  }, [])

  const wantLiveStations = f.serviceStyles.includes('live-stations')
  const canSave = f.serviceStyles.length > 0 || f.dietary.length > 0 || f.cuisines.length > 0 || !f.letCatererDecideMenu

  return (
    <div className="space-y-6">

      {/* Service style */}
      <div>
        <SectionHeading>What type of service do you want?</SectionHeading>
        <PillToggle
          options={SERVICE_STYLE_OPTIONS}
          selected={f.serviceStyles}
          onChange={v => up({ serviceStyles: v })}
        />
      </div>

      {/* Live stations — conditional */}
      {wantLiveStations && (
        <div className="bg-cream rounded-xl p-4 space-y-3 border border-brand-border">
          <SectionHeading>Which live stations are you looking for?</SectionHeading>
          <PillToggle
            options={LIVE_STATION_OPTIONS}
            selected={f.liveStations}
            onChange={v => up({ liveStations: v })}
          />
          {/* Custom station */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={f.customStation}
              onChange={e => up({ customStation: e.target.value })}
              placeholder="Other station (e.g. Panipuri, Frankie…)"
              className="flex-1 border border-brand-border rounded-lg px-3 py-2 text-sm bg-white text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {f.customStation && (
              <button type="button" onClick={() => up({ customStation: '' })} className="text-text-4 hover:text-text-2">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Food requirements */}
      <div>
        <SectionHeading>Menu / dishes</SectionHeading>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-3">Let the caterer decide the menu</span>
          <button
            type="button"
            onClick={() => up({ letCatererDecideMenu: !f.letCatererDecideMenu })}
            className={`relative rounded-full transition-colors flex-shrink-0 ${f.letCatererDecideMenu ? 'bg-brand' : 'bg-gray-200'}`}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${f.letCatererDecideMenu ? 'translate-x-[19px]' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        {!f.letCatererDecideMenu && (
          <div className="bg-cream/50 border border-brand-border rounded-xl p-4 space-y-4">
            {/* Course counts */}
            <div>
              <p className="text-xs font-semibold text-text-3 mb-2">How many dishes per course? <span className="font-normal text-text-4">(optional)</span></p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([
                  { key: 'startersCount', label: 'Starters', emoji: '🥗' },
                  { key: 'mainsCount', label: 'Mains', emoji: '🍛' },
                  { key: 'breadRiceCount', label: 'Bread / Rice', emoji: '🫓' },
                  { key: 'dessertsCount', label: 'Desserts', emoji: '🍮' },
                ] as const).map(({ key, label, emoji }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs text-text-4">{emoji} {label}</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={f[key]}
                      onChange={e => up({ [key]: e.target.value })}
                      placeholder="—"
                      className="w-full border border-brand-border rounded-lg px-3 py-1.5 text-sm text-text-1 bg-white placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dish picker */}
            <div>
              <p className="text-xs text-text-4 mb-3">Pick from our library or type your own dishes. Caterers will see your full list.</p>
              <DishPicker
              categories={dishCategories}
              selected={f.selectedDishes}
              searchQuery={f.dishSearch}
              onToggle={dish => up({
                selectedDishes: f.selectedDishes.includes(dish)
                  ? f.selectedDishes.filter(d => d !== dish)
                  : [...f.selectedDishes, dish],
              })}
              onSearchChange={v => up({ dishSearch: v })}
              onAddCustom={dish => {
                if (!f.selectedDishes.includes(dish)) {
                  up({ selectedDishes: [...f.selectedDishes, dish], dishSearch: '' })
                }
              }}
              onRemove={dish => up({ selectedDishes: f.selectedDishes.filter(d => d !== dish) })}
            />
            </div>
          </div>
        )}

        {f.letCatererDecideMenu && (
          <p className="text-sm text-text-4 bg-cream px-3 py-2 rounded-lg">
            Caterer will propose a suitable menu based on your other requirements
          </p>
        )}
      </div>

      {/* Dietary requirements */}
      <div>
        <SectionHeading>Dietary requirements</SectionHeading>
        <PillToggle
          options={DIETARY_OPTIONS}
          selected={f.dietary}
          onChange={v => up({ dietary: v })}
        />
        {f.dietary.length === 0 && (
          <p className="text-xs text-text-4 mt-2">None selected — all dietary preferences welcome</p>
        )}
      </div>

      {/* Cuisine preferences */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <SectionHeading>Cuisine preferences</SectionHeading>
          <button
            type="button"
            onClick={() => up({ letCatererDecideCuisine: !f.letCatererDecideCuisine, cuisines: [] })}
            className="text-xs text-brand font-semibold hover:underline"
          >
            {f.letCatererDecideCuisine ? 'Choose specific cuisines' : 'Let caterer decide'}
          </button>
        </div>
        {f.letCatererDecideCuisine ? (
          <p className="text-sm text-text-4 bg-cream px-3 py-2 rounded-lg">Caterer will suggest appropriate cuisines</p>
        ) : (
          <PillToggle
            options={CUISINE_OPTIONS}
            selected={f.cuisines}
            onChange={v => up({ cuisines: v })}
          />
        )}
      </div>

      {/* Additional notes */}
      <div>
        <SectionHeading>Additional notes <span className="text-text-4 font-normal">(optional)</span></SectionHeading>
        <textarea
          value={f.notes}
          onChange={e => up({ notes: e.target.value })}
          rows={3}
          placeholder="Anything else the caterer should know — e.g. venue restrictions, serving time, special requests…"
          className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white resize-none
                     placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
        />
      </div>

      {/* Contextual suggestions — other vendor types often booked separately */}
      {(() => {
        const suggestions = CATERING_SUGGESTIONS.filter(s => {
          if (s.triggerStyles && s.triggerStyles.some(v => f.serviceStyles.includes(v))) return true
          if (s.triggerStations && s.triggerStations.some(v => f.liveStations.includes(v) || f.customStation.includes(v))) return true
          if (s.triggerDessertsCount && !f.letCatererDecideMenu && f.selectedDishes.some(d => /dessert|gulab|kheer|jalebi|kulfi|barfi|ladoo|halwa|rasmal|shahi/i.test(d))) return true
          return false
        })
        if (suggestions.length === 0) return null
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-amber-800 mb-3">💡 Often booked as separate vendors</p>
            {suggestions.map(s => (
              <Link
                key={s.slug}
                href={`/events/${eventId}/services/${s.slug}`}
                className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2.5 border border-amber-100 hover:border-amber-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-1">{s.label}</p>
                    <p className="text-xs text-text-4">{s.tip}</p>
                  </div>
                </div>
                <span className="text-xs text-brand font-semibold group-hover:underline whitespace-nowrap">Add service →</span>
              </Link>
            ))}
          </div>
        )
      })()}

      {/* Save button */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={() => onSave(buildSummary(f), buildCateringPrefs(f))}
          disabled={saving}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-black px-5 py-3 rounded-xl transition-colors disabled:opacity-60"
          style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}
        >
          {saving ? (
            <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
          ) : (
            <><Send className="h-3.5 w-3.5" /> Save requirements</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Generic Requirements Form (non-catering) ──────────────────────────────────

function GenericForm({
  initialNotes,
  onSave,
  saving,
}: {
  initialNotes: string
  onSave: (notes: string) => Promise<void>
  saving: boolean
}) {
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])
  const changed = notes !== initialNotes
  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor="service-notes" className="block text-sm font-semibold text-text-2 mb-1.5">
          Requirements &amp; special notes
        </label>
        <p className="text-xs text-text-4 mb-2.5">
          The more detail you share, the better quotes you'll receive.
        </p>
        <textarea
          id="service-notes"
          className="w-full border border-brand-border rounded-xl p-3.5 text-sm leading-relaxed min-h-[120px] resize-none
                     bg-cream/40 placeholder:text-text-4 text-text-1
                     focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-all"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Describe what you need — dates, guest count, style, budget, any special requests…"
        />
      </div>
      <div className="flex items-center justify-end">
        <Button
          onClick={() => onSave(notes)}
          disabled={saving || !notes.trim()}
          className="gap-2 bg-brand hover:bg-brand-hover text-white"
        >
          {saving ? (
            <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
          ) : (
            <><Send className="h-3.5 w-3.5" /> Save requirements</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 py-8 px-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-cream-2 rounded-full w-20" />
        <div className="h-3 bg-cream-2 rounded-full w-3" />
        <div className="h-3.5 bg-cream-2 rounded-full w-28" />
      </div>
      <div className="h-10 bg-cream-2 rounded-2xl w-56" />
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="h-5 bg-cream-2 rounded w-36" />
          <div className="h-5 w-5 bg-cream-2 rounded-full" />
        </div>
        <div className="border-t border-brand-border px-5 py-5 space-y-3">
          <div className="h-24 bg-cream-2 rounded-xl" />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-brand-border rounded-2xl p-4 flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-cream-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-cream-2 rounded w-32" />
            <div className="h-3 bg-cream-2 rounded w-20" />
          </div>
          <div className="h-8 w-28 bg-cream-2 rounded-lg self-center" />
        </div>
      ))}
    </div>
  )
}

// ── Vendor Card ───────────────────────────────────────────────────────────────

function VendorCard({
  vendor, onRequestQuote, requesting, requestingId,
}: {
  vendor: Vendor
  onRequestQuote: (vendorId: string) => void
  requesting: boolean
  requestingId: string | null
}) {
  const name = vendorDisplayName(vendor)
  const priceStr = formatPrice(vendor.price_per_head_min, vendor.price_per_head_max, vendor.currency)
  const isThisLoading = requesting && requestingId === vendor.id
  const avatarBg = [
    'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-purple-100 text-purple-700', 'bg-teal-100 text-teal-700',
  ][name.charCodeAt(0) % 5]

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4 sm:p-5 flex gap-4 items-start
                    hover:border-brand/40 hover:shadow-[0_4px_16px_rgba(26,9,4,0.06)] transition-all duration-200 group">
      {vendor.profile_photo_url ? (
        <img src={vendor.profile_photo_url} alt={name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-brand-border group-hover:ring-brand/20 transition-all" />
      ) : (
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black
                         ring-2 ring-brand-border group-hover:ring-brand/20 transition-all ${avatarBg}`}>
          {getInitials(name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-text-1 text-sm leading-tight">{name}</p>
              {vendor.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700
                                 border border-green-200 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-4">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {vendor.city}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1" title={`Match score: ${vendor.score.toFixed(0)}`}>
              <div className={`w-2 h-2 rounded-full ${scoreColor(vendor.score)}`} />
              <span className="text-[10px] text-text-4 font-medium">{vendor.score.toFixed(0)}% match</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {vendor.avg_rating !== null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-3 w-3 ${s <= Math.round(vendor.avg_rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
              ))}
              <span className="text-xs font-semibold text-text-2 ml-0.5">{vendor.avg_rating.toFixed(1)}</span>
            </div>
          )}
          {priceStr && (
            <span className="text-xs font-medium text-text-3 bg-cream px-2 py-0.5 rounded-full">{priceStr}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 self-center">
        <Button
          size="sm"
          onClick={() => onRequestQuote(vendor.id)}
          disabled={requesting}
          className={`text-xs font-semibold transition-all ${
            isThisLoading
              ? 'bg-brand/70 text-white'
              : 'bg-brand hover:bg-brand-hover text-white shadow-[0_2px_8px_rgba(232,85,16,0.2)]'
          }`}
        >
          {isThisLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Sending…
            </span>
          ) : 'Request Quote'}
        </Button>
      </div>
    </div>
  )
}

// ── Public Request Panel ──────────────────────────────────────────────────────

function PublicRequestPanel({ req, slug }: { req: EventRequest | null; slug: string }) {
  if (!req) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-cream">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe className="h-[18px] w-[18px] text-brand" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm">Public request board</p>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">
                Once you save your requirements, your request will be posted publicly — vendors and contacts can find and respond to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const isOpen = req.public_status === 'OPEN'
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-orange-50 via-amber-50/40 to-cream">
      <div className="h-0.5 bg-gradient-to-r from-brand via-amber-400 to-brand/30" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm leading-tight">Your request is live</p>
              <p className="text-xs text-text-4">
                {req.response_count > 0 ? `${req.response_count} response${req.response_count !== 1 ? 's' : ''} received` : 'Waiting for responses'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isOpen ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'}`}>
            {isOpen ? '● Open' : '✓ Filled'}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a href={`/requests/${slug}/${req.public_token}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-white border border-brand/20 rounded-lg px-3 py-1.5 hover:bg-cream transition-all">
            View public page <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-text-4">· Share to get faster responses</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ServicePage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const router = useRouter()
  const isCatering = slug === 'catering'

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Derive initial catering state from saved menu_preference
  function deriveCateringState(req: EventRequest | null): CateringState {
    if (!req?.menu_preference) return DEFAULT_CATERING
    const mp = req.menu_preference as Record<string, unknown>
    return {
      serviceStyles: (mp.service_style as string ?? '').split(',').filter(Boolean),
      liveStations: (mp.customer_tray_requests as string[] ?? []).filter(s =>
        LIVE_STATION_OPTIONS.some(o => o.value === s)),
      customStation: (mp.customer_tray_requests as string[] ?? []).find(s =>
        !LIVE_STATION_OPTIONS.some(o => o.value === s)) ?? '',
      letCatererDecideMenu: (mp.menu_mode as string) !== 'CUSTOMER_SPECIFIES',
      startersCount: mp.appetizer_count != null ? String(mp.appetizer_count) : '',
      mainsCount: mp.main_count != null ? String(mp.main_count) : '',
      breadRiceCount: mp.bread_count != null ? String(mp.bread_count) : '',
      dessertsCount: mp.dessert_count != null ? String(mp.dessert_count) : '',
      selectedDishes: (mp.selected_dishes as string[] ?? []),
      dishSearch: '',
      dietary: [
        ...(mp.is_vegetarian ? ['vegetarian'] : []),
        ...(mp.is_vegan ? ['vegan'] : []),
        ...(mp.is_halal ? ['halal'] : []),
        ...(mp.is_jain ? ['jain'] : []),
        ...(mp.is_kosher ? ['kosher'] : []),
        ...(mp.nut_free ? ['nut-free'] : []),
        ...(mp.gluten_free ? ['gluten-free'] : []),
        ...(mp.dairy_free ? ['dairy-free'] : []),
        ...(mp.egg_free ? ['egg-free'] : []),
      ],
      cuisines: (mp.cuisines as string[] ?? []),
      letCatererDecideCuisine: !(mp.cuisines as string[] ?? []).length,
      notes: (mp.special_notes as string) ?? '',
    }
  }

  async function load() {
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}`)
      if (!res.ok) { setLoading(false); return }
      const json = (await res.json()) as PageData
      setData(json)
      if (json.event_request?.service_notes) setFormOpen(false)
    } catch { /* network */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [eventId, slug])
  useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }, [])

  async function saveCatering(summary: string, prefs: Record<string, unknown>) {
    setSaving(true); setError(''); setSuccessMsg('')
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_notes: summary, catering_prefs: prefs }),
      })
      if (res.ok) {
        setSuccessMsg('Requirements saved!')
        successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000)
        await load(); setFormOpen(false)
      } else { setError('Could not save. Please try again.') }
    } catch { setError('Network error.') } finally { setSaving(false) }
  }

  async function saveGeneric(notes: string) {
    setSaving(true); setError(''); setSuccessMsg('')
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_notes: notes }),
      })
      if (res.ok) {
        setSuccessMsg('Requirements saved! Vendors matched below.')
        successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000)
        await load(); setFormOpen(false)
      } else { setError('Could not save. Please try again.') }
    } catch { setError('Network error.') } finally { setSaving(false) }
  }

  async function requestQuote(vendorId: string) {
    setRequesting(true); setRequestingId(vendorId); setError(''); setSuccessMsg('')
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}/request-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId }),
      })
      if (res.ok) {
        router.push(`/events/${eventId}/quotes`)
      } else {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not send quote request.')
        setRequesting(false); setRequestingId(null)
      }
    } catch { setError('Network error.'); setRequesting(false); setRequestingId(null) }
  }

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-text-4 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-text-1 mb-1">Service unavailable</h2>
        <p className="text-sm text-text-3 mb-6">This service isn't enabled or could not be loaded.</p>
        <Link href={`/events/${eventId}`} className="text-sm text-brand font-semibold hover:underline">← Back to event</Link>
      </div>
    )
  }

  const { service_config: svc, event_request: req, vendors } = data
  const isBusinessService = svc.service_class === 'BUSINESS'
  const hasReq = !!req
  const hasNotes = !!req?.service_notes

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-6 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors font-medium">Event</Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-text-2 font-semibold">{svc.icon} {svc.label}</span>
      </div>

      {/* Heading */}
      <div>
        <div className="flex items-center gap-3 mb-0.5">
          <span className="text-3xl">{svc.icon}</span>
          <h1 className="text-2xl font-black text-text-1 leading-tight">{svc.label}</h1>
        </div>
        <p className="text-sm text-text-3 ml-[calc(2rem+0.75rem)]">
          {hasReq
            ? 'Your requirements are saved. Review matched vendors below or update them.'
            : `Tell us what you need and we'll match you with the best ${svc.label.toLowerCase()} vendors.`}
        </p>
      </div>

      {/* Toasts */}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Requirements panel */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(26,9,4,0.05)]">
        <button
          type="button"
          aria-expanded={formOpen}
          onClick={() => setFormOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-text-1 text-sm">Your requirements</span>
            {hasNotes && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5 font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5" /> Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!formOpen && hasNotes && (
              <span className="text-xs text-text-4 italic line-clamp-1 max-w-[200px] text-right">{req?.service_notes}</span>
            )}
            {formOpen ? <ChevronUp className="h-4 w-4 text-text-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-text-4 flex-shrink-0" />}
          </div>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-5 pb-6 border-t border-brand-border pt-5">
            {isCatering ? (
              <CateringForm
                initial={deriveCateringState(req)}
                onSave={saveCatering}
                saving={saving}
                eventId={eventId}
              />
            ) : (
              <GenericForm
                initialNotes={req?.service_notes ?? ''}
                onSave={saveGeneric}
                saving={saving}
              />
            )}
          </div>
        </div>
      </div>

      {/* Vendor list */}
      {vendors.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-base font-black text-text-1">
                {isBusinessService ? `${svc.label} vendors on OneSeva` : `${svc.label} professionals on OneSeva`}
              </h2>
              <p className="text-xs text-text-4 mt-0.5">Ranked by relevance · {vendors.length} found</p>
            </div>
            {hasReq && <span className="inline-flex items-center gap-1 text-xs text-brand font-semibold"><Sparkles className="h-3.5 w-3.5" /> Matched</span>}
          </div>
          <div className="space-y-3">
            {vendors.map(v => (
              <VendorCard key={v.id} vendor={v} onRequestQuote={requestQuote} requesting={requesting} requestingId={requestingId} />
            ))}
          </div>
        </section>
      ) : hasReq ? (
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-3">{svc.icon}</span>
          <h3 className="font-bold text-text-1 text-sm mb-1">No vendors found yet</h3>
          <p className="text-xs text-text-3 max-w-xs mx-auto leading-relaxed">
            We're building our vendor network. Your public request is live — vendors can find and respond to it.
          </p>
        </div>
      ) : null}

      {/* Public request panel */}
      {hasReq && <PublicRequestPanel req={req} slug={slug} />}

      {/* Google Places stub */}
      {isBusinessService && (
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cream-2 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-[18px] w-[18px] text-text-3" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm">Other local businesses</p>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">
                Local {svc.label.toLowerCase()} businesses not yet on OneSeva will appear here.
              </p>
              <p className="text-[11px] text-text-4 mt-2 italic">Google Places integration — coming soon</p>
            </div>
          </div>
        </div>
      )}

      <div className="pb-6" />
    </div>
  )
}
