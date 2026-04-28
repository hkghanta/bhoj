'use client'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Props = {
  vendorId: string
  vendorName: string
  eventRequestId: string
  matchId: string
  onSubmitted: () => void
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-48 text-sm text-gray-600">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-xl transition-colors ${n <= value ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function HiddenFeedbackForm({ vendorId, vendorName, eventRequestId, matchId, onSubmitted }: Props) {
  const [form, setForm] = useState({
    communication_score: 0,
    professionalism_score: 0,
    quote_accuracy: 0,
    overall_experience: 0,
    would_recommend: true,
    booked_offline: false,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.communication_score === 0 || form.overall_experience === 0) {
      setError('Please fill in all ratings.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/feedback/hidden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId, event_request_id: eventRequestId, match_id: matchId, ...form }),
    })
    setSubmitting(false)
    if (res.ok) onSubmitted()
    else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit feedback.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Private Feedback</h3>
        <p className="text-sm text-gray-500 mt-1">
          This feedback about <strong>{vendorName}</strong> is completely private — only used to improve our matching.
          It will never be shown publicly.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StarRating label="Communication" value={form.communication_score} onChange={v => setForm(f => ({ ...f, communication_score: v }))} />
        <StarRating label="Professionalism" value={form.professionalism_score} onChange={v => setForm(f => ({ ...f, professionalism_score: v }))} />
        <StarRating label="Quote accuracy" value={form.quote_accuracy} onChange={v => setForm(f => ({ ...f, quote_accuracy: v }))} />
        <StarRating label="Overall experience" value={form.overall_experience} onChange={v => setForm(f => ({ ...f, overall_experience: v }))} />

        <div className="flex items-center justify-between py-2">
          <Label className="text-sm text-gray-600">Would you recommend this vendor?</Label>
          <Switch checked={form.would_recommend} onCheckedChange={v => setForm(f => ({ ...f, would_recommend: v }))} />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm text-gray-600">Did you book them outside Bhoj?</Label>
            <p className="text-xs text-gray-400">Helps us improve the matching</p>
          </div>
          <Switch checked={form.booked_offline} onCheckedChange={v => setForm(f => ({ ...f, booked_offline: v }))} />
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-gray-600">Any other notes? <span className="text-gray-400">(optional)</span></Label>
          <Textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Anything else we should know…"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={cn(buttonVariants(), 'w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
        >
          {submitting ? 'Submitting…' : 'Submit Private Feedback'}
        </button>
      </form>
    </div>
  )
}
