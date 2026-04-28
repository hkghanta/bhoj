'use client'
import { useState, useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Lock, Zap } from 'lucide-react'

type Props = { eventId: string; eventName: string }

export function EventPassCard({ eventId, eventName }: Props) {
  const [hasPass, setHasPass] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetch(`/api/billing/event-pass?eventId=${eventId}`)
      .then(r => r.json())
      .then(data => {
        setHasPass(data.has_pass)
        setLoading(false)
      })
  }, [eventId])

  async function handlePurchase() {
    setPurchasing(true)
    const res = await fetch('/api/billing/event-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setPurchasing(false)
    }
  }

  if (loading) return null

  const FEATURES = [
    'Unlimited quote requests (vs 3 on free)',
    'Add collaborators to your event planning',
    'Export checklist as PDF',
    'Priority support',
  ]

  return (
    <div className={`rounded-xl border p-5 ${hasPass ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasPass ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Zap className="h-5 w-5 text-orange-600" />
          )}
          <h3 className="font-semibold text-gray-900">Event Pass</h3>
          {hasPass && <Badge className="bg-green-600 text-white text-xs">Active</Badge>}
        </div>
        {!hasPass && (
          <span className="text-xl font-bold text-orange-600">£9.99</span>
        )}
      </div>

      {hasPass ? (
        <p className="text-sm text-green-700">
          Your Event Pass is active for <strong>{eventName}</strong>. All features unlocked.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Unlock premium planning features for <strong>{eventName}</strong>. One-time payment.
          </p>
          <ul className="space-y-1.5 mb-4">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <Lock className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className={cn(buttonVariants(), 'w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
          >
            {purchasing ? 'Redirecting to checkout…' : 'Get Event Pass — £9.99'}
          </button>
        </>
      )}
    </div>
  )
}
