import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { AddChecklistItemDialog } from '@/components/customer/AddChecklistItemDialog'
import { EventChecklistTable } from '@/components/customer/EventChecklistTable'
import {
  CalendarDays, MapPin, Users, Search, FileText,
  MessageSquare, ChevronRight, Wallet, CalendarPlus,
  Users2,
} from 'lucide-react'
import Link from 'next/link'

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
      sub_events: { orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }] },
    },
  })

  if (!event) notFound()

  // Quote count (received)
  const quoteCount = await prisma.quote.count({
    where: {
      status: { in: ['SENT', 'ACCEPTED'] },
      match: { event_request: { event_id: id } },
    },
  })

  // Unread messages
  const unreadCount = await prisma.message.count({
    where: {
      is_read: false,
      sender_type: 'VENDOR',
      conversation: { customer_id: customerId, match: { event_request: { event_id: id } } },
    },
  })

  const guestHouseholdCount = await prisma.guestHousehold.count({ where: { event_id: id } })

  const [enabledServices, eventRequests] = await Promise.all([
    prisma.serviceConfig.findMany({
      where: { is_enabled: true },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.eventRequest.findMany({
      where: { event_id: id },
      include: { _count: { select: { matches: true } } },
    }),
  ])

  const requestByType: Record<string, { id: string; service_notes: string | null; matchCount: number }> = {}
  for (const r of eventRequests) {
    requestByType[r.vendor_type] = {
      id: r.id,
      service_notes: r.service_notes,
      matchCount: r._count.matches,
    }
  }

  // Checklist stats
  const doneStatuses = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = event.checklist_items.filter(i => doneStatuses.includes(i.status)).length
  const totalItems = event.checklist_items.length
  const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  const totalBudget = Number(event.total_budget)
  const totalSpent = Number(event.total_spent)
  const remaining = totalBudget - totalSpent
  const budgetPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency, maximumFractionDigits: 0 }).format(n)

  const daysUntil = Math.ceil((event.event_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2 font-medium">{event.event_name}</span>
      </div>

      {/* Event hero card */}
      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-brand" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl font-black text-text-1">{event.event_name}</h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  event.status === 'PLANNING' ? 'bg-blue-50 text-blue-700' :
                  event.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                  'bg-cream-2 text-text-3'
                }`}>{event.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-text-3">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-text-4" />
                  {format(event.event_date, 'EEEE, d MMMM yyyy')}
                  {daysUntil > 0 && (
                    <span className="text-xs text-brand font-semibold ml-1">({daysUntil}d away)</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-text-4" />
                  {event.venue ? `${event.venue}, ` : ''}{event.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-text-4" />
                  {event.guest_count} guests
                </span>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#e8ddd4" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#e85510"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-text-1">
                  {progressPct}%
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-text-1">{doneCount}/{totalItems}</div>
                <div className="text-xs text-text-4">tasks done</div>
              </div>
            </div>
          </div>

          {/* Budget bar */}
          {totalBudget > 0 && (
            <div className="mt-5 pt-4 border-t border-brand-border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1.5 text-text-3 font-medium">
                  <Wallet className="h-4 w-4 text-text-4" />
                  Budget
                </span>
                <div className="flex items-center gap-4 text-xs text-text-4">
                  <span>Spent: <span className="font-semibold text-text-2">{fmtCurrency(totalSpent)}</span></span>
                  <span>Remaining: <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmtCurrency(remaining)}</span></span>
                  <span>Total: <span className="font-semibold text-text-2">{fmtCurrency(totalBudget)}</span></span>
                </div>
              </div>
              <div className="h-2 bg-cream-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-brand'}`}
                  style={{ width: `${Math.max(budgetPct, 2)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href={`/events/${id}/vendors`}
          className="bg-brand hover:bg-brand-hover rounded-2xl p-4 text-white transition-colors group"
          style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.22)' }}>
          <Search className="h-5 w-5 mb-3" />
          <div className="font-black text-sm">Find Vendors</div>
          <div className="text-xs opacity-75 mt-0.5">Browse vendors</div>
        </Link>

        <Link href={`/events/${id}/quotes`}
          className="bg-white hover:bg-cream rounded-2xl border border-brand-border p-4 text-text-1 transition-colors group relative">
          <FileText className="h-5 w-5 mb-3 text-text-3" />
          <div className="font-black text-sm">Quotes</div>
          <div className="text-xs text-text-4 mt-0.5">{quoteCount > 0 ? `${quoteCount} received` : 'No quotes yet'}</div>
          {quoteCount > 0 && (
            <span className="absolute top-3 right-3 bg-brand text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {quoteCount}
            </span>
          )}
        </Link>

        <Link href="/messages"
          className="bg-white hover:bg-cream rounded-2xl border border-brand-border p-4 text-text-1 transition-colors group relative">
          <MessageSquare className="h-5 w-5 mb-3 text-text-3" />
          <div className="font-black text-sm">Messages</div>
          <div className="text-xs text-text-4 mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : 'Chat with vendors'}</div>
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Link>

        <Link href={`/events/${id}/guests`}
          className="bg-white hover:bg-cream rounded-2xl border border-brand-border p-4 text-text-1 transition-colors group">
          <Users2 className="h-5 w-5 mb-3 text-text-3" />
          <div className="font-black text-sm">Guests</div>
          <div className="text-xs text-text-4 mt-0.5">
            {guestHouseholdCount > 0 ? `${guestHouseholdCount} households` : 'Manage list'}
          </div>
        </Link>
      </div>

      {/* Services */}
      {enabledServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-text-1">Services</h2>
            <span className="text-xs text-text-4">{enabledServices.length} available</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {enabledServices.map(svc => {
              const slug = svc.vendor_type.toLowerCase().replace(/_/g, '-')
              const req = requestByType[svc.vendor_type]
              const hasReq = !!req
              const hasVendors = hasReq && req.matchCount > 0

              return (
                <Link
                  key={svc.vendor_type}
                  href={`/events/${id}/services/${slug}`}
                  className={`relative flex flex-col gap-2 rounded-2xl border p-4 transition-all hover:shadow-sm ${
                    hasReq
                      ? 'bg-white border-brand shadow-[0_1px_4px_rgba(232,85,16,0.08)]'
                      : 'bg-white border-brand-border hover:border-brand/40'
                  }`}
                >
                  {/* Green dot — requirements saved */}
                  {hasReq && (
                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500" />
                  )}
                  {/* Match count badge */}
                  {hasVendors && (
                    <span className="absolute top-2.5 right-7 bg-brand text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                      {req.matchCount}
                    </span>
                  )}
                  <span className="text-2xl">{svc.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-text-1 leading-tight">{svc.label}</div>
                    {hasReq && req.service_notes ? (
                      <div className="text-xs text-text-4 mt-0.5 line-clamp-1">{req.service_notes}</div>
                    ) : hasReq ? (
                      <div className="text-xs text-green-600 mt-0.5 font-medium">Requirements saved</div>
                    ) : (
                      <div className="text-xs text-text-4 mt-0.5">Tap to add</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Sub-events */}
      {event.sub_events.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-text-1">Sub-Events</h2>
            <Link href={`/events/${id}/sub-events`} className="text-xs text-brand font-semibold hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {event.sub_events.map(se => (
              <div key={se.id} className="bg-white rounded-xl border border-brand-border p-4">
                <p className="font-semibold text-text-1 text-sm">{se.name}</p>
                <p className="text-xs text-text-4 mt-0.5">{format(se.event_date, 'EEE d MMM, h:mm a')}</p>
                {se.venue && <p className="text-xs text-text-4 mt-0.5 truncate">{se.venue}</p>}
              </div>
            ))}
            <Link href={`/events/${id}/sub-events`}
              className="bg-cream rounded-xl border border-dashed border-brand-border p-4 flex items-center justify-center gap-2 text-sm text-text-4 hover:border-brand hover:text-brand transition-colors">
              <CalendarPlus className="h-4 w-4" />
              Add occasion
            </Link>
          </div>
        </div>
      ) : (
        <Link href={`/events/${id}/sub-events`}
          className="flex items-center gap-2 text-sm text-text-4 hover:text-brand transition-colors px-1">
          <CalendarPlus className="h-4 w-4" />
          Add sub-events (Mehendi, Reception, Sangeet…)
        </Link>
      )}

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-text-1">Planning Checklist</h2>
          <AddChecklistItemDialog eventId={id} />
        </div>
        <EventChecklistTable
          eventId={id}
          items={event.checklist_items as any}
          currency={event.currency}
        />
      </div>
    </div>
  )
}
