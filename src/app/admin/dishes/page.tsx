'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X, Plus, Pencil, Search } from 'lucide-react'

type PendingItem = {
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
  vendor: { business_name: string }
}

type NutritionInfo = {
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
}

type GlobalDish = {
  id: string
  name: string
  description: string | null
  category: string
  spice_level: string
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  proteins: string[]
  cuisine_type: string | null
  ingredients: string[]
  history: string | null
  nutrition: NutritionInfo | null
  active: boolean
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

const BOOL_FIELDS = [
  { key: 'is_vegetarian', label: 'Vegetarian' },
  { key: 'is_vegan', label: 'Vegan' },
  { key: 'is_jain', label: 'Jain' },
  { key: 'is_halal', label: 'Halal' },
  { key: 'contains_nuts', label: 'Contains nuts' },
  { key: 'contains_gluten', label: 'Contains gluten' },
  { key: 'contains_dairy', label: 'Contains dairy' },
  { key: 'contains_eggs', label: 'Contains eggs' },
]

const EMPTY_NEW_DISH = {
  name: '', description: '', category: 'MAIN_COURSE', spice_level: 'MEDIUM',
  is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: false,
  contains_nuts: false, contains_gluten: false, contains_dairy: false, contains_eggs: false,
  proteins_raw: '', cuisine_type: '',
  ingredients_raw: '', history: '',
  cal: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '',
}

export default function AdminDishesPage() {
  const [tab, setTab] = useState<'pending' | 'global'>('pending')
  const [pending, setPending] = useState<PendingItem[]>([])
  const [globalItems, setGlobalItems] = useState<GlobalDish[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; description: string }>({ name: '', description: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDish, setNewDish] = useState(EMPTY_NEW_DISH)
  const [saving, setSaving] = useState(false)
  const [editingGlobal, setEditingGlobal] = useState<GlobalDish | null>(null)
  const router = useRouter()

  useEffect(() => { loadPending() }, [])
  useEffect(() => { if (tab === 'global') loadGlobal() }, [tab])

  async function loadPending() {
    const res = await fetch('/api/admin/dishes?tab=pending')
    if (res.status === 401) { router.push('/admin/login'); return }
    if (res.ok) setPending(await res.json())
  }

  async function loadGlobal(q?: string) {
    const url = q ? `/api/admin/dishes?tab=global&q=${encodeURIComponent(q)}` : '/api/admin/dishes?tab=global'
    const res = await fetch(url)
    if (res.ok) setGlobalItems(await res.json())
  }

  // Debounced search
  useEffect(() => {
    if (tab !== 'global') return
    const t = setTimeout(() => loadGlobal(searchQ || undefined), 300)
    return () => clearTimeout(t)
  }, [searchQ, tab])

  async function approve(id: string) {
    setSaving(true)
    const updates = editingId === id ? { name: editValues.name, description: editValues.description } : {}
    await fetch(`/api/admin/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', ...updates }),
    })
    setPending(prev => prev.filter(i => i.id !== id))
    setEditingId(null)
    setSaving(false)
  }

  async function reject(id: string) {
    setSaving(true)
    await fetch(`/api/admin/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    setPending(prev => prev.filter(i => i.id !== id))
    setSaving(false)
  }

  async function saveGlobalEdit() {
    if (!editingGlobal) return
    setSaving(true)
    const { id, ...updates } = editingGlobal
    await fetch(`/api/admin/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setGlobalItems(prev => prev.map(i => i.id === id ? editingGlobal : i))
    setEditingGlobal(null)
    setSaving(false)
  }

  async function deleteGlobal(id: string) {
    if (!confirm('Remove this dish from the global library?')) return
    await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE' })
    setGlobalItems(prev => prev.filter(i => i.id !== id))
  }

  async function addGlobalDish() {
    if (!newDish.name || !newDish.description) return
    setSaving(true)
    const { proteins_raw, ingredients_raw, history, cal, protein_g, carbs_g, fat_g, fiber_g, ...dishData } = newDish
    const proteins = proteins_raw.split(',').map(s => s.trim()).filter(Boolean)
    const ingredients = ingredients_raw.split(',').map(s => s.trim()).filter(Boolean)
    const nutrition: NutritionInfo = {}
    if (cal) nutrition.calories = parseFloat(cal)
    if (protein_g) nutrition.protein_g = parseFloat(protein_g)
    if (carbs_g) nutrition.carbs_g = parseFloat(carbs_g)
    if (fat_g) nutrition.fat_g = parseFloat(fat_g)
    if (fiber_g) nutrition.fiber_g = parseFloat(fiber_g)
    const res = await fetch('/api/admin/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dishData, proteins, cuisine_type: dishData.cuisine_type || null,
        ingredients, history: history || null,
        nutrition: Object.keys(nutrition).length ? nutrition : undefined,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setGlobalItems(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setShowAddForm(false)
      setNewDish(EMPTY_NEW_DISH)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-1">Dish Library</h1>
          <p className="text-sm text-text-4 mt-1">Manage the global dish catalogue used for vendor autocomplete.</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex rounded-lg border overflow-hidden w-fit">
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === 'pending' ? 'bg-brand text-white' : 'text-text-3 hover:bg-cream'}`}
              onClick={() => setTab('pending')}
            >
              Pending Review
              {pending.length > 0 && (
                <span className="ml-1.5 bg-cream text-brand rounded-full px-1.5 py-0.5 text-xs">{pending.length}</span>
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === 'global' ? 'bg-brand text-white' : 'text-text-3 hover:bg-cream'}`}
              onClick={() => setTab('global')}
            >
              Global Library {tab === 'global' && globalItems.length > 0 && <span className="text-xs text-text-4 ml-1">({globalItems.length})</span>}
            </button>
          </div>

          {tab === 'global' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-4 pointer-events-none" />
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search dishes…"
                  className="pl-9 pr-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:border-brand w-52"
                />
              </div>
              <Button onClick={() => setShowAddForm(v => !v)} className="bg-brand hover:bg-brand-hover">
                <Plus className="h-4 w-4 mr-2" /> Add Dish
              </Button>
            </div>
          )}
        </div>

        {/* ── PENDING TAB ── */}
        {tab === 'pending' && (
          <>
            {pending.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center text-text-4">
                No dishes pending review.
              </div>
            ) : (
              <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-text-3">Dish</th>
                      <th className="text-left px-4 py-3 font-medium text-text-3">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-text-3">Suggested by</th>
                      <th className="text-left px-4 py-3 font-medium text-text-3">Description</th>
                      <th className="w-32" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pending.map(item => (
                      <tr key={item.id} className={editingId === item.id ? 'bg-cream' : 'hover:bg-cream'}>
                        <td className="px-4 py-3">
                          {editingId === item.id ? (
                            <Input
                              value={editValues.name}
                              onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-text-1">{item.name}</div>
                              <div className="flex gap-1 mt-0.5">
                                {item.is_vegetarian && (
                                  <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>
                                )}
                                {item.is_halal && !item.is_vegetarian && <Badge variant="outline" className="text-xs">Halal</Badge>}
                                {item.contains_nuts && (
                                  <Badge variant="outline" className="text-xs text-brand border-brand-border">Nuts</Badge>
                                )}
                                {item.contains_gluten && (
                                  <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-200">Gluten</Badge>
                                )}
                                {item.contains_dairy && (
                                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">Dairy</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-3">
                          {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                        </td>
                        <td className="px-4 py-3 text-text-3">{item.vendor.business_name}</td>
                        <td className="px-4 py-3 text-text-4 max-w-xs">
                          {editingId === item.id ? (
                            <Input
                              value={editValues.description}
                              onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
                              className="h-8 text-sm"
                              placeholder="1–2 sentence description"
                            />
                          ) : (
                            item.description ?? <span className="text-text-4">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {editingId !== item.id ? (
                              <button
                                onClick={() => { setEditingId(item.id); setEditValues({ name: item.name, description: item.description ?? '' }) }}
                                className="px-2 py-1 text-xs border rounded hover:bg-cream"
                              >
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 text-xs border rounded hover:bg-cream text-text-4"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => approve(item.id)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve & publish"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => reject(item.id)}
                              disabled={saving}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── GLOBAL LIBRARY TAB ── */}
        {tab === 'global' && (
          <div className="space-y-4">
            {/* Add form */}
            {showAddForm && (
              <div className="bg-white border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-text-1">Add to Global Library</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">Name *</label>
                    <Input
                      value={newDish.name}
                      onChange={e => setNewDish(f => ({ ...f, name: e.target.value }))}
                      placeholder="Paneer Tikka"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">Category</label>
                    <Select
                      value={newDish.category}
                      onValueChange={(v: string | null) => setNewDish(f => ({ ...f, category: v ?? 'MAIN_COURSE' }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-2">Description * <span className="text-text-4 font-normal">(1–2 sentences)</span></label>
                  <Input
                    value={newDish.description}
                    onChange={e => setNewDish(f => ({ ...f, description: e.target.value }))}
                    placeholder="Classic grilled cottage cheese with aromatic spiced marinade."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">Spice level</label>
                    <Select
                      value={newDish.spice_level}
                      onValueChange={(v: string | null) => setNewDish(f => ({ ...f, spice_level: v ?? 'MEDIUM' }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPICE_LEVELS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-2">Cuisine type</label>
                    <Input
                      value={newDish.cuisine_type}
                      onChange={e => setNewDish(f => ({ ...f, cuisine_type: e.target.value }))}
                      placeholder="North Indian, South Indian…"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {BOOL_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(newDish as any)[key]}
                        onChange={e => setNewDish(f => ({ ...f, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-2">Proteins <span className="text-text-4 font-normal">(comma-separated)</span></label>
                  <Input
                    value={newDish.proteins_raw}
                    onChange={e => setNewDish(f => ({ ...f, proteins_raw: e.target.value }))}
                    placeholder="Chicken, Paneer, Lentils"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-2">Ingredients <span className="text-text-4 font-normal">(comma-separated)</span></label>
                  <Input
                    value={newDish.ingredients_raw}
                    onChange={e => setNewDish(f => ({ ...f, ingredients_raw: e.target.value }))}
                    placeholder="Basmati rice, Chicken, Saffron, Ghee…"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-2">History / Origin</label>
                  <textarea
                    value={newDish.history}
                    onChange={e => setNewDish(f => ({ ...f, history: e.target.value }))}
                    placeholder="A brief history or origin story of the dish…"
                    rows={3}
                    className="w-full text-sm border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:border-brand resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-2 block mb-2">Nutrition <span className="text-text-4 font-normal">(per 100g)</span></label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { key: 'cal', label: 'Calories' },
                      { key: 'protein_g', label: 'Protein (g)' },
                      { key: 'carbs_g', label: 'Carbs (g)' },
                      { key: 'fat_g', label: 'Fat (g)' },
                      { key: 'fiber_g', label: 'Fiber (g)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs text-text-4">{label}</label>
                        <Input
                          type="number"
                          value={(newDish as any)[key]}
                          onChange={e => setNewDish(f => ({ ...f, [key]: e.target.value }))}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setShowAddForm(false); setNewDish(EMPTY_NEW_DISH) }}>Cancel</Button>
                  <Button
                    onClick={addGlobalDish}
                    disabled={saving || !newDish.name || !newDish.description}
                    className="bg-brand hover:bg-brand-hover"
                  >
                    {saving ? 'Adding…' : 'Add to Library'}
                  </Button>
                </div>
              </div>
            )}

            {/* Edit modal */}
            {editingGlobal && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-semibold text-text-1">Edit Dish</h2>
                    <button onClick={() => setEditingGlobal(null)} className="text-text-4 hover:text-text-3">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">Name</label>
                      <Input
                        value={editingGlobal.name}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">Description</label>
                      <Input
                        value={editingGlobal.description ?? ''}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-text-2">Category</label>
                        <Select
                          value={editingGlobal.category}
                          onValueChange={(v: string | null) => setEditingGlobal(d => d && ({ ...d, category: v ?? d.category }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-text-2">Spice level</label>
                        <Select
                          value={editingGlobal.spice_level}
                          onValueChange={(v: string | null) => setEditingGlobal(d => d && ({ ...d, spice_level: v ?? d.spice_level }))}
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
                    <div className="flex flex-wrap gap-4 text-sm">
                      {BOOL_FIELDS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editingGlobal as any)[key]}
                            onChange={e => setEditingGlobal(d => d && ({ ...d, [key]: e.target.checked }))}
                            className="rounded"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">Cuisine type</label>
                      <Input
                        value={editingGlobal.cuisine_type ?? ''}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, cuisine_type: e.target.value || null }))}
                        placeholder="North Indian, South Indian…"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">Proteins <span className="text-text-4 font-normal">(comma-separated)</span></label>
                      <Input
                        value={editingGlobal.proteins.join(', ')}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, proteins: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        placeholder="Chicken, Paneer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">Ingredients <span className="text-text-4 font-normal">(comma-separated)</span></label>
                      <Input
                        value={editingGlobal.ingredients.join(', ')}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, ingredients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        placeholder="Basmati rice, Chicken, Saffron…"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-2">History / Origin</label>
                      <textarea
                        value={editingGlobal.history ?? ''}
                        onChange={e => setEditingGlobal(d => d && ({ ...d, history: e.target.value || null }))}
                        rows={3}
                        className="w-full text-sm border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:border-brand resize-none"
                        placeholder="A brief history or origin story…"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-2 block mb-2">Nutrition <span className="text-text-4 font-normal">(per 100g)</span></label>
                      <div className="grid grid-cols-5 gap-2">
                        {([
                          { key: 'calories', label: 'Cal' },
                          { key: 'protein_g', label: 'Protein' },
                          { key: 'carbs_g', label: 'Carbs' },
                          { key: 'fat_g', label: 'Fat' },
                          { key: 'fiber_g', label: 'Fiber' },
                        ] as const).map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs text-text-4">{label}</label>
                            <Input
                              type="number"
                              value={editingGlobal.nutrition?.[key] ?? ''}
                              onChange={e => setEditingGlobal(d => {
                                if (!d) return d
                                const val = e.target.value ? parseFloat(e.target.value) : undefined
                                const n = { ...(d.nutrition ?? {}), [key]: val }
                                if (val === undefined) delete n[key]
                                return { ...d, nutrition: Object.keys(n).length ? n : null }
                              })}
                              placeholder="0"
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => setEditingGlobal(null)}>Cancel</Button>
                    <Button
                      onClick={saveGlobalEdit}
                      disabled={saving}
                      className="bg-brand hover:bg-brand-hover"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-text-3">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-text-3">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-text-3">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-text-3">Spice</th>
                    <th className="text-left px-4 py-3 font-medium text-text-3">Active</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {globalItems.map(item => (
                    <tr key={item.id} className="hover:bg-cream">
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-1">{item.name}</div>
                        {item.description && <p className="text-xs text-text-4 mt-0.5 line-clamp-1">{item.description}</p>}
                        <div className="flex gap-2 mt-0.5">
                          {item.ingredients.length > 0 && (
                            <span className="text-xs text-indigo-500">{item.ingredients.length} ingredients</span>
                          )}
                          {item.nutrition && (
                            <span className="text-xs text-emerald-500">{(item.nutrition as NutritionInfo).calories} kcal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-3">
                        {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {item.is_vegetarian ? (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                              {item.is_vegan ? 'Vegan' : item.is_jain ? 'Jain' : 'Veg'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-700 border-red-200">Non-Veg</Badge>
                          )}
                          {item.is_halal && !item.is_vegetarian && (
                            <Badge variant="outline" className="text-xs">Halal</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-4 text-xs">{item.spice_level.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.active ? 'bg-green-50 text-green-700' : 'bg-cream text-text-4'}`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingGlobal(item)}
                            className="p-1 text-text-4 hover:text-brand rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteGlobal(item.id)}
                            className="p-1 text-text-4 hover:text-red-500 rounded transition-colors"
                            title="Deactivate"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {globalItems.length === 0 && (
                <div className="px-4 py-8 text-center text-text-4 text-sm">
                  No dishes in global library yet. Click "Add Dish" to seed the library.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
