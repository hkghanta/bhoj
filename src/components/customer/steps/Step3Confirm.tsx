'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { getChecklistTemplate } from '@/lib/checklist-templates'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

type Props = { eventType: string; details: EventDetails; onBack: () => void }

export function Step3Confirm({ eventType, details, onBack }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const template = getChecklistTemplate(eventType)
  const categories = [...new Set(template.map(t => t.category))]

  async function createEvent() {
    setCreating(true)
    setError('')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, ...details }),
    })
    if (res.ok) {
      const event = await res.json()
      router.push(`/events/${event.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create event.')
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review your event</h2>
        <p className="text-gray-500 text-sm mt-1">We'll create your planning checklist automatically.</p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        {[
          { label: 'Event name', value: details.event_name },
          { label: 'Type', value: <span className="capitalize">{eventType}</span> },
          { label: 'Date', value: format(new Date(details.event_date), 'EEEE, d MMMM yyyy') },
          { label: 'Location', value: `${details.city}${details.venue ? ` — ${details.venue}` : ''}` },
          { label: 'Guests', value: details.guest_count.toLocaleString() },
        ].map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Budget</span>
          <span className="font-medium text-orange-600">
            {details.currency} {details.total_budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Your checklist will include {template.length} items across {categories.length} categories:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
          ))}
        </div>
      </div>

      {details.guest_count >= 100 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          <strong>Tasting events unlocked!</strong> With {details.guest_count} guests, caterers can offer tasting sessions with their quotes.
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={createEvent} disabled={creating} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {creating ? 'Creating event…' : 'Create Event & Go to Dashboard →'}
        </Button>
      </div>
    </div>
  )
}
