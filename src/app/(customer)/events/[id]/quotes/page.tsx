'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, MessageSquare, MapPin, ExternalLink,
  ChevronRight, ChevronDown, ChevronUp, Shield, Phone,
  ArrowLeftRight, Clock, Calendar, Users, Filter,
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
  match: { id: string; score: number; rank: number; event_request: { vendor_type: string } | null }
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
  oneseva: 'bg-brand/10 text-brand border border-brand/20',
  board: 'bg-cream-2 text-text-3 border border-brand-border',
}

// ─── Status configs ────────────────────────────────────────────────────────

const ONESEVA_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  DRAFT:    { label: 'Draft',    dot: 'bg-brand-border',   text: 'text-text-4' },
  SENT:     { label: 'Received', dot: 'bg-blue-500',   text: 'text-blue-700' },
  VIEWED:   { label: 'Viewed',   dot: 'bg-blue-500',   text: 'text-blue-700' },
  ACCEPTED: { label: 'Accepted', dot: 'bg-green-500',  text: 'text-green-700' },
  DECLINED: { label: 'Declined', dot: 'bg-red-400',    text: 'text-red-500' },
  EXPIRED:  { label: 'Expired',  dot: 'bg-brand-border',   text: 'text-text-4' },
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
    <div className="border border-brand-border rounded-xl overflow-hidden mt-3">
      <div className="bg-cream px-4 py-2 border-b">
        <p className="text-xs font-bold text-text-4 uppercase tracking-widest">
          Order Summary · {lines.length} item{lines.length !== 1 ? 's' : ''}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream border-b border-brand-border">
            <th className="text-left px-4 py-2 text-sm font-bold text-text-4 uppercase tracking-wide">Item</th>
            <th className="text-center px-3 py-2 text-sm font-bold text-text-4 uppercase tracking-wide hidden sm:table-cell">Serves</th>
            <th className="text-center px-3 py-2 text-sm font-bold text-text-4 uppercase tracking-wide">Qty</th>
            <th className="text-right px-3 py-2 text-sm font-bold text-text-4 uppercase tracking-wide">Unit</th>
            <th className="text-right px-4 py-2 text-sm font-bold text-text-4 uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream">
          {lines.map(l => (
            <tr key={l.id}>
              <td className="px-4 py-2.5 font-medium text-text-1">{l.item_name}</td>
              <td className="px-3 py-2.5 text-center text-xs text-text-4 hidden sm:table-cell">{l.serves_note ?? '—'}</td>
              <td className="px-3 py-2.5 text-center text-text-3">{l.qty}</td>
              <td className="px-3 py-2.5 text-right text-text-3">{fmt(Number(l.unit_price), currency)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-text-1">{fmt(Number(l.line_total), currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-brand-border">
          {discount > 0 && (
            <tr>
              <td colSpan={3} className="hidden sm:table-cell" />
              <td className="px-3 py-1.5 text-right text-xs text-green-600">
                Discount{discountType === 'PERCENTAGE' ? ` (${discountValue}%)` : ''}
                {discountNote && <span className="block text-text-4">{discountNote}</span>}
              </td>
              <td className="px-4 py-1.5 text-right text-sm font-medium text-green-600">−{fmt(discount, currency)}</td>
            </tr>
          )}
          <tr className="bg-cream">
            <td colSpan={3} className="hidden sm:table-cell" />
            <td className="px-3 py-3 text-right text-sm font-bold text-text-1">Total</td>
            <td className="px-4 py-3 text-right text-base font-black text-text-1">{fmt(total, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── OneSeva Quote Row ─────────────────────────────────────────────────────

function OnesevQuoteRow({
  quote, eventId, onAccept, onDecline, highlightTags = [],
}: {
  quote: OnesevQuote
  eventId: string
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  highlightTags?: string[]
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
    <div className={`bg-white dark:bg-cream-2 rounded-2xl border overflow-hidden transition-all ${
      quote.status === 'ACCEPTED' ? 'ring-2 ring-green-500' :
      quote.status === 'DECLINED' ? 'opacity-55' : 'border-brand-border'
    }`}>
      {/* Row header */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center flex-shrink-0 text-brand font-bold text-sm">
            {quote.vendor.business_name[0]}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-text-1 text-sm truncate">
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
            {highlightTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {highlightTags.map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tag === 'Best Price' ? 'bg-green-100 text-green-700' :
                      tag === 'Fastest Response' ? 'bg-blue-100 text-blue-700' :
                      tag === 'Highest Rated' ? 'bg-amber-100 text-amber-700' :
                      tag === 'Most Complete' ? 'bg-purple-100 text-purple-700' :
                      tag === 'Best Value' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-text-4">
              <MapPin className="h-3 w-3" />{quote.vendor.city}
              <span className="text-brand-border">·</span>
              <Calendar className="h-3 w-3" />
              {quote.expires_at ? `Expires ${fmtDate(quote.expires_at)}` : 'No expiry'}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            {!isTray && quote.price_per_head ? (
              <div>
                <div className="text-xl font-black text-text-1">
                  {fmt(Number(quote.price_per_head), currency)}
                  <span className="text-xs font-normal text-text-4">/head</span>
                </div>
                <div className="text-xs text-text-4">Total: {fmt(Number(quote.total_estimate), currency)}</div>
              </div>
            ) : (
              <div className="text-xl font-black text-text-1">
                {fmt(Number(quote.total_estimate), currency)}
                <div className="text-xs text-text-4 font-normal">tray order</div>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-cream border border-brand-border">
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <span className={statusCfg.text}>{statusCfg.label}</span>
            </span>
            <span className="text-text-4">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-brand-border px-5 pb-5 pt-4 space-y-4">
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
            <div className="bg-cream rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-brand uppercase tracking-wider mb-0.5">Price per head</p>
                <p className="text-2xl font-black text-text-1">{fmt(Number(quote.price_per_head), currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-text-4 uppercase tracking-wider mb-0.5">Total estimate</p>
                <p className="text-lg font-bold text-text-1">{fmt(Number(quote.total_estimate), currency)}</p>
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
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-text-2">
              {quote.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link href={`/events/${eventId}/quotes/${quote.id}`}>
              <button className="text-sm font-medium px-4 py-2 rounded-xl border border-brand-border text-text-2 hover:bg-cream transition-colors">
                View details →
              </button>
            </Link>
            {!['ACCEPTED', 'DECLINED'].includes(quote.status) && (
              <button
                onClick={openConversation}
                disabled={messaging}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-brand-border text-text-2 hover:bg-cream transition-colors disabled:opacity-50"
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
              <span className="flex items-center gap-1.5 text-green-700 text-sm font-bold">
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
  response, requestToken, onAskQuote, onAccept, onDecline, highlightTags = [],
}: {
  response: BoardResponse
  requestToken: string
  onAskQuote: (id: string) => Promise<void>
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  highlightTags?: string[]
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
    <div className={`bg-white dark:bg-cream-2 rounded-2xl border overflow-hidden transition-all ${
      response.status === 'ACCEPTED_RESPONSE' ? 'ring-2 ring-green-500' :
      response.status === 'DECLINED' ? 'opacity-55' : 'border-brand-border'
    }`}>
      {/* Row header */}
      <button className="w-full text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center flex-shrink-0 text-text-3 font-bold text-sm">
            {response.name[0]}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-text-1 text-sm">{response.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SOURCE_BADGE.board}`}>
                Board
              </span>
              {response.status === 'QUOTE_SUBMITTED' && availCfg && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${availCfg.cls}`}>
                  {availCfg.icon}
                </span>
              )}
            </div>
            {highlightTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {highlightTags.map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tag === 'Best Price' ? 'bg-green-100 text-green-700' :
                      tag === 'Fastest Response' ? 'bg-blue-100 text-blue-700' :
                      tag === 'Highest Rated' ? 'bg-amber-100 text-amber-700' :
                      tag === 'Most Complete' ? 'bg-purple-100 text-purple-700' :
                      tag === 'Best Value' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-text-4">
              <Clock className="h-3 w-3" />
              {fmtDate(response.created_at)}
              {response.portfolio_url && (
                <>
                  <span className="text-brand-border">·</span>
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
                  <span className="text-xs font-normal text-text-4">
                    {priceUnitLabel[response.price_unit ?? ''] ?? ''}
                  </span>
                </div>
                <div className="text-xs text-text-4">Quote submitted</div>
              </div>
            ) : response.price_note ? (
              <div className="text-xs text-text-3 max-w-[120px] text-right leading-tight">{response.price_note}</div>
            ) : null}
          </div>

          {/* Status badge + chevron */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusCfg.bg} border border-transparent`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <span className={statusCfg.text}>{statusCfg.label}</span>
            </span>
            <span className="text-text-4">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-brand-border px-5 pb-5 pt-4 space-y-4">

          {/* Pitch */}
          <div>
            <p className="text-sm font-bold text-text-4 uppercase tracking-wider mb-1.5">Their Pitch</p>
            <p className="text-sm text-text-2 leading-relaxed">{response.pitch}</p>
          </div>

          {/* Phone — only when accepted */}
          {showPhone && response.phone && (
            <a href={`tel:${response.phone}`} className="flex items-center gap-2 text-sm text-text-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 hover:bg-green-100 transition-colors w-fit">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{response.phone}</span>
            </a>
          )}

          {/* Quote details when submitted */}
          {response.status === 'QUOTE_SUBMITTED' && response.quoted_price && (
            <div className="space-y-4">
              {/* Price box */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 flex items-center justify-between">
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
                  <p className="text-sm font-bold text-text-4 uppercase tracking-wider mb-1.5">What's Included</p>
                  <p className="text-sm text-text-2 leading-relaxed whitespace-pre-line">{response.what_includes}</p>
                </div>
              )}

              {/* Service details */}
              {response.service_details && (
                <div>
                  <p className="text-sm font-bold text-text-4 uppercase tracking-wider mb-1.5">Service Details</p>
                  <p className="text-sm text-text-2 leading-relaxed">{response.service_details}</p>
                </div>
              )}

              {/* Quote date */}
              {response.quote_submitted_at && (
                <p className="text-xs text-text-4">
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
                className="flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-50"
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
              <span className="flex items-center gap-1.5 text-green-700 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" /> Accepted
              </span>
            )}

            {/* Portfolio link */}
            {response.portfolio_url && (
              <a
                href={response.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-brand-border text-text-3 hover:bg-cream transition-colors"
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
  'from-brand to-amber-500',
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
    <div className="rounded-3xl border border-brand-border overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between`}>
        <div>
          <h2 className="text-white font-bold text-xl">{serviceLabel(vendorType)}</h2>
          <p className="text-white/70 text-sm mt-0.5">{count} response{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-10 h-10 bg-white/20 dark:bg-cream-2/20 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="bg-cream p-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

// ─── Pipeline row type ────────────────────────────────────────────────────

type PipelineRow = {
  id: string
  name: string
  service: string
  source: 'OneSeva' | 'Board' | 'External'
  price: string
  priceNumeric: number
  responseTime: string | null
  responseMs: number
  isVerified: boolean
  vendorBadges: string[]
  status: string
  statusColor: string
  statusBg: string
}

type PipelineSortOption = 'status' | 'price_asc' | 'price_desc' | 'response_time'

const PIPELINE_STATUS_ORDER: Record<string, number> = {
  Finalized: 0,
  Accepted: 1,
  'Quote Received': 2,
  Received: 3,
  Viewed: 4,
  'Quote Requested': 5,
  New: 6,
  Declined: 7,
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function EventQuotesPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [onesevQuotes, setOnesevQuotes] = useState<OnesevQuote[]>([])
  const [boardResponses, setBoardResponses] = useState<BoardResponse[]>([])
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [pipelineSort, setPipelineSort] = useState<PipelineSortOption>('status')
  const [highlightTags, setHighlightTags] = useState<Record<string, string[]>>({})

  const fetchAll = useCallback(async () => {
    const [quotesRes, responsesRes] = await Promise.all([
      fetch(`/api/quotes?eventId=${eventId}`),
      fetch(`/api/events/${eventId}/responses`),
    ])

    let fetchedQuotes: OnesevQuote[] = []
    let fetchedResponses: BoardResponse[] = []

    if (quotesRes.ok) {
      const quotesData = await quotesRes.json()
      if (Array.isArray(quotesData)) {
        fetchedQuotes = quotesData
        setOnesevQuotes(quotesData)
      }
    }

    if (responsesRes.ok) {
      const responsesData = await responsesRes.json()
      if (responsesData && Array.isArray(responsesData.responses)) {
        fetchedResponses = responsesData.responses
        setBoardResponses(responsesData.responses)
        setTokenMap(responsesData.token_map ?? {})
      }
    }

    // ── Compute highlight tags ──────────────────────────────────────────
    const tags: Record<string, string[]> = {}

    // Group OneSeva quotes by vendor_type and find cheapest in each group
    const sentQuotes = fetchedQuotes.filter(q => q.status !== 'DRAFT')
    const quotesByType: Record<string, OnesevQuote[]> = {}
    for (const q of sentQuotes) {
      const vt = q.match?.event_request?.vendor_type ?? 'CATERER'
      ;(quotesByType[vt] ??= []).push(q)
    }

    // Group board responses by vendor_type
    const responsesByType: Record<string, BoardResponse[]> = {}
    for (const r of fetchedResponses) {
      ;(responsesByType[r.vendor_type] ??= []).push(r)
    }

    // For each vendor_type, find "Best Price" across both OneSeva quotes and board responses
    const allVendorTypes = new Set([...Object.keys(quotesByType), ...Object.keys(responsesByType)])
    for (const vt of allVendorTypes) {
      let cheapestId: string | null = null
      let cheapestPrice = Infinity

      // Check OneSeva quotes
      for (const q of (quotesByType[vt] ?? [])) {
        const price = q.price_per_head ? Number(q.price_per_head) : Number(q.total_estimate)
        if (price > 0 && price < cheapestPrice) {
          cheapestPrice = price
          cheapestId = q.id
        }
      }

      // Check board responses with quoted_price
      for (const r of (responsesByType[vt] ?? [])) {
        if (r.quoted_price) {
          const price = Number(r.quoted_price)
          if (price > 0 && price < cheapestPrice) {
            cheapestPrice = price
            cheapestId = r.id
          }
        }
      }

      // Only tag if there are at least 2 items with prices to compare
      const priceCount = (quotesByType[vt] ?? []).filter(q => (q.price_per_head ? Number(q.price_per_head) : Number(q.total_estimate)) > 0).length
        + (responsesByType[vt] ?? []).filter(r => r.quoted_price && Number(r.quoted_price) > 0).length
      if (cheapestId && priceCount >= 2) {
        ;(tags[cheapestId] ??= []).push('Best Price')
      }

      // "Fastest Response" — board responses only, earliest created_at
      const boardGroup = responsesByType[vt] ?? []
      if (boardGroup.length >= 2) {
        let fastestId: string | null = null
        let fastestTime = Infinity
        for (const r of boardGroup) {
          const t = new Date(r.created_at).getTime()
          if (t < fastestTime) {
            fastestTime = t
            fastestId = r.id
          }
        }
        if (fastestId) {
          ;(tags[fastestId] ??= []).push('Fastest Response')
        }
      }

      // "Highest Rated" — OneSeva quote with highest match score in group
      const osevaGroup = quotesByType[vt] ?? []
      if (osevaGroup.length >= 2) {
        let highestId: string | null = null
        let highestScore = -Infinity
        for (const q of osevaGroup) {
          const score = q.match?.score ?? 0
          if (score > highestScore) {
            highestScore = score
            highestId = q.id
          }
        }
        if (highestId && highestScore > 0) {
          ;(tags[highestId] ??= []).push('Highest Rated')
        }
      }

      // "Most Complete" — OneSeva quotes with notes, tasting, and full pricing details
      if (osevaGroup.length >= 2) {
        for (const q of osevaGroup) {
          const hasNotes = !!q.notes
          const hasTasting = q.tasting_offered
          const hasPricingDetail = q.pricing_type === 'PER_TRAY'
            ? q.tray_lines.length >= 3
            : !!q.price_per_head
          if (hasNotes && hasTasting && hasPricingDetail) {
            ;(tags[q.id] ??= []).push('Most Complete')
          }
        }
      }

      // "Best Value" — PER_HEAD OneSeva quote with lowest price_per_head + tasting + notes
      const perHeadQuotes = osevaGroup.filter(
        q => q.pricing_type === 'PER_HEAD' && q.price_per_head && Number(q.price_per_head) > 0
      )
      if (perHeadQuotes.length >= 2) {
        let bestValueId: string | null = null
        let lowestPPH = Infinity
        for (const q of perHeadQuotes) {
          const pph = Number(q.price_per_head)
          if (pph < lowestPPH && q.tasting_offered && q.notes) {
            lowestPPH = pph
            bestValueId = q.id
          }
        }
        if (bestValueId) {
          ;(tags[bestValueId] ??= []).push('Best Value')
        }
      }
    }

    setHighlightTags(tags)
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
    const res = await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_full_quote', response_id: responseId }),
    })
    if (!res.ok) {
      await fetchAll()
      return
    }
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'QUOTE_REQUESTED' } : x))
  }

  async function handleBoardAccept(responseId: string) {
    const requestToken = tokenMap[responseId]
    if (!requestToken) return
    const res = await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', response_id: responseId }),
    })
    if (!res.ok) {
      await fetchAll()
      return
    }
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'ACCEPTED_RESPONSE' } : x))
  }

  async function handleBoardDecline(responseId: string) {
    const requestToken = tokenMap[responseId]
    if (!requestToken) return
    const res = await fetch(`/api/requests/${requestToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline_response', response_id: responseId }),
    })
    if (!res.ok) {
      await fetchAll()
      return
    }
    setBoardResponses(r => r.map(x => x.id === responseId ? { ...x, status: 'DECLINED' } : x))
  }

  // ── Build pipeline rows ────────────────────────────────────────────────
  const sentOneseva = onesevQuotes.filter(q => q.status !== 'DRAFT')

  const pipelineRows: PipelineRow[] = [
    ...sentOneseva.map(q => {
      const statusCfg = ONESEVA_STATUS[q.status] ?? ONESEVA_STATUS.DRAFT
      const isTray = q.pricing_type === 'PER_TRAY'
      const priceNum = q.price_per_head ? Number(q.price_per_head) : Number(q.total_estimate)
      return {
        id: `oneseva-${q.id}`,
        name: q.vendor.business_name,
        service: serviceLabel(q.match?.event_request?.vendor_type ?? 'CATERER'),
        source: 'OneSeva' as const,
        price: !isTray && q.price_per_head
          ? `${fmt(Number(q.price_per_head), q.currency)}/head`
          : fmt(Number(q.total_estimate), q.currency),
        priceNumeric: priceNum,
        responseTime: null,
        responseMs: 0,
        isVerified: q.vendor.is_verified,
        vendorBadges: [],
        status: q.status === 'ACCEPTED' ? 'Finalized' : statusCfg.label,
        statusColor: q.status === 'ACCEPTED' ? 'text-green-700' : statusCfg.text,
        statusBg: q.status === 'ACCEPTED' ? 'bg-green-50' : 'bg-cream',
      }
    }),
    ...boardResponses.map(r => {
      const statusCfg = BOARD_STATUS[r.status] ?? BOARD_STATUS.PENDING
      const priceUnitLabel: Record<string, string> = {
        per_head: '/head', per_event: '/event', per_hour: '/hr', per_day: '/day',
      }
      // Calculate response time
      let responseTime: string | null = null
      let responseMs = 0
      if (r.quote_submitted_at) {
        const diff = new Date(r.quote_submitted_at).getTime() - new Date(r.created_at).getTime()
        responseMs = diff
        const hrs = Math.round(diff / (1000 * 60 * 60))
        responseTime = hrs < 1 ? '< 1 hr' : hrs < 24 ? `${hrs} hr${hrs !== 1 ? 's' : ''}` : `${Math.round(hrs / 24)}d`
      }
      return {
        id: `board-${r.id}`,
        name: r.name,
        service: serviceLabel(r.vendor_type),
        source: 'Board' as const,
        price: r.quoted_price
          ? `$${Number(r.quoted_price).toLocaleString()}${priceUnitLabel[r.price_unit ?? ''] ?? ''}`
          : r.price_note ?? '—',
        priceNumeric: r.quoted_price ? Number(r.quoted_price) : 0,
        responseTime,
        responseMs,
        isVerified: false,
        vendorBadges: [],
        status: r.status === 'ACCEPTED_RESPONSE' ? 'Finalized' : statusCfg.label,
        statusColor: r.status === 'ACCEPTED_RESPONSE' ? 'text-green-700' : statusCfg.text,
        statusBg: r.status === 'ACCEPTED_RESPONSE' ? 'bg-green-50' : statusCfg.bg,
      }
    }),
  ]

  // Sort pipeline
  if (pipelineSort === 'price_asc') {
    pipelineRows.sort((a, b) => (a.priceNumeric || Infinity) - (b.priceNumeric || Infinity))
  } else if (pipelineSort === 'price_desc') {
    pipelineRows.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0))
  } else if (pipelineSort === 'response_time') {
    pipelineRows.sort((a, b) => (a.responseMs || Infinity) - (b.responseMs || Infinity))
  } else {
    pipelineRows.sort((a, b) => (PIPELINE_STATUS_ORDER[a.status] ?? 99) - (PIPELINE_STATUS_ORDER[b.status] ?? 99))
  }

  // Filter pipeline rows
  const filteredPipeline = filterType === 'all'
    ? pipelineRows
    : pipelineRows.filter(r => r.service === serviceLabel(filterType))

  // ── Group everything by vendor_type ─────────────────────────────────────
  const allServiceTypes = Array.from(new Set([
    ...onesevQuotes.map(q => q.match?.event_request?.vendor_type ?? 'CATERER'),
    ...boardResponses.map(r => r.vendor_type),
  ])).filter(Boolean)

  const filteredServiceTypes = filterType === 'all'
    ? allServiceTypes
    : [filterType]

  const totalCount = sentOneseva.length + boardResponses.length
  const finalizedCount = pipelineRows.filter(r => r.status === 'Finalized').length

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="flex items-center gap-1.5 text-sm text-text-4 mb-4">
          <Link href="/dashboard" className="hover:text-brand">My Events</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/events/${eventId}`} className="hover:text-brand">Event</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-2">Quotes</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-cream-2 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const allEmpty = sentOneseva.length === 0 && boardResponses.length === 0

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4 mb-6">
        <Link href="/dashboard" className="hover:text-brand">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-brand">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2">Quotes & Responses</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-1 tracking-tight">Quotes & Responses</h1>
          <p className="text-text-3 mt-1">
            {totalCount} total
            {finalizedCount > 0 && <> · <span className="text-green-600 font-bold">{finalizedCount} finalized</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allServiceTypes.length > 1 && (
            <div className="flex items-center gap-1.5 border border-brand-border rounded-xl px-3 py-2 bg-white dark:bg-cream-2 text-sm">
              <Filter className="h-3.5 w-3.5 text-text-4" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-text-2 bg-transparent focus:outline-none text-sm font-medium"
              >
                <option value="all">All services</option>
                {allServiceTypes.map(t => (
                  <option key={t} value={t}>{serviceLabel(t)}</option>
                ))}
              </select>
            </div>
          )}
          <Link href={`/events/${eventId}/vendors`}>
            <button className="text-sm font-medium px-4 py-2 rounded-xl border border-brand-border text-text-2 hover:bg-cream transition-colors">
              Find vendors
            </button>
          </Link>
        </div>
      </div>

      {/* ── Vendor Pipeline Table ───────────────────────────────────────── */}
      {!allEmpty && filteredPipeline.length > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border overflow-hidden mb-8 shadow-sm">
          <div className="px-5 py-3 border-b border-brand-border bg-cream flex items-center justify-between">
            <h2 className="text-sm font-black text-text-1 uppercase tracking-wider">Vendor Pipeline</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-4">{filteredPipeline.length} vendor{filteredPipeline.length !== 1 ? 's' : ''}</span>
              <div className="relative">
                <select
                  value={pipelineSort}
                  onChange={e => setPipelineSort(e.target.value as PipelineSortOption)}
                  className="text-[10px] pl-6 pr-5 py-1 rounded-lg border border-brand-border bg-white dark:bg-cream-2 text-text-2 appearance-none cursor-pointer focus:outline-none focus:border-brand"
                >
                  <option value="status">Sort: Status</option>
                  <option value="price_asc">Sort: Price low</option>
                  <option value="price_desc">Sort: Price high</option>
                  <option value="response_time">Sort: Fastest</option>
                </select>
                <ArrowLeftRight className="h-2.5 w-2.5 text-text-4 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-4 uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-4 uppercase tracking-wider">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-4 uppercase tracking-wider">Source</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-text-4 uppercase tracking-wider">Price</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-text-4 uppercase tracking-wider hidden sm:table-cell">Response</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-text-4 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filteredPipeline.map(row => (
                  <tr key={row.id} className={`transition-colors hover:bg-cream/50 ${row.status === 'Finalized' ? 'bg-green-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-1">{row.name}</span>
                        {row.isVerified && (
                          <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {row.vendorBadges.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {row.vendorBadges.map(b => (
                            <span key={b} className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{b}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-3">{row.service}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.source === 'OneSeva' ? SOURCE_BADGE.oneseva :
                        row.source === 'Board' ? SOURCE_BADGE.board :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {row.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-text-1">{row.price}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {row.responseTime ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-text-3">
                          <Clock className="h-3 w-3" />{row.responseTime}
                        </span>
                      ) : (
                        <span className="text-xs text-text-4">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${row.statusBg} border border-transparent`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          row.status === 'Finalized' ? 'bg-green-500' :
                          row.status === 'Declined' ? 'bg-red-400' :
                          'bg-blue-500'
                        }`} />
                        <span className={row.statusColor}>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Comparison Summary ──────────────────────────────────── */}
      {!allEmpty && totalCount >= 2 && (() => {
        const allPrices = [
          ...sentOneseva.map(q => Number(q.total_estimate)).filter(p => p > 0),
          ...boardResponses.filter(r => r.quoted_price).map(r => Number(r.quoted_price!)),
        ]
        const tastingCount = sentOneseva.filter(q => q.tasting_offered).length
        const acceptedOneseva = sentOneseva.filter(q => q.status === 'ACCEPTED')
        const acceptedBoard = boardResponses.filter(r => r.status === 'ACCEPTED_RESPONSE')
        const acceptedAll = [
          ...acceptedOneseva.map(q => ({ name: q.vendor.business_name, price: fmt(Number(q.total_estimate), q.currency) })),
          ...acceptedBoard.map(r => ({ name: r.name, price: r.quoted_price ? `$${Number(r.quoted_price).toLocaleString()}` : '—' })),
        ]

        return (
          <div className="bg-white rounded-2xl border border-brand-border p-5 mb-8 shadow-sm">
            <h3 className="text-sm font-black text-text-1 uppercase tracking-wider mb-4">Quick Comparison</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-text-4 font-medium mb-1">Total Quotes</p>
                <p className="text-2xl font-black text-text-1">{totalCount}</p>
              </div>
              <div>
                <p className="text-xs text-text-4 font-medium mb-1">Price Range</p>
                {allPrices.length >= 2 ? (
                  <p className="text-sm font-bold text-text-1">
                    ${Math.min(...allPrices).toLocaleString()} — ${Math.max(...allPrices).toLocaleString()}
                  </p>
                ) : allPrices.length === 1 ? (
                  <p className="text-sm font-bold text-text-1">${allPrices[0].toLocaleString()}</p>
                ) : (
                  <p className="text-sm text-text-4">No prices yet</p>
                )}
              </div>
              <div>
                <p className="text-xs text-text-4 font-medium mb-1">Tastings Offered</p>
                <p className="text-2xl font-black text-text-1">
                  {tastingCount}
                  <span className="text-sm font-normal text-text-4 ml-1">vendor{tastingCount !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-text-4 font-medium mb-1">Accepted</p>
                {acceptedAll.length > 0 ? (
                  <div className="space-y-1">
                    {acceptedAll.map(a => (
                      <p key={a.name} className="text-sm font-bold text-green-700">
                        {a.name} <span className="text-text-3 font-normal">({a.price})</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-4">None yet</p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Empty state */}
      {allEmpty && (
        <div className="bg-white dark:bg-cream-2 rounded-3xl border border-brand-border shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-text-4/50" />
          </div>
          <h3 className="text-xl font-black text-text-1 mb-2">No quotes yet</h3>
          <p className="text-text-3 mb-6 max-w-sm mx-auto">
            Start matching with vendors to receive OneSeva quotes, or share your public request board to collect responses directly.
          </p>
          <Link href={`/events/${eventId}/vendors`}>
            <button className="bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Find Vendors
            </button>
          </Link>
        </div>
      )}

      {/* Detail cards grouped by service */}
      {!allEmpty && (
        <div className="space-y-8">
          {filteredServiceTypes.map((vendorType, idx) => {
            const onesevGroup = sentOneseva.filter(
              q => (q.match?.event_request?.vendor_type ?? 'CATERER') === vendorType
            )
            const boardGroup = boardResponses.filter(r => r.vendor_type === vendorType)
            const count = onesevGroup.length + boardGroup.length
            if (count === 0) return null
            return (
              <ServiceGroup
                key={vendorType}
                vendorType={vendorType}
                colorIdx={idx}
                count={count}
              >
                {onesevGroup.map(q => (
                  <OnesevQuoteRow
                    key={q.id}
                    quote={q}
                    eventId={eventId}
                    onAccept={handleOnesevAccept}
                    onDecline={handleOnesevDecline}
                    highlightTags={highlightTags[q.id] ?? []}
                  />
                ))}
                {boardGroup.map(r => (
                  <BoardResponseRow
                    key={r.id}
                    response={r}
                    requestToken={tokenMap[r.id] ?? ''}
                    onAskQuote={handleAskQuote}
                    onAccept={handleBoardAccept}
                    onDecline={handleBoardDecline}
                    highlightTags={highlightTags[r.id] ?? []}
                  />
                ))}
              </ServiceGroup>
            )
          })}
        </div>
      )}
    </div>
  )
}
