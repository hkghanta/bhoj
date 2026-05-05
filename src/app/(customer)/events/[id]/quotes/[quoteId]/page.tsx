'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Printer, CheckCircle2, XCircle, MessageSquare,
  ArrowLeftRight, MapPin, Shield, Leaf, Droplets, AlertTriangle,
  Star, CalendarDays, Users, Banknote, CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import NegotiationPanel from '@/components/quotes/NegotiationPanel'
import { MenuCategory } from '@prisma/client'

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Mains',
  BREAD: 'Breads', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counters', OTHER: 'Other',
}

type TrayLine = {
  id: string
  item_name: string
  serves_note: string | null
  unit_price: number
  qty: number
  line_total: number
  sort_order: number
}

type MenuItem = {
  id: string
  item_name: string
  description: string | null
  category: MenuCategory
  is_vegetarian: boolean
  is_jain: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  is_optional: boolean
  is_removed_by_customer: boolean
  added_by_customer: boolean
}

type Quote = {
  id: string
  status: string
  pricing_type: 'PER_HEAD' | 'PER_TRAY'
  price_per_head: number | null
  total_estimate: number
  currency: string
  notes: string | null
  customer_menu_notes: string | null
  is_menu_finalized: boolean
  tasting_offered: boolean
  tasting_cost: number | null
  tasting_date: string | null
  tasting_location: string | null
  discount_type: string | null
  discount_value: number | null
  discount_note: string | null
  expires_at: string | null
  tray_lines: TrayLine[]
  vendor: {
    id: string
    business_name: string
    city: string
    tier: string
    is_verified: boolean
    avg_rating: number | null
    phone_business: string | null
    website: string | null
  }
  menu_items: MenuItem[]
  match: {
    id: string
    score: number
    event_request: {
      event: {
        id: string
        event_name: string
        event_date: string
        guest_count: number
        city: string
      }
    }
  }
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Draft',    cls: 'bg-cream-2 text-text-3' },
  SENT:     { label: 'Received', cls: 'bg-blue-50 text-blue-700' },
  VIEWED:   { label: 'Viewed',   cls: 'bg-blue-50 text-blue-700' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-50 text-green-700' },
  DECLINED: { label: 'Declined', cls: 'bg-red-50 text-red-500' },
  EXPIRED:  { label: 'Expired',  cls: 'bg-cream-2 text-text-4' },
}

export default function QuoteDetailPage() {
  const { id: eventId, quoteId } = useParams<{ id: string; quoteId: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/quotes/${quoteId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setQuote(d); setLoading(false) })
  }, [quoteId])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: quote?.currency ?? 'USD', maximumFractionDigits: 0 }).format(n)

  async function handleAccept() {
    setActing('accept')
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    setQuote(q => q ? { ...q, status: 'ACCEPTED' } : q)
    setActing(null)
  }

  async function handleDecline() {
    if (!confirm('Decline this quote?')) return
    setActing('decline')
    await fetch(`/api/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DECLINED' }),
    })
    setQuote(q => q ? { ...q, status: 'DECLINED' } : q)
    setActing(null)
  }

  async function openMessage() {
    setActing('msg')
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: quote!.match.id }),
    })
    if (res.ok) {
      const conv = await res.json()
      router.push(`/messages/${conv.id}`)
    } else {
      const list = await fetch('/api/conversations').then(r => r.json())
      const existing = list.find((c: any) => c.match_id === quote!.match.id)
      if (existing) router.push(`/messages/${existing.id}`)
    }
    setActing(null)
  }

  async function openNegotiate() {
    setActing('negotiate')
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: quote!.match.id }),
    })
    let convId: string | null = null
    if (res.ok) {
      convId = (await res.json()).id
    } else {
      const list = await fetch('/api/conversations').then(r => r.json())
      convId = list.find((c: any) => c.match_id === quote!.match.id)?.id ?? null
    }
    if (convId && quote) {
      const pph = quote.price_per_head
      const msg = isTrayPricing
        ? `Hi! Thanks for the quote. I'd like to discuss the order — could we chat about the quantities or pricing?`
        : pph
        ? `Hi! Thanks for the quote. I'd love to discuss — could we look at around ${fmt(Math.round(Number(pph) * 0.9))}/head?`
        : `Hi! Thanks for your quote. I'd like to discuss the details — can we chat?`
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      })
      router.push(`/messages/${convId}`)
    }
    setActing(null)
  }

  if (loading) return <div className="p-8 text-text-4">Loading…</div>
  if (!quote) return <div className="p-8 text-text-4">Quote not found.</div>

  const statusCfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.DRAFT
  const isTrayPricing = quote.pricing_type === 'PER_TRAY'
  const activeItems = quote.menu_items.filter(i => !i.is_removed_by_customer)
  const categories = [...new Set(activeItems.map(i => i.category))]
  const removedCount = quote.menu_items.filter(i => i.is_removed_by_customer && !i.added_by_customer).length
  const canAct = ['SENT', 'VIEWED'].includes(quote.status)
  const isAccepted = quote.status === 'ACCEPTED'
  const event = quote.match.event_request.event

  // Tray bill calculations
  const traySubtotal = quote.tray_lines.reduce((s, l) => s + Number(l.unit_price) * l.qty, 0)
  const trayDiscount = (() => {
    if (!quote.discount_type || !quote.discount_value) return 0
    if (quote.discount_type === 'FLAT') return Math.min(Number(quote.discount_value), traySubtotal)
    if (quote.discount_type === 'PERCENTAGE') return traySubtotal * (Number(quote.discount_value) / 100)
    return 0
  })()
  const trayTotal = Math.max(0, traySubtotal - trayDiscount)

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link href={`/events/${eventId}/quotes`} className="text-text-4 hover:text-text-3">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-text-1">{quote.vendor.business_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            {quote.is_menu_finalized && (
              <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                <CheckCheck className="h-3 w-3" /> Menu finalized
              </span>
            )}
          </div>
          <p className="text-sm text-text-3 mt-0.5">
            {event.event_name} · {new Date(event.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm text-text-3 border border-brand-border px-3 py-1.5 rounded-xl hover:bg-cream"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </div>

      <div ref={printRef} className="space-y-5">

        {/* Vendor info */}
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cream-2 flex items-center justify-center flex-shrink-0">
            <span className="text-brand font-bold text-lg">{quote.vendor.business_name[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text-1">{quote.vendor.business_name}</span>
              {quote.vendor.is_verified && (
                <span className="flex items-center gap-0.5 text-xs text-blue-600">
                  <Shield className="h-3 w-3" /> Verified
                </span>
              )}
              {quote.vendor.tier !== 'FREE' && (
                <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full">{quote.vendor.tier}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-3 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{quote.vendor.city}</span>
              {quote.vendor.avg_rating && (
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(quote.vendor.avg_rating).toFixed(1)}</span>
              )}
              <span className="flex items-center gap-1"><Star className="h-3 w-3" />Match score: {quote.match.score}</span>
            </div>
            {(quote.vendor.phone_business || quote.vendor.website) && (
              <div className="flex gap-3 mt-1.5 text-xs text-text-3">
                {quote.vendor.phone_business && <span>{quote.vendor.phone_business}</span>}
                {quote.vendor.website && (
                  <a href={quote.vendor.website} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
          <Link
            href={`/events/${eventId}/vendors/${quote.vendor.id}?matchId=${quote.match.id}`}
            className="text-xs text-brand hover:underline print:hidden"
          >
            Full profile →
          </Link>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
          <h2 className="font-bold text-text-1 mb-4">Pricing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {!isTrayPricing && (
              <div className="bg-cream rounded-xl p-5 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-brand font-medium mb-1">
                  <Users className="h-3.5 w-3.5" /> Per head
                </div>
                <div className="text-3xl font-black text-brand">
                  {quote.price_per_head ? fmt(Number(quote.price_per_head)) : '—'}
                </div>
              </div>
            )}
            <div className="bg-cream rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-brand font-medium mb-1">
                <Banknote className="h-3.5 w-3.5" /> {isTrayPricing ? 'Order total' : 'Total'}
              </div>
              <div className="text-3xl font-black text-brand">{fmt(Number(quote.total_estimate))}</div>
              {!isTrayPricing && <div className="text-xs text-brand mt-0.5">{event.guest_count} guests</div>}
            </div>
            {quote.tasting_offered && (
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <div className="text-xs text-green-600 font-medium mb-1">Tasting</div>
                <div className="text-2xl font-black text-green-700">
                  {Number(quote.tasting_cost) === 0 ? 'Free' : quote.tasting_cost ? fmt(Number(quote.tasting_cost)) : 'Available'}
                </div>
                {quote.tasting_location && (
                  <div className="text-xs text-green-500 mt-0.5 leading-tight">{quote.tasting_location}</div>
                )}
              </div>
            )}
            {quote.expires_at && (
              <div className="bg-cream rounded-xl p-5 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-text-3 font-medium mb-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Valid until
                </div>
                <div className="text-sm font-bold text-text-2">
                  {new Date(quote.expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tray order details */}
        {isTrayPricing && quote.tray_lines.length > 0 && (
          <div className="bg-white dark:bg-cream-2 rounded-xl border overflow-hidden">
            <div className="px-5 py-4 border-b bg-cream">
              <h2 className="font-bold text-text-1">Order Details</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-cream/40">
                  <th className="text-left px-5 py-2.5 text-sm font-bold text-text-3 uppercase tracking-wide">Item</th>
                  <th className="text-center px-3 py-2.5 text-sm font-bold text-text-3 uppercase tracking-wide hidden sm:table-cell">Serves</th>
                  <th className="text-center px-3 py-2.5 text-sm font-bold text-text-3 uppercase tracking-wide">Qty</th>
                  <th className="text-right px-3 py-2.5 text-sm font-bold text-text-3 uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-5 py-2.5 text-sm font-bold text-text-3 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {quote.tray_lines.map(l => (
                  <tr key={l.id}>
                    <td className="px-5 py-3 font-medium text-text-1">{l.item_name}</td>
                    <td className="px-3 py-3 text-center text-xs text-text-4 hidden sm:table-cell">{l.serves_note ?? '—'}</td>
                    <td className="px-3 py-3 text-center text-text-2">{l.qty}</td>
                    <td className="px-3 py-3 text-right text-text-3">{fmt(Number(l.unit_price))}</td>
                    <td className="px-5 py-3 text-right font-bold text-text-1">{fmt(Number(l.line_total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-brand-border">
                <tr>
                  <td colSpan={3} className="hidden sm:table-cell" />
                  <td className="px-3 py-2.5 text-right text-xs text-text-3">Subtotal</td>
                  <td className="px-5 py-2.5 text-right text-sm font-medium text-text-2">{fmt(traySubtotal)}</td>
                </tr>
                {trayDiscount > 0 && (
                  <tr>
                    <td colSpan={3} className="hidden sm:table-cell" />
                    <td className="px-3 py-2 text-right text-xs text-green-600">
                      Discount{quote.discount_type === 'PERCENTAGE' ? ` (${quote.discount_value}%)` : ''}
                      {quote.discount_note && <span className="block text-text-4">{quote.discount_note}</span>}
                    </td>
                    <td className="px-5 py-2 text-right text-sm font-medium text-green-600">−{fmt(trayDiscount)}</td>
                  </tr>
                )}
                <tr className="bg-cream/60">
                  <td colSpan={3} className="hidden sm:table-cell" />
                  <td className="px-3 py-4 text-right font-bold text-text-1">Total</td>
                  <td className="px-5 py-4 text-right text-xl font-black text-brand">{fmt(trayTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* What's included */}
        {quote.notes && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
            <h2 className="font-bold text-text-1 mb-2">What's included</h2>
            <p className="text-sm text-text-3 leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Menu */}
        {!isTrayPricing && quote.menu_items.length > 0 && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-text-1">
                  Menu <span className="text-text-4 font-normal text-sm">({activeItems.length} items)</span>
                </h2>
                {removedCount > 0 && (
                  <p className="text-xs text-text-4 mt-0.5">{removedCount} item(s) removed by you</p>
                )}
              </div>
              <div className="flex items-center gap-2 print:hidden">
                {quote.is_menu_finalized && (
                  <Link
                    href={`/events/${eventId}/menu-print/${quoteId}`}
                    target="_blank"
                    className="flex items-center gap-1.5 text-xs text-text-3 border border-brand-border px-3 py-1.5 rounded-xl hover:bg-cream"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print menu
                  </Link>
                )}
                <Link
                  href={`/events/${eventId}/quotes`}
                  className="text-xs text-brand hover:underline"
                >
                  Customize →
                </Link>
              </div>
            </div>

            <div className="space-y-8">
              {categories.map(cat => {
                const items = activeItems.filter(i => i.category === cat)
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-bold text-text-4 uppercase tracking-widest mb-3">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </h3>
                    <div className="space-y-4">
                      {items.map(item => {
                        const allergens = [item.contains_nuts && 'nuts', item.contains_gluten && 'gluten', item.contains_dairy && 'dairy'].filter(Boolean)
                        return (
                          <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-brand-border last:border-0 last:pb-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-text-1 text-sm">{item.item_name}</span>
                                {item.added_by_customer && (
                                  <span className="text-xs text-brand italic">(your request)</span>
                                )}
                                {item.is_optional && (
                                  <span className="text-xs text-text-4">(optional)</span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-text-3 mt-1 leading-relaxed italic">{item.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.is_vegetarian && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                                    <Leaf className="h-2.5 w-2.5" /> Vegetarian
                                  </span>
                                )}
                                {item.is_jain && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                    Jain
                                  </span>
                                )}
                                {item.is_halal && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                    <Droplets className="h-2.5 w-2.5" /> Halal
                                  </span>
                                )}
                                {allergens.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Contains: {allergens.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Customer notes */}
            {quote.customer_menu_notes && (
              <div className="mt-4 pt-4 border-t bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
                <span className="font-medium">Your notes: </span>{quote.customer_menu_notes}
              </div>
            )}
          </div>
        )}

        {/* Tasting date */}
        {quote.tasting_offered && quote.tasting_date && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-3">
            <CalendarDays className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-green-800">Tasting scheduled: </span>
              <span className="text-green-700">
                {new Date(quote.tasting_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {quote.tasting_location && (
                <p className="text-green-600 text-xs mt-0.5">{quote.tasting_location}</p>
              )}
            </div>
          </div>
        )}

        {/* Negotiation panel */}
        <NegotiationPanel
          quoteId={quoteId}
          quoteStatus={quote.status}
          vendorName={quote.vendor.business_name}
          currentTotal={Number(quote.total_estimate)}
          currentPerHead={quote.price_per_head ? Number(quote.price_per_head) : null}
        />

        {/* Actions */}
        {!isAccepted && canAct && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 flex flex-wrap gap-3 print:hidden">
            <Button
              onClick={handleAccept}
              disabled={acting !== null}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {acting === 'accept' ? 'Accepting…' : 'Accept this quote'}
            </Button>
            <Button
              variant="outline"
              onClick={openNegotiate}
              disabled={acting !== null}
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {acting === 'negotiate' ? 'Opening…' : 'Negotiate price'}
            </Button>
            <Button
              variant="outline"
              onClick={openMessage}
              disabled={acting !== null}
              className="gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              {acting === 'msg' ? 'Opening…' : 'Message vendor'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={acting !== null}
              className="gap-1.5 text-red-500 hover:text-red-700 hover:border-red-300 ml-auto"
            >
              <XCircle className="h-4 w-4" />
              {acting === 'decline' ? 'Declining…' : 'Decline'}
            </Button>
          </div>
        )}

        {isAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3 print:hidden">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Quote accepted</p>
              <p className="text-sm text-green-700 mt-0.5">Message the vendor to confirm final details and next steps.</p>
            </div>
            <Button size="sm" variant="outline" onClick={openMessage} disabled={acting !== null} className="ml-auto gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {acting === 'msg' ? 'Opening…' : 'Message'}
            </Button>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { font-size: 13px; }
          @page { margin: 20mm; }
        }
      `}</style>
    </div>
  )
}
