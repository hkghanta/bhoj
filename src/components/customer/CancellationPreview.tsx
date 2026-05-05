'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, DollarSign, Loader2, Info } from 'lucide-react'

type PreviewData = {
  hours_remaining: number
  refund_percent: number
  refund_amount: number
  policy_description: string
  quote_total: number
}

type Props = { eventId: string; quoteId: string }

export default function CancellationPreview({ eventId, quoteId }: Props) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

  useEffect(() => {
    fetch(`/api/events/${eventId}/cancellation-preview?quoteId=${quoteId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load cancellation preview')
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId, quoteId])

  if (loading) {
    return (
      <div className="bg-white dark:bg-cream-2 rounded-xl border p-5">
        <div className="flex items-center gap-2 text-text-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading cancellation details...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 p-5">
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error ?? 'Unable to load cancellation preview.'}
        </div>
      </div>
    )
  }

  const isLowRefund = data.refund_percent < 50
  const hoursDisplay = data.hours_remaining >= 24
    ? `${Math.floor(data.hours_remaining / 24)}d ${Math.round(data.hours_remaining % 24)}h`
    : `${Math.round(data.hours_remaining)}h`

  return (
    <div className={`rounded-2xl border border-brand-border p-6 space-y-5 ${
      isLowRefund ? 'bg-red-50 border-red-100' : 'bg-white dark:bg-cream-2'
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 ${isLowRefund ? 'text-red-500' : 'text-amber-500'}`} />
        <h3 className="font-bold text-text-1">Cancellation Preview</h3>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-5 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-text-4 mb-1">
            <Clock className="h-3 w-3" /> Time remaining
          </div>
          <div className="text-lg font-bold text-text-1">{hoursDisplay}</div>
        </div>
        <div className="bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-5 text-center">
          <div className="text-xs text-text-4 mb-1">Refund</div>
          <div className={`text-lg font-bold ${isLowRefund ? 'text-red-600' : 'text-green-600'}`}>
            {data.refund_percent}%
          </div>
        </div>
        <div className="bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-5 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-text-4 mb-1">
            <DollarSign className="h-3 w-3" /> Refund amount
          </div>
          <div className={`text-lg font-bold ${isLowRefund ? 'text-red-600' : 'text-green-600'}`}>
            {fmt(data.refund_amount)}
          </div>
        </div>
      </div>

      {/* Refund progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-text-4 mb-1">
          <span>0%</span>
          <span>Refund: {data.refund_percent}%</span>
          <span>100%</span>
        </div>
        <div className="h-3 bg-cream-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isLowRefund ? 'bg-red-400' : data.refund_percent >= 75 ? 'bg-green-400' : 'bg-amber-400'
            }`}
            style={{ width: `${data.refund_percent}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-text-4 mt-2">
        Quote total: {fmt(data.quote_total)}
      </div>

      {/* Policy description */}
      <div className={`flex items-start gap-2 text-sm rounded-xl p-3 ${
        isLowRefund ? 'bg-red-100/50 text-red-700' : 'bg-cream text-text-3'
      }`}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>{data.policy_description}</p>
      </div>

      {isLowRefund && (
        <div className="flex items-start gap-2 bg-red-100 text-red-800 rounded-xl p-3 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Warning: You will receive less than 50% refund if you cancel now.</p>
        </div>
      )}
    </div>
  )
}
