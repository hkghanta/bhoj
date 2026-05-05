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
  ChefHat,
  Wrench,
  Users,
  DollarSign,
  Loader2,
  Flame,
} from 'lucide-react'

type StationTemplate = {
  id: string
  name: string
  category: string
  description: string | null
}

type VendorStation = {
  id: string
  station_template_id: string
  station_template: StationTemplate
  pricing_model: string
  base_price: number | null
  price_per_person: number | null
  hourly_rate: number | null
  min_guests: number | null
  max_guests: number | null
  includes_chef: boolean
  includes_equipment: boolean
  description: string | null
  is_active: boolean
}

const PRICING_MODELS = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'hourly', label: 'Hourly' },
]

const emptyForm = {
  station_template_id: '',
  custom_name: '',
  custom_description: '',
  pricing_model: 'flat',
  base_price: '',
  price_per_person: '',
  hourly_rate: '',
  min_guests: '',
  max_guests: '',
  includes_chef: true,
  includes_equipment: true,
  description: '',
}

export function VendorStationsManager() {
  const [stations, setStations] = useState<VendorStation[]>([])
  const [templates, setTemplates] = useState<StationTemplate[]>([])
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

  async function fetchData() {
    setLoading(true)
    try {
      const [stRes, tmplRes] = await Promise.all([
        fetch('/api/vendor/stations'),
        fetch('/api/stations/templates'),
      ])
      if (!stRes.ok) throw new Error('Failed to load stations')
      const stData = await stRes.json()
      const tmplData = tmplRes.ok ? await tmplRes.json() : []
      setStations(stData)
      setTemplates(Array.isArray(tmplData) ? tmplData : [])
    } catch {
      showAlert('error', 'Failed to load stations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const usedTemplateIds = new Set(stations.map(s => s.station_template_id))
  const availableTemplates = templates.filter(t => !usedTemplateIds.has(t.id))

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(station: VendorStation) {
    setEditingId(station.id)
    setForm({
      station_template_id: station.station_template_id,
      custom_name: '',
      custom_description: '',
      pricing_model: station.pricing_model,
      base_price: station.base_price?.toString() ?? '',
      price_per_person: station.price_per_person?.toString() ?? '',
      hourly_rate: station.hourly_rate?.toString() ?? '',
      min_guests: station.min_guests?.toString() ?? '',
      max_guests: station.max_guests?.toString() ?? '',
      includes_chef: station.includes_chef,
      includes_equipment: station.includes_equipment,
      description: station.description ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const isCustom = form.station_template_id === '__custom__'
    const payload: Record<string, unknown> = {
      station_template_id: isCustom ? undefined : form.station_template_id,
      custom_template: isCustom ? { name: form.custom_name, description: form.custom_description } : undefined,
      pricing_model: form.pricing_model,
      base_price: form.base_price ? Number(form.base_price) : null,
      price_per_person: form.price_per_person ? Number(form.price_per_person) : null,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      min_guests: form.min_guests ? Number(form.min_guests) : null,
      max_guests: form.max_guests ? Number(form.max_guests) : null,
      includes_chef: form.includes_chef,
      includes_equipment: form.includes_equipment,
      description: form.description || null,
    }

    try {
      const url = editingId
        ? `/api/vendor/stations/${editingId}`
        : '/api/vendor/stations'
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
      showAlert('success', editingId ? 'Station updated' : 'Station added')
      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save station')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this station from your offerings?')) return
    try {
      const res = await fetch(`/api/vendor/stations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlert('success', 'Station removed')
      setStations(s => s.filter(x => x.id !== id))
    } catch {
      showAlert('error', 'Failed to remove station')
    }
  }

  function priceDisplay(station: VendorStation) {
    if (station.pricing_model === 'flat' && station.base_price != null) {
      return `$${Number(station.base_price).toFixed(0)} flat`
    }
    if (station.pricing_model === 'per_person' && station.price_per_person != null) {
      return `$${Number(station.price_per_person).toFixed(0)}/person`
    }
    if (station.pricing_model === 'hourly' && station.hourly_rate != null) {
      return `$${Number(station.hourly_rate).toFixed(0)}/hr`
    }
    return 'No pricing set'
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
              <Button
                className="bg-brand hover:bg-brand-hover rounded-xl font-bold"
                onClick={openCreate}
                disabled={false}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Station
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Station' : 'Add Live Station'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Station Type
                  </label>
                  <select
                    required
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.station_template_id}
                    onChange={e =>
                      setForm(f => ({ ...f, station_template_id: e.target.value }))
                    }
                  >
                    <option value="">Select a station...</option>
                    {availableTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Create Custom Station</option>
                  </select>
                </div>
              )}
              {form.station_template_id === '__custom__' && (
                <div className="space-y-4 border-l-2 border-brand-border pl-3">
                  <div>
                    <label className="block text-sm font-medium text-text-2 mb-1">
                      Custom Station Name
                    </label>
                    <input
                      required
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={form.custom_name}
                      onChange={e => setForm(f => ({ ...f, custom_name: e.target.value }))}
                      placeholder="e.g. Kulfi Station"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-2 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={form.custom_description}
                      onChange={e => setForm(f => ({ ...f, custom_description: e.target.value }))}
                      placeholder="Describe what this station offers..."
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Pricing Model
                </label>
                <div className="flex gap-2">
                  {PRICING_MODELS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, pricing_model: pm.value }))}
                      className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                        form.pricing_model === pm.value
                          ? 'bg-cream text-brand border-brand-border'
                          : 'bg-cream text-text-3 border-brand-border hover:bg-cream'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.pricing_model === 'flat' && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Base Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.base_price}
                    onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                  />
                </div>
              )}
              {form.pricing_model === 'per_person' && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Price Per Person ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.price_per_person}
                    onChange={e => setForm(f => ({ ...f, price_per_person: e.target.value }))}
                  />
                </div>
              )}
              {form.pricing_model === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.hourly_rate}
                    onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Min Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.min_guests}
                    onChange={e => setForm(f => ({ ...f, min_guests: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.max_guests}
                    onChange={e => setForm(f => ({ ...f, max_guests: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={form.includes_chef}
                    onChange={e =>
                      setForm(f => ({ ...f, includes_chef: e.target.checked }))
                    }
                    className="rounded border-brand-border"
                  />
                  Includes Chef
                </label>
                <label className="flex items-center gap-2 text-sm text-text-2">
                  <input
                    type="checkbox"
                    checked={form.includes_equipment}
                    onChange={e =>
                      setForm(f => ({ ...f, includes_equipment: e.target.checked }))
                    }
                    className="rounded border-brand-border"
                  />
                  Includes Equipment
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Station'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stations.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Flame className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No live stations yet. Add one from the available templates.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map(station => (
            <div
              key={station.id}
              className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-1">
                    {station.station_template.name}
                  </h3>
                  <p className="text-xs text-text-4">
                    {station.station_template.category}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(station)}>
                    <Pencil className="h-3.5 w-3.5 text-text-4" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(station.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-brand mb-3">
                <DollarSign className="h-4 w-4" />
                {priceDisplay(station)}
              </div>
              {(station.min_guests != null || station.max_guests != null) && (
                <div className="flex items-center gap-1 text-xs text-text-4 mb-2">
                  <Users className="h-3.5 w-3.5" />
                  {station.min_guests ?? '?'} - {station.max_guests ?? '?'} guests
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-2">
                {station.includes_chef && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                    <ChefHat className="h-3 w-3" /> Chef
                  </span>
                )}
                {station.includes_equipment && (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-200">
                    <Wrench className="h-3 w-3" /> Equipment
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
