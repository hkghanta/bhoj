'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, MessageSquare, MapPin, ExternalLink,
  ChevronRight, ChevronDown, ChevronUp, Shield, Phone,
  ArrowLeftRight, Scale, Clock, Calendar, Users, Filter,
} from 'lucide-react'

// ─── OneSeva quote types ───────────────────────────────────────────────────

type TrayLine = {
  id: string
  item_name: string
  serves_note: string | null
  unit_price: number
  qty: number
  line_total: number
  sort_order: number
}

type OnesevQuote = {
  id: string
  pricing_type: 'PER_HEAD' | 'PER_TRAY'
  price_per_head: number | null
  total_estimate: number
  currency: string
  notes: string | null
  status: string
  expires_at: string | null
  discount_type: string | null
  discount_value: number | null
  discount_note: string | null
  tasting_offered: boolean
  tasting_cost: number | null
  vendor: {
    id: string
    business_name: string
    city: string
    tier: string
    is_verified: boolean
    profile_photo_url: string | null
  }
  tray_lines: TrayLine[]
  match: { id: string; score: number; rank: number }
}

// ─── Board response types ──────────────────────────────────────────────────

type BoardResponse = {
  id: string
  name: string
  phone: string | null
  pitch: string
  price_note: string | null
  portfolio_url: string | null
  status: string
  quote_token: string | null
  quoted_price: string | null
  price_unit: string | null
  what_includes: string | null
  service_details: string | null
  availability_note: string | null
  quote_submitted_at: string | null
  created_at: string
  vendor_type: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return format(new Date(d), 'd MMM')
}

function serviceLabel(vendorType: string) {
  return vendorType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const SOURCE_BADGE = {
  oneseva: 'bg-orange-100 text-orange-700 border border-orange-200',
  board: 'bg-gray-100 text-gray-600 border border-gray-200',
}

// ─── Status configs ────────────────────────────────────────────────────────

const ONESEVA_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  DRAFT:    { label: 'Draft',    dot: 'bg-gray-300',   text: 'text-gray-500' },
  SENT:     { label: 'Received', dot: 'bg-blue-500',   text: 'text-blue-700' },
  VIEWED:   { label: 'Viewed',   dot: 'bg-blue-500',   text: 'text-blue-700' },
  ACCEPTED: { label: 'Accepted', dot: 'bg-green-500',  text: 'text-green-700' },
  DECLINED: { label: 'Declined', dot: 'bg-red-400',    text: 'text-red-500' },
  EXPIRED:  { label: 'Expired',  dot: 'bg-gray-300',   text: 'text-gray-400' },
}

const BOARD_STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  PENDING:          { label: 'New',             dot: 'bg-sky-400',    text: 'text-sky-700',   bg: 'bg-sky-50' },
  ACCEPTED_RESPONSE:{ label: 'Accepted',        dot: 'bg-green-500',  text: 'text-green-700', bg: 'bg-green-50' },
  DECLINED:         { label: 'Declined',        dot: 'bg-red-400',    text: 'text-red-500',   bg: 'bg-red-50' },
  QUOTE_REQUESTED:  { label: 'Quote Requested', dot: 'bg-amber-400',  text: 'text-amber-700', bg: 'bg-amber-50' },
  QUOTE_SUBMITTED:  { label: 'Quote Received',  dot: 'bg-purple-500', text: 'text-purple-700',bg: 'bg-purple-50' },
}

const AVAIL_BADGE: Record<string, { icon: string; cls: string }> = {
  available:        { icon: '✅', cls: 'bg-green-50 text-green-700 border border-green-200' },
  need_to_confirm:  { icon: '⏳', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  not_available:    { icon: '❌', cls: 'bg-red-50 text-red-600 border border-red-200' },
}

// ─── TrayBill (reused from old page) ──────────────────────────────────────

function TrayBill({ lines, discountType, discountValue, discountNote, currency }: {
  lines: TrayLine[]
  discountType: string | null
  discountValue: number | null
  discountNote: string | null
  currency: string
}) {
  const subtotal = lines.reduce((s, l) => s + Number(l.unit_price) * l.qty, 0)
  let discount = 0
  if (discountType === 'FLAT' && discountValue) discount = Math.min(Number(discountValue), subtotal)
  else if (discountType === 'PERCENTAGE' && discountValue) discount = subtotal * (Number(discountValue) / 100)
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mt-3">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Order Summary · {lines.length} item{lines.length !== 1 ? 's' : ''}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-orange-50/50 border-b border-gray-100">
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Serves</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qty</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Unit</th>
            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {lines.map(l => (
            <tr key={l.id}>
              <td className="px-4 py-2.5 font-medium text-gray-800">{l.item_name}</td>
              <td className="px-3 py-2.5 text-center text-xs text-gray-400 hidden sm:table-cell">{l.serves_note ?? '—'}</td>
              <td className="px-3 py-2.5 text-center text-gray-600">{l.qty}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{fmt(Number(l.unit_price), currency)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(Number(l.line_total), currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-gray-200">
          {discount > 0 && (
            <tr>
              <td colSpan={3} className="hidden sm:table-cell" />
              <td className="px-3 py-1.5 text-right text-xs text-green-600">
                Discount{discountType === 'PERCENTAGE' ? ` (${discountValue}%)` : ''}
                {discountNote && <span className="block text-gray-400">{discountNote}</span>}
              </td>
              <td className="px-4 py-1.5 text-right text-sm font-medium text-green-600">−{fmt(discount, currency)}</td>
            </tr>
          )}
          <tr className="bg-orange-50/60">
            <td colSpan={3} className="hidden sm:table-cell" />
            <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">Total</td>
            <td className="px-4 py-3 text-right text-base font-black text-orange-600">{fmt(total, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── OneSeva Quote Row ─────────────────────────────────────────────────────

function OnesevQuoteRow({
  quote, eventId, onAccept, onDecline,
}: {
  quote: OnesevQuote
  eventId: string
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const router = useRouter()
  const statusCfg = ONESEVA_STATUS[quote.status] ?? ONESEVA_STATUS.DRAFT
  const isTray = quote.pricing_type === 'PER_TRAY'
  const currency = quote.currency

  async function openConversation() {
    setMessaging(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: quote.match.id }),
      })
      let convId: string | null = null
      if (res.ok) {
        const c = await res.json(); convId = c.id
      } else {
        const list = await (await fetch('/api/conversations')).json()
        convId = list.find((c: any) => c.match_id === quote.match.id)?.id ?? null
      }
      if (convId) router.push(`/messages/${convId}`)
    } finally {
      setMessaging(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      quote.status === 'ACCEPTED' ? 'ring-2 ring-green-500' :
      quote.status === 'DECLINED' ? 'opacity-55' : 'border-gray-200'
    }`}>
      {/* Row header */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-sm">
            {quote.vendor.business_name[0]}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-gray-900 text-sm truncate">
                {quote.vendor.business_name}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SOURCE_BADGE.oneseva}`}>
                OneSeva
              </span>
              {quote.vendor.is_verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                  <Shield className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />{quote.vendor.city}
              <span className="text-gray-200">·</span>
              <Calendar className="h-3 w-3" />
              {quote.expires_at ? `Expires ${fmtDate(quote.expires_at)}` : 'No expiry'}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            {!isTray && quote.price_per_head ? (
              <div>
                <div className="text-xl font-black text-orange-600">
                  {fmt(Number(quote.price_per_head), currency)}
                  <span className="text-xs font-normal text-gray-400">/head</span>
                </div>
                <div className="text-xs text-gray-400">Total: {fmt(Number(quote.total_estimate), currency)}</div>
              </div>
            ) : (
              <div className="text-lg font-bold text-gray-900">
                {fmt(Number(quote.total_estimate), currency)}
                <div className="text-xs text-gray-400 font-normal">tray order</div>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <span className={statusCfg.text}>{statusCfg.label}</span>
            </span>
            <span className="text-gray-300">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">
          {/* Tray bill */}
          {isTray && quote.tray_lines.length > 0 && (
            <TrayBill
              lines={quote.tray_lines}
              discountType={quote.discount_type}
              discountValue={quote.discount_value}
              discountNote={quote.discount_note}
              currency={currency}
            />
          )}

          {/* Price/head breakdown for PER_HEAD */}
          {!isTray && quote.price_per_head && (
            <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Price per head</p>
                <p className="text-2xl font-black text-orange-700">{fmt(Number(quote.price_per_head), currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Total estimate</p>
                <p className="text-lg font-bold text-gray-900">{fmt(Number(quote.total_estimate), currency)}</p>
              </div>
            </div>
          )}

          {/* Tasting */}
          {quote.tasting_offered && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>
                Tasting available
                {quote.tasting_cost === 0 && <span className="text-green-600 ml-1">(complimentary)</span>}
                {quote.tasting_cost && Number(quote.tasting_cost) > 0 && (
                  <span className="text-green-600 ml-1">({fmt(Number(quote.tasting_cost), currency)})</span>
                )}
              </span>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-gray-700">
              {quote.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link href={`/events/${eventId}/quotes/${quote.id}`}>
              <button className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                View details →
              </button>
            </Link>
            {!['ACCEPTED', 'DECLINED'].includes(quote.status) && (
              <button
                onClick={openConversation}
                disabled={messaging}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
                {messaging ? 'Opening…' : 'Message'}
              </button>
            )}
            {['SENT', 'VIEWED'].includes(quote.status) && (
              <>
                <button
                  onClick={async () => { setActing(true); await onAccept(quote.id); setActing(false) }}
                  disabled={acting}
                  className="flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Accept
                </button>
                <button
                  onClick={async () => { setActing(true); await onDecline(quote.id); setActing(false) }}
                  disabled={acting}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Decline
                </button>
              </>
            )}
            {quote.status === 'ACCEPTED' && (
              <span className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Accepted
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Board Response Row ────────────────────────────────────────────────────

function BoardResponseRow({
  response, requestToken, onAskQuote, onAccept, onDecline,
}: {
  response: BoardResponse
  requestToken: string
  onAskQuote: (id: string) => Promise<void>
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState(false)

  const statusCfg = BOARD_STATUS[response.status] ?? BOARD_STATUS.PENDING
  const showPhone = ['ACCEPTED_RESPONSE'].includes(response.status)
  const availCfg = response.availability_note ? AVAIL_BADGE[response.availability_note] : null
  const priceUnitLabel: Record<string, string> = {
    per_head: '/head', per_event: '/event', per_hour: '/hr', per_day: '/day',
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      response.status === 'ACCEPTED_RESPONSE' ? 'ring-2 ring-green-500' :
      response.status === 'DECLINED' ? 'opacity-55' : 'border-gray-200'
    }`}>
      {/* Row header */}
      <button className="w-full text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center flex-shrink-0 text-gray-600 font-bold text-sm">
            {response.name[0]}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-gray-900 text-sm">{response.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SOURCE_BADGE.board}`}>
                Board
              </span>
              {response.status === 'QUOTE_SUBMITTED' && availCfg && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${availCfg.cls}`}>
                  {availCfg.icon}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {fmtDate(response.created_at)}
              {response.portfolio_url && (
                <>
                  <span className="text-gray-200">·</span>
                  <a
                    href={response.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-0.5 text-blue-500 hover:underline"
                  >
                    <ExternalLink className="h-2.5 w-2.5" /> Portfolio
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Price if submitted */}
          <div className="text-right flex-shrink-0">
            {response.quoted_price ? (
              <div>
                <div className="text-xl font-black text-purple-700">
                  {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(response.quoted_price))}
                  <span className="text-xs font-normal text-gray-400">
                    {priceUnitLabel[response.price_unit ?? ''] ?? ''}
                  </span>
                </div>
                <div className="text-xs text-gray-400">Quote submitted</div>
              </div>
            ) : response.price_note ? (
              <div className="text-xs text-gray-500 max-w-[120px] text-right leading-tight">{response.price_note}</div>
            ) : null}
          </div>

          {/* Status badge + chevron */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} border border-transparent`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <span className={statusCfg.text}>{statusCfg.label}</span>
            </span>
            <span className="text-gray-300">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">

          {/* Pitch */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Their Pitch</p>
            <p className="text-sm text-gray-700 leading-relaxed">{response.pitch}</p>
          </div>

          {/* Phone — only when accepted */}
          {showPhone && response.phone && (
            <a href={`tel:${response.phone}`} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 hover:bg-green-100 transition-colors w-fit">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{response.phone}</span>
            </a>
          )}

          {/* Quote details when submitted */}
          {response.status === 'QUOTE_SUBMITTED' && response.quoted_price && (
            <div className="space-y-3">
              {/* Price box */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-0.5">Quoted Price</p>
                  <p className="text-2xl font-black text-purple-700">
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(response.quoted_price))}
                    <span className="text-sm font-normal text-purple-400 ml-1">
                      {priceUnitLabel[response.price_unit ?? ''] ?? ''}
                    </span>
                  </p>
                </div>
                {availCfg && (
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${availCfg.cls}`}>
                    {availCfg.icon} {
                      { available: 'Available', need_to_confirm: 'To confirm', not_available: 'Not available' }[response.availability_note!]
                    }
                  </span>
                )}
              </div>

              {/* What's included */}
              {response.what_includes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">What's Included</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{response.what_includes}</p>
                </div>
              )}

              {/* Service details */}
              {response.service_details && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Service Details</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{response.service_details}</p>
                </div>
              )}

              {/* Quote date */}
              {response.quote_submitted_at && (
                <p className="text-xs text-gray-400">
                  Quote submitted {fmtDate(response.quote_submitted_at)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">

            {/* Ask for quote — available for PENDING board responses */}
            {response.status === 'PENDING' && (
              <button
                onClick={async () => { setActing(true); await onAskQuote(response.id); setActing(false) }}
                disabled={acting}
                className="flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
              >
                <ArrowLeftRight className="h-4 w-4" />
                {acting ? 'Requesting…' : 'Ask for full quote'}
              </button>
            )}

            {/* Quote requested — waiting state */}
            {response.status === 'QUOTE_REQUESTED' && (
              <span className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl font-medium">
                <Clock className="h-4 w-4" /> Quote link sent — awaiting response
              </span>
            )}

            {/* Accept quote button */}
            {response.status === 'QUOTE_SUBMITTED' && (
              <button
                onClick={async () => { setActing(true); await onAccept(response.id); setActing(false) }}
                disabled={acting}
                className="flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {acting ? 'Accepting…' : 'Accept this quote'}
              </button>
            )}

            {/* Decline button */}
            {!['DECLINED', 'ACCEPTED_RESPONSE'].includes(response.status) && (
              <button
                onClick={async () => { setActing(true); await onDecline(response.id); setActing(false) }}
                disabled={acting}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Decline
              </button>
            )}

            {/* Accepted state */}
            {response.status === 'ACCEPTED_RESPONSE' && (
              <span className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Accepted
              </span>
            )}

            {/* Portfolio link */}
            {response.portfolio_url && (
              <a
                href={response.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Portfolio
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Service Group ─────────────────────────────────────────────────────────

const GROUP_COLORS = [
  'from-orange-500 to-amber-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-violet-500',
  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-cyan-600',
]

function ServiceGroup({
  vendorType, colorIdx, children, count,
}: {
  vendorType: string
  colorIdx: number
  children: React.ReactNode
  count: number
}) {
  const gradient = GROUP_COLORS[colorIdx % GROUP_COLORS.length]
  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between`}>
        <div>
          <h2 className="text-white font-bold text-lg">{serviceLabel(vendorType)}</h2>
          <p className="text-white/70 text-sm mt-0.5">{count} response{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="bg-gray-50/50 p-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function EventQuotesPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [onesevQuotes, setOnesevQuotes] = useState<OnesevQuote[]>([])
  const [boardResponses, setBoardResponses] = useState<BoardResponse[]>([])
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  const fetchAll = useCallback(async () => {
    const [quotesRes, responsesRes] = await Promise.all([
      fetch(`/api/quotes?eventId=${eventId}`),
      fetch(`/api/events/${eventId}/responses`),
    ])

    const [quotesData, responsesData] = await Promise.all([
      quotesRes.json(),
      responsesRes.json(),
    ])

    if (Array.isArray(quotesData)) setOnesevQuotes(quotesData)
    if (responsesData && Array.isArray(responsesData.responses)) {
      setBoardResponses(responsesData.responses)
      setTokenMap(responsesData.token_map ?? {})
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── OneSeva handlers ─────────────────────────────────────────────────────
  async function handleOnesevAccept(quoteId: string) {
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    setOnesevQuotes(q => q.map(x => x.id === quoteId ? { ...x, status: 'ACCEPTED' } : x))
  }

  async function handleOnesevDecline(quoteId: string) {
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DECLINED' }),
    })
    setOnesevQuotes(q => q.map(x => x.id === quoteId ? { ...x, status: 'DECLINED' } : x))
  }

  // ── Board handlers ───────────────────────────────────────────────────────
  async function handleAskQuote(responseId: string) {
    const requestToken = tokenMap[responseId]
    if (!requestToken) return
    await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_full_quote', response_id: responseId }),
    })
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'QUOTE_REQUESTED' } : x))
  }

  async function handleBoardAccept(responseId: string) {
    const requestToken = tokenMap[responseId]
    if (!requestToken) return
    await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', response_id: responseId }),
    })
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'ACCEPTED_RESPONSE' } : x))
  }

  async function handleBoardDecline(responseId: string) {
    const requestToken = tokenMap[responseId]
    if (!requestToken) return
    await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline_response', response_id: responseId }),
    })
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'DECLINED' } : x))
  }

  // ── Group everything by vendor_type ─────────────────────────────────────
  const allServiceTypes = Array.from(new Set([
    ...onesevQuotes.map(q => {
      // OneSeva quotes don't directly have vendor_type on them
      // They're matched via event_request — for grouping use vendor's city as fallback
      // Actually group all OneSeva quotes together under a 'Catering' key
      return 'CATERING_ONESEVA'
    }),
    ...boardResponses.map(r => r.vendor_type),
  ])).filter(Boolean)

  const filteredServiceTypes = filterType === 'all'
    ? allServiceTypes
    : [filterType]

  const totalCount = onesevQuotes.filter(q => q.status !== 'DRAFT').length + boardResponses.length

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
          <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-700">Quotes</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const sentOneseva = onesevQuotes.filter(q => q.status !== 'DRAFT')
  const allEmpty = sentOneseva.length === 0 && boardResponses.length === 0

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700">Quotes & Responses</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quotes & Responses</h1>
          <p className="text-gray-500 mt-1">
            {totalCount} total · {sentOneseva.length} from OneSeva · {boardResponses.length} from public board
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allServiceTypes.length > 1 && (
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-gray-700 bg-transparent focus:outline-none text-sm font-medium"
              >
                <option value="all">All services</option>
                {sentOneseva.length > 0 && <option value="CATERING_ONESEVA">Catering (OneSeva)</option>}
                {Array.from(new Set(boardResponses.map(r => r.vendor_type))).map(t => (
                  <option key={t} value={t}>{serviceLabel(t)}</option>
                ))}
              </select>
            </div>
          )}
          <Link href={`/events/${eventId}/vendors`}>
            <button className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              Find vendors
            </button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {allEmpty && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-6xl mb-4">📬</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Start matching with vendors to receive OneSeva quotes, or share your public request board to collect responses directly.
          </p>
          <Link href={`/events/${eventId}/vendors`}>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Find Vendors
            </button>
          </Link>
        </div>
      )}

      {/* Groups */}
      {!allEmpty && (
        <div className="space-y-6">

          {/* OneSeva quotes group */}
          {sentOneseva.length > 0 && (filterType === 'all' || filterType === 'CATERING_ONESEVA') && (
            <ServiceGroup
              vendorType="Catering — OneSeva Matches"
              colorIdx={0}
              count={sentOneseva.length}
            >
              {sentOneseva.map(q => (
                <OnesevQuoteRow
                  key={q.id}
                  quote={q}
                  eventId={eventId}
                  onAccept={handleOnesevAccept}
                  onDecline={handleOnesevDecline}
                />
              ))}
            </ServiceGroup>
          )}

          {/* Board responses grouped by vendor_type */}
          {Array.from(new Set(boardResponses.map(r => r.vendor_type)))
            .filter(vt => filterType === 'all' || filterType === vt)
            .map((vendorType, idx) => {
              const group = boardResponses.filter(r => r.vendor_type === vendorType)
              return (
                <ServiceGroup
                  key={vendorType}
                  vendorType={vendorType}
                  colorIdx={idx + 1}
                  count={group.length}
                >
                  {group.map(r => (
                    <BoardResponseRow
                      key={r.id}
                      response={r}
                      requestToken={tokenMap[r.id] ?? ''}
                      onAskQuote={handleAskQuote}
                      onAccept={handleBoardAccept}
                      onDecline={handleBoardDecline}
                    />
                  ))}
                </ServiceGroup>
              )
            })
          }
        </div>
      )}
    </div>
  )
}
