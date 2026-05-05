'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Gift, DollarSign, ShoppingBag, Heart, Link, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type RegistryItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  category: string
  target_amount: number | null
  current_amount: number
  external_url: string | null
  is_fulfilled: boolean
  contributions: { id: string; amount: number; contributor_name: string }[]
}

type Registry = {
  id: string
  is_published: boolean
  items: RegistryItem[]
}

const CATEGORIES = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'home', label: 'Home' },
  { value: 'experience', label: 'Experience' },
  { value: 'cash_fund', label: 'Cash Fund' },
]

const emptyItemForm = {
  name: '',
  description: '',
  image_url: '',
  category: 'kitchen',
  target_amount: '',
  external_url: '',
}

export function GiftRegistryManager({ eventId }: { eventId: string }) {
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyItemForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchRegistry() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/registry`)
      if (res.status === 404) { setRegistry(null); return }
      if (!res.ok) throw new Error('Failed to load')
      setRegistry(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRegistry() }, [eventId])

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/registry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Failed to create')
      showAlertMsg('success', 'Registry created')
      fetchRegistry()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    if (!registry) return
    try {
      const res = await fetch(`/api/events/${eventId}/registry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !registry.is_published }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setRegistry(r => r ? { ...r, is_published: !r.is_published } : r)
    } catch {
      showAlertMsg('error', 'Failed to update')
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyItemForm)
    setShowForm(true)
  }

  function openEdit(item: RegistryItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? '',
      image_url: item.image_url ?? '',
      category: item.category,
      target_amount: item.target_amount?.toString() ?? '',
      external_url: item.external_url ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmitItem(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: form.image_url || null,
      category: form.category,
      target_amount: form.target_amount ? Number(form.target_amount) : null,
      external_url: form.external_url || null,
    }
    try {
      const url = editingId
        ? `/api/events/${eventId}/registry/items/${editingId}`
        : `/api/events/${eventId}/registry/items`
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      showAlertMsg('success', editingId ? 'Item updated' : 'Item added')
      setShowForm(false)
      fetchRegistry()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Remove this item?')) return
    try {
      const res = await fetch(`/api/events/${eventId}/registry/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Item removed')
      fetchRegistry()
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  if (!registry) {
    return (
      <div className="border-2 border-dashed rounded-xl p-12 text-center">
        <Gift className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-text-4 mb-4">No gift registry yet.</p>
        <Button onClick={handleCreate} disabled={saving} className="bg-brand hover:bg-brand-hover">
          {saving ? 'Creating...' : 'Create Registry'}
        </Button>
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-sm text-text-2">
          <input type="checkbox" checked={registry.is_published} onChange={togglePublish} className="rounded border-brand-border" />
          Published
        </label>
        <Button onClick={openAdd} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">{editingId ? 'Edit Item' : 'Add Item'}</h3>
          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
                <input required className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Image URL</label>
                <input className={inputCls} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Target Amount (for cash funds)</label>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">External URL</label>
                <input className={inputCls} value={form.external_url} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Description</label>
              <textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </div>
      )}

      {registry.items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <ShoppingBag className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No items in your registry yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {registry.items.map(item => (
            <div key={item.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded-xl mb-3" />
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-text-1">{item.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cream text-text-3 capitalize">{item.category.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1">
                  {item.is_fulfilled && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                      <Heart className="h-3 w-3" /> Fulfilled
                    </span>
                  )}
                </div>
              </div>
              {item.description && <p className="text-sm text-text-4 mb-3">{item.description}</p>}
              {item.target_amount && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-text-4 mb-1">
                    <span><DollarSign className="h-3 w-3 inline" />{item.current_amount}</span>
                    <span>of ${item.target_amount}</span>
                  </div>
                  <div className="w-full bg-cream-2 rounded-full h-2">
                    <div className="bg-brand h-2 rounded-full" style={{ width: `${Math.min(100, (item.current_amount / item.target_amount) * 100)}%` }} />
                  </div>
                </div>
              )}
              {item.contributions && item.contributions.length > 0 && (
                <div className="text-xs text-text-4 mb-3">
                  {item.contributions.length} contribution{item.contributions.length !== 1 ? 's' : ''}
                </div>
              )}
              {item.external_url && (
                <a href={item.external_url} target="_blank" className="text-xs text-brand hover:underline inline-flex items-center gap-1 mb-3">
                  <Link className="h-3 w-3" /> View externally
                </a>
              )}
              <div className="flex gap-1 mt-auto pt-2">
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5 text-text-4" /></Button>
                <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
