'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type MenuItem = {
  id: string; name: string; description: string | null; category: string;
  is_vegetarian: boolean; is_vegan: boolean; is_halal: boolean;
  contains_nuts: boolean; contains_gluten: boolean; contains_dairy: boolean;
  spice_level: string;
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

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'MAIN_COURSE', spice_level: 'MEDIUM',
    is_vegetarian: false, is_vegan: false, is_halal: false,
    contains_nuts: false, contains_gluten: false, contains_dairy: false,
    contains_eggs: false, contains_soy: false, contains_shellfish: false,
  })

  useEffect(() => {
    fetch('/api/vendor/menu-items').then(r => r.json()).then(setItems)
  }, [])

  async function addItem() {
    if (!form.name) return
    setSaving(true)
    const res = await fetch('/api/vendor/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
    setForm(f => ({ ...f, name: '', description: '' }))
    setShowForm(false)
    setSaving(false)
  }

  async function deleteItem(id: string) {
    await fetch(`/api/vendor/menu-items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const grouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dish Library</h1>
          <p className="text-gray-500 mt-1">Add your dishes. Customers see these in your menu packages.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" /> Add Dish
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">New Dish</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Paneer Tikka" />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v: string | null) => setForm(f => ({ ...f, category: v ?? 'MAIN_COURSE' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Spice Level</Label>
              <Select value={form.spice_level} onValueChange={(v: string | null) => setForm(f => ({ ...f, spice_level: v ?? 'MEDIUM' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPICE_LEVELS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { key: 'is_vegetarian', label: 'Vegetarian' },
              { key: 'is_vegan', label: 'Vegan' },
              { key: 'is_halal', label: 'Halal' },
              { key: 'contains_nuts', label: 'Contains nuts' },
              { key: 'contains_gluten', label: 'Contains gluten' },
              { key: 'contains_dairy', label: 'Contains dairy' },
              { key: 'contains_eggs', label: 'Contains eggs' },
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={addItem} disabled={saving || !form.name} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Adding…' : 'Add Dish'}
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500">No dishes yet. Add your first dish to build your menu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.filter(cat => grouped[cat.value].length > 0).map(cat => (
            <div key={cat.value} className="bg-white border rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                <h3 className="font-medium text-gray-800">{cat.label}</h3>
                <span className="text-xs text-gray-400">{grouped[cat.value].length} dishes</span>
              </div>
              <div className="divide-y">
                {grouped[cat.value].map(item => (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                        {item.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                        {item.contains_nuts && <Badge variant="outline" className="text-xs text-orange-700 border-orange-200">Nuts</Badge>}
                        {item.contains_gluten && <Badge variant="outline" className="text-xs">Gluten</Badge>}
                        {item.contains_dairy && <Badge variant="outline" className="text-xs">Dairy</Badge>}
                      </div>
                      <span className="text-xs text-gray-400">{item.spice_level.replace('_', ' ')}</span>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
