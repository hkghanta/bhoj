'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, Calendar, MapPin, Clock, CheckCircle, Plus, Loader2 } from 'lucide-react'

type Booking = {
  id: string
  vendor_name: string
  type: 'TASTING' | 'SITE_VISIT' | 'CONSULTATION'
  date: string
  time_slot: string
  location: string | null
  guest_count: number | null
  notes: string | null
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  RESCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-cream text-text-2 border-brand-border',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  NO_SHOW: 'bg-red-100 text-red-700 border-red-200',
}

const TYPES = [
  { value: 'TASTING', label: 'Tasting' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'CONSULTATION', label: 'Consultation' },
]

const emptyForm = {
  vendor_id: '',
  vendor_name: '',
  type: 'TASTING',
  date: '',
  time_slot: '',
  location: '',
  guest_count: '',
  notes: '',
}

export function TastingBookingManager({ eventId }: { eventId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tastings?event_id=${eventId}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : data.tastings ?? [])
    } catch {
      showAlertMsg('error', 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/tastings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          vendor_name: form.vendor_name,
          type: form.type,
          date: form.date,
          time_slot: form.time_slot,
          location: form.location || null,
          guest_count: form.guest_count ? Number(form.guest_count) : null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to book')
      showAlertMsg('success', 'Booking created')
      setShowForm(false)
      setForm(emptyForm)
      fetchBookings()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

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

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(!showForm)} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-1" /> Book New
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">Schedule a Booking</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Vendor Name</label>
                <input required className={inputCls} value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Type</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Date</label>
                <input type="date" required className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Time Slot</label>
                <input type="time" required className={inputCls} value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Location</label>
                <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Guest Count</label>
                <input type="number" min="1" className={inputCls} value={form.guest_count} onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Notes</label>
              <textarea rows={2} className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Booking...' : 'Book'}</Button>
            </div>
          </form>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <UtensilsCrossed className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No bookings yet. Schedule your first tasting or visit.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-text-1">{booking.vendor_name}</h3>
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[booking.status] ?? 'bg-cream text-text-2'}`}>
                  {booking.status}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-text-3">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-brand" />
                  {TYPES.find(t => t.value === booking.type)?.label ?? booking.type}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {booking.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {booking.time_slot}
                </div>
                {booking.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {booking.location}
                  </div>
                )}
              </div>
              {booking.notes && <p className="text-xs text-text-4 mt-2">{booking.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
