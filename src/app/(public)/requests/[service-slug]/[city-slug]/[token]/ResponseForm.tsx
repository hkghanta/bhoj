'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Send, ArrowRight, Sparkles } from 'lucide-react'

type Props = {
  token: string
  serviceName: string
  city: string
}

export function ResponseForm({ token, serviceName, city }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pitch, setPitch] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const pitchMax = 500
  const pitchLeft = pitchMax - pitch.length
  const canSubmit = name.trim().length >= 2 && pitch.trim().length >= 10

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/requests/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          pitch,
          price_note: priceNote || undefined,
          portfolio_url: portfolioUrl || undefined,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to submit. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-lg">
        {/* Decorative gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 ring-8 ring-green-50/60">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Response sent!</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            The event host will review your response and reach out if you&apos;re a good fit.
            Make sure your contact details are reachable.
          </p>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  Get more leads like this
                </p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Join OneSeva to receive direct {serviceName} enquiries in {city} — no middlemen, no fees on bookings.
                </p>
                <a
                  href="/register"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Create your free profile <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-lg">
      {/* Decorative gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">I can help with this</h3>
          <p className="text-sm text-gray-500 mt-1">
            Introduce yourself and tell the host why you&apos;re the right fit.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="resp-name">
              Your name <span className="text-red-400">*</span>
            </label>
            <Input
              id="resp-name"
              type="text"
              placeholder="e.g. Ravi Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="resp-phone">
              Phone number
              <span className="ml-1.5 text-xs font-normal text-gray-400">(optional, for WhatsApp contact)</span>
            </label>
            <Input
              id="resp-phone"
              type="tel"
              placeholder="+44 7700 900000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Pitch */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="resp-pitch">
                Why you&apos;re a great fit <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs tabular-nums ${pitchLeft < 50 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                {pitch.length}/{pitchMax}
              </span>
            </div>
            <Textarea
              id="resp-pitch"
              placeholder="Tell the host about your experience, style, and what makes your service special for this event…"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              maxLength={pitchMax}
              className="min-h-28 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">Minimum 10 characters. Be specific — mention relevant experience.</p>
          </div>

          {/* Price note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="resp-price">
              Pricing indication
              <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <Input
              id="resp-price"
              type="text"
              placeholder="e.g. From £800 for 50 guests, or let's discuss"
              value={priceNote}
              onChange={(e) => setPriceNote(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="resp-portfolio">
              Portfolio link
              <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <Input
              id="resp-portfolio"
              type="url"
              placeholder="Instagram, website, or portfolio link"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="h-10"
            />
          </div>

          <Button
            onClick={submit}
            disabled={submitting || !canSubmit}
            className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl gap-2 text-sm"
          >
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send my response
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-400">
            By responding you agree to be contacted by the event host.
          </p>
        </div>
      </div>
    </div>
  )
}
