'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
  Zap,
  Users,
  Package,
  Percent,
  Loader2,
} from 'lucide-react'

type MenuPackage = { id: string; name: string; price_per_head: number | null }

type Rule = {
  id: string
  name: string
  is_active: boolean
  event_types: string[]
  guest_count_min: number | null
  guest_count_max: number | null
  cuisine_match: string[]
  menu_package_id: string | null
  menu_package: MenuPackage | null
  markup_percent: number
  include_delivery: boolean
  auto_message: string | null
}

const EVENT_TYPES = [
  'wedding',
  'corporate',
  'birthday',
  'graduation',
  'holiday',
  'social',
  'fundraiser',
  'other',
]

const emptyForm = {
  name: '',
  event_types: [] as string[],
  guest_count_min: '',
  guest_count_max: '',
  markup_percent: '0',
  menu_package_id: '',
  include_delivery: false,
  auto_message: '',
}

export function AutoQuoteRulesManager() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<MenuPackage[]>([])

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/auto-quote-rules')
      if (!res.ok) throw new Error('Failed to load rules')
      const data = await res.json()
      setRules(data)
    } catch {
      showAlert('error', 'Failed to load auto-quote rules')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPackages() {
    try {
      const res = await fetch('/api/vendor/menu-packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(Array.isArray(data) ? data : data.packages ?? [])
      }
    } catch {
      /* packages are optional */
    }
  }

  useEffect(() => {
    fetchRules()
    fetchPackages()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(rule: Rule) {
    setEditingId(rule.id)
    setForm({
      name: rule.name,
      event_types: rule.event_types,
      guest_count_min: rule.guest_count_min?.toString() ?? '',
      guest_count_max: rule.guest_count_max?.toString() ?? '',
      markup_percent: rule.markup_percent.toString(),
      menu_package_id: rule.menu_package_id ?? '',
      include_delivery: rule.include_delivery,
      auto_message: rule.auto_message ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      event_types: form.event_types,
      guest_count_min: form.guest_count_min ? Number(form.guest_count_min) : null,
      guest_count_max: form.guest_count_max ? Number(form.guest_count_max) : null,
      markup_percent: Number(form.markup_percent),
      menu_package_id: form.menu_package_id || null,
      include_delivery: form.include_delivery,
      auto_message: form.auto_message || null,
    }

    try {
      const url = editingId
        ? `/api/vendor/auto-quote-rules/${editingId}`
        : '/api/vendor/auto-quote-rules'
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
      showAlert('success', editingId ? 'Rule updated' : 'Rule created')
      setDialogOpen(false)
      fetchRules()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this auto-quote rule?')) return
    try {
      const res = await fetch(`/api/vendor/auto-quote-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlert('success', 'Rule deleted')
      setRules(r => r.filter(x => x.id !== id))
    } catch {
      showAlert('error', 'Failed to delete rule')
    }
  }

  async function handleToggle(rule: Rule) {
    try {
      const res = await fetch(`/api/vendor/auto-quote-rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      setRules(prev =>
        prev.map(r => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      )
    } catch {
      showAlert('error', 'Failed to toggle rule')
    }
  }

  function toggleEventType(type: string) {
    setForm(f => ({
      ...f,
      event_types: f.event_types.includes(type)
        ? f.event_types.filter(t => t !== type)
        : [...f.event_types, type],
    }))
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
              <Button className="bg-brand hover:bg-brand-hover" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Rule
              </Button>
            }
          />
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Rule' : 'Add Auto-Quote Rule'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Rule Name</label>
                <input
                  required
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Wedding Auto-Quote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Event Types</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEventType(type)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        form.event_types.includes(type)
                          ? 'bg-cream text-brand border-brand-border'
                          : 'bg-cream text-text-3 border-brand-border hover:bg-cream'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Min Guests</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.guest_count_min}
                    onChange={e => setForm(f => ({ ...f, guest_count_min: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.guest_count_max}
                    onChange={e => setForm(f => ({ ...f, guest_count_max: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Markup %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.markup_percent}
                  onChange={e => setForm(f => ({ ...f, markup_percent: e.target.value }))}
                />
              </div>
              {packages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Linked Package</label>
                  <select
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.menu_package_id}
                    onChange={e => setForm(f => ({ ...f, menu_package_id: e.target.value }))}
                  >
                    <option value="">None</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input
                  type="checkbox"
                  checked={form.include_delivery}
                  onChange={e => setForm(f => ({ ...f, include_delivery: e.target.checked }))}
                  className="rounded border-brand-border"
                />
                Include delivery in quote
              </label>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Auto-Message (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.auto_message}
                  onChange={e => setForm(f => ({ ...f, auto_message: e.target.value }))}
                  placeholder="Message sent with auto-generated quotes"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || form.event_types.length === 0}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Zap className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No auto-quote rules yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex items-start justify-between gap-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-text-1 truncate">{rule.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rule.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-cream text-text-4'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {rule.event_types.map(et => (
                    <span
                      key={et}
                      className="bg-cream text-brand text-xs px-2 py-0.5 rounded-full border border-brand-border"
                    >
                      {et}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-text-4">
                  {(rule.guest_count_min != null || rule.guest_count_max != null) && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {rule.guest_count_min ?? '?'} - {rule.guest_count_max ?? '?'} guests
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {rule.markup_percent}% markup
                  </span>
                  {rule.menu_package && (
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {rule.menu_package.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => handleToggle(rule)}
                />
                <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                  <Pencil className="h-4 w-4 text-text-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
