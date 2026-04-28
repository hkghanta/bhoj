'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  quoteId: string
  guestCount: number
  currency: string
  initialValues?: {
    price_per_head?: number
    notes?: string
    tasting_offered?: boolean
    tasting_cost?: number
    tasting_location?: string
  }
  onSubmitted: () => void
}

export function QuoteForm({ quoteId, guestCount, currency, initialValues, onSubmitted }: Props) {
  const [form, setForm] = useState({
    price_per_head: initialValues?.price_per_head ?? 0,
    notes: initialValues?.notes ?? '',
    tasting_offered: initialValues?.tasting_offered ?? false,
    tasting_cost: initialValues?.tasting_cost ?? 0,
    tasting_location: initialValues?.tasting_location ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalEstimate = form.price_per_head * guestCount

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  async function handleSubmit() {
    if (form.price_per_head <= 0) { setError('Price per head is required.'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_per_head: form.price_per_head,
        total_estimate: totalEstimate,
        notes: form.notes,
        tasting_offered: form.tasting_offered,
        tasting_cost: form.tasting_offered ? form.tasting_cost : null,
        tasting_location: form.tasting_offered ? form.tasting_location : null,
        status: 'SENT',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    })

    setSubmitting(false)
    if (res.ok) {
      onSubmitted()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit quote.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-5">
      <h3 className="font-semibold text-gray-900">Quote Details</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Price per head ({currency}) *</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={form.price_per_head}
            onChange={e => setForm(f => ({ ...f, price_per_head: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Total estimate</Label>
          <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50 font-semibold text-orange-600">
            {fmtCurrency(totalEstimate)}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes for customer</Label>
        <Textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Describe what's included: setup, staffing, equipment, etc."
          rows={4}
        />
      </div>

      {guestCount >= 100 && (
        <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Offer a tasting session</p>
              <p className="text-xs text-orange-600">Available for events with 100+ guests</p>
            </div>
            <Switch
              checked={form.tasting_offered}
              onCheckedChange={v => setForm(f => ({ ...f, tasting_offered: v }))}
            />
          </div>
          {form.tasting_offered && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1">
                <Label className="text-sm">Tasting cost ({currency})</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.tasting_cost}
                  onChange={e => setForm(f => ({ ...f, tasting_cost: parseFloat(e.target.value) || 0 }))}
                />
                <p className="text-xs text-gray-400">0 = complimentary</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Location</Label>
                <Input
                  value={form.tasting_location}
                  onChange={e => setForm(f => ({ ...f, tasting_location: e.target.value }))}
                  placeholder="Your kitchen / venue"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={cn(buttonVariants(), 'w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
      >
        {submitting ? 'Sending quote…' : 'Send Quote to Customer'}
      </button>
    </div>
  )
}
