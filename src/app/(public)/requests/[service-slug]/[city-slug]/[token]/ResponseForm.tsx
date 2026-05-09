'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Send, ArrowRight, Lock, AlertTriangle } from 'lucide-react'

type VendorInfo = {
  name: string
  businessName: string
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
}

type Props = {
  token: string
  serviceName: string
  city: string
  vendor: VendorInfo | null
}

export function ResponseForm({ token, serviceName, city, vendor }: Props) {
  const [pitch, setPitch] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const pitchMax = 500
  const canSubmit = pitch.trim().length >= 10

  async function submit() {
    if (!canSubmit || !vendor) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/requests/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vendor.name,
          phone: vendor.phone ?? undefined,
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
      setError('Network error. Please check your connection.')
    }
    setSubmitting(false)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1 w-full bg-brand" />
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-text-1 mb-2">Response sent!</h3>
          <p className="text-sm text-text-3 leading-relaxed">
            The event host will review your response and reach out if you&apos;re a good fit.
          </p>
        </div>
      </div>
    )
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!vendor) {
    return (
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-7 flex flex-col gap-5">
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-text-1 mb-1">Want to respond?</h3>
            <p className="text-sm text-text-3 leading-relaxed">
              Sign in or create a free vendor account — takes 2 minutes, respond immediately.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/register/vendor?next=/requests/${encodeURIComponent(token)}`}
              className="w-full flex items-center justify-center gap-2 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-hover transition-colors text-sm"
            >
              Create free vendor account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/login?role=vendor&next=/requests/${encodeURIComponent(token)}`}
              className="w-full flex items-center justify-center py-3 text-sm font-semibold text-text-3 hover:text-text-1 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Unverified vendor ──────────────────────────────────────────────────────
  if (!vendor.emailVerified || !vendor.phoneVerified) {
    return (
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1 w-full bg-amber-400" />
        <div className="p-7 flex flex-col items-center text-center gap-5">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-text-1 mb-1">Verify your account first</h3>
            <p className="text-sm text-text-3 leading-relaxed">
              You need to verify your {!vendor.emailVerified ? 'email' : 'phone number'} before responding to requests.
            </p>
          </div>
          <Link
            href="/verify"
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors text-sm"
          >
            Verify my account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ── Verified vendor — show form ────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1 w-full bg-brand" />
      <div className="p-6">
        <h3 className="text-base font-extrabold tracking-tight text-text-1 mb-1">I can help with this</h3>
        <p className="text-xs text-text-3 mb-5">Responding as <span className="font-semibold text-text-2">{vendor.businessName}</span></p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Pitch */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-sm font-semibold text-text-2" htmlFor="resp-pitch">
                Why you're the right fit <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs tabular-nums ${pitch.length > 450 ? 'text-brand font-medium' : 'text-text-4'}`}>
                {pitch.length}/{pitchMax}
              </span>
            </div>
            <textarea
              id="resp-pitch"
              placeholder={`Tell the host about your experience with ${serviceName.toLowerCase()} in ${city}, your style, and what makes you the right choice…`}
              value={pitch}
              onChange={e => setPitch(e.target.value)}
              maxLength={pitchMax}
              rows={5}
              className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-text-4"
            />
            <p className="mt-1 text-xs text-text-4">Be specific — mention relevant experience, past events, team size.</p>
          </div>

          {/* Price note */}
          <div>
            <label className="text-sm font-semibold text-text-2 mb-1.5 block" htmlFor="resp-price">
              Pricing indication <span className="text-text-4 font-normal text-xs">(optional)</span>
            </label>
            <input
              id="resp-price"
              type="text"
              placeholder="e.g. From $2,000 for 150 guests, or happy to discuss"
              value={priceNote}
              onChange={e => setPriceNote(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-text-4"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="text-sm font-semibold text-text-2 mb-1.5 block" htmlFor="resp-portfolio">
              Portfolio / website <span className="text-text-4 font-normal text-xs">(optional)</span>
            </label>
            <input
              id="resp-portfolio"
              type="url"
              placeholder="Instagram, website, or portfolio link"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-text-1 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-text-4"
            />
          </div>

          <button
            onClick={submit}
            disabled={submitting || !canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send my response
              </>
            )}
          </button>

          <p className="text-xs text-center text-text-4">
            By responding you agree to be contacted by the event host.
          </p>
        </div>
      </div>
    </div>
  )
}
