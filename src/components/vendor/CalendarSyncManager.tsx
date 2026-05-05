'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, RefreshCw, Link, Trash2, Plus, Loader2 } from 'lucide-react'

type CalendarSync = {
  id: string
  provider: string
  calendar_url: string | null
  last_synced_at: string | null
  is_active: boolean
}

const PROVIDERS = [
  { value: 'google', label: 'Google Calendar' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'ical', label: 'iCal' },
]

const PROVIDER_COLORS: Record<string, string> = {
  google: 'bg-blue-50 text-blue-700 border-blue-200',
  outlook: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ical: 'bg-cream text-text-2 border-brand-border',
}

export function CalendarSyncManager() {
  const [syncs, setSyncs] = useState<CalendarSync[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formProvider, setFormProvider] = useState('google')
  const [formUrl, setFormUrl] = useState('')

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchSyncs() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/calendar-sync')
      if (!res.ok) throw new Error('Failed to load')
      setSyncs(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load calendar syncs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSyncs() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/calendar-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formProvider,
          calendar_url: formProvider === 'ical' ? formUrl : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to add')
      showAlertMsg('success', 'Calendar connected')
      setShowForm(false)
      setFormProvider('google')
      setFormUrl('')
      fetchSyncs()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this calendar sync?')) return
    try {
      const res = await fetch(`/api/vendor/calendar-sync/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      showAlertMsg('success', 'Calendar disconnected')
      setSyncs(s => s.filter(x => x.id !== id))
    } catch {
      showAlertMsg('error', 'Failed to remove')
    }
  }

  async function toggleActive(sync: CalendarSync) {
    try {
      const res = await fetch(`/api/vendor/calendar-sync/${sync.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !sync.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSyncs(prev => prev.map(s => s.id === sync.id ? { ...s, is_active: !s.is_active } : s))
    } catch {
      showAlertMsg('error', 'Failed to toggle')
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
        <Button onClick={() => setShowForm(!showForm)} className="bg-brand hover:bg-brand-hover rounded-xl font-bold">
          <Plus className="h-4 w-4 mr-1" /> Add Calendar
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">Connect Calendar</h3>
          <form onSubmit={handleAdd} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Provider</label>
              <select className={inputCls} value={formProvider} onChange={e => setFormProvider(e.target.value)}>
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {formProvider === 'ical' && (
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Calendar URL</label>
                <input required className={inputCls} value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Connecting...' : 'Connect'}</Button>
            </div>
          </form>
        </div>
      )}

      {syncs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Calendar className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No calendars connected yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {syncs.map(sync => (
            <div key={sync.id} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`rounded-xl p-2 ${PROVIDER_COLORS[sync.provider] ?? 'bg-cream text-text-2'}`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-1">{PROVIDERS.find(p => p.value === sync.provider)?.label ?? sync.provider}</h3>
                  <div className="flex items-center gap-3 text-xs text-text-4 mt-0.5">
                    {sync.last_synced_at && (
                      <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Last synced: {new Date(sync.last_synced_at).toLocaleString()}</span>
                    )}
                    {sync.calendar_url && (
                      <span className="flex items-center gap-1"><Link className="h-3 w-3" /> iCal URL</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(sync)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${sync.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-cream text-text-4 border-brand-border'}`}
                >
                  {sync.is_active ? 'Active' : 'Inactive'}
                </button>
                <Button variant="ghost" size="icon-xs" onClick={() => handleRemove(sync.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
