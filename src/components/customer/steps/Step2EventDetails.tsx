'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

type EventDetails = {
  event_name: string
  event_date: string
  city: string
  venue: string
  guest_count: number
  total_budget: number
  currency: string
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
    venue: '',
    guest_count: 100,
    total_budget: 5000,
    currency: 'GBP',
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
        <h2 className="text-xl font-semibold text-gray-900">Event details</h2>
        <p className="text-gray-500 text-sm mt-1 capitalize">Planning a {eventType}</p>
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

      <div className="grid grid-cols-2 gap-4">
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
          <Input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="London"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Venue name <span className="text-gray-400">(optional)</span></Label>
        <Input
          value={form.venue}
          onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
          placeholder="The Grand Banqueting Hall"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
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
          <Select value={form.currency} onValueChange={(v: string | null) => setForm(f => ({ ...f, currency: v ?? 'GBP' }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP £</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="CAD">CAD $</SelectItem>
              <SelectItem value="AUD">AUD $</SelectItem>
              <SelectItem value="INR">INR ₹</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} className="flex-1 bg-orange-600 hover:bg-orange-700">
          Review & Create →
        </Button>
      </div>
    </div>
  )
}
