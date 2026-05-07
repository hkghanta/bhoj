import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { EventDeleteButton } from '@/components/customer/EventDeleteButton'
import {
  CalendarDays, MapPin, Users, FileText,
  MessageSquare, ChevronRight, Wallet,
  Users2, Gift, LayoutGrid, Clock,
  UtensilsCrossed, CreditCard, UserPlus, Wrench,
  ArrowRight, Sparkles, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { vendorTypeToSlug } from '@/lib/service-slugs'

const EVENT_TYPE_EMOJI: Record<string, string> = {
  WEDDING: '💍', BIRTHDAY: '🎂', CORPORATE: '💼', ENGAGEMENT: '💎',
  BABY_SHOWER: '👶', ANNIVERSARY: '🥂', GRADUATION: '🎓', OTHER: '🎉',
}

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    include: {
      checklist_items: { select: { id: true, status: true } },
    },
  })

  if (!event) notFound()

  // Quote count (all quotes visible to customer — excludes DRAFT which vendor is still editing)
  const quoteCount = await prisma.quote.count({
    where: {
      status: { in: ['SENT', 'VIEWED', 'ACCEPTED'] },
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

  // Spend tracking — vendor breakdown
  const acceptedQuotes = await prisma.quote.findMany({
    where: {
      status: 'ACCEPTED',
      match: { event_request: { event_id: id } },
    },
    select: {
      total_estimate: true,
      vendor: { select: { business_name: true, vendor_type: true } },
    },
  })
  const spendByVendor = acceptedQuotes.map(q => ({
    name: q.vendor.business_name,
    type: q.vendor.vendor_type,
    amount: Number(q.total_estimate),
  }))

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

  const hasActivity = eventRequests.some(r => r._count.matches > 0)

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
  // Add-on types hidden from overview — managed within their parent service
  const ADDON_TYPES = new Set([
    'DESSERT_VENDOR', 'CHAI_STATION', 'BARTENDER',
    'VIDEOGRAPHER',
    'FLORIST', 'LIGHTING', 'TENT_MARQUEE', 'FURNITURE_RENTAL',
    'DHOL_PLAYER', 'LIVE_BAND', 'CLASSICAL_MUSICIAN',
    'CHOREOGRAPHER', 'GAMES_ENTERTAINMENT',
    'EQUIPMENT_RENTAL',
  ])
  const addedServices = enabledServices.filter(svc => !!requestByType[svc.vendor_type] && !ADDON_TYPES.has(svc.vendor_type))
  const emoji = EVENT_TYPE_EMOJI[event.event_type] ?? '🎉'

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PLANNING: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', label: 'Planning' },
    CONFIRMED: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300', label: 'Confirmed' },
    COMPLETED: { bg: 'bg-cream-2', text: 'text-text-3', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', label: 'Cancelled' },
  }
  const status = statusConfig[event.status] ?? statusConfig.PLANNING

  // Build contextual next-step suggestions
  const nextSteps: { text: string; href: string; priority: 'high' | 'medium' | 'low' }[] = []
  if (event.status !== 'CANCELLED') {
    if (addedServices.length === 0) {
      nextSteps.push({ text: 'Add services like catering, photography or decor to get started', href: `/events/${id}/services`, priority: 'high' })
    }
    if (quoteCount > 0 && !acceptedQuotes.length) {
      nextSteps.push({ text: `You have ${quoteCount} quote${quoteCount > 1 ? 's' : ''} waiting — review and accept the best one`, href: `/events/${id}/quotes`, priority: 'high' })
    }
    if (guestHouseholdCount === 0) {
      nextSteps.push({ text: 'Start building your guest list', href: `/events/${id}/guests`, priority: 'medium' })
    }
    if (unreadCount > 0) {
      nextSteps.push({ text: `${unreadCount} unread message${unreadCount > 1 ? 's' : ''} from vendors`, href: '/messages', priority: 'high' })
    }
    if (totalItems === 0) {
      nextSteps.push({ text: 'Create a planning checklist to stay on track', href: `/events/${id}/checklist`, priority: 'medium' })
    } else if (progressPct < 50) {
      nextSteps.push({ text: `Your checklist is ${progressPct}% done — keep the momentum going`, href: `/events/${id}/checklist`, priority: 'low' })
    }
    if (addedServices.length > 0 && quoteCount === 0) {
      nextSteps.push({ text: 'Vendors are being matched — quotes will appear here soon', href: `/events/${id}/quotes`, priority: 'low' })
    }
    if (daysUntil > 0 && daysUntil <= 30) {
      nextSteps.push({ text: 'Your event is less than a month away — add a day-of timeline', href: `/events/${id}/timeline`, priority: 'medium' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-text-2 font-medium" aria-current="page">{event.event_name}</span>
      </nav>

      {/* Cancelled banner */}
      {event.status === 'CANCELLED' && (
        <div role="alert" className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <span className="font-bold">Event cancelled.</span>
          All open service requests have been closed. This record is kept for your reference.
        </div>
      )}

      {/* Event hero card */}
      <section aria-label="Event overview" className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        {/* Accent bar */}
        <div className={`h-1.5 ${event.status === 'CANCELLED' ? 'bg-red-400' : 'bg-brand'}`} />

        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
                {emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-4xl font-black tracking-tight text-text-1 leading-tight">{event.event_name}</h1>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                  {event.status !== 'CANCELLED' && (
                    <EventDeleteButton
                      eventId={id}
                      eventName={event.event_name}
                      hasActivity={hasActivity}
                    />
                  )}
                </div>
                <p className="text-sm text-text-4 capitalize mb-3">{event.event_type.toLowerCase().replace('_', ' ')}</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-3">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center" aria-hidden="true">
                      <CalendarDays className="h-4 w-4 text-text-4" />
                    </span>
                    <span>
                      {format(event.event_date, 'EEEE, d MMMM yyyy')}
                      {daysUntil > 0 && (
                        <span className="text-brand font-bold ml-1.5">({daysUntil}d away)</span>
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center" aria-hidden="true">
                      <MapPin className="h-4 w-4 text-text-4" />
                    </span>
                    {event.venue ? `${event.venue}, ` : ''}{event.city}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center" aria-hidden="true">
                      <Users className="h-4 w-4 text-text-4" />
                    </span>
                    {event.guest_count} guests
                  </span>
                </div>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-4 bg-cream rounded-2xl px-5 py-4 self-start" aria-label={`Planning progress: ${progressPct}%`}>
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r="18" fill="none" className="stroke-cream-2" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="none" className="stroke-brand"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-text-1">
                  {progressPct}%
                </span>
              </div>
              <div>
                <div className="text-lg font-black text-text-1">{doneCount}/{totalItems}</div>
                <div className="text-xs text-text-4 font-medium">tasks done</div>
              </div>
            </div>
          </div>

          {/* Budget section */}
          {totalBudget > 0 && (
            <div className="mt-6 pt-6 border-t border-brand-border">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center" aria-hidden="true">
                    <Wallet className="h-4 w-4 text-text-4" />
                  </span>
                  <span className="text-sm font-bold text-text-2">Budget Overview</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span className="text-text-4">Spent: <span className="font-bold text-text-1">{fmtCurrency(totalSpent)}</span></span>
                  <span className="text-text-4">Remaining: <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmtCurrency(remaining)}</span></span>
                  <span className="text-text-4">Total: <span className="font-bold text-text-1">{fmtCurrency(totalBudget)}</span></span>
                </div>
              </div>
              <div className="h-3 bg-cream-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={budgetPct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget spent">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-brand'}`}
                  style={{ width: `${Math.max(budgetPct, 2)}%` }}
                />
              </div>
              {spendByVendor.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spendByVendor.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-cream rounded-xl px-4 py-2.5">
                      <span className="text-text-3 font-medium">{v.name}</span>
                      <span className="font-bold text-text-1">{fmtCurrency(v.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick stats */}
      <section aria-label="Quick statistics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: `/events/${id}/quotes`, icon: FileText, value: quoteCount, label: 'Quotes received', iconBg: 'bg-purple-50 dark:bg-purple-950/40', iconColor: 'text-purple-600 dark:text-purple-400', badge: 0 },
          { href: '/messages', icon: MessageSquare, value: unreadCount, label: 'Unread messages', iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400', badge: unreadCount },
          { href: `/events/${id}/guests`, icon: Users2, value: guestHouseholdCount, label: 'Guest households', iconBg: 'bg-green-50 dark:bg-green-950/40', iconColor: 'text-green-600 dark:text-green-400', badge: 0 },
          { href: `/events/${id}/services`, icon: Wrench, value: addedServices.length, label: 'Services booked', iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400', badge: 0 },
        ].map(stat => (
          <Link
            key={stat.href}
            href={stat.href}
            className="group bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 sm:p-6 hover:border-brand hover:shadow-sm transition-all relative"
            aria-label={`${stat.value} ${stat.label}`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`} aria-hidden="true">
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="text-3xl font-black text-text-1 mb-0.5">{stat.value}</div>
            <div className="text-xs text-text-4 font-medium">{stat.label}</div>
            {stat.badge > 0 && (
              <span className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {stat.badge}
              </span>
            )}
            <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-text-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>
        ))}
      </section>

      {/* Next Steps / Suggestions */}
      {nextSteps.length > 0 && (
        <section aria-label="Suggested next steps" className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
          <h2 className="text-lg font-black text-text-1 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" aria-hidden="true" />
            What to do next
          </h2>
          <div className="space-y-3">
            {nextSteps.slice(0, 4).map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="group flex items-center gap-3 text-sm hover:text-brand transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  step.priority === 'high' ? 'bg-brand' : step.priority === 'medium' ? 'bg-amber-500' : 'bg-text-4'
                }`} aria-hidden="true" />
                <span className="text-text-2 group-hover:text-brand transition-colors flex-1">{step.text}</span>
                <ArrowRight className="h-4 w-4 text-text-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Services & Planning */}
      <section aria-label="Services and planning">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-text-1">Services & Planning</h2>
          <Link href={`/events/${id}/services`} className="text-sm text-brand font-bold hover:underline flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Add service
          </Link>
        </div>

        {/* Active services */}
        {addedServices.length === 0 ? (
          <Link
            href={`/events/${id}/services`}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-border bg-white dark:bg-cream-2 p-10 text-center hover:border-brand hover:bg-cream transition-colors group mb-6"
          >
            <span className="text-4xl" aria-hidden="true">🎉</span>
            <div className="text-base font-bold text-text-2 group-hover:text-brand transition-colors">Add your first service</div>
            <div className="text-sm text-text-4">Catering, photography, DJ and more</div>
          </Link>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {addedServices.map(svc => {
              const slug = vendorTypeToSlug(svc.vendor_type)
              const req = requestByType[svc.vendor_type]!
              const hasVendors = req.matchCount > 0
              return (
                <Link
                  key={svc.vendor_type}
                  href={`/events/${id}/services/${slug}`}
                  className="group relative flex items-start gap-4 rounded-2xl border bg-white dark:bg-cream-2 border-brand-border p-5 transition-all hover:border-brand hover:shadow-sm"
                  aria-label={`${svc.label} service${hasVendors ? `, ${req.matchCount} vendor matches` : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
                    {svc.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-1 leading-tight group-hover:text-brand transition-colors">{svc.label}</span>
                      <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" aria-label="Active" />
                    </div>
                    {req.service_notes ? (
                      <p className="text-xs text-text-4 mt-1 line-clamp-2">{req.service_notes}</p>
                    ) : (
                      <p className="text-xs text-text-4 mt-1">Requirements submitted</p>
                    )}
                    {hasVendors && (
                      <span className="inline-flex items-center gap-1 mt-2 bg-brand/10 text-brand text-xs font-bold rounded-full px-2.5 py-0.5">
                        {req.matchCount} vendor{req.matchCount > 1 ? 's' : ''} matched
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </Link>
              )
            })}
            <Link
              href={`/events/${id}/services`}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-border bg-white dark:bg-cream-2 p-6 text-center hover:border-brand hover:bg-cream transition-colors min-h-[120px]"
              aria-label="Add another service"
            >
              <span className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-xl text-text-4" aria-hidden="true">+</span>
              <span className="text-xs font-bold text-text-3">Add service</span>
            </Link>
          </div>
        )}

        {/* Planning tools grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: `/events/${id}/planning`, icon: ClipboardList, label: 'Event Plan', bg: 'bg-brand/10 dark:bg-brand/20', color: 'text-brand' },
            { href: `/events/${id}/checklist`, icon: FileText, label: 'Checklist', bg: 'bg-amber-50 dark:bg-amber-950/40', color: 'text-amber-600 dark:text-amber-400' },
            { href: `/events/${id}/timeline`, icon: Clock, label: 'Timeline', bg: 'bg-purple-50 dark:bg-purple-950/40', color: 'text-purple-600 dark:text-purple-400' },
            { href: `/events/${id}/seating`, icon: LayoutGrid, label: 'Seating', bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400' },
            { href: `/events/${id}/collaborators`, icon: UserPlus, label: 'Co-Planners', bg: 'bg-green-50 dark:bg-green-950/40', color: 'text-green-600 dark:text-green-400' },

            { href: `/events/${id}/registry`, icon: Gift, label: 'Gift Registry', bg: 'bg-pink-50 dark:bg-pink-950/40', color: 'text-pink-600 dark:text-pink-400' },
            { href: `/events/${id}/tastings`, icon: UtensilsCrossed, label: 'Tastings', bg: 'bg-red-50 dark:bg-red-950/40', color: 'text-red-600 dark:text-red-400' },
            { href: `/events/${id}/payment-schedule`, icon: CreditCard, label: 'Payments', bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400' },
            { href: `/events/${id}/contracts`, icon: FileText, label: 'Contracts', bg: 'bg-slate-50 dark:bg-slate-800/40', color: 'text-slate-600 dark:text-slate-400' },
          ].map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-brand-border bg-white dark:bg-cream-2 p-4 sm:p-5 text-center hover:bg-cream hover:border-brand hover:shadow-sm transition-all"
              aria-label={tool.label}
            >
              <div className={`w-11 h-11 rounded-xl ${tool.bg} flex items-center justify-center`} aria-hidden="true">
                <tool.icon className={`h-5 w-5 ${tool.color}`} />
              </div>
              <span className="text-xs font-bold text-text-2 group-hover:text-brand transition-colors">{tool.label}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
