import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { VendorBadges } from '@/components/vendor/VendorBadges'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Users,
  FileText,
  Star,
  Clock,
  MessageSquare,
  CalendarDays,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

export default async function VendorDashboardPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  const vendorId = session.user!.id as string

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Fetch vendor with badges
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      business_name: true,
      avg_rating: true,
      avg_response_hrs: true,
      total_reviews: true,
      total_bookings: true,
      badges: { select: { badge_type: true } },
    },
  })

  if (!vendor) redirect('/login')

  // New leads (pending matches from last 30 days)
  const newLeadsCount = await prisma.match.count({
    where: {
      vendor_id: vendorId,
      status: 'PENDING',
      created_at: { gte: thirtyDaysAgo },
    },
  })

  // Active quotes (SENT or VIEWED)
  const activeQuotesCount = await prisma.quote.count({
    where: {
      vendor_id: vendorId,
      status: { in: ['SENT', 'VIEWED'] },
    },
  })

  // Leads needing quotes (pending matches with no quotes)
  const leadsNeedingQuotes = await prisma.match.count({
    where: {
      vendor_id: vendorId,
      status: 'PENDING',
      quotes: { none: {} },
    },
  })

  // Unread messages count
  const unreadMessages = await prisma.message.count({
    where: {
      conversation: { vendor_id: vendorId },
      sender_type: 'CUSTOMER',
      is_read: false,
    },
  })

  // Recent bookings (last 5 accepted quotes with event info)
  const recentBookings = await prisma.quote.findMany({
    where: {
      vendor_id: vendorId,
      status: 'ACCEPTED',
    },
    include: {
      match: {
        include: {
          event_request: {
            include: {
              event: {
                select: {
                  event_name: true,
                  event_date: true,
                  guest_count: true,
                  city: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  })

  const stats = [
    {
      label: 'New Leads',
      value: newLeadsCount,
      icon: Users,
      href: '/vendor/leads',
    },
    {
      label: 'Active Quotes',
      value: activeQuotesCount,
      icon: FileText,
      href: '/vendor/leads',
    },
    {
      label: 'Avg Rating',
      value: vendor.avg_rating ? vendor.avg_rating.toFixed(1) : '--',
      icon: Star,
      sub: vendor.total_reviews > 0 ? `${vendor.total_reviews} reviews` : undefined,
    },
    {
      label: 'Response Time',
      value:
        vendor.avg_response_hrs != null
          ? vendor.avg_response_hrs < 1
            ? `${Math.round(vendor.avg_response_hrs * 60)}m`
            : `${Math.round(vendor.avg_response_hrs)}h`
          : '--',
      icon: Clock,
    },
  ]

  const actionItems = [
    leadsNeedingQuotes > 0 && {
      text: `${leadsNeedingQuotes} lead${leadsNeedingQuotes === 1 ? '' : 's'} need${leadsNeedingQuotes === 1 ? 's' : ''} a quote`,
      href: '/vendor/leads',
    },
    unreadMessages > 0 && {
      text: `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`,
      href: '/vendor/messages',
    },
  ].filter(Boolean) as { text: string; href: string }[]

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Dashboard</h1>
          <p className="text-sm text-text-4 mt-1">Welcome back, {vendor.business_name}</p>
        </div>
      </div>

      {/* Badges */}
      {vendor.badges.length > 0 && (
        <div className="mb-6">
          <VendorBadges badges={vendor.badges} responseHrs={vendor.avg_response_hrs} />
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="mb-6 space-y-2">
          {actionItems.map((item) => (
            <Link
              key={item.text}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-cream-2 border border-brand-border border-l-[3px] border-l-brand rounded-lg text-sm text-text-2 hover:bg-cream/50 transition-colors"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-text-4" />
              <span className="font-medium">{item.text}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-text-4" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          const inner = (
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-text-4" />
                <span className="text-[11px] text-text-4 font-medium uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-text-1">{stat.value}</div>
              {stat.sub && <div className="text-[11px] text-text-4 mt-0.5">{stat.sub}</div>}
            </div>
          )
          if ('href' in stat && stat.href) {
            return (
              <Link key={stat.label} href={stat.href} className="hover:opacity-80 transition-opacity">
                {inner}
              </Link>
            )
          }
          return <div key={stat.label}>{inner}</div>
        })}
      </div>

      {/* Recent Bookings */}
      <div>
        <h2 className="text-lg font-bold text-text-1 mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <div className="bg-white dark:bg-cream-2 border border-dashed border-brand-border rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="h-6 w-6 text-text-4/40" />
            </div>
            <h3 className="font-bold text-text-1 text-sm mb-1">No bookings yet</h3>
            <p className="text-xs text-text-4 max-w-xs mx-auto mb-4">
              Once customers accept your quotes, confirmed bookings will appear here with event details and dates.
            </p>
            <Link
              href="/vendor/onboarding"
              className="inline-block px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((booking) => {
              const event = booking.match.event_request.event
              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-cream-2 border border-brand-border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-cream/30 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-text-1 text-sm">{event.event_name}</div>
                    <div className="flex items-center gap-3 text-xs text-text-4 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(event.event_date, 'd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.guest_count} guests
                      </span>
                      <span>{event.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand text-sm">
                      {booking.currency} {Number(booking.total_estimate).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-0.5">Accepted</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
