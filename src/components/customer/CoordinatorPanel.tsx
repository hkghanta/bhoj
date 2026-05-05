'use client'
import { useState, useEffect } from 'react'
import { Headphones, Phone, Mail, Star, Loader2 } from 'lucide-react'

type Coordinator = {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  priority: string | null
}

export function CoordinatorPanel({ eventId }: { eventId: string }) {
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCoordinator() {
      try {
        const res = await fetch(`/api/events/${eventId}/coordinator`)
        if (res.status === 404) {
          setCoordinator(null)
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        setCoordinator(await res.json())
      } catch {
        setError('Failed to load coordinator info')
      } finally {
        setLoading(false)
      }
    }
    fetchCoordinator()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-text-4" />
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

  if (!coordinator) {
    return (
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Headphones className="h-5 w-5 text-text-4" />
          <h3 className="font-bold text-text-1">OneSeva Coordinator</h3>
        </div>
        <p className="text-base text-text-4">No OneSeva coordinator assigned</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Headphones className="h-5 w-5 text-brand" />
        <h3 className="font-bold text-text-1">OneSeva Coordinator</h3>
        <span
          className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
            coordinator.status === 'active'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-cream text-text-3 border-brand-border'
          }`}
        >
          {coordinator.status}
        </span>
      </div>
      <div className="space-y-2 text-sm text-text-3">
        <p className="font-medium text-text-1">{coordinator.name}</p>
        <div className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5 text-text-4" />
          {coordinator.email}
        </div>
        {coordinator.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-text-4" />
            {coordinator.phone}
          </div>
        )}
        {coordinator.priority && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span className="capitalize">{coordinator.priority} priority</span>
          </div>
        )}
      </div>
    </div>
  )
}
