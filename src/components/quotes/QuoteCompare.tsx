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
  }
  menu_items: QuoteItem[]
  match: { score: number; rank: number }
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
    <div className="text-center py-12 text-gray-400">No quotes yet.</div>
  )

  const allCategories = [...new Set(quotes.flatMap(q => q.menu_items.map(i => i.category)))]

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td className="w-40 p-3" />
            {quotes.map(q => (
              <th key={q.id} className="p-3 text-left align-top border-b min-w-[220px]">
                <div className="font-semibold text-gray-900">{q.vendor.business_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{q.vendor.city}</div>
                <div className="flex items-center gap-2 mt-1">
                  {q.vendor.tier !== 'FREE' && (
                    <Badge className="bg-orange-600 text-white text-xs">{q.vendor.tier}</Badge>
                  )}
                  <span className="text-xs text-gray-500">Score: {q.match.score}</span>
                </div>
                <div className={`mt-2 text-xs font-medium ${
                  q.status === 'ACCEPTED' ? 'text-green-600' :
                  q.status === 'DECLINED' ? 'text-red-500' : 'text-gray-500'
                }`}>{q.status}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="bg-gray-50">
            <td className="p-3 font-medium text-gray-600">Price / head</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.price_per_head
                  ? <span className="font-bold text-orange-600 text-lg">{fmt(Number(q.price_per_head), q.currency)}</span>
                  : <span className="text-gray-300">—</span>}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 font-medium text-gray-600">Total estimate</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3 font-semibold">
                {fmt(Number(q.total_estimate), q.currency)}
              </td>
            ))}
          </tr>

          <tr className="bg-gray-50">
            <td className="p-3 font-medium text-gray-600">Tasting</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3">
                {q.tasting_offered ? (
                  <div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Available
                    </div>
                    {q.tasting_cost !== null && Number(q.tasting_cost) > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">{fmt(Number(q.tasting_cost), q.currency)}</div>
                    )}
                    {q.tasting_cost !== null && Number(q.tasting_cost) === 0 && (
                      <div className="text-xs text-green-500">Complimentary</div>
                    )}
                    {q.tasting_location && <div className="text-xs text-gray-400 mt-0.5">{q.tasting_location}</div>}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-gray-300">
                    <XCircle className="h-4 w-4" /> Not offered
                  </span>
                )}
              </td>
            ))}
          </tr>

          {allCategories.map(cat => (
            <tr key={cat} className="border-t">
              <td className="p-3 font-medium text-gray-600 align-top">
                {CATEGORY_LABELS[cat] ?? cat}
              </td>
              {quotes.map(q => {
                const catItems = q.menu_items.filter(i => i.category === cat)
                return (
                  <td key={q.id} className="p-3 align-top">
                    {catItems.length === 0 ? (
                      <span className="text-gray-300 text-xs">Not included</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {catItems.map((item, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">·</span>
                            {item.item_name}
                            {item.is_optional && <span className="text-gray-400 ml-1">(opt)</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}

          <tr className="border-t bg-gray-50">
            <td className="p-3 font-medium text-gray-600 align-top">Notes</td>
            {quotes.map(q => (
              <td key={q.id} className="p-3 text-xs text-gray-600 align-top">
                {q.notes ?? <span className="text-gray-300">—</span>}
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
                  <Badge variant="outline" className="text-gray-400">Declined</Badge>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(q.id)}
                      className={cn(buttonVariants({ size: 'sm' }), 'bg-orange-600 hover:bg-orange-700')}
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
