'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type DayStatus = { date: string; is_available: boolean }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export function AvailabilityCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = getDaysInMonth(year, month)
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    fetch(`/api/vendor/availability?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: DayStatus[]) => {
        const map: Record<string, boolean> = {}
        data.forEach(d => { map[d.date.split('T')[0]] = d.is_available })
        setAvailability(map)
        setPendingChanges({})
      })
  }, [year, month])

  function toggleDay(dateStr: string) {
    const current = pendingChanges[dateStr] ?? availability[dateStr] ?? true
    setPendingChanges(p => ({ ...p, [dateStr]: !current }))
  }

  async function saveChanges() {
    setSaving(true)
    const dates = Object.entries(pendingChanges).map(([date, is_available]) => ({ date, is_available }))
    await fetch('/api/vendor/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates }),
    })
    setAvailability(a => ({ ...a, ...pendingChanges }))
    setPendingChanges({})
    setSaving(false)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold">{MONTH_NAMES[month]} {year}</h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-full bg-green-100 border border-green-300 inline-block" /> Available
            <span className="h-3 w-3 rounded-full bg-red-100 border border-red-300 inline-block ml-2" /> Blocked
          </div>
          {Object.keys(pendingChanges).length > 0 && (
            <Button size="sm" onClick={saveChanges} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Saving…' : `Save ${Object.keys(pendingChanges).length} changes`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAvailable = pendingChanges[dateStr] ?? availability[dateStr] ?? true
          const isPending = dateStr in pendingChanges
          const isPast = new Date(dateStr) < today

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => !isPast && toggleDay(dateStr)}
              className={cn(
                'aspect-square rounded-lg text-sm font-medium transition-colors',
                isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                isAvailable
                  ? 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
                isPending && 'ring-2 ring-orange-400'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
