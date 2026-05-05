'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

type EventDetails = {
  event_name: string; event_date: string; city: string; state: string; venue: string;
  guest_count: number; total_budget: number; currency: string; country: string
}

type Props = {
  eventType: string
  details: EventDetails
  onBack: () => void
}

export function Step5Confirm({ eventType, details, onBack }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

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
        <h2 className="text-xl font-semibold text-text-1">Review your event</h2>
        <p className="text-text-4 text-sm mt-1">
          Once created, add services and find vendors from your event dashboard.
        </p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-cream rounded-xl p-5 space-y-4">
        {[
          { label: 'Event', value: details.event_name },
          { label: 'Type', value: <span className="capitalize">{eventType.replace(/_/g, ' ')}</span> },
          { label: 'Date', value: format(new Date(details.event_date), 'EEEE, d MMMM yyyy') },
          { label: 'Location', value: [details.city, details.state].filter(Boolean).join(', ') + (details.venue ? ` — ${details.venue}` : '') },
          { label: 'Guests', value: details.guest_count.toLocaleString() },
        ].map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-text-4">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-text-4">Budget</span>
          <span className="font-medium text-brand">
            {details.currency} {details.total_budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={createEvent} disabled={creating} className="flex-1 bg-brand hover:bg-brand-hover">
          {creating ? 'Creating your event…' : 'Create Event →'}
        </Button>
      </div>
    </div>
  )
}
