import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CalendarDays, Users } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-cream text-text-3',
  SENT: 'bg-blue-50 text-blue-700',
  VIEWED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  DECLINED: 'bg-red-50 text-red-600',
}

export default async function VendorQuotesPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  const quotes = await prisma.quote.findMany({
    where: { vendor_id: (session.user!.id as string) },
    include: {
      match: {
        include: {
          event_request: {
            include: {
              event: { select: { event_name: true, event_date: true, guest_count: true, city: true, currency: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight tracking-tight text-text-1 mb-8">Quotes</h1>
      {quotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-text-4">No quotes yet. Create a quote from your leads page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map(quote => {
            const event = quote.match.event_request.event
            return (
              <div key={quote.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text-1">{event.event_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[quote.status] ?? 'bg-cream text-text-3'}`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-4">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(event.event_date, 'd MMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.guest_count} guests
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {quote.price_per_head && (
                    <div className="text-right">
                      <div className="font-bold text-brand">
                        {event.currency} {Number(quote.price_per_head).toFixed(0)}/head
                      </div>
                      <div className="text-xs text-text-4">
                        Total: {event.currency} {Number(quote.total_estimate).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/vendor/quotes/${quote.id}/builder`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    {quote.status === 'DRAFT' ? 'Edit' : 'View'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
