'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, DollarSign, Users, Package, Clock, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type InstantPackage = {
  id: string
  name: string
  description: string | null
  price_type: string
  price: number
  min_guests: number | null
  max_guests: number | null
  min_hours: number | null
  includes: string[]
  photos: string[]
  advance_notice_hours: number
  is_active: boolean
}

const PRICE_TYPES = [
  { value: 'FLAT', label: 'Flat Rate' },
  { value: 'PER_PERSON', label: 'Per Person' },
  { value: 'HOURLY', label: 'Hourly' },
]

const emptyForm = {
  name: '',
  description: '',
  price_type: 'FLAT',
  price: '',
  min_guests: '',
  max_guests: '',
  min_hours: '',
  includes: '',
  photos: '',
  advance_notice_hours: '48',
  is_active: true,
}

export function InstantBookManager() {
  const [packages, setPackages] = useState<InstantPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchPackages() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/instant-book')
      if (!res.ok) throw new Error('Failed to load')
      setPackages(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPackages() }, [])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(pkg: InstantPackage) {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description ?? '',
      price_type: pkg.price_type,
      price: pkg.price.toString(),
      min_guests: pkg.min_guests?.toString() ?? '',
      max_guests: pkg.max_guests?.toString() ?? '',
      min_hours: pkg.min_hours?.toString() ?? '',
      includes: pkg.includes.join(', '),
      photos: pkg.photos.join('\n'),
      advance_notice_hours: pkg.advance_notice_hours.toString(),
      is_active: pkg.is_active,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      price_type: form.price_type,
      price: Number(form.price),
      min_guests: form.min_guests ? Number(form.min_guests) : null,
      max_guests: form.max_guests ? Number(form.max_guests) : null,
      min_hours: form.min_hours ? Number(form.min_hours) : null,
      includes: form.includes ? form.includes.split(',').map(s => s.trim()).filter(Boolean) : [],
      photos: form.photos ? form.photos.split('\n').map(s => s.trim()).filter(Boolean) : [],
      advance_notice_hours: Number(form.advance_notice_hours),
      is_active: form.is_active,
    }
    try {
      const url = editingId ? `/api/vendor/instant-book/${editingId}` : '/api/vendor/instant-book'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      showAlertMsg('success', editingId ? 'Package updated' : 'Package created')
      setShowForm(false)
      fetchPackages()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return
    try {
      const res = await fetch(`/api/vendor/instant-book/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Package deleted')
      setPackages(p => p.filter(x => x.id !== id))
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  return (
    <div>
      {alert && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={openAdd} className="bg-brand hover:bg-brand-hover rounded-xl font-bold">
          <Plus className="h-4 w-4 mr-1" /> Create Package
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">{editingId ? 'Edit Package' : 'Create Package'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
                <input required className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Price Type</label>
                <select className={inputCls} value={form.price_type} onChange={e => setForm(f => ({ ...f, price_type: e.target.value }))}>
                  {PRICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Price ($)</label>
                <input type="number" min="0" step="0.01" required className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Advance Notice (hours)</label>
                <input type="number" min="0" className={inputCls} value={form.advance_notice_hours} onChange={e => setForm(f => ({ ...f, advance_notice_hours: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Min Guests</label>
                <input type="number" min="1" className={inputCls} value={form.min_guests} onChange={e => setForm(f => ({ ...f, min_guests: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Max Guests</label>
                <input type="number" min="1" className={inputCls} value={form.max_guests} onChange={e => setForm(f => ({ ...f, max_guests: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Min Hours</label>
                <input type="number" min="1" className={inputCls} value={form.min_hours} onChange={e => setForm(f => ({ ...f, min_hours: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Description</label>
              <textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Includes (comma-separated tags)</label>
              <input className={inputCls} value={form.includes} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))} placeholder="Setup, Cleanup, Tableware" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Photo URLs (one per line)</label>
              <textarea rows={2} className={inputCls} value={form.photos} onChange={e => setForm(f => ({ ...f, photos: e.target.value }))} placeholder="https://..." />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-brand-border" />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Package className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No instant book packages yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-1">{pkg.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${pkg.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-cream text-text-4 border-brand-border'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(pkg)}><Pencil className="h-3.5 w-3.5 text-text-4" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-text-3 mb-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-brand" />
                  ${pkg.price.toLocaleString()} ({PRICE_TYPES.find(t => t.value === pkg.price_type)?.label})
                </div>
                {(pkg.min_guests || pkg.max_guests) && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {pkg.min_guests ?? '?'} - {pkg.max_guests ?? '?'} guests
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {pkg.advance_notice_hours}h advance notice
                </div>
              </div>
              {pkg.includes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto pt-2">
                  {pkg.includes.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-cream text-brand border border-brand-border">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
