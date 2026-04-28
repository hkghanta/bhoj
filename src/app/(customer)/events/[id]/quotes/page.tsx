'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { QuoteCompare } from '@/components/quotes/QuoteCompare'
import Link from 'next/link'

export default function EventQuotesPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/quotes?eventId=${eventId}`)
      .then(r => r.json())
      .then(data => {
        setQuotes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [eventId])

  async function handleAccept(quoteId: string) {
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    setQuotes(q => q.map(quote => quote.id === quoteId ? { ...quote, status: 'ACCEPTED' } : quote))
  }

  async function handleDecline(quoteId: string) {
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DECLINED' }),
    })
    setQuotes(q => q.map(quote => quote.id === quoteId ? { ...quote, status: 'DECLINED' } : quote))
  }

  if (loading) return <div className="text-gray-400 p-8">Loading quotes…</div>

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
          <span>/</span>
          <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
          <span>/</span>
          <span>Quotes</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Compare Quotes</h1>
        <p className="text-gray-500 mt-1">
          {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received
        </p>
      </div>
      <QuoteCompare
        quotes={quotes}
        guestCount={0}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  )
}
