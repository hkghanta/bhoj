'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { CityInput } from '@/components/ui/CityInput'

const VENDOR_TYPES = [
  { value: 'CATERER',       label: 'Catering' },
  { value: 'PHOTOGRAPHER',  label: 'Photography' },
  { value: 'VIDEOGRAPHER',  label: 'Videography' },
  { value: 'DJ',            label: 'DJ / Music' },
  { value: 'DECORATOR',     label: 'Decoration / Mandap' },
  { value: 'MEHENDI_ARTIST',label: 'Mehndi Artist' },
  { value: 'MAKEUP_HAIR',   label: 'Bridal Makeup & Hair' },
  { value: 'FLORIST',       label: 'Florist' },
  { value: 'DHOL_PLAYER',   label: 'Dhol Player' },
  { value: 'LIVE_BAND',     label: 'Live Band' },
]

const EVENT_TYPES = ['Wedding', 'Engagement', 'Birthday', 'Corporate', 'Mehndi / Sangeet', 'Baby Shower', 'Anniversary', 'Other']

export default function ConciergePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    event_date: '',
    event_type: '',
    guest_count: '',
    budget: '',
    city: '',
    vendor_types: [] as string[],
    notes: '',
  })

  function toggleType(v: string) {
    setForm(f => ({
      ...f,
      vendor_types: f.vendor_types.includes(v)
        ? f.vendor_types.filter(t => t !== v)
        : [...f.vendor_types, v],
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.city || form.vendor_types.length === 0) {
      setError('Please enter your city and select at least one vendor type.')
      return
    }
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = await res.json()
      if (d.error === 'Unauthorized') router.push('/login?next=/concierge')
      else setError(d.error ?? 'Something went wrong. Please try again.')
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-brand-border p-10 max-w-md w-full text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1 mb-2">Request received!</h1>
          <p className="text-text-2 mb-6">
            We'll personally curate 3–5 vetted vendors for your event and be in touch within 24 hours.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-brand text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand/90 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cream text-brand text-sm font-medium px-4 py-1.5 rounded-full border border-brand mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            OneSeva Concierge
          </div>
          <h1 className="text-3xl font-bold text-text-1">We'll find your vendors for you</h1>
          <p className="text-text-2 mt-3 max-w-lg mx-auto">
            Tell us about your event and we'll personally recommend vetted South Asian wedding vendors in your area — within 24 hours.
          </p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-brand-border p-8 space-y-6">

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-text-1 mb-1.5">
              City <span className="text-brand">*</span>
            </label>
            <CityInput
              value={form.city}
              onChange={city => setForm(f => ({ ...f, city }))}
              placeholder="New York, Chicago, Houston…"
              required
            />
          </div>

          {/* Event type + date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-1 mb-1.5">Event type</label>
              <select
                value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full border border-brand-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="">Select…</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-1 mb-1.5">Event date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                className="w-full border border-brand-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          {/* Guests + budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-1 mb-1.5">Guest count</label>
              <input
                type="number"
                min={1}
                value={form.guest_count}
                onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))}
                placeholder="e.g. 200"
                className="w-full border border-brand-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-1 mb-1.5">Rough budget</label>
              <input
                type="text"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="e.g. £8,000–12,000"
                className="w-full border border-brand-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          {/* Vendor types */}
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              What do you need? <span className="text-brand">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VENDOR_TYPES.map(({ value, label }) => {
                const selected = form.vendor_types.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-brand bg-cream text-brand'
                        : 'border-brand-border text-text-2 hover:border-brand/50'
                    }`}
                  >
                    {selected ? '✓ ' : ''}{label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-1 mb-1.5">
              Anything else we should know?
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Dietary requirements, specific themes, cultural traditions, previous vendors tried…"
              className="w-full border border-brand-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Request concierge recommendations →'}
          </button>

          <p className="text-xs text-text-3 text-center">
            A real person from OneSeva will review your request and send personalised recommendations within 24 hours. Free service.
          </p>
        </form>
      </div>
    </div>
  )
}
