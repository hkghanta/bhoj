'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  CheckCircle2,
  Globe,
  MapPin,
  Sparkles,
  AlertCircle,
  Send,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ServiceConfig = {
  vendor_type: string
  label: string
  icon: string
  service_class: string // 'BUSINESS' | 'INDIVIDUAL'
  is_enabled: boolean
}

type EventRequest = {
  id: string
  service_notes: string | null
  public_token: string
  public_status: string // 'OPEN' | 'FILLED'
  menu_preference: Record<string, unknown> | null
  match_count: number
  response_count: number
}

type Vendor = {
  id: string
  business_name: string
  city: string
  profile_type: string // 'BUSINESS' | 'INDIVIDUAL'
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  avg_rating: number | null
  is_verified: boolean
  score: number
  price_per_head_min: number | null
  price_per_head_max: number | null
  currency: string
}

type PageData = {
  service_config: ServiceConfig
  event_request: EventRequest | null
  vendors: Vendor[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function vendorDisplayName(v: Vendor): string {
  if (v.profile_type === 'INDIVIDUAL' && v.first_name) {
    return `${v.first_name}${v.last_name ? ` ${v.last_name}` : ''}`
  }
  return v.business_name
}

function formatPrice(min: number | null, max: number | null, currency: string): string | null {
  if (min === null && max === null) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)} /head`
  if (min !== null) return `From ${fmt(min)} /head`
  return `Up to ${fmt(max!)} /head`
}

// Score to a 0-100 visual indicator — scores are arbitrary floats from ranking algo
function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-brand'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-gray-300'
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 py-8 px-4 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-cream-2 rounded-full w-20" />
        <div className="h-3 bg-cream-2 rounded-full w-3" />
        <div className="h-3.5 bg-cream-2 rounded-full w-28" />
      </div>

      {/* Hero */}
      <div className="h-10 bg-cream-2 rounded-2xl w-56" />

      {/* Requirements panel */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="h-5 bg-cream-2 rounded w-36" />
          <div className="h-5 w-5 bg-cream-2 rounded-full" />
        </div>
        <div className="border-t border-brand-border px-5 py-5 space-y-3">
          <div className="h-24 bg-cream-2 rounded-xl" />
          <div className="h-8 bg-cream-2 rounded-lg w-36" />
        </div>
      </div>

      {/* Vendor cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-brand-border rounded-2xl p-4 flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-cream-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-cream-2 rounded w-32" />
            <div className="h-3 bg-cream-2 rounded w-20" />
            <div className="h-3 bg-cream-2 rounded w-28" />
          </div>
          <div className="h-8 w-28 bg-cream-2 rounded-lg self-center" />
        </div>
      ))}
    </div>
  )
}

// ── Requirements Form ─────────────────────────────────────────────────────────

function RequirementsForm({
  initialNotes,
  onSave,
  saving,
}: {
  initialNotes: string
  onSave: (notes: string) => Promise<void>
  saving: boolean
}) {
  const [notes, setNotes] = useState(initialNotes)
  const changed = notes !== initialNotes

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor="service-notes" className="block text-sm font-semibold text-text-2 mb-1.5">
          Requirements &amp; special notes
        </label>
        <p className="text-xs text-text-4 mb-2.5">
          The more detail you share, the better quotes you'll receive. Include dates, guest
          count, dietary needs, budget range, or anything else relevant.
        </p>
        <textarea
          id="service-notes"
          className="w-full border border-brand-border rounded-xl p-3.5 text-sm leading-relaxed min-h-[120px] resize-none
                     bg-cream/40 placeholder:text-text-4 text-text-1
                     focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50
                     transition-all"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. 150 guests, vegetarian + Jain options, North Indian menu with live chaat station, event on 15 Dec in Bangalore…"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-4">{notes.length > 0 ? `${notes.length} characters` : ''}</p>
        <Button
          onClick={() => onSave(notes)}
          disabled={saving || !notes.trim()}
          className={`gap-2 transition-all ${
            changed && notes.trim()
              ? 'bg-brand hover:bg-brand-hover text-white shadow-[0_4px_12px_rgba(232,85,16,0.25)]'
              : 'bg-brand hover:bg-brand-hover text-white'
          }`}
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Save requirements
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Vendor Card ───────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  onRequestQuote,
  requesting,
  requestingId,
}: {
  vendor: Vendor
  onRequestQuote: (vendorId: string) => void
  requesting: boolean
  requestingId: string | null
}) {
  const name = vendorDisplayName(vendor)
  const priceStr = formatPrice(vendor.price_per_head_min, vendor.price_per_head_max, vendor.currency)
  const isThisLoading = requesting && requestingId === vendor.id
  const avatarBg = [
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700',
  ][name.charCodeAt(0) % 5]

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4 sm:p-5 flex gap-4 items-start
                    hover:border-brand/40 hover:shadow-[0_4px_16px_rgba(26,9,4,0.06)]
                    transition-all duration-200 group">
      {/* Avatar */}
      {vendor.profile_photo_url ? (
        <img
          src={vendor.profile_photo_url}
          alt={name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-brand-border group-hover:ring-brand/20 transition-all"
        />
      ) : (
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black
                      ring-2 ring-brand-border group-hover:ring-brand/20 transition-all ${avatarBg}`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-text-1 text-sm leading-tight">{name}</p>
              {vendor.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700
                                 border border-green-200 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-4">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {vendor.city}
            </div>
          </div>

          {/* Match score dot */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1" title={`Match score: ${vendor.score.toFixed(0)}`}>
              <div className={`w-2 h-2 rounded-full ${scoreColor(vendor.score)}`} />
              <span className="text-[10px] text-text-4 font-medium">{vendor.score.toFixed(0)}% match</span>
            </div>
          </div>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {vendor.avg_rating !== null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${
                    s <= Math.round(vendor.avg_rating!)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              ))}
              <span className="text-xs font-semibold text-text-2 ml-0.5">
                {vendor.avg_rating.toFixed(1)}
              </span>
            </div>
          )}
          {priceStr && (
            <span className="text-xs font-medium text-text-3 bg-cream px-2 py-0.5 rounded-full">
              {priceStr}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 self-center">
        <Button
          size="sm"
          onClick={() => onRequestQuote(vendor.id)}
          disabled={requesting}
          className={`text-xs font-semibold transition-all ${
            isThisLoading
              ? 'bg-brand/70 text-white'
              : 'bg-brand hover:bg-brand-hover text-white shadow-[0_2px_8px_rgba(232,85,16,0.2)] hover:shadow-[0_4px_12px_rgba(232,85,16,0.3)]'
          }`}
        >
          {isThisLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Sending…
            </span>
          ) : (
            'Request Quote'
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Public Request Panel ──────────────────────────────────────────────────────

function PublicRequestPanel({
  req,
  slug,
}: {
  req: EventRequest | null
  slug: string
}) {
  if (!req) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-cream">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe className="h-[18px] w-[18px] text-brand" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm">Public request board</p>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">
                Once you save your requirements, your request will be posted publicly — vendors,
                freelancers, and contacts in your area can discover it and send you their best offers.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isOpen = req.public_status === 'OPEN'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-orange-50 via-amber-50/40 to-cream">
      {/* Decorative top bar */}
      <div className="h-0.5 bg-gradient-to-r from-brand via-amber-400 to-brand/30" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm leading-tight">Your request is live</p>
              <p className="text-xs text-text-4">
                {req.response_count > 0
                  ? `${req.response_count} response${req.response_count !== 1 ? 's' : ''} received`
                  : 'Waiting for responses'}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
              isOpen
                ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {isOpen ? '● Open' : '✓ Filled'}
          </span>
        </div>

        <p className="text-xs text-text-3 leading-relaxed mb-3.5">
          Anyone — vendors, freelancers, or your own contacts — can find this request and respond.
          Share the link below to get faster replies.
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/requests/${slug}/${req.public_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand
                       bg-white border border-brand/20 rounded-lg px-3 py-1.5
                       hover:bg-cream hover:border-brand/40 transition-all"
          >
            View public page
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-text-4">· Share to get faster responses</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServicePage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const router = useRouter()

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function load() {
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}`)
      if (!res.ok) {
        setLoading(false)
        return
      }
      const json = (await res.json()) as PageData
      setData(json)
      // Auto-collapse form if requirements already saved
      if (json.event_request?.service_notes) setFormOpen(false)
    } catch {
      // network error — leave data null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, slug])

  // Clear success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  async function saveRequirements(notes: string) {
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_notes: notes }),
      })
      if (res.ok) {
        setSuccessMsg('Requirements saved! Vendors matched below.')
        if (successTimerRef.current) clearTimeout(successTimerRef.current)
        successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000)
        await load()
        setFormOpen(false)
      } else {
        setError('Could not save requirements. Please try again.')
      }
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  async function requestQuote(vendorId: string) {
    setRequesting(true)
    setRequestingId(vendorId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}/request-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId }),
      })
      if (res.ok) {
        router.push(`/events/${eventId}/quotes`)
      } else {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not send quote request. Please try again.')
        setRequesting(false)
        setRequestingId(null)
      }
    } catch {
      setError('Network error — please check your connection.')
      setRequesting(false)
      setRequestingId(null)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />

  // ── Not found / disabled ─────────────────────────────────────────────────

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-2 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-text-4" />
        </div>
        <h2 className="text-lg font-bold text-text-1 mb-1">Service unavailable</h2>
        <p className="text-sm text-text-3 mb-6">
          This service isn't enabled yet or could not be loaded.
        </p>
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline"
        >
          ← Back to event dashboard
        </Link>
      </div>
    )
  }

  const { service_config: svc, event_request: req, vendors } = data
  const isBusinessService = svc.service_class === 'BUSINESS'
  const hasReq = !!req
  const hasNotes = !!req?.service_notes

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-6 px-4">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors font-medium">
          Event
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-text-2 font-semibold">
          {svc.icon} {svc.label}
        </span>
      </div>

      {/* ── Page heading ── */}
      <div>
        <div className="flex items-center gap-3 mb-0.5">
          <span className="text-3xl">{svc.icon}</span>
          <h1 className="text-2xl font-black text-text-1 leading-tight">{svc.label}</h1>
        </div>
        <p className="text-sm text-text-3 ml-[calc(2rem+0.75rem)]">
          {hasReq
            ? 'Your requirements are saved. Review matched vendors below or update your notes.'
            : `Tell us what you need and we'll match you with the best ${svc.label.toLowerCase()} vendors.`}
        </p>
      </div>

      {/* ── Success toast ── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Requirements panel ── */}
      <div
        className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(26,9,4,0.05)]"
      >
        {/* Panel header — always visible toggle */}
        <button
          type="button"
          aria-expanded={formOpen}
          onClick={() => setFormOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-text-1 text-sm">Your requirements</span>
            {hasNotes && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700
                               border border-green-200 rounded-full px-1.5 py-0.5 font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!formOpen && hasNotes && (
              <span className="text-xs text-text-4 italic line-clamp-1 max-w-[200px] text-right">
                {req?.service_notes}
              </span>
            )}
            {formOpen
              ? <ChevronUp className="h-4 w-4 text-text-4 flex-shrink-0" />
              : <ChevronDown className="h-4 w-4 text-text-4 flex-shrink-0" />
            }
          </div>
        </button>

        {/* Collapsible form body */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            formOpen ? 'max-h-[600px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'
          }`}
        >
          <div className="px-5 pb-5 border-t border-brand-border pt-4">
            <RequirementsForm
              initialNotes={req?.service_notes ?? ''}
              onSave={saveRequirements}
              saving={saving}
            />
          </div>
        </div>
      </div>

      {/* ── Matched vendors ── */}
      {vendors.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-base font-black text-text-1">
                {isBusinessService
                  ? `${svc.label} vendors on OneSeva`
                  : `${svc.label} professionals on OneSeva`}
              </h2>
              <p className="text-xs text-text-4 mt-0.5">
                Ranked by relevance · {vendors.length} found
              </p>
            </div>
            {hasReq && (
              <span className="inline-flex items-center gap-1 text-xs text-brand font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Matched
              </span>
            )}
          </div>

          <div className="space-y-3">
            {vendors.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                onRequestQuote={requestQuote}
                requesting={requesting}
                requestingId={requestingId}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Empty state */
        hasReq && (
          <div className="bg-white border border-brand-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cream-2 flex items-center justify-center mx-auto mb-3.5">
              <span className="text-2xl">{svc.icon}</span>
            </div>
            <h3 className="font-bold text-text-1 text-sm mb-1">No vendors found yet</h3>
            <p className="text-xs text-text-3 max-w-xs mx-auto leading-relaxed">
              We're building our vendor network. Your public request is live — vendors can
              find and respond to it directly.
            </p>
          </div>
        )
      )}

      {/* ── Public request board panel ── */}
      {hasReq && <PublicRequestPanel req={req} slug={slug} />}

      {/* ── Google Places stub (business services only) ── */}
      {isBusinessService && (
        <div className="relative overflow-hidden bg-white border border-brand-border rounded-2xl p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cream via-transparent to-transparent pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cream-2 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="h-[18px] w-[18px] text-text-3" />
            </div>
            <div>
              <p className="font-bold text-text-1 text-sm">Other local businesses</p>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">
                Local {svc.label.toLowerCase()} businesses not yet on OneSeva will appear here.
                Call them directly to enquire about pricing and availability.
              </p>
              <p className="text-[11px] text-text-4 mt-2 italic">
                Google Places integration — coming soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="pb-6" />
    </div>
  )
}
