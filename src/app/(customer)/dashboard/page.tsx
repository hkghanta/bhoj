import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarDays, Users, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function CustomerDashboard() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await prisma.event.findMany({
    where: { customer_id: (session.user!.id as string) },
    include: { _count: { select: { checklist_items: true } } },
    orderBy: { event_date: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Link href="/events/new" className={cn(buttonVariants(), 'bg-orange-600 hover:bg-orange-700')}>
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-gray-400 mb-4">No events yet. Start planning your celebration!</p>
          <Link href="/events/new" className={cn(buttonVariants(), 'bg-orange-600 hover:bg-orange-700')}>
            Create my first event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-white rounded-xl border p-5 hover:border-orange-400 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{event.event_type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{event.status}</Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(event.event_date, 'd MMM yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {event.guest_count} guests · {event.city}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Planning progress</span>
                    <span>{event.checklist_progress}%</span>
                  </div>
                  <Progress value={event.checklist_progress} className="h-1.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
