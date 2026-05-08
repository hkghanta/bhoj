'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Sparkles, Loader2 } from 'lucide-react'

interface PlaybookSuggestionProps {
  eventId: string
  eventType: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'wedding',
  ENGAGEMENT: 'engagement',
  BIRTHDAY: 'birthday',
  BABY_SHOWER: 'baby shower',
  ANNIVERSARY: 'anniversary',
  GRADUATION: 'graduation',
}

export function PlaybookSuggestion({ eventId, eventType }: PlaybookSuggestionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const label = EVENT_TYPE_LABELS[eventType] ?? eventType.toLowerCase().replace('_', ' ')

  async function applyPlaybook() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${eventId}/apply-playbook`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Something went wrong' }))
        setError(body.error ?? 'Failed to apply template')
        return
      }

      router.push(`/events/${eventId}/checklist`)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      aria-label="Planning template suggestion"
      className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border overflow-hidden shadow-sm"
    >
      <div className="bg-brand/5 border-b border-brand-border px-6 py-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="h-6 w-6 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-text-1 mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
            Get a head start on planning
          </h2>
          <p className="text-sm text-text-3">
            Use our <span className="font-bold text-text-2">{label}</span> planning template
            to get started with a pre-built checklist and timeline. You can customize everything after.
          </p>
        </div>
      </div>
      <div className="px-6 py-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={applyPlaybook}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-5 py-2.5 text-sm font-bold hover:bg-brand/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            'Use Template'
          )}
        </button>
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
    </section>
  )
}
