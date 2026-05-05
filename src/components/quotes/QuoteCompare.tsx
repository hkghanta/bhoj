'use client'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { MenuCategory } from '@prisma/client'

type QuoteItem = { item_name: string; category: MenuCategory; is_optional: boolean }
type Quote = {
  id: string
  price_per_head: number | null
  total_estimate: number
  currency: string
  notes: string | null
  tasting_offered: boolean
  tasting_cost: number | null
  tasting_location: string | null
  status: string
  expires_at: string | null
  vendor: {
    id: string; business_name: string; city: string; tier: string
    is_verified: boolean; profile_photo_url: string | null
    sustainability_tags?: string[]
    badges?: { badge_type: string }[]
    cancellation_policies?: { hours_before_event: number; refund_percent: number }[]
    cancellation_preset?: { name: string; tiers: unknown } | null
    stations?: { station_template: { name: string } }[]
  }
  menu_items: QuoteItem[]
  match: { score: number; rank: number }
  tags?: string[]
  vendor_rating?: { avg: number; count: number }
  response_time_ms?: number
}

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Mains',
  BREAD: 'Breads', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counters',
}

type Props = {
  quotes: Quote[]
  guestCount: number
  onAccept: (quoteId: string) => void
  onDecline: (quoteId: string) => void
}

export function QuoteCompare({ quotes, guestCount: _guestCount, onAccept, onDecline }: Props) {
  if (quotes.length === 0) return (
    <div className="text-center py-12 text-text-4">No quotes yet.</div>
  )

  const allCategories = [...new Set(quotes.flatMap(q => q.menu_items.map(i => i.category)))]

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td className="w-40 p-3" />
            {quotes.map(q => (
              <th key={q.id} className="p-3 text-left align-top border-b min-w-[220px]">
                <div className="font-semibold text-text-1">{q.vendor.business_name}</div>
                <div className="text-xs text-text-4 mt-0.5">{q.vendor.city}</div>
                <div className="flex items-center gap-2 mt-1">
                  {q.vendor.tier !== 'FREE' && (
                    <Badge className="bg-brand text-white text-xs">{q.vendor.tier}</Badge>
                  )}
                  <span className="text-xs text-text-4">Score: {q.match.score}</span>
                </div>
                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {q.tags.map(tag => (
                      <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        tag === 'Cheapest' ? 'bg-green-100 text-green-700' :
                        tag === 'Highest Rated' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {q.vendor.badges && q.vendor.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {q.vendor.badges.map(b => (
                      <span key={b.badge_type} className="text-xs bg-cream text-text-3 px-1.5 py-0.5 rounded">
                        {b.badge_type === 'TOP_RATED' ? '⭐ Top' :
                         b.badge_type === 'FAST_RESPONDER' ? '⚡ Fast' :
                         b.badge_type === 'POPULAR' ? '🔥 Popular' :
                         b.badge_type === 'NEW_VENDOR' ? '✨ New' : b.badge_type}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`mt-2 text-xs font-medium ${
                  q.status === 'ACCEPTED' ? 'text-green-600' :
                  q.status === 'DECLINED' ? 'text-red-500' : 'text-text-4'
                }`}>{q.status}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="bg-cream">
            <td className="p-3 font-medium text-text-3">Price / head</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.price_per_head
                  ? <span className="font-bold text-brand text-lg">{fmt(Number(q.price_per_head), q.currency)}</span>
                  : <span className="text-text-4">—</span>}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 font-medium text-text-3">Total estimate</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3 font-semibold">
                {fmt(Number(q.total_estimate), q.currency)}
              </td>
            ))}
          </tr>

          <tr className="bg-cream">
            <td className="p-3 font-medium text-text-3">Rating</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.vendor_rating && q.vendor_rating.count > 0 ? (
                  <div>
                    <span className="font-semibold text-amber-600">{q.vendor_rating.avg.toFixed(1)}</span>
                    <span className="text-xs text-text-4 ml-1">({q.vendor_rating.count} reviews)</span>
                  </div>
                ) : <span className="text-text-4 text-xs">No reviews</span>}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 font-medium text-text-3">Response Time</td>
            {quotes.map(q => {
              if (!q.response_time_ms) return <td key={q.id} className="p-3 text-text-4">—</td>
              const hours = Math.round(q.response_time_ms / (1000 * 60 * 60))
              return (
                <td key={q.id} className="p-3 text-sm">
                  {hours < 1 ? '< 1 hour' : hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`}
                </td>
              )
            })}
          </tr>
          <tr className="bg-cream">
            <td className="p-3 font-medium text-text-3">Cancellation</td>
            {quotes.map(q => {
              const policies = q.vendor.cancellation_policies
              const preset = q.vendor.cancellation_preset
              if (preset) {
                return <td key={q.id} className="p-3 text-xs text-text-3">{preset.name} policy</td>
              }
              if (policies && policies.length > 0) {
                return (
                  <td key={q.id} className="p-3">
                    <div className="space-y-0.5">
                      {policies.map((p, i) => (
                        <div key={i} className="text-xs text-text-4">{p.hours_before_event}h+ → {p.refund_percent}%</div>
                      ))}
                    </div>
                  </td>
                )
              }
              return <td key={q.id} className="p-3 text-text-4 text-xs">Not specified</td>
            })}
          </tr>
          <tr>
            <td className="p-3 font-medium text-text-3">Sustainability</td>
            {quotes.map(q => {
              const tags = q.vendor.sustainability_tags ?? []
              return (
                <td key={q.id} className="p-3">
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map(t => (
                        <span key={t} className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                          {t.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ))}
                    </div>
                  ) : <span className="text-text-4 text-xs">—</span>}
                </td>
              )
            })}
          </tr>
          <tr className="bg-cream">
            <td className="p-3 font-medium text-text-3">Live Stations</td>
            {quotes.map(q => {
              const stations = q.vendor.stations ?? []
              return (
                <td key={q.id} className="p-3">
                  {stations.length > 0 ? (
                    <div className="space-y-0.5">
                      {stations.map((s, i) => (
                        <div key={i} className="text-xs text-text-3">🔥 {s.station_template.name}</div>
                      ))}
                    </div>
                  ) : <span className="text-text-4 text-xs">—</span>}
                </td>
              )
            })}
          </tr>

          <tr>
            <td className="p-3 font-medium text-text-3">Tasting</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.tasting_offered ? (
                  <div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Available
                    </div>
                    {q.tasting_cost !== null && Number(q.tasting_cost) > 0 && (
                      <div className="text-xs text-text-4 mt-0.5">{fmt(Number(q.tasting_cost), q.currency)}</div>
                    )}
                    {q.tasting_cost !== null && Number(q.tasting_cost) === 0 && (
                      <div className="text-xs text-green-500">Complimentary</div>
                    )}
                    {q.tasting_location && <div className="text-xs text-text-4 mt-0.5">{q.tasting_location}</div>}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-text-4">
                    <XCircle className="h-4 w-4" /> Not offered
                  </span>
                )}
              </td>
            ))}
          </tr>

          {allCategories.map(cat => (
            <tr key={cat} className="border-t">
              <td className="p-3 font-medium text-text-3 align-top">
                {CATEGORY_LABELS[cat] ?? cat}
              </td>
              {quotes.map(q => {
                const catItems = q.menu_items.filter(i => i.category === cat)
                return (
                  <td key={q.id} className="p-3 align-top">
                    {catItems.length === 0 ? (
                      <span className="text-text-4 text-xs">Not included</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {catItems.map((item, i) => (
                          <li key={i} className="text-xs text-text-2 flex items-start gap-1">
                            <span className="text-text-4 mt-0.5">·</span>
                            {item.item_name}
                            {item.is_optional && <span className="text-text-4 ml-1">(opt)</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}

          <tr className="border-t bg-cream">
            <td className="p-3 font-medium text-text-3 align-top">Notes</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3 text-xs text-text-3 align-top">
                {q.notes ?? <span className="text-text-4">—</span>}
              </td>
            ))}
          </tr>

          <tr className="border-t">
            <td className="p-3" />
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.status === 'ACCEPTED' ? (
                  <Badge className="bg-green-600 text-white">Accepted</Badge>
                ) : q.status === 'DECLINED' ? (
                  <Badge variant="outline" className="text-text-4">Declined</Badge>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(q.id)}
                      className={cn(buttonVariants({ size: 'sm' }), 'bg-brand hover:bg-brand-hover')}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDecline(q.id)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
