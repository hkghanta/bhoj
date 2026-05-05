'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, User, Clock, Loader2 } from 'lucide-react'

type AssignedEvent = {
  id: string
  event_name: string
  event_date: string
  customer_name: string
  location: string | null
  status: string
}

export function EventManagerDashboard() {
  const [events, setEvents] = useState<AssignedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/vendor/event-manager')
        if (!res.ok) throw new Error('Failed to load events')
        setEvents(await res.json())
      } catch {
        setError('Failed to load assigned events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 text-red-800 border border-red-200 px-4 py-3 text-sm">
        {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <Calendar className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-text-4">No events assigned yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/vendor/event-manager/${event.id}`}
          className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col hover:border-brand transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-text-1">{event.event_name}</h3>
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
                event.status === 'confirmed'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : event.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-cream text-text-3 border-brand-border'
              }`}
            >
              {event.status}
            </span>
          </div>
          <div className="space-y-1.5 text-sm text-text-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              {new Date(event.event_date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-text-4" />
              {event.customer_name}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-text-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
