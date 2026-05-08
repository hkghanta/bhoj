'use client'

import { useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, X, Check, MapPin,
  CalendarDays, Clock, ChevronRight, Layers,
} from 'lucide-react'
import Link from 'next/link'

const SUB_EVENT_TYPES = [
  'Mehendi',
  'Haldi',
  'Sangeet',
  'Baraat',
  'Wedding Ceremony',
  'Reception',
  'After-Party',
  'Engagement',
  'Housewarming',
  'Other',
] as const

interface SubEvent {
  id: string
  event_id: string
  name: string
  event_type: string
  event_date: string | null
  start_time: string | null
  end_time: string | null
  venue: string | null
  city: string | null
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface Props {
  eventId: string
  eventName: string
  eventCity: string
  eventVenue: string | null
  initialSubEvents: SubEvent[]
}

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Mehendi':           { bg: 'bg-green-50 dark:bg-green-950/40',   text: 'text-green-700 dark:text-green-300',   dot: 'bg-green-500' },
  'Haldi':             { bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Sangeet':           { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  'Baraat':            { bg: 'bg-red-50 dark:bg-red-950/40',       text: 'text-red-700 dark:text-red-300',       dot: 'bg-red-500' },
  'Wedding Ceremony':  { bg: 'bg-pink-50 dark:bg-pink-950/40',     text: 'text-pink-700 dark:text-pink-300',     dot: 'bg-pink-500' },
  'Reception':         { bg: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500' },
  'After-Party':       { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  'Engagement':        { bg: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500' },
  'Housewarming':      { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
}
const DEFAULT_COLOR = { bg: 'bg-cream', text: 'text-text-3', dot: 'bg-text-4' }

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? DEFAULT_COLOR
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SubEventsManager({ eventId, eventName, eventCity, eventVenue, initialSubEvents }: Props) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>(initialSubEvents)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<string>(SUB_EVENT_TYPES[0])
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formVenue, setFormVenue] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const resetForm = useCallback(() => {
    setFormName('')
    setFormType(SUB_EVENT_TYPES[0])
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormVenue('')
    setFormCity('')
    setFormDescription('')
  }, [])

  const openAddForm = () => {
    resetForm()
    setFormCity(eventCity || '')
    setFormVenue(eventVenue || '')
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  const openEditForm = (se: SubEvent) => {
    setFormName(se.name)
    setFormType(se.event_type)
    setFormDate(se.event_date ? se.event_date.slice(0, 10) : '')
    setFormStartTime(se.start_time || '')
    setFormEndTime(se.end_time || '')
    setFormVenue(se.venue || '')
    setFormCity(se.city || '')
    setFormDescription(se.description || '')
    setEditingId(se.id)
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    const payload: Record<string, any> = {
      name: formName.trim(),
      event_type: formType,
      event_date: formDate ? new Date(formDate).toISOString() : null,
      start_time: formStartTime || null,
      end_time: formEndTime || null,
      venue: formVenue.trim() || null,
      city: formCity.trim() || null,
      description: formDescription.trim() || null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/events/${eventId}/sub-events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated: SubEvent = await res.json()
        setSubEvents(prev => prev.map(s => (s.id === editingId ? updated : s)))
      } else {
        payload.sort_order = subEvents.length
        const res = await fetch(`/api/events/${eventId}/sub-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
        const created: SubEvent = await res.json()
        setSubEvents(prev => [...prev, created])
      }

      setShowForm(false)
      resetForm()
      setEditingId(null)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sub-event?')) return

    try {
      const res = await fetch(`/api/events/${eventId}/sub-events/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSubEvents(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to delete sub-event.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors">{eventName}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-text-2 font-medium" aria-current="page">Sub-Events</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-1">Sub-Events</h1>
          <p className="text-sm text-text-4 mt-1">
            Manage all the events within your celebration
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Sub-Event
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-text-1">
              {editingId ? 'Edit Sub-Event' : 'Add Sub-Event'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
              className="text-text-4 hover:text-text-1 transition-colors"
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Sangeet Night"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {SUB_EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">Venue</label>
              <input
                type="text"
                value={formVenue}
                onChange={e => setFormVenue(e.target.value)}
                placeholder="Venue name"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Start time */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">Start Time</label>
              <input
                type="time"
                value={formStartTime}
                onChange={e => setFormStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* End time */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">End Time</label>
              <input
                type="time"
                value={formEndTime}
                onChange={e => setFormEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-text-3 mb-1.5">City</label>
              <input
                type="text"
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
                placeholder="City"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-3 mb-1.5">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Optional details about this event..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-cream text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
              className="px-4 py-2 rounded-xl text-sm font-bold text-text-3 hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Sub-Event'}
            </button>
          </div>
        </div>
      )}

      {/* Sub-events list */}
      {subEvents.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-brand-border bg-white dark:bg-cream-2 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center">
            <Layers className="h-8 w-8 text-text-4" />
          </div>
          <div>
            <p className="text-base font-bold text-text-2">No sub-events yet</p>
            <p className="text-sm text-text-4 mt-1">
              Add events like Mehendi, Sangeet, Haldi, and more to your celebration
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first sub-event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline view */}
          <div className="relative">
            {subEvents.map((se, idx) => {
              const color = getTypeColor(se.event_type)
              const isLast = idx === subEvents.length - 1

              return (
                <div key={se.id} className="flex gap-4 group">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <div className={`w-3.5 h-3.5 rounded-full ${color.dot} ring-4 ring-white dark:ring-cream-2 z-10 flex-shrink-0`} />
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-brand-border min-h-[24px]" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 mb-4 hover:border-brand/50 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <h3 className="text-base font-black text-text-1 leading-tight">{se.name}</h3>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${color.bg} ${color.text}`}>
                            {se.event_type}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-text-3">
                          {se.event_date && (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-text-4" />
                              {formatDate(se.event_date)}
                            </span>
                          )}
                          {(se.start_time || se.end_time) && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-text-4" />
                              {se.start_time}{se.start_time && se.end_time ? ' - ' : ''}{se.end_time}
                            </span>
                          )}
                          {se.venue && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-text-4" />
                              {se.venue}{se.city ? `, ${se.city}` : ''}
                            </span>
                          )}
                        </div>

                        {se.description && (
                          <p className="text-sm text-text-4 mt-2 line-clamp-2">{se.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEditForm(se)}
                          className="p-2 rounded-lg text-text-4 hover:text-brand hover:bg-cream transition-colors"
                          aria-label={`Edit ${se.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(se.id)}
                          className="p-2 rounded-lg text-text-4 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={`Delete ${se.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
