'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Search, Pencil, Check, X } from 'lucide-react'

type MenuItem = {
  id: string
  name: string
  description: string | null
  category: string
  is_vegetarian: boolean
  is_vegan: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  spice_level: string
  proteins: string[]
  pending_review?: boolean
}

type EditForm = {
  is_vegetarian: boolean
  is_vegan: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  spice_level: string
  description: string
  proteins: string[]
}

type GlobalSuggestion = {
  id: string
  name: string
  description: string | null
  category: string
  spice_level: string
  is_vegetarian: boolean
  is_vegan: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  proteins: string[]
}

const CATEGORIES = [
  { value: 'SOUP_SALAD', label: 'Soups & Salads' },
  { value: 'APPETIZER', label: 'Appetizers' },
  { value: 'MAIN_COURSE', label: 'Main Course' },
  { value: 'BREAD', label: 'Bread' },
  { value: 'RICE_BIRYANI', label: 'Rice & Biryani' },
  { value: 'DAL', label: 'Dal & Lentils' },
  { value: 'DESSERT', label: 'Desserts' },
  { value: 'BEVERAGE', label: 'Beverages' },
  { value: 'LIVE_COUNTER', label: 'Live Counter' },
  { value: 'OTHER', label: 'Other' },
]

const SPICE_LEVELS = ['MILD', 'MEDIUM', 'HOT', 'VERY_HOT']

const PROTEINS = ['Chicken', 'Lamb', 'Goat', 'Beef', 'Prawn', 'Fish', 'Paneer', 'Tofu', 'Egg', 'Lentils']

// Categories where proteins are not relevant
const NO_PROTEIN_CATEGORIES = ['DESSERT', 'BEVERAGE', 'BREAD']

// Keywords that map to each protein
const PROTEIN_KEYWORDS: Record<string, string[]> = {
  Chicken:  ['chicken', 'murgh', 'tikka chicken', 'poultry'],
  Lamb:     ['lamb', 'mutton', 'gosht', 'rogan'],
  Goat:     ['goat', 'kid goat'],
  Beef:     ['beef', 'brisket'],
  Prawn:    ['prawn', 'shrimp', 'jhinga', 'scampi'],
  Fish:     ['fish', 'salmon', 'cod', 'tilapia', 'mackerel', 'mahi', 'tuna', 'sea bass'],
  Paneer:   ['paneer', 'cottage cheese'],
  Tofu:     ['tofu', 'bean curd'],
  Egg:      ['egg', 'anda', 'omelette'],
  Lentils:  ['lentil', 'dal', 'daal', 'masoor', 'moong', 'chana', 'rajma', 'urad'],
}

function detectProteins(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase()
  return PROTEINS.filter(p =>
    PROTEIN_KEYWORDS[p].some(kw => text.includes(kw))
  )
}

const DISH_TYPES = [
  { label: 'Non-Veg', veg: false, vegan: false, active: 'bg-red-100 border-red-500 text-red-800', inactive: 'border-brand-border text-text-4 hover:border-red-300' },
  { label: 'Vegetarian', veg: true,  vegan: false, active: 'bg-green-100 border-green-500 text-green-800', inactive: 'border-brand-border text-text-4 hover:border-green-300' },
  { label: 'Vegan',   veg: true,  vegan: true,  active: 'bg-teal-100 border-teal-500 text-teal-800', inactive: 'border-brand-border text-text-4 hover:border-teal-300' },
]

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'MAIN_COURSE',
  spice_level: 'MEDIUM',
  dish_type: null as null | string,   // null = not yet chosen (required)
  is_vegetarian: false,
  is_vegan: false,
  is_halal: false,
  contains_nuts: false,
  contains_gluten: false,
  contains_dairy: false,
  contains_eggs: false,
  contains_soy: false,
  contains_shellfish: false,
  proteins: [] as string[],           // required: ≥ 1
  suggest_global: false,
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<GlobalSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filledFromLibrary, setFilledFromLibrary] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/vendor/menu-items')
      .then(async r => {
        if (!r.ok) return null
        const text = await r.text()
        return text ? JSON.parse(text) : null
      })
      .then(data => { if (Array.isArray(data)) setItems(data) })
  }, [])

  function autoDetectProteins(name: string, description: string) {
    const detected = detectProteins(name, description)
    if (detected.length > 0) setForm(f => ({ ...f, proteins: detected }))
  }

  function onNameChange(value: string) {
    setForm(f => {
      const updated = { ...f, name: value }
      const detected = detectProteins(value, f.description)
      if (detected.length > 0) updated.proteins = detected
      return updated
    })
    setFilledFromLibrary(false)

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return }

    searchTimeout.current = setTimeout(async () => {
      const text = await fetch(`/api/dishes?q=${encodeURIComponent(value)}`).then(r => r.text()).catch(() => '')
      if (!text) return
      const data = JSON.parse(text)
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data.slice(0, 6))
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 250)
  }

  function fillFromSuggestion(s: GlobalSuggestion) {
    setForm({
      name: s.name,
      description: s.description ?? '',
      category: s.category,
      spice_level: s.spice_level,
      dish_type: s.is_vegan ? 'Vegan' : s.is_vegetarian ? 'Vegetarian' : 'Non-Veg',
      is_vegetarian: s.is_vegetarian,
      is_vegan: s.is_vegan,
      is_halal: s.is_halal,
      contains_nuts: s.contains_nuts,
      contains_gluten: s.contains_gluten,
      contains_dairy: s.contains_dairy,
      contains_eggs: s.contains_eggs,
      contains_soy: false,
      contains_shellfish: false,
      proteins: (s.proteins && s.proteins.length > 0) ? s.proteins : detectProteins(s.name, s.description ?? ''),
      suggest_global: false,
    })
    setSuggestions([])
    setShowSuggestions(false)
    setFilledFromLibrary(true)
  }

  async function addItem() {
    if (!form.name || !form.description) return
    setSaving(true)
    const res = await fetch('/api/vendor/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setFilledFromLibrary(false)
    setSaving(false)
  }

  async function deleteItem(id: string) {
    await fetch(`/api/vendor/menu-items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditForm({
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_halal: item.is_halal,
      contains_nuts: item.contains_nuts,
      contains_gluten: item.contains_gluten,
      contains_dairy: item.contains_dairy,
      contains_eggs: item.contains_eggs,
      spice_level: item.spice_level,
      description: item.description ?? '',
      proteins: item.proteins ?? [],
    })
  }

  async function saveEdit(id: string) {
    if (!editForm) return
    setEditSaving(true)
    const res = await fetch(`/api/vendor/menu-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i))
    }
    setEditingId(null)
    setEditForm(null)
    setEditSaving(false)
  }

  const grouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value)
    return acc
  }, {})

  const pendingCount = items.filter(i => i.pending_review).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-1">Dish Library</h1>
          <p className="text-text-4 mt-1">Add dishes to your library. Search the global catalogue when adding a new dish.</p>
        </div>
        <Button onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); setFilledFromLibrary(false) }} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-2" /> Add Dish
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 mb-8 space-y-5">
          <h3 className="text-lg font-bold text-text-1">New Dish</h3>

          {/* Name with live global library search */}
          <div className="space-y-1">
            <Label>Name *</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-4 pointer-events-none" />
                <Input
                  value={form.name}
                  onChange={e => onNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-9"
                  placeholder="Type to search global dish library…"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden">
                  <div className="px-3 py-1.5 text-xs text-text-4 bg-cream border-b">
                    From global library — click to auto-fill
                  </div>
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={() => fillFromSuggestion(s)}
                      className="w-full text-left px-4 py-3 hover:bg-cream border-b last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-text-1 text-sm">{s.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {s.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                            {s.is_halal && !s.is_vegetarian && <Badge variant="outline" className="text-xs">Halal</Badge>}
                            {s.contains_nuts && <Badge variant="outline" className="text-xs text-brand border-brand-border">Nuts</Badge>}
                            {s.contains_gluten && <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-200">Gluten</Badge>}
                            {s.contains_dairy && <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">Dairy</Badge>}
                          </div>
                        </div>
                        <span className="text-xs text-text-4 flex-shrink-0">
                          {CATEGORIES.find(c => c.value === s.category)?.label}
                        </span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-text-4 mt-0.5 line-clamp-1">{s.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {filledFromLibrary && (
              <p className="text-xs text-green-600">✓ Details filled from global library. Review and save.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v: string | null) => setForm(f => ({ ...f, category: v ?? 'MAIN_COURSE' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Spice Level</Label>
              <Select
                value={form.spice_level}
                onValueChange={(v: string | null) => setForm(f => ({ ...f, spice_level: v ?? 'MEDIUM' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPICE_LEVELS.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description * <span className="text-text-4 font-normal text-xs">(1–2 sentences)</span></Label>
            <Input
              value={form.description}
              onChange={e => {
                const desc = e.target.value
                setForm(f => {
                  const updated = { ...f, description: desc }
                  const detected = detectProteins(f.name, desc)
                  if (detected.length > 0) updated.proteins = detected
                  return updated
                })
              }}
              placeholder="Grilled cottage cheese with spiced marinade, served with mint chutney."
            />
          </div>

          {/* Dish type — required */}
          <div className="space-y-1.5">
            <Label>Dish type <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {DISH_TYPES.map(opt => {
                const active = form.dish_type === opt.label
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, dish_type: opt.label, is_vegetarian: opt.veg, is_vegan: opt.vegan, ...(opt.veg ? { is_halal: false } : {}) }))}
                    className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${active ? opt.active : opt.inactive}`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {!form.dish_type && <p className="text-xs text-text-4">Required — select one</p>}
          </div>

          {/* Halal */}
          {!form.is_vegetarian && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_halal}
                onChange={e => setForm(f => ({ ...f, is_halal: e.target.checked }))}
                className="rounded"
              />
              Halal certified
            </label>
          )}

          {/* Allergens */}
          <div className="space-y-1.5">
            <Label>Allergens</Label>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { key: 'contains_nuts', label: 'Nuts' },
                { key: 'contains_gluten', label: 'Gluten' },
                { key: 'contains_dairy', label: 'Dairy' },
                { key: 'contains_eggs', label: 'Eggs' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Proteins — optional, hidden for dessert/beverage/bread */}
          {!NO_PROTEIN_CATEGORIES.includes(form.category) && (
            <div className="space-y-1.5">
              <Label>
                Proteins <span className="text-text-4 font-normal text-xs">(auto-detected · adjust if needed)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {PROTEINS.map(p => {
                  const selected = form.proteins.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        proteins: selected ? f.proteins.filter(x => x !== p) : [...f.proteins, p],
                      }))}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors ${selected ? 'bg-cream border-brand-border text-brand font-medium' : 'border-brand-border text-text-4 hover:border-brand-border'}`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!filledFromLibrary && (
            <label className="flex items-center gap-2 text-sm cursor-pointer border-t pt-3">
              <input
                type="checkbox"
                checked={form.suggest_global}
                onChange={e => setForm(f => ({ ...f, suggest_global: e.target.checked }))}
                className="rounded"
              />
              <span className="font-medium text-brand">Suggest this dish for the global library</span>
              <span className="text-text-4">(admin will review before publishing)</span>
            </label>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancel</Button>
            <Button
              onClick={addItem}
              disabled={saving || !form.name || !form.description || !form.dish_type}
              className="bg-brand hover:bg-brand-hover"
            >
              {saving ? 'Adding…' : 'Add Dish'}
            </Button>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="bg-cream border border-brand-border rounded-xl p-5 mb-6 text-sm text-brand">
          <strong>{pendingCount} dish{pendingCount > 1 ? 'es' : ''}</strong> pending admin review for the global library.
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-cream-2 border-2 border-dashed rounded-2xl p-16 text-center">
          <p className="text-base text-text-4">No dishes yet. Click <strong>Add Dish</strong> to build your menu.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.filter(cat => grouped[cat.value].length > 0).map(cat => (
            <div key={cat.value} className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-cream border-b flex items-center justify-between">
                <h3 className="font-bold text-text-1">{cat.label}</h3>
                <span className="text-xs text-text-4">{grouped[cat.value].length} dishes</span>
              </div>
              <div className="divide-y">
                {grouped[cat.value].map(item => (
                  <div key={item.id} className="px-5 py-4">
                    {editingId === item.id && editForm ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text-1">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={editSaving}
                              className="flex items-center gap-1 text-xs bg-brand hover:bg-brand-hover text-white px-3 py-1.5 rounded-xl disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" /> {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditForm(null) }}
                              className="text-text-4 hover:text-text-3"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Description</label>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
                            className="w-full text-sm border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>

                        {/* Spice */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-text-4">Spice:</label>
                          {SPICE_LEVELS.map(s => (
                            <button
                              key={s}
                              onClick={() => setEditForm(f => f ? { ...f, spice_level: s } : f)}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${editForm.spice_level === s ? 'bg-cream border-brand-border text-brand font-medium' : 'border-brand-border text-text-4 hover:border-brand-border'}`}
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>

                        {/* Dish type */}
                        <div>
                          <p className="text-xs text-text-4 mb-1.5">Dish type</p>
                          <div className="flex gap-2">
                            {DISH_TYPES.map(opt => {
                              const active = editForm.is_vegetarian === opt.veg && editForm.is_vegan === opt.vegan
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setEditForm(f => f ? { ...f, is_vegetarian: opt.veg, is_vegan: opt.vegan, ...(opt.veg ? { is_halal: false } : {}) } : f)}
                                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${active ? opt.active : opt.inactive}`}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Halal */}
                        {!editForm.is_vegetarian && (
                          <div>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.is_halal}
                                onChange={e => setEditForm(f => f ? { ...f, is_halal: e.target.checked } : f)}
                                className="rounded"
                              />
                              <span className="text-xs">Halal certified</span>
                            </label>
                          </div>
                        )}

                        {/* Allergens */}
                        <div>
                          <p className="text-xs text-text-4 mb-1.5">Allergens</p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            {[
                              { key: 'contains_nuts', label: 'Nuts' },
                              { key: 'contains_gluten', label: 'Gluten' },
                              { key: 'contains_dairy', label: 'Dairy' },
                              { key: 'contains_eggs', label: 'Eggs' },
                            ].map(({ key, label }) => (
                              <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(editForm as any)[key]}
                                  onChange={e => setEditForm(f => f ? { ...f, [key]: e.target.checked } : f)}
                                  className="rounded"
                                />
                                <span className="text-xs">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Proteins */}
                        <div>
                          <p className="text-xs text-text-4 mb-1.5">Proteins <span className="text-text-4">(select all that apply)</span></p>
                          <div className="flex flex-wrap gap-2">
                            {PROTEINS.map(p => {
                              const selected = editForm.proteins.includes(p)
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setEditForm(f => f ? {
                                    ...f,
                                    proteins: selected
                                      ? f.proteins.filter(x => x !== p)
                                      : [...f.proteins, p],
                                  } : f)}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selected ? 'bg-cream border-brand-border text-brand font-medium' : 'border-brand-border text-text-4 hover:border-brand-border'}`}
                                >
                                  {p}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-1">{item.name}</span>
                            {item.is_vegetarian && (
                              <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>
                            )}
                            {item.is_halal && !item.is_vegetarian && (
                              <Badge variant="outline" className="text-xs">Halal</Badge>
                            )}
                            {item.contains_nuts && (
                              <Badge variant="outline" className="text-xs text-brand border-brand-border">⚠ Nuts</Badge>
                            )}
                            {item.contains_gluten && (
                              <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-200">Gluten</Badge>
                            )}
                            {item.contains_dairy && (
                              <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">Dairy</Badge>
                            )}
                            {item.pending_review && (
                              <Badge variant="outline" className="text-xs text-brand border-brand-border">Pending review</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-text-4 mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-text-4">{item.spice_level.replace('_', ' ')}</span>
                            {item.proteins?.length > 0 && (
                              <span className="text-xs text-text-4">· {item.proteins.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-text-4 hover:text-brand transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-text-4 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
