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
  Users,
  Clock,
  DollarSign,
  ShieldCheck,
  Shirt,
  Loader2,
} from 'lucide-react'

type StaffListing = {
  id: string
  staff_role_key: string
  name: string
  description: string | null
  hourly_rate: number
  min_hours: number
  max_staff_available: number
  includes_uniform: boolean
  background_checked: boolean
  is_active: boolean
}

const ROLE_KEYS = [
  { value: 'server', label: 'Server' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'event_coordinator', label: 'Event Coordinator' },
  { value: 'chef_onsite', label: 'Chef (On-Site)' },
  { value: 'cleanup_crew', label: 'Cleanup Crew' },
]

const emptyForm = {
  staff_role_key: '',
  name: '',
  description: '',
  hourly_rate: '',
  min_hours: '4',
  max_staff_available: '1',
  includes_uniform: false,
  background_checked: false,
}

export function VendorStaffingManager() {
  const [listings, setListings] = useState<StaffListing[]>([])
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

  async function fetchListings() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/staffing')
      if (!res.ok) throw new Error('Failed to load')
      setListings(await res.json())
    } catch {
      showAlert('error', 'Failed to load staffing listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: StaffListing) {
    setEditingId(item.id)
    setForm({
      staff_role_key: item.staff_role_key,
      name: item.name,
      description: item.description ?? '',
      hourly_rate: item.hourly_rate.toString(),
      min_hours: item.min_hours.toString(),
      max_staff_available: item.max_staff_available.toString(),
      includes_uniform: item.includes_uniform,
      background_checked: item.background_checked,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      staff_role_key: form.staff_role_key,
      name: form.name,
      description: form.description || null,
      hourly_rate: Number(form.hourly_rate),
      min_hours: Number(form.min_hours),
      max_staff_available: Number(form.max_staff_available),
      includes_uniform: form.includes_uniform,
      background_checked: form.background_checked,
    }

    try {
      const url = editingId
        ? `/api/vendor/staffing/${editingId}`
        : '/api/vendor/staffing'
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
      showAlert('success', editingId ? 'Listing updated' : 'Listing created')
      setDialogOpen(false)
      fetchListings()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this staffing listing?')) return
    try {
      const res = await fetch(`/api/vendor/staffing/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlert('success', 'Listing removed')
      setListings(l => l.filter(x => x.id !== id))
    } catch {
      showAlert('error', 'Failed to delete')
    }
  }

  function roleLabel(key: string) {
    return ROLE_KEYS.find(k => k.value === key)?.label ?? key
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
                <Plus className="h-4 w-4 mr-1" /> Add Role
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Staffing Role' : 'Add Staffing Role'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Role</label>
                <select
                  required
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none disabled:bg-cream"
                  value={form.staff_role_key}
                  onChange={e => {
                    const key = e.target.value
                    const label = ROLE_KEYS.find(k => k.value === key)?.label ?? ''
                    setForm(f => ({
                      ...f,
                      staff_role_key: key,
                      name: f.name || label,
                    }))
                  }}
                >
                  <option value="">Select role...</option>
                  {ROLE_KEYS.map(k => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Display Name
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.hourly_rate}
                    onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Min Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.min_hours}
                    onChange={e => setForm(f => ({ ...f, min_hours: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Max Available
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.max_staff_available}
                    onChange={e =>
                      setForm(f => ({ ...f, max_staff_available: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={form.includes_uniform}
                    onChange={e =>
                      setForm(f => ({ ...f, includes_uniform: e.target.checked }))
                    }
                    className="rounded border-brand-border"
                  />
                  Includes Uniform
                </label>
                <label className="flex items-center gap-2 text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={form.background_checked}
                    onChange={e =>
                      setForm(f => ({ ...f, background_checked: e.target.checked }))
                    }
                    className="rounded border-brand-border"
                  />
                  Background Checked
                </label>
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

      {listings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Users className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No staffing roles listed yet. Add your first role.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-1">{item.name}</h3>
                  <p className="text-xs text-text-4">{roleLabel(item.staff_role_key)}</p>
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
              <div className="space-y-1.5 text-sm text-text-3 mb-3">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-brand" />
                  ${Number(item.hourly_rate).toFixed(2)}/hr
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Min {item.min_hours}h
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Up to {item.max_staff_available} available
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                {item.includes_uniform && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                    <Shirt className="h-3 w-3" /> Uniform
                  </span>
                )}
                {item.background_checked && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                    <ShieldCheck className="h-3 w-3" /> BG Check
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
