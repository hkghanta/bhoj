'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, User, Calendar, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type TimelineEntry = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  category: string
  vendor_name: string | null
  location: string | null
  is_public: boolean
  sub_event_id: string | null
}

type EventDate = {
  id: string    // 'main' or sub-event id
  label: string // event/sub-event name
  date: string  // ISO date string
}

type Props = {
  eventId: string
  eventDates: EventDate[]
}

const CATEGORIES = [
  { value: 'ceremony', label: 'Ceremony', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'vendor_setup', label: 'Vendor Setup', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'food_service', label: 'Food Service', color: 'bg-cream text-brand border-brand-border' },
  { value: 'entertainment', label: 'Entertainment', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'logistics', label: 'Logistics', color: 'bg-cream text-text-2 border-brand-border' },
  { value: 'preparation', label: 'Preparation', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'reception', label: 'Reception', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function toDateStr(iso: string) {
  return iso.slice(0, 10) // YYYY-MM-DD
}

// Convert a date (YYYY-MM-DD) + time (HH:MM) to ISO string
function combineDateAndTime(dateStr: string, time: string) {
  if (!dateStr) dateStr = new Date().toISOString().slice(0, 10)
  if (!time) time = '09:00'
  const d = new Date(`${dateStr}T${time}:00`)
  if (isNaN(d.getTime())) return new Date().toISOString()
  return d.toISOString()
}

export function EventTimeline({ eventId, eventDates }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null) // null = all days

  const mainDate = eventDates[0]?.date ? toDateStr(eventDates[0].date) : new Date().toISOString().slice(0, 10)

  const emptyForm = {
    title: '',
    description: '',
    day: mainDate, // YYYY-MM-DD
    start_time: '09:00',
    end_time: '',
    category: 'ceremony',
    vendor_name: '',
    location: '',
    is_public: true,
    sub_event_id: '',
  }

  const [form, setForm] = useState(emptyForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchEntries(signal?: AbortSignal) {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/timeline`, { signal })
      if (!res.ok) throw new Error('Failed to load')
      setEntries(await res.json())
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      showAlertMsg('error', 'Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchEntries(controller.signal)
    return () => controller.abort()
  }, [eventId])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(entry: TimelineEntry) {
    setEditingId(entry.id)
    const startDate = entry.start_time ? toDateStr(entry.start_time) : mainDate
    const startTime = entry.start_time ? new Date(entry.start_time).toTimeString().slice(0, 5) : '09:00'
    const endTime = entry.end_time ? new Date(entry.end_time).toTimeString().slice(0, 5) : ''
    setForm({
      title: entry.title,
      description: entry.description ?? '',
      day: startDate,
      start_time: startTime,
      end_time: endTime,
      category: entry.category,
      vendor_name: entry.vendor_name ?? '',
      location: entry.location ?? '',
      is_public: entry.is_public,
      sub_event_id: entry.sub_event_id ?? '',
    })
    setShowForm(true)
  }

  // When user picks a sub-event, auto-set the day to that sub-event's date
  function handleSubEventChange(subEventId: string) {
    const match = eventDates.find(d => d.id === subEventId)
    setForm(f => ({
      ...f,
      sub_event_id: subEventId,
      ...(match ? { day: toDateStr(match.date) } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      start_time: combineDateAndTime(form.day, form.start_time),
      end_time: form.end_time ? combineDateAndTime(form.day, form.end_time) : null,
      category: form.category,
      vendor_name: form.vendor_name || null,
      location: form.location || null,
      is_public: form.is_public,
      sub_event_id: form.sub_event_id || null,
    }
    try {
      const url = editingId
        ? `/api/events/${eventId}/timeline/${editingId}`
        : `/api/events/${eventId}/timeline`
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to save (${res.status})`)
      }
      showAlertMsg('success', editingId ? 'Entry updated' : 'Entry added')
      setShowForm(false)
      fetchEntries()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this entry?')) return
    try {
      const res = await fetch(`/api/events/${eventId}/timeline/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Entry removed')
      setEntries(e => e.filter(x => x.id !== id))
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  function categoryStyle(cat: string) {
    return CATEGORIES.find(c => c.value === cat)?.color ?? 'bg-cream text-text-2 border-brand-border'
  }
  function categoryLabel(cat: string) {
    return CATEGORIES.find(c => c.value === cat)?.label ?? cat
  }
  function categoryDot(cat: string) {
    const map: Record<string, string> = {
      ceremony: 'bg-purple-500', vendor_setup: 'bg-blue-500', food_service: 'bg-brand',
      entertainment: 'bg-pink-500', logistics: 'bg-cream0', preparation: 'bg-teal-500',
      reception: 'bg-amber-500', other: 'bg-slate-500',
    }
    return map[cat] ?? 'bg-cream0'
  }

  // Group entries by date
  const entriesByDate: Record<string, TimelineEntry[]> = {}
  for (const entry of entries) {
    const day = toDateStr(entry.start_time)
    if (!entriesByDate[day]) entriesByDate[day] = []
    entriesByDate[day].push(entry)
  }
  const sortedDays = Object.keys(entriesByDate).sort()

  // Unique days from event dates for the tab filter
  const allDays = [...new Set(eventDates.map(d => toDateStr(d.date)))].sort()
  // Also include any days entries exist on that aren't event days
  for (const d of sortedDays) {
    if (!allDays.includes(d)) allDays.push(d)
  }
  allDays.sort()

  const filteredDays = selectedDay ? sortedDays.filter(d => d === selectedDay) : sortedDays

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  return (
    <div>
      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      {/* Day tabs — only show if multi-day */}
      {allDays.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedDay === null ? 'bg-brand text-white' : 'bg-cream text-text-3 hover:bg-cream-2'
            }`}
          >
            All Days
          </button>
          {allDays.map(day => {
            const eventDate = eventDates.find(d => toDateStr(d.date) === day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedDay === day ? 'bg-brand text-white' : 'bg-cream text-text-3 hover:bg-cream-2'
                }`}
              >
                {eventDate ? eventDate.label : formatDate(day)}
                <span className="ml-1 opacity-70">({formatDate(day)})</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={openAdd} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">{editingId ? 'Edit Entry' : 'Add Timeline Entry'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Activity *</label>
                <input required className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Baraat Arrival, Mehendi, DJ Setup" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Location / Room / Area *</label>
                <input required className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Main Hall, Garden, Pool Deck, Temple" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Vendor / Person</label>
                <input className={inputCls} value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Sharma Caterers, Uncle Raj" />
              </div>
            </div>

            {/* Day + Sub-event */}
            <div className="grid gap-4 sm:grid-cols-2">
              {eventDates.length > 1 ? (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Event Day</label>
                  <select className={inputCls} value={form.sub_event_id || 'main'} onChange={e => handleSubEventChange(e.target.value === 'main' ? '' : e.target.value)}>
                    {eventDates.map(d => (
                      <option key={d.id} value={d.id}>{d.label} — {formatDate(d.date)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Date</label>
                  <input type="date" required className={inputCls} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Start Time *</label>
                  <input type="time" required className={inputCls} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">End Time</label>
                  <input type="time" className={inputCls} value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Description</label>
              <textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details..." />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-2">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded border-brand-border" />
              Visible on event website
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Calendar className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-base text-text-4 font-medium">No timeline entries yet</p>
          <p className="text-text-4 text-base mt-1">Plan your event schedule -- add ceremonies, vendor setup times, food service, and more.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredDays.map(day => {
            const dayEntries = entriesByDate[day] ?? []
            const eventDate = eventDates.find(d => toDateStr(d.date) === day)
            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-cream rounded-xl px-3 py-1.5">
                    <Calendar className="h-4 w-4 text-brand" />
                    <span className="text-sm font-bold text-text-1">{formatDate(day)}</span>
                    {eventDate && <span className="text-xs text-text-4">— {eventDate.label}</span>}
                  </div>
                  <span className="text-xs text-text-4">{dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}</span>
                </div>

                {/* Timeline for this day */}
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-cream-2" />
                  <div className="space-y-5">
                    {dayEntries.map(entry => (
                      <div key={entry.id} className="relative">
                        <div className={`absolute -left-5 top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${categoryDot(entry.category)}`} />
                        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-text-1">{entry.title}</h3>
                                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${categoryStyle(entry.category)}`}>
                                  {categoryLabel(entry.category)}
                                </span>
                                {!entry.is_public && <span className="text-xs text-text-4 italic">Private</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-sm text-text-4 flex-wrap">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTime(entry.start_time)}
                                  {entry.end_time && <> — {formatTime(entry.end_time)}</>}
                                </span>
                                {entry.location && (
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                    <MapPin className="h-3 w-3" /> {entry.location}
                                  </span>
                                )}
                                {entry.vendor_name && (
                                  <span className="flex items-center gap-1 text-xs text-text-4">
                                    <User className="h-3 w-3" /> {entry.vendor_name}
                                  </span>
                                )}
                              </div>
                              {entry.description && <p className="text-sm text-text-4 mt-1.5">{entry.description}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => openEdit(entry)} className="p-1 rounded hover:bg-cream"><Pencil className="h-3.5 w-3.5 text-text-4" /></button>
                              <button onClick={() => handleDelete(entry.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
