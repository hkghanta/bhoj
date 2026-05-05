'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type MatchDetail = {
  id: string
  score: number
  rank: number
  event_request: {
    vendor_type: string
    event: {
      id: string
      event_name: string
      event_date: string
      guest_count: number
      city: string
    }
  }
  vendor: {
    id: string
    business_name: string
    city: string
    tier: string
    avg_rating: number | null
    description: string | null
    menu_packages: { name: string; price_per_head: number; currency: string }[]
  }
}

export default function RequestQuotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const matchId = searchParams.get('matchId')

  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    fetch(`/api/matches/${matchId}`)
      .then(async r => {
        if (!r.ok) throw new Error('Match not found')
        return r.json()
      })
      .then(setMatch)
      .catch(() => setError('Could not load vendor details.'))
      .finally(() => setLoading(false))
  }, [matchId])

  async function requestQuote() {
    if (!matchId) return
    setSubmitting(true)
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId }),
    })
    if (res.ok) {
      setDone(true)
      setTimeout(() => {
        router.push(`/events/${match?.event_request.event.id}/quotes`)
      }, 2000)
    } else {
      const err = await res.json()
      setError(err.error ?? 'Failed to request quote.')
    }
    setSubmitting(false)
  }

  if (!matchId) return <div className="p-8 text-text-3">No match specified.</div>
  if (loading) return <div className="p-8 text-text-4">Loading vendor details…</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!match) return null

  const event = match.event_request.event

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-text-4 mb-6">
        <Link href="/dashboard" className="hover:text-brand">My Events</Link>
        <span>/</span>
        <Link href={`/events/${event.id}`} className="hover:text-brand">{event.event_name}</Link>
        <span>/</span>
        <Link href={`/events/${event.id}/vendors`} className="hover:text-brand">Find Vendors</Link>
        <span>/</span>
        <span>Request Quote</span>
      </div>

      {done ? (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border p-10 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-text-1">Quote Requested!</h2>
          <p className="text-text-3 mt-1">
            {match.vendor.business_name} has been notified. You'll hear back soon.
          </p>
          <p className="text-xs text-text-4 mt-3">Redirecting to your quotes…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Event summary */}
          <div className="bg-cream rounded-xl border px-5 py-4 text-sm text-text-3">
            <p className="font-medium text-text-1 mb-1">For your event</p>
            <p>{event.event_name} · {new Date(event.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>{event.guest_count} guests · {event.city}</p>
          </div>

          {/* Vendor card */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-text-1">{match.vendor.business_name}</h2>
                  {match.vendor.tier !== 'FREE' && (
                    <Badge className="bg-brand text-white text-xs">{match.vendor.tier}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-text-3">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{match.vendor.city}</span>
                  {match.vendor.avg_rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {Number(match.vendor.avg_rating).toFixed(1)}
                    </span>
                  )}
                </div>
                {match.vendor.description && (
                  <p className="text-sm text-text-3 mt-3">{match.vendor.description}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-brand">{match.score}</div>
                <div className="text-xs text-text-4">match score</div>
                <div className="text-xs text-text-4">#{match.rank} match</div>
              </div>
            </div>

            {match.vendor.menu_packages.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-text-3 mb-2">Packages</p>
                <div className="flex flex-wrap gap-2">
                  {match.vendor.menu_packages.map((pkg, i) => (
                    <span key={i} className="text-sm bg-cream-2 text-text-2 px-3 py-1 rounded-full">
                      {pkg.name} — {pkg.currency === 'GBP' ? '£' : '$'}{Number(pkg.price_per_head).toFixed(0)}/head
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link href={`/events/${event.id}/vendors`}>
              <Button variant="outline">Back</Button>
            </Link>
            <Button
              onClick={requestQuote}
              disabled={submitting}
              className="bg-brand hover:bg-brand-hover"
            >
              {submitting ? 'Sending request…' : `Request Quote from ${match.vendor.business_name}`}
            </Button>
          </div>

          <p className="text-xs text-text-4">
            The vendor will receive a notification and prepare a quote for your event. You can compare all quotes under your event.
          </p>
        </div>
      )}
    </div>
  )
}
