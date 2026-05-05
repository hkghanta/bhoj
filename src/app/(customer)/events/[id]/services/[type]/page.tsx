'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronRight, ChevronDown, ChevronUp, ExternalLink, Plus,
  CheckCircle2, Globe, AlertCircle, Send, X,
} from 'lucide-react'
import { SERVICE_FORMS } from './ServiceForms'

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

type BoardResponse = {
  id: string
  name: string
  pitch: string
  price_note: string | null
  portfolio_url: string | null
  status: string
  quote_token: string | null
  quoted_price: number | null
  price_unit: string | null
  what_includes: string | null
  service_details: string | null
  availability_note: string | null
  quote_submitted_at: string | null
  vendor_type: string
  created_at: string
}

type PageData = {
  service_config: ServiceConfig
  event_request: EventRequest | null
  event_city_slug: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────


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
    <div className="flex flex-wrap gap-2.5">
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
              on
                ? 'bg-brand/10 text-brand border-brand shadow-sm'
                : 'bg-white dark:bg-cream-2 text-text-3 border-brand-border hover:border-brand/40 hover:text-text-1'
            }`}
          >
            {o.emoji && <span className="text-base">{o.emoji}</span>}
            {o.label}
            {on && (
              <svg viewBox="0 0 10 10" className="w-3 h-3 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
            )}
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
  breadCount: string
  riceCount: string
  dessertsCount: string
  selectedDishes: string[]
  // Maps custom dish name → category key (e.g. 'APPETIZER') for display grouping
  customDishCategories: Record<string, string>
  dishSearch: string
  proteinPreference: string
  dietary: string[]
  cuisines: string[]
  letCatererDecideCuisine: boolean
  notes: string
  // Logistics
  deliveryRequired: boolean
  setupRequired: boolean
  servingStaffRequired: boolean
  equipmentRequired: boolean
  labelsRequired: boolean
}

const DEFAULT_CATERING: CateringState = {
  serviceStyles: [],
  liveStations: [],
  customStation: '',
  letCatererDecideMenu: true,
  startersCount: '',
  mainsCount: '',
  breadCount: '',
  riceCount: '',
  dessertsCount: '',
  selectedDishes: [],
  customDishCategories: {},
  dishSearch: '',
  proteinPreference: '',
  dietary: [],
  cuisines: [],
  letCatererDecideCuisine: true,
  notes: '',
  deliveryRequired: false,
  setupRequired: false,
  servingStaffRequired: false,
  equipmentRequired: false,
  labelsRequired: false,
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

const PROTEIN_OPTIONS = [
  { value: 'veg-only', label: 'Vegetarian Only', emoji: '🌿', desc: 'No meat, poultry, or seafood' },
  { value: 'non-veg', label: 'Non-Vegetarian', emoji: '🍗', desc: 'Includes meat, poultry, and/or seafood' },
  { value: 'mixed', label: 'Mixed Menu', emoji: '🍽️', desc: 'Both vegetarian and non-vegetarian options' },
  { value: 'eggetarian', label: 'Eggetarian', emoji: '🥚', desc: 'Vegetarian plus eggs' },
]

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan', emoji: '🥦' },
  { value: 'halal', label: 'Halal', emoji: '☪️' },
  { value: 'jain', label: 'Jain', emoji: '✋' },
  { value: 'kosher', label: 'Kosher', emoji: '✡️' },
  { value: 'nut-free', label: 'Nut-free', emoji: '🚫' },
  { value: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-free', emoji: '🥛' },
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
    if (f.breadCount) counts.push(`${f.breadCount} bread`)
    if (f.riceCount) counts.push(`${f.riceCount} rice/biryani`)
    if (f.dessertsCount) counts.push(`${f.dessertsCount} dessert${Number(f.dessertsCount) !== 1 ? 's' : ''}`)
    if (counts.length > 0) parts.push(counts.join(', '))
    if (f.selectedDishes.length > 0) parts.push(`Dishes: ${f.selectedDishes.join(', ')}`)
  }
  if (f.proteinPreference) {
    const pLabel = PROTEIN_OPTIONS.find(o => o.value === f.proteinPreference)?.label ?? f.proteinPreference
    parts.push(pLabel)
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
    menu_mode: f.letCatererDecideMenu ? 'CATERER_PROPOSES' : 'CUSTOMER_SPECIFIED',
    service_styles: f.serviceStyles,
    cuisines: f.letCatererDecideCuisine ? [] : f.cuisines,
    customer_tray_requests: allStations,
    selected_dishes: f.letCatererDecideMenu ? [] : f.selectedDishes,
    custom_dish_categories: f.letCatererDecideMenu ? {} : f.customDishCategories,
    appetizer_count: f.startersCount ? parseInt(f.startersCount) : null,
    main_count: f.mainsCount ? parseInt(f.mainsCount) : null,
    bread_count: f.breadCount ? parseInt(f.breadCount) : null,
    rice_biryani_count: f.riceCount ? parseInt(f.riceCount) : null,
    dessert_count: f.dessertsCount ? parseInt(f.dessertsCount) : null,
    protein_preference: f.proteinPreference || null,
    is_vegetarian: f.proteinPreference === 'veg-only' || f.proteinPreference === 'eggetarian',
    is_vegan: f.dietary.includes('vegan'),
    is_halal: f.dietary.includes('halal'),
    is_jain: f.dietary.includes('jain'),
    is_kosher: f.dietary.includes('kosher'),
    nut_free: f.dietary.includes('nut-free'),
    gluten_free: f.dietary.includes('gluten-free'),
    dairy_free: f.dietary.includes('dairy-free'),
    special_notes: f.notes.trim() || null,
    pricing_preference: 'NO_PREFERENCE',
    delivery_required: f.deliveryRequired,
    setup_required: f.setupRequired,
    serving_staff_required: f.servingStaffRequired,
    equipment_required: f.equipmentRequired,
    labels_required: f.labelsRequired,
  }
}

function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t-2 border-brand-border/60">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left group hover:bg-cream/30 -mx-1 px-1 rounded-lg transition-colors"
        aria-expanded={open}
      >
        <span className="text-lg font-black text-text-1">{title}</span>
        <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 border-brand-border transition-all ${open ? 'bg-cream-2 rotate-180' : ''}`}>
          <svg
            className="h-4 w-4 text-text-3"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-lg font-black text-text-1 mb-4">{children}</p>
}

function SectionDivider() {
  return <div className="border-t border-brand-border" />
}

// ── Course count input (stepper) ──────────────────────────────────────────────

function CourseCountInput({
  label, emoji, value, onChange,
}: { label: string; emoji: string; value: string; onChange: (v: string) => void }) {
  const n = parseInt(value) || 0
  return (
    <div className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-colors ${
      n > 0 ? 'border-blue-300 bg-blue-50' : 'border-brand-border bg-white dark:bg-cream-2'
    }`}>
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-xs text-text-2 font-bold text-center leading-tight">{label}</span>
      <div className="flex items-center gap-2.5 mt-0.5">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(0, n - 1)))}
          className="w-7 h-7 rounded-full border-2 border-brand-border flex items-center justify-center text-text-3 hover:bg-cream-2 text-sm font-bold"
        >−</button>
        <span className="text-base font-black text-text-1 w-5 text-center tabular-nums">
          {n > 0 ? n : '—'}
        </span>
        <button
          type="button"
          onClick={() => onChange(String(Math.min(20, n + 1)))}
          className="w-7 h-7 rounded-full border-2 border-brand-border flex items-center justify-center text-text-3 hover:bg-cream-2 text-sm font-bold"
        >+</button>
      </div>
    </div>
  )
}

function toTitleCase(str: string): string {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase())
}

// ── Build your own — unified search + category grouping ──────────────────────

function DishBuildSection({
  categories,
  selected,
  customDishCategories,
  onToggle,
  onAddCustom,
  onRemove,
}: {
  categories: DishCategory[]
  selected: string[]
  customDishCategories: Record<string, string>
  onToggle: (dish: string) => void
  onAddCustom: (dish: string, categoryKey?: string) => void
  onRemove: (dish: string) => void
}) {
  const [search, setSearch] = useState('')
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  // Pending custom dish waiting for category assignment
  const [pendingCustom, setPendingCustom] = useState<string | null>(null)

  const allLibraryDishes = categories.flatMap(c => c.dishes)

  const getCategoryForDish = (dish: string): DishCategory | undefined =>
    categories.find(c => c.dishes.includes(dish))

  const activeCat = categories.find(c => c.key === activeCategoryKey)
  const searchPool = activeCat ? activeCat.dishes : allLibraryDishes
  const suggestions = search.trim()
    ? searchPool
        .filter(d => d.toLowerCase().includes(search.toLowerCase()) && !selected.includes(d))
        .slice(0, 8)
    : []

  const exactInLibrary = allLibraryDishes.some(
    d => d.toLowerCase() === search.toLowerCase().trim()
  )
  const alreadyAdded = selected.some(
    d => d.toLowerCase() === search.toLowerCase().trim()
  )
  const canAddCustom = search.trim().length > 0 && !exactInLibrary && !alreadyAdded
  const showDropdown = dropdownVisible && search.trim().length > 0 && (suggestions.length > 0 || canAddCustom)

  // Group selected dishes by category
  const grouped: { category: DishCategory | null; key: string; dishes: string[] }[] = []
  for (const cat of categories) {
    // Library dishes in this category + custom dishes assigned here
    const catSelected = selected.filter(d =>
      cat.dishes.includes(d) ||
      (!allLibraryDishes.includes(d) && customDishCategories[d] === cat.key)
    )
    if (catSelected.length > 0) grouped.push({ category: cat, key: cat.key, dishes: catSelected })
  }
  // Custom dishes with no category assigned
  const uncategorisedCustom = selected.filter(
    d => !allLibraryDishes.includes(d) && !customDishCategories[d]
  )
  if (uncategorisedCustom.length > 0) {
    grouped.push({ category: null, key: 'custom', dishes: uncategorisedCustom })
  }

  // Course options for the category picker (simplified list)
  const COURSE_OPTIONS = [
    { key: 'SOUP_SALAD',   label: 'Soups & Salads', emoji: '🥣' },
    { key: 'APPETIZER',    label: 'Starters',        emoji: '🥗' },
    { key: 'MAIN_COURSE',  label: 'Mains',           emoji: '🍛' },
    { key: 'BREAD',        label: 'Breads',          emoji: '🫓' },
    { key: 'RICE_BIRYANI', label: 'Rice & Biryani',  emoji: '🍚' },
    { key: 'DAL',          label: 'Dal',             emoji: '🫕' },
    { key: 'DESSERT',      label: 'Desserts',        emoji: '🍮' },
    { key: 'BEVERAGE',     label: 'Drinks',          emoji: '🥤' },
    { key: 'OTHER',        label: 'Other',           emoji: '🍽️' },
  ]

  return (
    <div className="space-y-4">
      {/* Unified search bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setDropdownVisible(true); setPendingCustom(null) }}
          onFocus={() => setDropdownVisible(true)}
          onBlur={() => setTimeout(() => setDropdownVisible(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (suggestions.length === 1) { onToggle(suggestions[0]); setSearch(''); setDropdownVisible(false) }
              else if (canAddCustom) { setPendingCustom(toTitleCase(search)); setDropdownVisible(false) }
            }
            if (e.key === 'Escape') { setSearch(''); setDropdownVisible(false); setPendingCustom(null) }
          }}
          placeholder="Search dishes — e.g. Paneer Tikka, Butter Chicken, Gulab Jamun…"
          className="w-full text-sm border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 pr-9 placeholder:text-text-4"
        />
        {search ? (
          <button
            type="button"
            onClick={() => { setSearch(''); setDropdownVisible(false); setPendingCustom(null) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-text-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 text-base">🔍</span>
        )}

        {/* Typeahead dropdown */}
        {showDropdown && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-cream-2 border border-brand-border rounded-xl shadow-lg overflow-hidden divide-y divide-brand-border">
            {suggestions.map(dish => {
              const cat = getCategoryForDish(dish)
              return (
                <button
                  key={dish}
                  type="button"
                  onMouseDown={() => { onToggle(dish); setSearch(''); setDropdownVisible(false) }}
                  className="w-full px-4 py-2.5 text-sm text-left text-text-2 hover:bg-cream transition-colors flex items-center justify-between"
                >
                  <span>{dish}</span>
                  {cat && (
                    <span className="text-[11px] text-text-4 bg-cream-2 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                      {cat.emoji} {cat.label}
                    </span>
                  )}
                </button>
              )
            })}
            {canAddCustom && (
              <button
                type="button"
                onMouseDown={() => { setPendingCustom(toTitleCase(search)); setDropdownVisible(false) }}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-cream flex items-center gap-2 text-text-3"
              >
                <Plus className="h-3.5 w-3.5 text-text-4" />
                Add <span className="font-semibold text-text-1 ml-0.5">"{toTitleCase(search)}"</span>
                <span className="text-text-4 text-[11px] ml-1">— pick a course</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category picker for custom dish */}
      {pendingCustom && (
        <div className="border border-brand-border rounded-xl p-3 bg-cream space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-2">
              Adding <span className="text-text-1">"{pendingCustom}"</span> — which course?
            </p>
            <button
              type="button"
              onClick={() => { onAddCustom(pendingCustom, undefined); setPendingCustom(null); setSearch('') }}
              className="text-[11px] text-text-4 hover:text-text-2"
            >
              Skip
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COURSE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onAddCustom(pendingCustom, opt.key)
                  setPendingCustom(null)
                  setSearch('')
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brand-border bg-white dark:bg-cream-2 text-xs font-medium text-text-3 hover:border-text-1 hover:text-text-1 hover:bg-cream transition-all"
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 0 && !pendingCustom && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategoryKey(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              activeCategoryKey === null
                ? 'bg-text-1 text-white border-text-1'
                : 'bg-white dark:bg-cream-2 text-text-3 border-brand-border hover:text-text-1'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategoryKey(activeCategoryKey === cat.key ? null : cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeCategoryKey === cat.key
                  ? 'bg-text-1 text-white border-text-1'
                  : 'bg-white dark:bg-cream-2 text-text-3 border-brand-border hover:text-text-1'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Selected dishes grouped by category */}
      {grouped.length > 0 && (
        <div className="space-y-2">
          {grouped.map(({ category: cat, key, dishes }) => (
            <div key={key} className="bg-cream rounded-xl px-3 py-2.5">
              <p className="text-xs font-bold text-text-3 uppercase tracking-wide mb-2">
                {cat ? `${cat.emoji} ${cat.label}` : '✏️ Custom'}
              </p>
              <div className="flex flex-wrap gap-2">
                {dishes.map(d => (
                  <span
                    key={d}
                    className="flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand rounded-full px-3 py-1 text-sm font-semibold"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => onRemove(d)}
                      className="text-brand/50 hover:text-brand ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-text-4 text-right">
            {selected.length} dish{selected.length !== 1 ? 'es' : ''} selected
          </p>
        </div>
      )}

      {selected.length === 0 && !pendingCustom && (
        <p className="text-xs text-text-4 italic">Start typing to search dishes from our library</p>
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
    <div>

      {/* Service style */}
      <div className="pb-6">
        <SectionHeading>What type of service do you want?</SectionHeading>
        <PillToggle
          options={SERVICE_STYLE_OPTIONS}
          selected={f.serviceStyles}
          onChange={v => up({ serviceStyles: v })}
        />

        {/* Live stations — conditional */}
        {wantLiveStations && (
          <div className="bg-amber-50 rounded-xl p-5 space-y-4 border-2 border-amber-200 mt-5">
            <p className="text-base font-bold text-text-1">Which live stations?</p>
            <PillToggle
              options={LIVE_STATION_OPTIONS}
              selected={f.liveStations}
              onChange={v => up({ liveStations: v })}
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={f.customStation}
                onChange={e => up({ customStation: e.target.value })}
                placeholder="Other station (e.g. Panipuri, Frankie…)"
                className="flex-1 border border-brand-border rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {f.customStation && (
                <button type="button" onClick={() => up({ customStation: '' })} className="text-text-4 hover:text-text-2">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cuisine preferences */}
      <CollapsibleSection title="Cuisine Preferences">
        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={() => up({ letCatererDecideCuisine: !f.letCatererDecideCuisine, cuisines: [] })}
            className="text-sm text-brand font-bold hover:underline"
          >
            {f.letCatererDecideCuisine ? 'Choose specific cuisines' : 'Let caterer decide'}
          </button>
        </div>
        {f.letCatererDecideCuisine ? (
          <p className="text-sm text-text-3 bg-cream px-4 py-3 rounded-xl">Caterer will suggest appropriate cuisines</p>
        ) : (
          <PillToggle
            options={CUISINE_OPTIONS}
            selected={f.cuisines}
            onChange={v => up({ cuisines: v })}
          />
        )}
      </CollapsibleSection>

      {/* Protein preference */}
      <CollapsibleSection title="Protein Preference">
        <div className="grid grid-cols-2 gap-3">
          {PROTEIN_OPTIONS.map(opt => {
            const active = f.proteinPreference === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => up({ proteinPreference: active ? '' : opt.value })}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-brand-border bg-white dark:bg-cream-2 hover:border-emerald-300'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-1">{opt.label}</p>
                  <p className="text-xs text-text-4 mt-0.5">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  active ? 'bg-emerald-500 border-emerald-500' : 'border-brand-border'
                }`}>
                  {active && (
                    <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Dietary requirements */}
      <CollapsibleSection title="Dietary Restrictions & Allergies">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DIETARY_OPTIONS.map(o => {
            const on = f.dietary.includes(o.value)
            return (
              <button key={o.value} type="button" onClick={() => up({ dietary: on ? f.dietary.filter(v => v !== o.value) : [...f.dietary, o.value] })}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-bold text-left transition-all ${
                  on ? 'bg-green-50 text-text-1 border-green-400 shadow-sm' : 'bg-white dark:bg-cream-2 text-text-3 border-brand-border hover:border-green-300'
                }`}>
                <span className="text-xl">{o.emoji}</span>
                <span className="flex-1">{o.label}</span>
                {on && (
                  <svg viewBox="0 0 10 10" className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
                )}
              </button>
            )
          })}
        </div>
        {f.dietary.length === 0 && <p className="text-sm text-text-4 mt-3">None selected — all dietary preferences welcome</p>}
      </CollapsibleSection>

      {/* Menu / Dishes */}
      <CollapsibleSection title="Menu / Dishes">
        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            {
              val: true,
              icon: '👨‍🍳',
              title: 'Let caterer decide',
              desc: 'Set counts per course — caterer proposes the dishes',
            },
            {
              val: false,
              icon: '🍽️',
              title: 'Build your own',
              desc: 'Browse our library and pick specific dishes by course',
            },
          ] as const).map(opt => {
            const active = f.letCatererDecideMenu === opt.val
            return (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => up({ letCatererDecideMenu: opt.val })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-brand-border bg-white dark:bg-cream-2 hover:border-blue-300 text-text-2'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'bg-blue-500 border-blue-500' : 'border-brand-border'
                  }`}>
                    {active && (
                      <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold leading-snug">{opt.title}</p>
                <p className="text-xs mt-1 leading-snug text-text-4">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Let caterer decide: stepper counts per course */}
        {f.letCatererDecideMenu && (
          <div>
            <p className="text-sm text-text-3 mb-3">
              How many dishes of each course are you thinking?{' '}
              <span className="text-text-4">(optional)</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {([
                { key: 'startersCount', label: 'Starters',       emoji: '🥗' },
                { key: 'mainsCount',    label: 'Mains',          emoji: '🍛' },
                { key: 'breadCount',    label: 'Breads',         emoji: '🫓' },
                { key: 'riceCount',     label: 'Rice / Biryani', emoji: '🍚' },
                { key: 'dessertsCount', label: 'Desserts',       emoji: '🍮' },
              ] as const).map(({ key, label, emoji }) => (
                <CourseCountInput
                  key={key}
                  label={label}
                  emoji={emoji}
                  value={f[key] ?? ''}
                  onChange={v => up({ [key]: v })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Build your own: unified search + category grouping */}
        {!f.letCatererDecideMenu && (
          dishCategories.length === 0 ? (
            <p className="text-sm text-text-4 italic py-2">Loading dish library…</p>
          ) : (
            <DishBuildSection
              categories={dishCategories}
              selected={f.selectedDishes}
              customDishCategories={f.customDishCategories}
              onToggle={dish => up({
                selectedDishes: f.selectedDishes.includes(dish)
                  ? f.selectedDishes.filter(d => d !== dish)
                  : [...f.selectedDishes, dish],
              })}
              onAddCustom={(dish, categoryKey) => {
                if (!f.selectedDishes.includes(dish)) {
                  up({
                    selectedDishes: [...f.selectedDishes, dish],
                    customDishCategories: categoryKey
                      ? { ...f.customDishCategories, [dish]: categoryKey }
                      : f.customDishCategories,
                  })
                }
              }}
              onRemove={dish => up({
                selectedDishes: f.selectedDishes.filter(d => d !== dish),
                customDishCategories: Object.fromEntries(
                  Object.entries(f.customDishCategories).filter(([k]) => k !== dish)
                ),
              })}
            />
          )
        )}
      </CollapsibleSection>

      {/* Setup & logistics */}
      <CollapsibleSection title={<>Setup &amp; logistics <span className="text-text-4 font-normal text-sm">(optional)</span></>}>
        <p className="text-sm text-text-3 mb-4">What do you need the caterer to handle on the day?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'deliveryRequired',      label: 'Delivery to venue',                emoji: '🚚', desc: 'Food delivered to the venue' },
            { key: 'setupRequired',         label: 'Setup & arrangement',              emoji: '🪑', desc: 'Set up tables, dishes, and presentation' },
            { key: 'servingStaffRequired',  label: 'Serving staff',                    emoji: '🧑‍🍳', desc: 'Staff to serve guests during the event' },
            { key: 'equipmentRequired',     label: 'Buffet equipment',                 emoji: '🔥', desc: 'Chaffers, burners, serving stands' },
            { key: 'labelsRequired',        label: 'Dish labels & menu cards',         emoji: '🏷️', desc: 'Printed labels for each dish or menu' },
          ] as const).map(({ key, label, emoji, desc }) => {
            const on = f[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => up({ [key]: !on })}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                  on
                    ? 'bg-purple-50 border-purple-300 shadow-sm'
                    : 'bg-white dark:bg-cream-2 border-brand-border hover:border-purple-200'
                }`}
              >
                <span className="text-2xl mt-0.5 flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-1">{label}</p>
                  <p className="text-xs text-text-4 mt-1 leading-snug">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  on ? 'bg-purple-500 border-purple-500' : 'border-2 border-brand-border'
                }`}>
                  {on && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
                </div>
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Additional notes */}
      <CollapsibleSection title={<>Additional notes <span className="text-text-4 font-normal text-sm">(optional)</span></>} defaultOpen={false}>
        <textarea
          value={f.notes}
          onChange={e => up({ notes: e.target.value })}
          rows={4}
          placeholder="Anything else the caterer should know — e.g. venue restrictions, serving time, special requests…"
          className="w-full border-2 border-brand-border rounded-xl px-4 py-3.5 text-sm text-text-1 bg-white dark:bg-cream-2 resize-none
                     placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
        />
      </CollapsibleSection>

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
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
            <p className="text-xs font-bold text-amber-800 mb-3">💡 Often booked as separate vendors</p>
            {suggestions.map(s => (
              <Link
                key={s.slug}
                href={`/events/${eventId}/services/${s.slug}`}
                className="flex items-center justify-between gap-3 bg-white dark:bg-cream-2 rounded-xl px-3 py-2.5 border border-amber-100 hover:border-amber-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-text-1">{s.label}</p>
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
    <div className="space-y-4.5">
      <div>
        <label htmlFor="service-notes" className="block text-sm font-bold text-text-2 mb-1.5">
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
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="h-5 bg-cream-2 rounded w-36" />
          <div className="h-5 w-5 bg-cream-2 rounded-full" />
        </div>
        <div className="border-t border-brand-border px-5 py-5 space-y-4">
          <div className="h-32 bg-cream-2 rounded-xl" />
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-cream-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-cream-2 rounded w-32" />
            <div className="h-3 bg-cream-2 rounded w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Public Request Panel ──────────────────────────────────────────────────────

function PublicRequestPanel({ req, slug, citySlug, responseCount }: { req: EventRequest | null; slug: string; citySlug: string; responseCount: number }) {
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
    <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-cream via-amber-50/40 to-cream">
      <div className="h-0.5 bg-gradient-to-r from-brand via-amber-400 to-brand/30" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm leading-tight">Your request is live</p>
              <p className="text-xs text-text-4">
                {responseCount > 0 ? `${responseCount} pitch${responseCount !== 1 ? 'es' : ''} received` : 'Waiting for responses'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isOpen ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-cream-2 text-text-3 ring-1 ring-brand-border'}`}>
            {isOpen ? '● Open' : '✓ Filled'}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a href={`/requests/${slug}/${citySlug}/${req.public_token}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-white dark:bg-cream-2 border border-brand/20 rounded-xl px-3 py-1.5 hover:bg-cream transition-all">
            View public page <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-text-4">· Share to get faster responses</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

// Map URL slug → VendorType enum value (mirrors SLUG_TO_VENDOR_TYPE in lib)
function slugToVendorType(slug: string): string {
  const map: Record<string, string> = {
    catering: 'CATERER', photography: 'PHOTOGRAPHER', videography: 'VIDEOGRAPHER',
    decoration: 'DECORATOR', dj: 'DJ', florist: 'FLORIST',
    'mehendi-artist': 'MEHENDI_ARTIST', 'makeup-hair': 'MAKEUP_HAIR',
    'dhol-player': 'DHOL_PLAYER', 'live-band': 'LIVE_BAND',
    choreographer: 'CHOREOGRAPHER', 'pandit-officiant': 'PANDIT_OFFICIANT',
    'mc-host': 'MC_HOST', bartender: 'BARTENDER', transport: 'TRANSPORT',
  }
  return map[slug] ?? slug.toUpperCase()
}

const PRICE_UNIT_LABEL: Record<string, string> = {
  per_head: '/head', per_event: ' flat', per_hour: '/hr', per_day: '/day',
}

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  need_to_confirm: 'Needs to confirm',
  not_available: 'Not available',
}

function ResponseCard({
  resp, eventRequestToken, onAction, acting,
}: {
  resp: BoardResponse
  eventRequestToken: string | null
  onAction: (action: string, responseId: string, token: string) => void
  acting: string | null
}) {
  const [open, setOpen] = useState(false)
  const hasQuote = !!resp.quote_submitted_at
  const statusColors: Record<string, string> = {
    PENDING: 'bg-cream-2 text-text-3',
    QUOTE_REQUESTED: 'bg-blue-50 text-blue-700',
    QUOTE_SUBMITTED: 'bg-indigo-50 text-indigo-700',
    ACCEPTED_RESPONSE: 'bg-green-50 text-green-700',
    DECLINED: 'bg-cream-2 text-text-4',
  }
  const statusLabel: Record<string, string> = {
    PENDING: 'Pitched', QUOTE_REQUESTED: 'Quote requested',
    QUOTE_SUBMITTED: 'Full quote', ACCEPTED_RESPONSE: 'Accepted', DECLINED: 'Declined',
  }
  return (
    <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden hover:border-brand/30 transition-colors">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-5 text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-cream-2 flex items-center justify-center flex-shrink-0 text-sm font-black text-text-3">
          {resp.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-text-1">{resp.name}</span>
            {hasQuote && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-1.5 py-0.5 font-semibold">Full quote</span>
            )}
          </div>
          <p className="text-xs text-text-3 mt-0.5 line-clamp-1">{resp.pitch}</p>
          {resp.quoted_price && (
            <p className="text-xs font-semibold text-brand mt-0.5">
              £{resp.quoted_price.toLocaleString()}{PRICE_UNIT_LABEL[resp.price_unit ?? ''] ?? ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[resp.status] ?? 'bg-cream-2 text-text-3'}`}>
            {statusLabel[resp.status] ?? resp.status}
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-text-4" /> : <ChevronDown className="h-3.5 w-3.5 text-text-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-brand-border px-4 pb-4 pt-3 space-y-4">
          <p className="text-sm text-text-2 italic">"{resp.pitch}"</p>
          {resp.what_includes && (
            <div>
              <p className="text-xs font-bold text-text-4 mb-0.5">What's included</p>
              <p className="text-sm text-text-2">{resp.what_includes}</p>
            </div>
          )}
          {resp.service_details && (
            <div>
              <p className="text-xs font-bold text-text-4 mb-0.5">Service details</p>
              <p className="text-sm text-text-2">{resp.service_details}</p>
            </div>
          )}
          {resp.availability_note && (
            <p className="text-xs text-text-4">{AVAILABILITY_LABEL[resp.availability_note] ?? resp.availability_note}</p>
          )}
          {resp.portfolio_url && (
            <a href={resp.portfolio_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
              View portfolio <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {resp.status === 'PENDING' && eventRequestToken && (
            <button
              type="button"
              disabled={acting === resp.id}
              onClick={() => onAction('request_full_quote', resp.id, eventRequestToken)}
              className="text-xs font-semibold text-brand border border-brand/30 rounded-xl px-3 py-1.5 hover:bg-cream transition-colors disabled:opacity-50"
            >
              {acting === resp.id ? 'Sending…' : 'Ask for formal quote →'}
            </button>
          )}
          {resp.status === 'ACCEPTED_RESPONSE' && (
            <p className="text-sm font-semibold text-green-700">✓ Accepted — they'll be in touch</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ServicePage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const isCatering = slug === 'catering'

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [responses, setResponses] = useState<BoardResponse[]>([])
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)
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
      letCatererDecideMenu: (mp.menu_mode as string) !== 'CUSTOMER_SPECIFIED',
      startersCount: mp.appetizer_count != null ? String(mp.appetizer_count) : '',
      mainsCount: mp.main_count != null ? String(mp.main_count) : '',
      breadCount: mp.bread_count != null ? String(mp.bread_count) : '',
      riceCount: mp.rice_biryani_count != null ? String(mp.rice_biryani_count) : '',
      dessertsCount: mp.dessert_count != null ? String(mp.dessert_count) : '',
      selectedDishes: (mp.selected_dishes as string[] ?? []),
      customDishCategories: (mp.custom_dish_categories as Record<string, string> ?? {}),
      dishSearch: '',
      proteinPreference: (mp.protein_preference as string) ?? '',
      dietary: [
        ...(mp.is_vegan ? ['vegan'] : []),
        ...(mp.is_halal ? ['halal'] : []),
        ...(mp.is_jain ? ['jain'] : []),
        ...(mp.is_kosher ? ['kosher'] : []),
        ...(mp.nut_free ? ['nut-free'] : []),
        ...(mp.gluten_free ? ['gluten-free'] : []),
        ...(mp.dairy_free ? ['dairy-free'] : []),
      ],
      cuisines: (mp.cuisines as string[] ?? []),
      letCatererDecideCuisine: !(mp.cuisines as string[] ?? []).length,
      notes: (mp.special_notes as string) ?? '',
      deliveryRequired: (mp.delivery_required as boolean) ?? false,
      setupRequired: (mp.setup_required as boolean) ?? false,
      servingStaffRequired: (mp.serving_staff_required as boolean) ?? false,
      equipmentRequired: (mp.equipment_required as boolean) ?? false,
      labelsRequired: (mp.labels_required as boolean) ?? false,
    }
  }

  async function load() {
    try {
      const [svcRes, respRes] = await Promise.all([
        fetch(`/api/events/${eventId}/services/${slug}`),
        fetch(`/api/events/${eventId}/responses`),
      ])
      if (!svcRes.ok) { setLoading(false); return }
      const json = (await svcRes.json()) as PageData
      setData(json)
      if (json.event_request?.service_notes) setFormOpen(false)

      if (respRes.ok) {
        const respData = await respRes.json()
        const vendorTypeForSlug = slugToVendorType(slug)
        const filtered = (respData.responses ?? []).filter(
          (r: BoardResponse) => r.vendor_type === vendorTypeForSlug
        )
        setResponses(filtered)
        setTokenMap(respData.token_map ?? {})
      }
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
      } else {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not save. Please try again.')
      }
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
        setSuccessMsg('Requirements saved!')
        successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000)
        await load(); setFormOpen(false)
      } else {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not save. Please try again.')
      }
    } catch { setError('Network error.') } finally { setSaving(false) }
  }

  async function handleAction(action: string, responseId: string, erToken: string) {
    setActing(responseId)
    try {
      await fetch(`/api/requests/${erToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, response_id: responseId }),
      })
      await load()
    } finally { setActing(null) }
  }

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-text-4 mx-auto mb-4" />
        <h2 className="text-xl font-black text-text-1 mb-1">Service unavailable</h2>
        <p className="text-sm text-text-3 mb-6">This service isn't enabled or could not be loaded.</p>
        <Link href={`/events/${eventId}`} className="text-sm text-brand font-semibold hover:underline">← Back to event</Link>
      </div>
    )
  }

  const { service_config: svc, event_request: req, event_city_slug: citySlug } = data
  const hasReq = !!req
  const hasNotes = !!req?.service_notes

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4 mb-5">
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors font-medium">Event</Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-text-2 font-bold">{svc.icon} {svc.label}</span>
      </div>

      {/* Toasts */}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 mb-4">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Left column: requirements + pitches ───────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{svc.icon}</span>
            <div>
              <h1 className="text-2xl font-black text-text-1 leading-tight">{svc.label}</h1>
              <p className="text-xs text-text-4 mt-0.5">
                {hasReq ? 'Your request is live — vendors pitch to you.' : 'Tell us what you need and vendors will pitch to you.'}
              </p>
            </div>
          </div>

          {/* Requirements panel */}
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(26,9,4,0.05)]">
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
                  <span className="text-xs text-text-4 italic line-clamp-1 max-w-[180px] text-right">{req?.service_notes}</span>
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
                ) : SERVICE_FORMS[slug] ? (
                  (() => {
                    const SpecificForm = SERVICE_FORMS[slug]
                    return (
                      <SpecificForm
                        initialNotes={req?.service_notes ?? ''}
                        onSave={saveGeneric}
                        saving={saving}
                      />
                    )
                  })()
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

          {/* Pitches */}
          {hasReq && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-text-1 flex items-center gap-2">
                  Pitches received
                  {responses.length > 0 && (
                    <span className="text-xs font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5">{responses.length}</span>
                  )}
                </h2>
                {responses.length > 0 && (
                  <Link href={`/events/${eventId}/quotes`} className="text-xs text-brand font-semibold hover:underline">
                    View all quotes →
                  </Link>
                )}
              </div>

              {responses.length === 0 ? (
                <div className="bg-white dark:bg-cream-2 border border-brand-border border-dashed rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand/8 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📬</span>
                  </div>
                  <p className="text-sm font-semibold text-text-1 mb-1">Waiting for pitches</p>
                  <p className="text-xs text-text-3 leading-relaxed max-w-xs mx-auto mb-4">
                    Vendors typically respond within 24 hours. Share your request link to get faster replies.
                  </p>
                  <a
                    href={`/requests/${slug}/${citySlug}/${req!.public_token}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl px-4 py-2 transition-colors"
                  >
                    Share request link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {responses.map(resp => (
                    <ResponseCard
                      key={resp.id}
                      resp={resp}
                      eventRequestToken={tokenMap[resp.id] ?? null}
                      onAction={handleAction}
                      acting={acting}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Right column: status + actions (sticky) ───────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* Live status card */}
          <PublicRequestPanel req={req} slug={slug} citySlug={data.event_city_slug} responseCount={responses.length} />

          {/* Browse vendors CTA */}
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-4">
            <p className="text-base font-bold text-text-1 mb-1">Invite a specific vendor</p>
            <p className="text-xs text-text-3 mb-3">Browse {svc.label.toLowerCase()} vendors and request a quote directly.</p>
            <Link
              href={`/events/${eventId}/vendors`}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-cream hover:bg-cream-2 border border-brand-border text-brand rounded-xl px-3 py-2.5 transition-colors w-full"
            >
              Browse vendors <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Tips card — only before first save */}
          {!hasReq && (
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 space-y-4">
              <p className="text-xs font-black text-text-1 uppercase tracking-wider">How it works</p>
              {[
                { n: '1', t: 'Set your requirements', d: "Fill in what you need — the more detail, the better pitches you'll get." },
                { n: '2', t: 'Vendors pitch to you', d: 'Your request goes live on our board. Vendors reach out with quotes.' },
                { n: '3', t: 'Pick the best fit', d: 'Review pitches and connect directly — no commission, no middlemen.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
                  <div>
                    <p className="text-xs font-bold text-text-1">{s.t}</p>
                    <p className="text-xs text-text-4 mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pb-6" />
    </div>
  )
}
