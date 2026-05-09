'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

const DAYS = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
]

type DayRow = {
  day_of_week: string
  is_open: boolean
  opens_at: string
  closes_at: string
  notes: string
}

type SpecialDay = {
  id: string
  date: string
  is_open: boolean
  opens_at: string | null
  closes_at: string | null
  reason: string | null
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DayRow[]>(
    DAYS.map(d => ({
      day_of_week: d.key,
      is_open: true,
      opens_at: '14:00',
      closes_at: '23:00',
      notes: '',
    }))
  )
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSpecial, setNewSpecial] = useState({
    date: '',
    is_open: false,
    opens_at: '',
    closes_at: '',
    reason: '',
  })
  const [showSpecialForm, setShowSpecialForm] = useState(false)

  useEffect(() => {
    fetch('/api/vendor/schedule')
      .then(async r => {
        if (!r.ok) return null
        const text = await r.text()
        return text ? JSON.parse(text) : null
      })
      .then((rows: DayRow[] | null) => {
        if (!Array.isArray(rows)) return
        const byDay: Record<string, DayRow> = {}
        rows.forEach(r => { byDay[r.day_of_week] = r })
        setSchedule(
          DAYS.map(d => byDay[d.key] ?? {
            day_of_week: d.key,
            is_open: true,
            opens_at: '14:00',
            closes_at: '23:00',
            notes: '',
          })
        )
      })
    fetch('/api/vendor/special-days')
      .then(async r => {
        if (!r.ok) return null
        const text = await r.text()
        return text ? JSON.parse(text) : null
      })
      .then(data => { if (Array.isArray(data)) setSpecialDays(data) })
  }, [])

  function updateDay(key: string, field: keyof DayRow, value: unknown) {
    setSchedule(prev =>
      prev.map(d => (d.day_of_week === key ? { ...d, [field]: value } : d))
    )
  }

  async function saveSchedule() {
    setSaving(true)
    await fetch('/api/vendor/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addSpecialDay() {
    if (!newSpecial.date) return
    setSaving(true)
    const res = await fetch('/api/vendor/special-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpecial),
    })
    const day = await res.json()
    setSpecialDays(prev =>
      [...prev, day].sort((a, b) => a.date.localeCompare(b.date))
    )
    setNewSpecial({ date: '', is_open: false, opens_at: '', closes_at: '', reason: '' })
    setShowSpecialForm(false)
    setSaving(false)
  }

  async function deleteSpecialDay(id: string) {
    await fetch(`/api/vendor/special-days/${id}`, { method: 'DELETE' })
    setSpecialDays(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-1 mb-1">Event Availability</h1>
        <p className="text-text-4 text-sm">
          Which days you're available to take event bookings. Caterers often work evenings, weekends, and holidays —
          mark any day you can accept a booking.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong className="font-semibold">Tip:</strong> Most South Asian events happen on Friday evenings, Saturdays, and Sundays.
        Consider marking all days as available and using the notes field to indicate your preferred hours.
        Customers will always message you to confirm your exact availability for their date.
      </div>

      {/* Weekly schedule */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-cream border-b">
          <h3 className="font-bold text-text-1">Weekly Availability</h3>
        </div>
        <div className="divide-y">
          {schedule.map(row => {
            const dayLabel = DAYS.find(d => d.key === row.day_of_week)?.label ?? row.day_of_week
            return (
              <div key={row.day_of_week} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                <div className="w-28 text-sm font-medium text-text-2">{dayLabel}</div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.is_open}
                    onChange={e => updateDay(row.day_of_week, 'is_open', e.target.checked)}
                    className="rounded"
                  />
                  <span className={row.is_open ? 'text-green-700 font-medium' : 'text-text-4'}>
                    {row.is_open ? 'Available' : 'Not available'}
                  </span>
                </label>
                {row.is_open && (
                  <>
                    <Input
                      type="time"
                      value={row.opens_at}
                      onChange={e => updateDay(row.day_of_week, 'opens_at', e.target.value)}
                      className="h-8 w-32 text-sm"
                    />
                    <span className="text-text-4 text-sm">to</span>
                    <Input
                      type="time"
                      value={row.closes_at}
                      onChange={e => updateDay(row.day_of_week, 'closes_at', e.target.value)}
                      className="h-8 w-32 text-sm"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="px-5 py-4 border-t bg-cream">
          <Button
            onClick={saveSchedule}
            disabled={saving}
            className="bg-brand hover:bg-brand-hover"
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Schedule'}
          </Button>
        </div>
      </div>

      {/* Special days */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-cream border-b flex items-center justify-between">
          <h3 className="font-bold text-text-1">Special Days</h3>
          <button
            onClick={() => setShowSpecialForm(v => !v)}
            className="flex items-center gap-1 text-sm text-brand hover:text-brand"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {showSpecialForm && (
          <div className="px-5 py-4 border-b bg-cream space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-3">Date *</label>
                <Input
                  type="date"
                  value={newSpecial.date}
                  onChange={e => setNewSpecial(f => ({ ...f, date: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-3">Reason</label>
                <Input
                  value={newSpecial.reason}
                  onChange={e => setNewSpecial(f => ({ ...f, reason: e.target.value }))}
                  className="h-8 text-sm"
                  placeholder="Eid, Christmas, private booking…"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-0.5">
                <input
                  type="checkbox"
                  checked={newSpecial.is_open}
                  onChange={e => setNewSpecial(f => ({ ...f, is_open: e.target.checked }))}
                  className="rounded"
                />
                Open this day
              </label>
              {newSpecial.is_open && (
                <>
                  <Input
                    type="time"
                    value={newSpecial.opens_at}
                    onChange={e => setNewSpecial(f => ({ ...f, opens_at: e.target.value }))}
                    className="h-8 w-32 text-sm"
                  />
                  <span className="text-text-4 text-sm mb-0.5">to</span>
                  <Input
                    type="time"
                    value={newSpecial.closes_at}
                    onChange={e => setNewSpecial(f => ({ ...f, closes_at: e.target.value }))}
                    className="h-8 w-32 text-sm"
                  />
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSpecialForm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addSpecialDay}
                disabled={saving || !newSpecial.date}
                className="bg-brand hover:bg-brand-hover"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {specialDays.length === 0 ? (
          <div className="px-5 py-16 text-center text-base text-text-4">
            No special days added.
          </div>
        ) : (
          <div className="divide-y">
            {specialDays.map(day => (
              <div key={day.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-text-1">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {day.reason && (
                    <span className="ml-2 text-sm text-text-4">{day.reason}</span>
                  )}
                  <span
                    className={`ml-2 text-xs font-medium ${
                      day.is_open ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {day.is_open
                      ? `Open ${day.opens_at ?? ''}–${day.closes_at ?? ''}`
                      : 'Closed'}
                  </span>
                </div>
                <button
                  onClick={() => deleteSpecialDay(day.id)}
                  className="text-text-4 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
