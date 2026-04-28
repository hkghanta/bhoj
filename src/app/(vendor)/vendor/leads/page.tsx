import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Users, CalendarDays, MapPin } from 'lucide-react'

export default async function VendorLeadsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  const matches = await prisma.match.findMany({
    where: { vendor_id: (session.user!.id as string) },
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads</h1>
      {matches.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-gray-400">No leads yet. Complete your profile to start receiving matches.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(match => {
            const event = match.event_request.event
            const pref = match.event_request.menu_preference
            const hasQuote = match.quotes.length > 0

            return (
              <div key={match.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                      <Badge variant="outline" className="text-xs capitalize">
                        {match.event_request.vendor_type.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        match.status === 'PENDING' ? 'bg-blue-50 text-blue-700' :
                        match.status === 'QUOTED' ? 'bg-green-50 text-green-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>{match.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(event.event_date, 'd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {event.guest_count} guests
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 text-lg">
                      {event.currency} {Number(event.total_budget).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">total budget</div>
                    <div className="text-sm font-medium text-gray-600 mt-1">Score: {match.score}</div>
                  </div>
                </div>

                {pref && (
                  <div className="flex gap-2 mb-4">
                    {pref.cuisine_preferences.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                    {pref.is_vegetarian && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Vegetarian</span>}
                    {pref.is_halal && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Halal</span>}
                  </div>
                )}

                <div className="flex gap-3">
                  {hasQuote ? (
                    <Link
                      href={`/vendor/quotes/${match.quotes[0].id}/builder`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      {match.quotes[0].status === 'SENT' ? 'Quote sent' : 'Edit quote'}
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/quotes/new?matchId=${match.id}`}
                      className={cn(buttonVariants({ size: 'sm' }), 'bg-orange-600 hover:bg-orange-700')}
                    >
                      Create Quote
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
