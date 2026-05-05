'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CityInput } from '@/components/ui/CityInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

type EventDetails = {
  event_name: string
  event_date: string
  city: string
  state: string
  venue: string
  guest_count: number
  total_budget: number
  currency: string
  country: string
}

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', GBP: 'GB', CAD: 'CA', AUD: 'AU', INR: 'IN',
}

// Photon API returns full country names; map to our codes
const COUNTRY_CODE_MAP: Record<string, string> = {
  'United States': 'US', 'United States of America': 'US', US: 'US', USA: 'US',
  'United Kingdom': 'GB', UK: 'GB', GB: 'GB',
  Canada: 'CA', CA: 'CA',
  Australia: 'AU', AU: 'AU',
  India: 'IN', IN: 'IN',
  'United Arab Emirates': 'AE', AE: 'AE',
  Singapore: 'SG', SG: 'SG',
  'New Zealand': 'NZ', NZ: 'NZ',
  'South Africa': 'ZA', ZA: 'ZA',
  Malaysia: 'MY', MY: 'MY',
}

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', IN: 'INR',
}

type Props = {
  eventType: string
  onNext: (details: EventDetails) => void
  onBack: () => void
}

export function Step2EventDetails({ eventType, onNext, onBack }: Props) {
  const [form, setForm] = useState<EventDetails>({
    event_name: '',
    event_date: '',
    city: '',
    state: '',
    venue: '',
    guest_count: 100,
    total_budget: 5000,
    currency: 'USD',
    country: 'US',
  })
  const [error, setError] = useState('')

  function validate() {
    if (!form.event_name) return 'Event name is required.'
    if (!form.event_date) return 'Date is required.'
    if (new Date(form.event_date) < new Date()) return 'Event date must be in the future.'
    if (!form.city) return 'City is required.'
    if (form.guest_count < 1) return 'Guest count must be at least 1.'
    if (form.total_budget < 100) return 'Budget must be at least 100.'
    return null
  }

  function handleNext() {
    const err = validate()
    if (err) { setError(err); return }
    onNext(form)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-text-1">Event details</h2>
        <p className="text-text-4 text-sm mt-1 capitalize">Planning a {eventType}</p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-1">
        <Label>Event name *</Label>
        <Input
          value={form.event_name}
          onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
          placeholder="Priya & Arjun's Wedding"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1">
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.event_date ? form.event_date.split('T')[0] : ''}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setForm(f => ({ ...f, event_date: new Date(e.target.value).toISOString() }))}
          />
        </div>
        <div className="space-y-1">
          <Label>City *</Label>
          <CityInput
            value={form.city}
            onChange={(city, meta) => {
              setForm(f => ({
                ...f,
                city,
                ...(meta?.state ? { state: meta.state } : {}),
                ...(meta?.country && COUNTRY_CODE_MAP[meta.country] ? { country: COUNTRY_CODE_MAP[meta.country], currency: COUNTRY_CURRENCY[COUNTRY_CODE_MAP[meta.country]] ?? 'USD' } : {}),
              }))
            }}
            placeholder="Search city…"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Venue name <span className="text-text-4">(optional)</span></Label>
        <Input
          value={form.venue}
          onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
          placeholder="The Grand Banqueting Hall"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-1">
          <Label>Guests *</Label>
          <Input
            type="number"
            min={1}
            value={form.guest_count}
            onChange={e => setForm(f => ({ ...f, guest_count: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Total budget *</Label>
          <Input
            type="number"
            min={100}
            value={form.total_budget}
            onChange={e => setForm(f => ({ ...f, total_budget: parseFloat(e.target.value) || 100 }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v: string | null) => {
            const cur = v ?? 'USD'
            setForm(f => ({ ...f, currency: cur, country: CURRENCY_TO_COUNTRY[cur] ?? 'US' }))
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
              <SelectItem value="CAD">CAD $</SelectItem>
              <SelectItem value="AUD">AUD $</SelectItem>
              <SelectItem value="INR">INR ₹</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} className="flex-1 bg-brand hover:bg-brand-hover">
          Review & Create →
        </Button>
      </div>
    </div>
  )
}
