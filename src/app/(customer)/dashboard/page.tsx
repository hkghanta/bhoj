import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarDays, Users, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const EVENT_TYPE_EMOJI: Record<string, string> = {
  WEDDING: '💍', BIRTHDAY: '🎂', CORPORATE: '💼', ENGAGEMENT: '💎',
  BABY_SHOWER: '👶', ANNIVERSARY: '🥂', GRADUATION: '🎓', OTHER: '🎉',
}

export default async function CustomerDashboard() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await prisma.event.findMany({
    where: { customer_id: (session.user!.id as string) },
    include: { _count: { select: { checklist_items: true } } },
    orderBy: { event_date: 'asc' },
  })

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date())
  const past = events.filter(e => new Date(e.event_date) < new Date())

  // Overall spend
  const eventIds = events.map(e => e.id)
  const totalCommitted = eventIds.length > 0
    ? await prisma.quote.aggregate({
        where: { status: 'ACCEPTED', match: { event_request: { event_id: { in: eventIds } } } },
        _sum: { total_estimate: true },
      })
    : { _sum: { total_estimate: null } }
  const overallSpend = Number(totalCommitted._sum.total_estimate ?? 0)
  const overallBudget = events.reduce((sum, e) => sum + Number(e.total_budget), 0)
  const currency = events[0]?.currency ?? 'USD'
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1">My Events</h1>
          <p className="text-sm text-text-4 mt-0.5">
            {events.length === 0 ? 'Start planning your first celebration' :
             `${upcoming.length} upcoming${past.length > 0 ? ` · ${past.length} past` : ''}`}
          </p>
        </div>
        <Link href="/events/new" className={cn(buttonVariants(), 'bg-brand hover:bg-brand-hover gap-2')}>
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      {/* Spend summary */}
      {overallSpend > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-text-4">Total Committed</div>
              <div className="text-2xl font-extrabold tracking-tight text-text-1">{fmtCurrency(overallSpend)}</div>
            </div>
          </div>
          {overallBudget > 0 && (
            <div className="text-right">
              <div className="text-sm text-text-4">Total Budget</div>
              <div className="text-lg font-bold text-text-2">{fmtCurrency(overallBudget)}</div>
              <div className={`text-xs font-medium ${overallSpend > overallBudget ? 'text-red-600' : 'text-green-600'}`}>
                {fmtCurrency(overallBudget - overallSpend)} remaining
              </div>
            </div>
          )}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-2xl bg-cream">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-lg font-bold text-text-1 mb-1">No events yet</h3>
          <p className="text-text-4 text-sm mb-6">Start planning your celebration — we'll match you with the best vendors.</p>
          <Link href="/events/new" className={cn(buttonVariants(), 'bg-brand hover:bg-brand-hover')}>
            Create my first event
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              {past.length > 0 && (
                <h2 className="text-xs font-bold text-text-4 uppercase tracking-wider mb-3">Upcoming</h2>
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-text-4 uppercase tracking-wider mb-3">Past Events</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {past.map(event => (
                  <EventCard key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, past = false }: {
  event: {
    id: string
    event_name: string
    event_type: string
    event_date: Date
    guest_count: number
    city: string
    status: string
    checklist_progress: number
    _count: { checklist_items: number }
  }
  past?: boolean
}) {
  const daysUntil = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const emoji = EVENT_TYPE_EMOJI[event.event_type] ?? '🎉'
  const statusColors: Record<string, string> = {
    PLANNING: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-green-50 text-green-700',
    COMPLETED: 'bg-cream-2 text-text-3',
    CANCELLED: 'bg-red-50 text-red-500',
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className={cn(
        'bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 hover:shadow-md hover:border-brand transition-all group',
        past && 'opacity-70'
      )}>
        {/* Top accent */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-xl">
              {emoji}
            </div>
            <div>
              <h3 className="font-bold text-text-1 text-sm leading-tight group-hover:text-brand transition-colors">
                {event.event_name}
              </h3>
              <p className="text-xs text-text-4 mt-0.5 capitalize">{event.event_type.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[event.status] ?? 'bg-cream-2 text-text-3'}`}>
            {event.status}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-text-3 mb-4">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-text-4" />
            {format(event.event_date, 'd MMM yyyy')}
            {!past && daysUntil > 0 && (
              <span className="text-brand font-bold">· {daysUntil}d away</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-text-4" />
            {event.guest_count} guests · {event.city}
          </span>
        </div>

        {/* Progress bar */}
        {event._count.checklist_items > 0 && (
          <div>
            <div className="flex justify-between text-xs text-text-4 mb-1.5">
              <span>Planning progress</span>
              <span className="font-medium text-text-2">{event.checklist_progress}%</span>
            </div>
            <div className="h-1.5 bg-cream-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${Math.max(event.checklist_progress, 2)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border">
          <span className="text-xs text-text-4">
            {event._count.checklist_items} checklist items
          </span>
          <span className="text-xs text-brand font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
