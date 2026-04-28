'use client'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  vendorId: string
  vendorName: string
  eventId: string
  eventType: string
  onSubmitted: () => void
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-36 text-sm text-gray-600">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl ${n <= value ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ vendorId, vendorName, eventId, eventType, onSubmitted }: Props) {
  const [form, setForm] = useState({
    overall_rating: 0,
    food_quality_rating: 0,
    service_rating: 0,
    value_rating: 0,
    title: '',
    body: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.overall_rating === 0) { setError('Overall rating is required.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId, event_id: eventId, event_type: eventType, ...form }),
    })
    setSubmitting(false)
    if (res.ok) onSubmitted()
    else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit review.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Review {vendorName}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <StarPicker label="Overall *" value={form.overall_rating} onChange={v => setForm(f => ({ ...f, overall_rating: v }))} />
        <StarPicker label="Food quality" value={form.food_quality_rating} onChange={v => setForm(f => ({ ...f, food_quality_rating: v }))} />
        <StarPicker label="Service" value={form.service_rating} onChange={v => setForm(f => ({ ...f, service_rating: v }))} />
        <StarPicker label="Value" value={form.value_rating} onChange={v => setForm(f => ({ ...f, value_rating: v }))} />
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary" />
        </div>
        <div className="space-y-1">
          <Label>Your review</Label>
          <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Share your experience…" />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={cn(buttonVariants(), 'w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
