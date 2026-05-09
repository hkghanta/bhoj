'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type EventContext = {
  responder_name: string
  vendor_type: string
  service_notes: string | null
  menu_preference: {
    cuisine_preferences: string[]
    service_style: string | null
    special_notes: string | null
  } | null
  event: {
    event_type: string
    fuzzy_date: string
    city: string
    guest_count: number
    budget_band: string
    currency: string
  }
}

const PRICE_UNITS = [
  { value: 'per_head', label: 'Per person / head' },
  { value: 'per_event', label: 'Per event (flat fee)' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_day', label: 'Per day' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: "✅ I'm available on this date" },
  { value: 'need_to_confirm', label: '⏳ I need to confirm availability' },
  { value: 'not_available', label: "❌ I'm not available — but can suggest an alternative" },
]

function StatusScreen({ icon, title, subtitle, cta }: {
  icon: string
  title: string
  subtitle: string
  cta?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream-2 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-cream-2 rounded-3xl border border-brand-border shadow-xl p-10 text-center">
        <div className="text-6xl mb-5">{icon}</div>
        <h2 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1 mb-2">{title}</h2>
        <p className="text-text-3 leading-relaxed mb-6">{subtitle}</p>
        {cta}
      </div>
    </div>
  )
}

export default function QuoteRequestPage() {
  const { token } = useParams<{ token: string }>()

  const [context, setContext] = useState<EventContext | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'already_submitted' | 'not_found'>('loading')

  // Form state
  const [quotedPrice, setQuotedPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('per_head')
  const [whatIncludes, setWhatIncludes] = useState('')
  const [serviceDetails, setServiceDetails] = useState('')
  const [availability, setAvailability] = useState('available')
  const [extraNotes, setExtraNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch(`/api/quote-request/${token}`)
      .then(async r => {
        if (r.status === 404) { setLoadState('not_found'); return }
        if (r.status === 409) { setLoadState('already_submitted'); return }
        if (!r.ok) { setLoadState('not_found'); return }
        const data = await r.json()
        setContext(data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('not_found'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    const body = {
      quoted_price: parseFloat(quotedPrice),
      price_unit: priceUnit,
      what_includes: whatIncludes,
      service_details: serviceDetails || undefined,
      availability_note: availability,
      extra_notes: extraNotes || undefined,
    }

    try {
      const res = await fetch(`/api/quote-request/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        setLoadState('already_submitted')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setSubmitState('error')
        return
      }

      setSubmitState('success')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setSubmitState('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-text-3 text-sm">Loading your quote request…</p>
        </div>
      </div>
    )
  }

  if (loadState === 'not_found') {
    return (
      <StatusScreen
        icon="🔍"
        title="Link not found"
        subtitle="This quote request link is invalid or has expired. Please check your message for the correct link."
      />
    )
  }

  if (loadState === 'already_submitted') {
    return (
      <StatusScreen
        icon="✅"
        title="Quote already submitted"
        subtitle="You've already sent your quote for this event. The host will be in touch if they'd like to proceed."
      />
    )
  }

  if (submitState === 'success') {
    return (
      <StatusScreen
        icon="🎉"
        title="Quote sent!"
        subtitle={`Your quote has been delivered to the host. They'll review it and reach out if they'd like to book you for their ${context?.event.event_type.toLowerCase().replace('_', ' ')}.`}
        cta={
          <div className="space-y-4">
            <p className="text-sm text-text-4">You can close this tab.</p>
            <div className="bg-cream border border-brand-border rounded-2xl p-5 text-center">
              <p className="font-semibold text-text-1 mb-1">Want more leads like this?</p>
              <p className="text-sm text-text-2 mb-3">
                Create your free OneSeva profile to get notified about new events in your area, manage bookings, and build your reputation with reviews.
              </p>
              <Link
                href="/register?role=vendor"
                className="inline-block bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Create free profile →
              </Link>
            </div>
          </div>
        }
      />
    )
  }

  if (!context) return null

  const { event, responder_name, vendor_type, service_notes, menu_preference } = context
  const vendorTypeLabel = vendor_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream-2">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header greeting */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-cream border border-brand-border text-brand text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <span>📋</span> Quote Request
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-1 mb-2">
            Hi {responder_name}!
          </h1>
          <p className="text-text-3 text-lg">
            You've been invited to quote for a <strong className="text-text-2">{vendorTypeLabel}</strong> service.
          </p>
        </div>

        {/* Event context card */}
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a0904] to-[#3d1f10] px-6 py-4">
            <h2 className="text-white font-bold text-lg">Event Details</h2>
            <p className="text-white/60 text-sm mt-0.5">Here's what we know about this event</p>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-1">Event Type</p>
              <p className="text-text-1 font-semibold">{event.event_type.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-1">Date</p>
              <p className="text-text-1 font-semibold">{event.fuzzy_date}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-1">City</p>
              <p className="text-text-1 font-semibold">{event.city}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-1">Guest Count</p>
              <p className="text-text-1 font-semibold">{event.guest_count} guests</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-1">Budget Range</p>
              <p className="text-text-1 font-semibold">{event.budget_band}</p>
            </div>
            {service_notes && (
              <div className="col-span-2 bg-cream border border-brand-border rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Host's Notes</p>
                <p className="text-text-2 text-sm">{service_notes}</p>
              </div>
            )}
            {menu_preference && (
              <div className="col-span-2 border-t border-brand-border pt-4">
                <p className="text-xs font-bold text-text-4 uppercase tracking-wider mb-2">Catering Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {menu_preference.cuisine_preferences.map(c => (
                    <span key={c} className="text-xs bg-cream text-brand border border-brand-border px-2.5 py-1 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                  {menu_preference.service_style && (
                    <span className="text-xs bg-cream-2 text-text-2 border border-brand-border px-2.5 py-1 rounded-full font-medium">
                      {menu_preference.service_style.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                {menu_preference.special_notes && (
                  <p className="text-sm text-text-3 mt-2 italic">{menu_preference.special_notes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quote form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Pricing card */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-lg text-text-1">Your Price</h3>
              <p className="text-sm text-text-3 mt-0.5">Enter the amount you'd charge for this event</p>
            </div>
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-text-2 mb-1.5">
                    Amount ({event.currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 font-semibold text-sm">
                      {event.currency}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={quotedPrice}
                      onChange={e => setQuotedPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 border border-brand-border rounded-xl text-text-1 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-text-2 mb-1.5">
                    Pricing Basis
                  </label>
                  <select
                    value={priceUnit}
                    onChange={e => setPriceUnit(e.target.value)}
                    className="w-full px-3 py-3 border border-brand-border rounded-xl text-text-1 text-base bg-white dark:bg-cream-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  >
                    {PRICE_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* What's included card */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-lg text-text-1">What's Included</h3>
              <p className="text-sm text-text-3 mt-0.5">Describe what this price covers — menu, setup, service, etc.</p>
            </div>
            <div className="p-6 sm:p-8">
              <textarea
                required
                minLength={5}
                maxLength={1000}
                value={whatIncludes}
                onChange={e => setWhatIncludes(e.target.value)}
                placeholder="e.g. Full buffet setup for 150 guests including welcome drinks, 3-course meal, dessert table, and 2 service staff. Includes all crockery and linen."
                rows={4}
                className="w-full px-4 py-3 border border-brand-border rounded-xl text-text-1 text-base resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-text-4"
              />
              <p className="text-xs text-text-4 mt-1.5 text-right">{whatIncludes.length}/1000</p>
            </div>
          </div>

          {/* Service details card (optional) */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-lg text-text-1">Service Details <span className="text-text-4 font-normal text-sm">(optional)</span></h3>
              <p className="text-sm text-text-3 mt-0.5">Any additional information about your service, experience, or team</p>
            </div>
            <div className="p-6 sm:p-8">
              <textarea
                maxLength={1000}
                value={serviceDetails}
                onChange={e => setServiceDetails(e.target.value)}
                placeholder="e.g. 8 years experience in Indian weddings. Our team specialises in North Indian cuisine and live chaat counters. Fully insured, references available."
                rows={3}
                className="w-full px-4 py-3 border border-brand-border rounded-xl text-text-1 text-base resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-text-4"
              />
              <p className="text-xs text-text-4 mt-1.5 text-right">{serviceDetails.length}/1000</p>
            </div>
          </div>

          {/* Availability card */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-lg text-text-1">Your Availability</h3>
              <p className="text-sm text-text-3 mt-0.5">For {event.fuzzy_date} in {event.city}</p>
            </div>
            <div className="p-6 sm:p-8 space-y-2.5">
              {AVAILABILITY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    availability === opt.value
                      ? 'border-brand bg-brand/5'
                      : 'border-brand-border hover:border-brand/40 bg-white dark:bg-cream-2'
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={opt.value}
                    checked={availability === opt.value}
                    onChange={() => setAvailability(opt.value)}
                    className="accent-brand flex-shrink-0"
                  />
                  <span className={`text-sm font-medium ${availability === opt.value ? 'text-text-1' : 'text-text-2'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Extra notes card (optional) */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-lg text-text-1">Extra Notes <span className="text-text-4 font-normal text-sm">(optional)</span></h3>
              <p className="text-sm text-text-3 mt-0.5">Anything else you'd like the host to know?</p>
            </div>
            <div className="p-6 sm:p-8">
              <textarea
                maxLength={500}
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                placeholder="e.g. Happy to arrange a tasting session. Please call me to discuss the menu in more detail."
                rows={2}
                className="w-full px-4 py-3 border border-brand-border rounded-xl text-text-1 text-base resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-text-4"
              />
            </div>
          </div>

          {/* Error state */}
          {submitState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
              <strong>Could not submit:</strong> {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || !quotedPrice || !whatIncludes}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending quote…
              </>
            ) : (
              <>
                Send my quote →
              </>
            )}
          </button>

          <p className="text-center text-xs text-text-4 pb-4">
            By submitting you agree to be contacted by the event host via OneSeva.
          </p>
        </form>
      </div>
    </div>
  )
}
