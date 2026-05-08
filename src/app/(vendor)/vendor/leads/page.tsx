import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format, differenceInDays } from 'date-fns'
import { StatusBadge } from '@/components/ui/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Users, CalendarDays, MapPin, Inbox, Send, Leaf, AlertTriangle } from 'lucide-react'
import { VendorBadges } from '@/components/vendor/VendorBadges'
import { LeadsSortClient } from './leads-sort-client'

export default async function VendorLeadsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  const vendorId = session.user!.id as string

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      avg_response_hrs: true,
      badges: { select: { badge_type: true } },
    },
  })

  const matches = await prisma.match.findMany({
    where: { vendor_id: vendorId },
    include: {
      event_request: {
        include: {
          event: {
            select: { event_name: true, event_date: true, guest_count: true, city: true, total_budget: true, currency: true },
          },
          menu_preference: { select: { cuisine_preferences: true, is_vegetarian: true, is_halal: true } },
        },
      },
      quotes: { select: { id: true, status: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  const now = new Date()
  const leadsData = matches.map(match => {
    const daysUntil = differenceInDays(new Date(match.event_request.event.event_date), now)
    return { match, daysUntil }
  })

  const pendingCount = matches.filter(m => m.status === 'PENDING').length
  const quotedCount = matches.filter(m => m.quotes.length > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-1">Leads</h1>
          {matches.length > 0 && (
            <p className="text-sm text-text-4 mt-1">
              {pendingCount} new &middot; {quotedCount} quoted
            </p>
          )}
        </div>
        {matches.length > 1 && <LeadsSortClient />}
      </div>

      {vendor && vendor.badges.length > 0 && (
        <div className="mb-6">
          <VendorBadges badges={vendor.badges} responseHrs={vendor.avg_response_hrs} />
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl bg-white dark:bg-cream-2">
          <Inbox className="h-10 w-10 text-text-4/40 mx-auto mb-3" />
          <h3 className="font-bold text-text-1 mb-1">No leads yet</h3>
          <p className="text-sm text-text-4 max-w-sm mx-auto mb-4">
            Complete your profile and add packages so customers can find and match with you.
          </p>
          <Link
            href="/vendor/onboarding"
            className={cn(buttonVariants({ size: 'sm' }), 'bg-brand hover:bg-brand-hover')}
          >
            Complete Profile
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_90px_130px_130px] gap-3 px-5 py-2.5 border-b border-brand-border bg-cream text-[10px] font-bold uppercase tracking-widest text-text-4">
            <span>Event</span>
            <span className="text-center">Urgency</span>
            <span className="text-center">Score</span>
            <span className="text-right">Budget</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-brand-border/50">
            {leadsData.map(({ match, daysUntil }) => {
              const event = match.event_request.event
              const pref = match.event_request.menu_preference
              const hasQuote = match.quotes.length > 0
              const quoteSent = hasQuote && match.quotes[0].status === 'SENT'
              const scoreWidth = Math.min(100, Math.max(0, (match.score / 100) * 100))

              return (
                <div key={match.id} className="px-5 py-4 hover:bg-cream/30 transition-colors">
                  {/* Desktop: table-like row */}
                  <div className="hidden sm:grid grid-cols-[1fr_100px_90px_130px_130px] gap-3 items-center">
                    {/* Event info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-text-1 text-sm truncate">{event.event_name}</h3>
                        <StatusBadge
                          status={quoteSent ? 'Quoted' : match.status === 'PENDING' ? 'New' : match.status.toLowerCase()}
                          variant={quoteSent ? 'success' : match.status === 'PENDING' ? 'info' : 'default'}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-4">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(event.event_date, 'd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.guest_count}
                        </span>
                      </div>
                      {pref && (
                        <div className="flex gap-1.5 mt-1.5">
                          {pref.cuisine_preferences.slice(0, 2).map(c => (
                            <span key={c} className="text-[10px] bg-cream text-brand px-1.5 py-0.5 rounded-full">{c}</span>
                          ))}
                          {pref.is_vegetarian && (
                            <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Leaf className="h-2.5 w-2.5" /> Veg
                            </span>
                          )}
                          {pref.is_halal && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Halal</span>}
                        </div>
                      )}
                    </div>

                    {/* Urgency */}
                    <div className="text-center">
                      {daysUntil <= 0 ? (
                        <span className="text-xs text-text-4">Past</span>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          {daysUntil <= 14 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                          <span className={cn(
                            'text-xs font-bold',
                            daysUntil <= 7 ? 'text-red-600' :
                            daysUntil <= 30 ? 'text-amber-600' :
                            'text-text-3'
                          )}>
                            {daysUntil}d
                          </span>
                          <span className="text-[10px] text-text-4">until event</span>
                        </div>
                      )}
                    </div>

                    {/* Match score bar */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-text-1">{match.score}</span>
                      <div className="w-full h-1.5 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${scoreWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="text-right">
                      <div className="font-bold text-brand text-sm">
                        {event.currency} {Number(event.total_budget).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-text-4">total budget</div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      {hasQuote ? (
                        <Link
                          href={`/vendor/quotes/${match.quotes[0].id}/builder`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}
                        >
                          {quoteSent ? (
                            <><Send className="h-3 w-3 mr-1" /> Sent</>
                          ) : (
                            'Edit Quote'
                          )}
                        </Link>
                      ) : (
                        <Link
                          href={`/vendor/quotes/new?matchId=${match.id}`}
                          className={cn(buttonVariants({ size: 'sm' }), 'bg-brand hover:bg-brand-hover text-xs')}
                        >
                          <Send className="h-3 w-3 mr-1" /> Send Quote
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Mobile: stacked layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-text-1 text-sm">{event.event_name}</h3>
                          <StatusBadge
                            status={quoteSent ? 'Quoted' : match.status === 'PENDING' ? 'New' : match.status.toLowerCase()}
                            variant={quoteSent ? 'success' : match.status === 'PENDING' ? 'info' : 'default'}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-4 mt-0.5">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(event.event_date, 'd MMM')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.guest_count}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand text-sm">
                          {event.currency} {Number(event.total_budget).toLocaleString()}
                        </div>
                        {daysUntil > 0 && (
                          <span className={cn(
                            'text-[10px] font-bold',
                            daysUntil <= 7 ? 'text-red-600' : daysUntil <= 30 ? 'text-amber-600' : 'text-text-4'
                          )}>
                            {daysUntil}d away
                          </span>
                        )}
                      </div>
                    </div>
                    {pref && (
                      <div className="flex gap-1.5 mb-2">
                        {pref.cuisine_preferences.slice(0, 2).map(c => (
                          <span key={c} className="text-[10px] bg-cream text-brand px-1.5 py-0.5 rounded-full">{c}</span>
                        ))}
                        {pref.is_vegetarian && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">Veg</span>}
                        {pref.is_halal && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Halal</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-3">Score: {match.score}</span>
                        <div className="w-16 h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${scoreWidth}%` }} />
                        </div>
                      </div>
                      {hasQuote ? (
                        <Link
                          href={`/vendor/quotes/${match.quotes[0].id}/builder`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}
                        >
                          {quoteSent ? 'Sent' : 'Edit'}
                        </Link>
                      ) : (
                        <Link
                          href={`/vendor/quotes/new?matchId=${match.id}`}
                          className={cn(buttonVariants({ size: 'sm' }), 'bg-brand hover:bg-brand-hover text-xs')}
                        >
                          Send Quote
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
