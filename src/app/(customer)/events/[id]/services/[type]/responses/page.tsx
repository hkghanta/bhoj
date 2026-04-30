'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ExternalLink,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  AlertCircle,
  Sparkles,
  UserCheck,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type VendorInfo = {
  business_name: string
  profile_photo_url: string | null
  profile_type: string
  first_name: string | null
  last_name: string | null
}

type Response = {
  id: string
  name: string
  phone: string | null
  pitch: string
  price_note: string | null
  portfolio_url: string | null
  status: string // 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
  vendor: VendorInfo | null
}

type PageData = {
  public_token: string
  public_status: string // 'OPEN' | 'FILLED'
  responses: Response[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function displayName(r: Response): string {
  if (r.vendor) {
    const v = r.vendor
    if (v.profile_type === 'INDIVIDUAL' && v.first_name) {
      return `${v.first_name}${v.last_name ? ` ${v.last_name}` : ''}`
    }
    return v.business_name
  }
  return r.name
}

function avatarColorClass(name: string): string {
  const classes = [
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
  ]
  return classes[name.charCodeAt(0) % classes.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 py-8 px-4 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-cream-2 rounded-full w-20" />
        <div className="h-3 bg-cream-2 rounded-full w-3" />
        <div className="h-3.5 bg-cream-2 rounded-full w-28" />
        <div className="h-3 bg-cream-2 rounded-full w-3" />
        <div className="h-3.5 bg-cream-2 rounded-full w-24" />
      </div>
      <div className="h-10 bg-cream-2 rounded-2xl w-64" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-brand-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-cream-2 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-cream-2 rounded w-40" />
              <div className="h-3 bg-cream-2 rounded w-24" />
            </div>
            <div className="h-6 w-20 bg-cream-2 rounded-full" />
          </div>
          <div className="h-14 bg-cream-2 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-cream-2 rounded-lg" />
            <div className="h-8 w-20 bg-cream-2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Response Card ─────────────────────────────────────────────────────────────

function ResponseCard({
  resp,
  acting,
  onAction,
}: {
  resp: Response
  acting: string | null
  onAction: (action: string, responseId: string) => void
}) {
  const name = displayName(resp)
  const isOnPlatform = !!resp.vendor
  const isPending = resp.status === 'PENDING'
  const isAccepted = resp.status === 'ACCEPTED'
  const isDeclined = resp.status === 'DECLINED'
  const isActing = acting === resp.id
  const avatarBg = avatarColorClass(name)
  const photoUrl = resp.vendor?.profile_photo_url ?? null

  // Card border/bg based on status
  const cardClass = isAccepted
    ? 'bg-white border border-green-200 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_4px_16px_rgba(34,197,94,0.08)]'
    : isDeclined
      ? 'bg-gray-50 border border-gray-200 opacity-60'
      : 'bg-white border border-brand-border hover:border-brand/40 hover:shadow-[0_4px_16px_rgba(26,9,4,0.06)] transition-all duration-200'

  return (
    <div className={`relative rounded-2xl overflow-hidden ${cardClass}`}>
      {/* Accepted left accent bar */}
      {isAccepted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-500 rounded-l-2xl" />
      )}

      <div className={`p-5 ${isAccepted ? 'pl-6' : ''}`}>
        {/* ── Header row ── */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-brand-border"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                          text-base font-black ring-2 ring-brand-border ${avatarBg}`}
            >
              {getInitials(name)}
            </div>
          )}

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-text-1 text-sm leading-tight">{name}</p>
              {isOnPlatform && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700
                                 border border-blue-200 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
                  <UserCheck className="h-2.5 w-2.5" />
                  On OneSeva
                </span>
              )}
            </div>
            <p className="text-xs text-text-4 mt-0.5">{timeAgo(resp.created_at)}</p>
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            {isPending && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700
                               border border-amber-200 rounded-full px-2 py-1 font-semibold">
                <Clock className="h-2.5 w-2.5" />
                Pending
              </span>
            )}
            {isAccepted && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700
                               border border-green-200 rounded-full px-2 py-1 font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Accepted
              </span>
            )}
            {isDeclined && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500
                               border border-gray-200 rounded-full px-2 py-1 font-semibold">
                <XCircle className="h-2.5 w-2.5" />
                Declined
              </span>
            )}
          </div>
        </div>

        {/* ── Pitch ── */}
        <p className="mt-3.5 text-sm text-text-2 leading-relaxed">{resp.pitch}</p>

        {/* ── Price note ── */}
        {resp.price_note && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-brand/8 border border-brand/20 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-brand">{resp.price_note}</span>
          </div>
        )}

        {/* ── Portfolio link ── */}
        {resp.portfolio_url && (
          <div className="mt-2.5">
            <a
              href={resp.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-text-3
                         hover:text-brand transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View portfolio
            </a>
          </div>
        )}

        {/* ── Phone (accepted only) ── */}
        {isAccepted && resp.phone && (
          <div className="mt-3.5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
            <Phone className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-800">{resp.phone}</span>
            <a
              href={`tel:${resp.phone}`}
              className="ml-auto text-xs font-bold text-green-700 hover:underline"
            >
              Call
            </a>
          </div>
        )}

        {/* ── Not on platform callout (accepted only) ── */}
        {isAccepted && !isOnPlatform && (
          <div className="mt-3.5 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-3">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800 leading-tight">
                {resp.name} isn't on OneSeva yet
              </p>
              <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                Invite them to join — they can create a free profile, receive quote requests,
                and grow their business.
              </p>
            </div>
          </div>
        )}

        {/* ── Actions (pending only) ── */}
        {isPending && (
          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-brand-border">
            <Button
              size="sm"
              onClick={() => onAction('accept', resp.id)}
              disabled={!!acting}
              className={`gap-1.5 text-xs font-semibold transition-all ${
                isActing
                  ? 'bg-green-500/70 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_2px_8px_rgba(34,197,94,0.25)] hover:shadow-[0_4px_12px_rgba(34,197,94,0.35)]'
              }`}
            >
              {isActing ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Accepting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accept
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction('decline_response', resp.id)}
              disabled={!!acting}
              className="gap-1.5 text-xs font-semibold text-text-3 border-brand-border
                         hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ publicToken, slug }: { publicToken: string; slug: string }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-2 flex items-center justify-center mx-auto mb-4">
        <Globe className="h-7 w-7 text-text-4" />
      </div>
      <h3 className="font-bold text-text-1 text-base mb-1.5">No responses yet</h3>
      <p className="text-sm text-text-3 max-w-xs mx-auto leading-relaxed mb-5">
        Your request is live — share the public link to get faster replies from vendors and
        freelancers in your area.
      </p>
      <a
        href={`/requests/${slug}/${publicToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand
                   hover:bg-brand-hover rounded-xl px-4 py-2.5 transition-all
                   shadow-[0_4px_12px_rgba(232,85,16,0.25)] hover:shadow-[0_6px_16px_rgba(232,85,16,0.35)]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View &amp; share your public request
      </a>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResponsesPage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [filling, setFilling] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/events/${eventId}/services/${slug}/responses`)
      if (res.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      // network error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, slug])

  async function doAction(action: string, responseId?: string) {
    if (!data) return
    setActing(responseId ?? action)
    setError('')
    try {
      const res = await fetch(`/api/requests/${data.public_token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, response_id: responseId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Action failed. Please try again.')
      } else {
        await load()
      }
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setActing(null)
    }
  }

  async function markFilled() {
    setFilling(true)
    setError('')
    await doAction('fill')
    setFilling(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />

  // ── Not found ──────────────────────────────────────────────────────────────

  if (notFound || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-2 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-text-4" />
        </div>
        <h2 className="text-lg font-bold text-text-1 mb-1">No request found</h2>
        <p className="text-sm text-text-3 mb-6">
          You haven't posted a public request for this service yet. Go to the service page to set
          up your requirements first.
        </p>
        <Link
          href={`/events/${eventId}/services/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline"
        >
          ← Go to service page
        </Link>
      </div>
    )
  }

  const { public_token: publicToken, public_status: publicStatus, responses } = data
  const isOpen = publicStatus === 'OPEN'
  const pendingCount = responses.filter(r => r.status === 'PENDING').length
  const acceptedCount = responses.filter(r => r.status === 'ACCEPTED').length
  const declinedCount = responses.filter(r => r.status === 'DECLINED').length

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-6 px-4">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-sm text-text-4 flex-wrap">
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors font-medium">
          Event
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <Link
          href={`/events/${eventId}/services/${slug}`}
          className="hover:text-brand transition-colors font-medium capitalize"
        >
          {slug.replace(/-/g, ' ')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-text-2 font-semibold">Responses</span>
      </div>

      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-black text-text-1 leading-tight">Responses</h1>
        <p className="text-sm text-text-3 mt-0.5">
          Review and respond to vendors and freelancers who replied to your public request.
        </p>
      </div>

      {/* ── Stats row ── */}
      {responses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-brand-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
            <p className="text-xs text-text-4 font-medium mt-0.5">Pending</p>
          </div>
          <div className="bg-white border border-brand-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-green-600">{acceptedCount}</p>
            <p className="text-xs text-text-4 font-medium mt-0.5">Accepted</p>
          </div>
          <div className="bg-white border border-brand-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-gray-400">{declinedCount}</p>
            <p className="text-xs text-text-4 font-medium mt-0.5">Declined</p>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Top action bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Public link */}
        <a
          href={`/requests/${slug}/${publicToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand
                     bg-white border border-brand/20 rounded-lg px-3 py-1.5
                     hover:bg-cream hover:border-brand/40 transition-all"
        >
          <Globe className="h-3 w-3" />
          View public page
          <ExternalLink className="h-2.5 w-2.5" />
        </a>

        {/* Mark as filled */}
        {isOpen ? (
          <Button
            size="sm"
            variant="outline"
            onClick={markFilled}
            disabled={filling || !!acting}
            className="gap-1.5 text-xs font-semibold text-text-3 border-brand-border
                       hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all"
          >
            {filling ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-current/40 border-t-current animate-spin" />
                Marking…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark as filled
              </>
            )}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500
                           bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Filled
          </span>
        )}
      </div>

      {/* ── Filled banner ── */}
      {!isOpen && (
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            This request is marked as <strong>filled</strong> — it's no longer accepting new
            responses.
          </p>
        </div>
      )}

      {/* ── Response list ── */}
      {responses.length === 0 ? (
        <EmptyState publicToken={publicToken} slug={slug} />
      ) : (
        <div className="space-y-3.5">
          {/* Pending first, then accepted, then declined */}
          {[
            ...responses.filter(r => r.status === 'PENDING'),
            ...responses.filter(r => r.status === 'ACCEPTED'),
            ...responses.filter(r => r.status === 'DECLINED'),
          ].map(resp => (
            <ResponseCard
              key={resp.id}
              resp={resp}
              acting={acting}
              onAction={doAction}
            />
          ))}
        </div>
      )}

      {/* Bottom spacer */}
      <div className="pb-6" />
    </div>
  )
}
