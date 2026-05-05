'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, ChevronRight, GripVertical } from 'lucide-react'
import Link from 'next/link'

type SubEvent = {
  id: string
  name: string
  event_date: string
  venue: string | null
  guest_count: number | null
  budget: number | null
  currency: string
  notes: string | null
  sort_order: number
}

const SUBEVENT_SUGGESTIONS = [
  'Mehendi Night', 'Haldi Ceremony', 'Sangeet', 'Puja / Pooja',
  'Wedding Ceremony', 'Reception', 'Farewell Brunch',
]

export default function SubEventsPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', event_date: '', venue: '', guest_count: '', budget: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [eventId])

  async function load() {
    const res = await fetch(`/api/events/${eventId}/sub-events`)
    if (res.ok) setSubEvents(await res.json())
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', event_date: '', venue: '', guest_count: '', budget: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(se: SubEvent) {
    setForm({
      name: se.name,
      event_date: se.event_date.slice(0, 16),
      venue: se.venue ?? '',
      guest_count: se.guest_count?.toString() ?? '',
      budget: se.budget?.toString() ?? '',
      notes: se.notes ?? '',
    })
    setEditingId(se.id)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const body = {
      name: form.name,
      event_date: new Date(form.event_date).toISOString(),
      venue: form.venue || undefined,
      guest_count: form.guest_count ? parseInt(form.guest_count) : undefined,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      notes: form.notes || undefined,
    }
    const url = editingId
      ? `/api/events/${eventId}/sub-events/${editingId}`
      : `/api/events/${eventId}/sub-events`
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await load(); resetForm() }
    setSaving(false)
  }

  async function remove(subId: string) {
    if (!confirm('Delete this sub-event? All vendor matches and guest invites for it will be removed.')) return
    await fetch(`/api/events/${eventId}/sub-events/${subId}`, { method: 'DELETE' })
    setSubEvents(prev => prev.filter(s => s.id !== subId))
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-1.5 text-sm text-text-4 mb-4">
        <Link href="/dashboard" className="hover:text-brand">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-brand">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2">Sub-Events</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-1">Sub-Events</h1>
          <p className="text-sm text-text-3 mt-0.5">Break your event into multiple occasions, each with its own vendors and guests.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4 mr-1.5" /> Add sub-event
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-cream-2 rounded-xl border p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-text-1">{editingId ? 'Edit' : 'New'} sub-event</h2>

          {/* Quick suggestions */}
          {!editingId && (
            <div className="flex flex-wrap gap-1.5">
              {SUBEVENT_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, name: s }))}
                  className="text-xs px-3 py-1 rounded-full border border-dashed border-brand text-brand hover:bg-cream transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-text-3 block mb-1">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mehendi Night" />
            </div>
            <div>
              <label className="text-xs text-text-3 block mb-1">Date & time *</label>
              <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-text-3 block mb-1">Venue</label>
              <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue name" />
            </div>
            <div>
              <label className="text-xs text-text-3 block mb-1">Expected guests</label>
              <Input type="number" value={form.guest_count} onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <label className="text-xs text-text-3 block mb-1">Budget (£)</label>
              <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="—" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-3 block mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any details..."
                className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.event_date} className="bg-brand hover:bg-brand-hover">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add sub-event'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white dark:bg-cream-2 rounded-xl border animate-pulse" />)}</div>
      ) : subEvents.length === 0 ? (
        <div className="bg-white dark:bg-cream-2 rounded-xl border p-12 text-center text-text-4">
          <p className="text-base font-medium text-text-3 mb-1">No sub-events yet</p>
          <p className="text-sm">Add occasions like Mehendi, Reception, Puja — each with its own vendors and guests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subEvents.map(se => (
            <div key={se.id} className="bg-white dark:bg-cream-2 rounded-xl border p-5 flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-text-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-1">{se.name}</h3>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-3 mt-1">
                  <span>📅 {format(new Date(se.event_date), 'EEE d MMM yyyy, h:mm a')}</span>
                  {se.venue && <span>📍 {se.venue}</span>}
                  {se.guest_count && <span>👥 {se.guest_count} guests</span>}
                  {se.budget && <span>💰 £{Number(se.budget).toLocaleString()}</span>}
                </div>
                {se.notes && <p className="text-xs text-text-4 mt-1 truncate">{se.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(se)} className="p-1.5 text-text-4 hover:text-text-2 hover:bg-cream-2 rounded-xl transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(se.id)} className="p-1.5 text-text-4 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
