'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type Props = {
  quoteId: string
  guestCount: number
  currency: string
  initialValues?: {
    price_per_head?: number | null
    notes?: string | null
    tasting_offered?: boolean
    tasting_cost?: number | null
    tasting_date?: string | null
    tasting_location?: string | null
    expires_at?: string | null
  }
  onSaveDraft: (data: FormData) => Promise<void>
  onSend: (data: FormData) => Promise<void>
  saving: boolean
  sending: boolean
}

export type FormData = {
  price_per_head: number
  total_estimate: number
  notes: string
  tasting_offered: boolean
  tasting_cost: number
  tasting_date: string
  tasting_location: string
}

export function QuoteForm({ quoteId, guestCount, currency, initialValues, onSaveDraft, onSend, saving, sending }: Props) {
  const [form, setForm] = useState<FormData>({
    price_per_head: initialValues?.price_per_head ?? 0,
    total_estimate: 0,
    notes: initialValues?.notes ?? '',
    tasting_offered: initialValues?.tasting_offered ?? false,
    tasting_cost: initialValues?.tasting_cost ?? 0,
    tasting_date: initialValues?.tasting_date?.slice(0, 10) ?? '',
    tasting_location: initialValues?.tasting_location ?? '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(f => ({ ...f, total_estimate: f.price_per_head * guestCount }))
  }, [form.price_per_head, guestCount])

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  function validate() {
    if (form.price_per_head <= 0) { setError('Price per head is required.'); return false }
    setError('')
    return true
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4 sticky top-6">
      <h3 className="font-semibold text-text-1">Quote details</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Price per head ({currency}) *</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={form.price_per_head || ''}
            placeholder="0"
            onChange={e => setForm(f => ({ ...f, price_per_head: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Total estimate</Label>
          <div className="h-10 flex items-center px-3 border rounded-md bg-cream font-semibold text-brand text-sm">
            {form.price_per_head > 0 ? fmtCurrency(form.price_per_head * guestCount) : '—'}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes for customer</Label>
        <Textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="What's included: staffing, setup, equipment, service style…"
          rows={3}
        />
      </div>

      {guestCount >= 50 && (
        <div className="space-y-3 p-3 bg-cream rounded-lg border border-brand">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand">Offer a tasting</p>
              <p className="text-xs text-brand">Let them try the food before booking</p>
            </div>
            <Switch
              checked={form.tasting_offered}
              onCheckedChange={v => setForm(f => ({ ...f, tasting_offered: v }))}
            />
          </div>
          {form.tasting_offered && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Cost ({currency})</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.tasting_cost || ''}
                  placeholder="0 = free"
                  onChange={e => setForm(f => ({ ...f, tasting_cost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  value={form.tasting_location}
                  onChange={e => setForm(f => ({ ...f, tasting_location: e.target.value }))}
                  placeholder="Your kitchen…"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Tasting date</Label>
                <Input
                  type="date"
                  value={form.tasting_date}
                  onChange={e => setForm(f => ({ ...f, tasting_date: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => { if (validate()) onSend(form) }}
          disabled={sending || saving}
          className="w-full py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending…' : 'Send to customer'}
        </button>
        <button
          onClick={() => onSaveDraft(form)}
          disabled={saving || sending}
          className="w-full py-2 rounded-lg border border-brand-border text-text-2 text-sm font-medium hover:bg-cream disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
      </div>
    </div>
  )
}
