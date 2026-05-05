'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Clock,
  Hash,
  DollarSign,
  Loader2,
} from 'lucide-react'

type Equipment = {
  id: string
  equipment_key: string
  name: string
  description: string | null
  price_per_unit: number | null
  price_per_event: number | null
  quantity_available: number
  min_rental_hours: number
  is_active: boolean
}

const EQUIPMENT_KEYS = [
  { value: 'chafing_dishes', label: 'Chafing Dishes' },
  { value: 'serving_ware', label: 'Serving Ware' },
  { value: 'tables', label: 'Tables' },
  { value: 'chairs', label: 'Chairs' },
  { value: 'linens', label: 'Linens' },
  { value: 'bar_equipment', label: 'Bar Equipment' },
  { value: 'tents', label: 'Tents' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'beverage_dispensers', label: 'Beverage Dispensers' },
  { value: 'dinnerware', label: 'Dinnerware' },
  { value: 'flatware', label: 'Flatware' },
  { value: 'glassware', label: 'Glassware' },
]

const emptyForm = {
  equipment_key: '',
  name: '',
  description: '',
  price_per_unit: '',
  price_per_event: '',
  quantity_available: '1',
  min_rental_hours: '4',
}

export function VendorEquipmentManager() {
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/equipment')
      if (!res.ok) throw new Error('Failed to load')
      setItems(await res.json())
    } catch {
      showAlert('error', 'Failed to load equipment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: Equipment) {
    setEditingId(item.id)
    setForm({
      equipment_key: item.equipment_key,
      name: item.name,
      description: item.description ?? '',
      price_per_unit: item.price_per_unit?.toString() ?? '',
      price_per_event: item.price_per_event?.toString() ?? '',
      quantity_available: item.quantity_available.toString(),
      min_rental_hours: item.min_rental_hours.toString(),
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      equipment_key: form.equipment_key,
      name: form.name,
      description: form.description || null,
      price_per_unit: form.price_per_unit ? Number(form.price_per_unit) : null,
      price_per_event: form.price_per_event ? Number(form.price_per_event) : null,
      quantity_available: Number(form.quantity_available),
      min_rental_hours: Number(form.min_rental_hours),
    }

    try {
      const url = editingId
        ? `/api/vendor/equipment/${editingId}`
        : '/api/vendor/equipment'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }
      showAlert('success', editingId ? 'Equipment updated' : 'Equipment added')
      setDialogOpen(false)
      fetchItems()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this equipment listing?')) return
    try {
      const res = await fetch(`/api/vendor/equipment/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlert('success', 'Equipment removed')
      setItems(i => i.filter(x => x.id !== id))
    } catch {
      showAlert('error', 'Failed to delete')
    }
  }

  function keyLabel(key: string) {
    return EQUIPMENT_KEYS.find(k => k.value === key)?.label ?? key
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-brand hover:bg-brand-hover rounded-xl font-bold" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Equipment
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Equipment Type
                </label>
                <select
                  required
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none disabled:bg-cream"
                  value={form.equipment_key}
                  onChange={e => {
                    const key = e.target.value
                    const label = EQUIPMENT_KEYS.find(k => k.value === key)?.label ?? ''
                    setForm(f => ({ ...f, equipment_key: key, name: f.name || label }))
                  }}
                >
                  <option value="">Select type...</option>
                  {EQUIPMENT_KEYS.map(k => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
                <input
                  required
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Display name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Price Per Unit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.price_per_unit}
                    onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Price Per Event ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.price_per_event}
                    onChange={e => setForm(f => ({ ...f, price_per_event: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.quantity_available}
                    onChange={e =>
                      setForm(f => ({ ...f, quantity_available: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Min Rental Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.min_rental_hours}
                    onChange={e =>
                      setForm(f => ({ ...f, min_rental_hours: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Package className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No equipment listed yet. Add your first item.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-1">{item.name}</h3>
                  <p className="text-xs text-text-4">{keyLabel(item.equipment_key)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5 text-text-4" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-text-3">
                {item.price_per_unit != null && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-brand" />
                    ${Number(item.price_per_unit).toFixed(2)}/unit
                  </div>
                )}
                {item.price_per_event != null && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-brand" />
                    ${Number(item.price_per_event).toFixed(2)}/event
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  Qty: {item.quantity_available}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Min {item.min_rental_hours}h rental
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
