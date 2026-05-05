'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'

export type TrayRequest = { item_name: string; qty: number }

export type CateringPrefs = {
  dietary_type: 'non_veg' | 'vegetarian' | 'vegan'
  is_halal: boolean
  is_jain: boolean
  is_kosher: boolean
  nut_free: boolean
  gluten_free: boolean
  dairy_free: boolean
  egg_free: boolean
  cuisines: string[]
  service_styles: string[]
  menu_mode: 'CATERER_PROPOSES' | 'CUSTOMER_SPECIFIES'
  pricing_preference: 'NO_PREFERENCE' | 'PER_HEAD' | 'PER_TRAY'
  customer_tray_requests: TrayRequest[]
  appetizer_count: number | null
  main_count: number | null
  main_veg_count: number | null
  main_non_veg_count: number | null
  dessert_count: number | null
  bread_count: number | null
  rice_biryani_count: number | null
  dal_count: number | null
  live_counter_count: number | null
  beverage_count: number | null
  special_notes: string
}

const CUISINES = [
  'North Indian', 'Punjabi', 'South Indian', 'Mughlai', 'Gujarati', 'Rajasthani',
  'Bengali', 'Hyderabadi', 'Maharashtrian', 'Continental', 'Chinese',
]

const SERVICE_STYLES = [
  { value: 'buffet',       label: 'Buffet',         desc: 'Self-serve stations' },
  { value: 'seated',       label: 'Seated',         desc: 'Plated table service' },
  { value: 'live_counters', label: 'Live Counters',  desc: 'Fresh cooked at counters' },
  { value: 'family_style', label: 'Family Style',   desc: 'Shared dishes per table' },
]

const DEFAULT_PREFS: CateringPrefs = {
  dietary_type: 'non_veg',
  is_halal: false, is_jain: false, is_kosher: false,
  nut_free: false, gluten_free: false, dairy_free: false, egg_free: false,
  cuisines: [],
  service_styles: ['buffet'],
  menu_mode: 'CATERER_PROPOSES',
  pricing_preference: 'NO_PREFERENCE',
  customer_tray_requests: [],
  appetizer_count: null, main_count: null, main_veg_count: null,
  main_non_veg_count: null, dessert_count: null, bread_count: null,
  rice_biryani_count: null, dal_count: null, live_counter_count: null,
  beverage_count: null,
  special_notes: '',
}

type Props = {
  onNext: (prefs: CateringPrefs) => void
  onBack: () => void
}

export function Step4CateringPrefs({ onNext, onBack }: Props) {
  const [p, setP] = useState<CateringPrefs>(DEFAULT_PREFS)
  const [newTrayItem, setNewTrayItem] = useState('')
  const [newTrayQty, setNewTrayQty] = useState('1')

  function set<K extends keyof CateringPrefs>(key: K, value: CateringPrefs[K]) {
    setP(prev => ({ ...prev, [key]: value }))
  }

  function toggleCuisine(c: string) {
    setP(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c)
        ? prev.cuisines.filter(x => x !== c)
        : [...prev.cuisines, c],
    }))
  }

  const DIETARY_OPTIONS = [
    { value: 'non_veg',    label: 'Non-Veg',     color: 'bg-red-500',   active: 'border-red-500 bg-red-50',    dot: 'bg-red-500' },
    { value: 'vegetarian', label: 'Vegetarian',  color: 'bg-green-500', active: 'border-green-500 bg-green-50', dot: 'bg-green-500' },
    { value: 'vegan',      label: 'Vegan',       color: 'bg-teal-500',  active: 'border-teal-500 bg-teal-50',  dot: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-1">Catering preferences</h2>
        <p className="text-text-4 text-sm mt-1">
          This helps us match you with the right caterers and gets you more accurate quotes.
        </p>
      </div>

      {/* Dietary type */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">Dietary type</label>
        <div className="flex gap-2">
          {DIETARY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('dietary_type', opt.value as CateringPrefs['dietary_type'])}
              className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                p.dietary_type === opt.value ? opt.active : 'border-brand-border text-text-3 hover:border-brand-border'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${p.dietary_type === opt.value ? opt.dot : 'bg-brand-border'}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">Certifications / preparation</label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'is_halal', label: '☪️ Halal' },
            { key: 'is_jain', label: '🌿 Jain' },
            { key: 'is_kosher', label: '✡️ Kosher' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => set(key as keyof CateringPrefs, !p[key as keyof CateringPrefs] as any)}
              className={`px-3.5 py-1.5 rounded-full border text-sm transition-all ${
                p[key as keyof CateringPrefs]
                  ? 'border-brand bg-cream text-brand font-medium'
                  : 'border-brand-border text-text-3 hover:border-brand-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Allergens */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">Allergen-free requirements</label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'nut_free', label: '🥜 Nut-free' },
            { key: 'gluten_free', label: '🌾 Gluten-free' },
            { key: 'dairy_free', label: '🥛 Dairy-free' },
            { key: 'egg_free', label: '🥚 Egg-free' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => set(key as keyof CateringPrefs, !p[key as keyof CateringPrefs] as any)}
              className={`px-3.5 py-1.5 rounded-full border text-sm transition-all ${
                p[key as keyof CateringPrefs]
                  ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                  : 'border-brand-border text-text-3 hover:border-brand-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">
          Cuisine preferences <span className="text-text-4 font-normal">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => toggleCuisine(c)}
              className={`px-3.5 py-1.5 rounded-full border text-sm transition-all ${
                p.cuisines.includes(c)
                  ? 'border-brand bg-cream text-brand font-medium'
                  : 'border-brand-border text-text-3 hover:border-brand-border'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Service style */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">
          Service style <span className="text-text-4 font-normal">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_STYLES.map(s => {
            const isSelected = p.service_styles.includes(s.value)
            return (
              <button
                key={s.value}
                onClick={() => setP(prev => ({
                  ...prev,
                  service_styles: isSelected
                    ? prev.service_styles.filter(x => x !== s.value)
                    : [...prev.service_styles, s.value],
                }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-brand bg-cream' : 'border-brand-border hover:border-brand-border'
                }`}
              >
                <p className={`text-sm font-medium ${isSelected ? 'text-brand' : 'text-text-1'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-text-4 mt-0.5">{s.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu detail */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-text-2">Menu specification</label>
          <div className="flex rounded-xl border overflow-hidden text-xs">
            {[
              { v: 'CATERER_PROPOSES', l: 'Let caterer decide' },
              { v: 'CUSTOMER_SPECIFIES', l: "I'll specify counts" },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => set('menu_mode', opt.v as CateringPrefs['menu_mode'])}
                className={`px-3 py-1.5 transition-colors ${
                  p.menu_mode === opt.v ? 'bg-brand text-white' : 'text-text-3 hover:bg-cream'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {p.menu_mode === 'CUSTOMER_SPECIFIES' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 bg-cream rounded-xl p-4">
            {[
              { key: 'appetizer_count',   label: '🥗 Starters' },
              { key: 'main_count',        label: '🍛 Mains (total)' },
              { key: 'main_veg_count',    label: '🥦 Veg mains' },
              { key: 'main_non_veg_count',label: '🍗 Non-veg mains' },
              { key: 'dal_count',         label: '🫘 Dal / lentils' },
              { key: 'bread_count',       label: '🫓 Breads' },
              { key: 'rice_biryani_count',label: '🍚 Rice / biryani' },
              { key: 'live_counter_count',label: '🔥 Live counters' },
              { key: 'dessert_count',     label: '🍮 Desserts' },
              { key: 'beverage_count',    label: '🥤 Beverages' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-text-4 block mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={(p[key as keyof CateringPrefs] as number | null) ?? ''}
                  onChange={e => set(key as keyof CateringPrefs, (e.target.value ? parseInt(e.target.value) : null) as any)}
                  className="w-full border rounded-xl px-3 py-1.5 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing preference */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-2">Pricing preference</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'NO_PREFERENCE', label: "No preference",   desc: "Let the caterer decide",            icon: '🤝' },
            { value: 'PER_HEAD',      label: "Per person",      desc: "Fixed price per guest",             icon: '👤' },
            { value: 'PER_TRAY',      label: "By tray / qty",   desc: "Order trays or dishes by quantity", icon: '🫕' },
          ].map(opt => {
            const isSelected = p.pricing_preference === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => set('pricing_preference', opt.value as CateringPrefs['pricing_preference'])}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-brand bg-cream' : 'border-brand-border hover:border-brand-border'
                }`}
              >
                <p className="text-lg mb-1">{opt.icon}</p>
                <p className={`text-sm font-medium ${isSelected ? 'text-brand' : 'text-text-1'}`}>{opt.label}</p>
                <p className="text-xs text-text-4 mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Tray wishlist — shown when customer picks PER_TRAY */}
        {p.pricing_preference === 'PER_TRAY' && (
          <div className="mt-3 border border-brand-border bg-cream/40 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-text-2">What dishes do you want? <span className="text-text-4 font-normal">(optional)</span></p>
              <p className="text-xs text-text-4 mt-0.5">Tell the caterer what trays you have in mind. They'll price and adjust quantities.</p>
            </div>

            {/* Existing items */}
            {p.customer_tray_requests.length > 0 && (
              <div className="space-y-2">
                {p.customer_tray_requests.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
                    <span className="flex-1 text-sm text-text-1">{item.item_name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setP(prev => ({
                          ...prev,
                          customer_tray_requests: prev.customer_tray_requests.map((r, idx) =>
                            idx === i ? { ...r, qty: Math.max(1, r.qty - 1) } : r
                          ),
                        }))}
                        className="w-6 h-6 rounded-full border border-brand-border text-text-3 flex items-center justify-center text-sm hover:bg-cream"
                      >−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => setP(prev => ({
                          ...prev,
                          customer_tray_requests: prev.customer_tray_requests.map((r, idx) =>
                            idx === i ? { ...r, qty: r.qty + 1 } : r
                          ),
                        }))}
                        className="w-6 h-6 rounded-full border border-brand-border text-text-3 flex items-center justify-center text-sm hover:bg-cream"
                      >+</button>
                    </div>
                    <span className="text-xs text-text-4">tray{item.qty !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => setP(prev => ({
                        ...prev,
                        customer_tray_requests: prev.customer_tray_requests.filter((_, idx) => idx !== i),
                      }))}
                      className="text-text-4 hover:text-red-400 ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new item */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Chicken Biryani, Paneer Butter Masala…"
                value={newTrayItem}
                onChange={e => setNewTrayItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTrayItem.trim()) {
                    e.preventDefault()
                    setP(prev => ({
                      ...prev,
                      customer_tray_requests: [
                        ...prev.customer_tray_requests,
                        { item_name: newTrayItem.trim(), qty: parseInt(newTrayQty) || 1 },
                      ],
                    }))
                    setNewTrayItem('')
                    setNewTrayQty('1')
                  }
                }}
                className="flex-1 min-w-0 border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="number"
                min="1"
                max="20"
                value={newTrayQty}
                onChange={e => setNewTrayQty(e.target.value)}
                className="w-16 border border-brand-border rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!newTrayItem.trim()) return
                  setP(prev => ({
                    ...prev,
                    customer_tray_requests: [
                      ...prev.customer_tray_requests,
                      { item_name: newTrayItem.trim(), qty: parseInt(newTrayQty) || 1 },
                    ],
                  }))
                  setNewTrayItem('')
                  setNewTrayQty('1')
                }}
                className="gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <p className="text-xs text-text-4">Press Enter or click Add. Caterer will see this as your wishlist — quantities and prices are their call.</p>
          </div>
        )}
      </div>

      {/* Special notes */}
      <div>
        <label className="text-sm font-medium text-text-2 block mb-1.5">Special notes for caterers</label>
        <Textarea
          value={p.special_notes}
          onChange={e => set('special_notes', e.target.value)}
          placeholder="e.g. No pork, must have a kids menu, need service staff for 5 hours, prefer eco-friendly packaging…"
          className="text-sm"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={() => onNext(p)} className="flex-1 bg-brand hover:bg-brand-hover">
          Continue →
        </Button>
      </div>
    </div>
  )
}
