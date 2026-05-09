import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, Plus, CheckCircle2, ArrowRight } from 'lucide-react'
import { vendorTypeToSlug } from '@/lib/service-slugs'

// Add-on types hidden from service picker — managed within their parent service
const ADDON_TYPES = new Set([
  'DESSERT_VENDOR', 'CHAI_STATION', 'BARTENDER',        // → part of Catering
  'VIDEOGRAPHER',                                         // → part of Photography
  'FLORIST', 'LIGHTING', 'TENT_MARQUEE', 'FURNITURE_RENTAL', // → part of Decoration
  'DHOL_PLAYER', 'LIVE_BAND', 'CLASSICAL_MUSICIAN',      // → part of DJ / Music
  'CHOREOGRAPHER', 'GAMES_ENTERTAINMENT',                 // → part of Entertainment / MC
  'EQUIPMENT_RENTAL',                                     // → part of Logistics
])

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Catering',
  DECORATOR: 'Decoration',
  PHOTOGRAPHER: 'Photography',
  DJ: 'DJ / Music',
  MEHENDI_ARTIST: 'Mehendi Artist',
  MAKEUP_HAIR: 'Makeup & Hair',
  FLORIST: 'Florist',
  MC_HOST: 'MC / Host',
  PANDIT_OFFICIANT: 'Pandit / Officiant',
  INVITATION_DESIGNER: 'Invitations',
  TRANSPORT: 'Transport',
  SECURITY: 'Security',
}

type ServiceItem = {
  vendor_type: string
  label: string
  icon: string
  matchCount: number
  quoteCount: number
  acceptedCount: number
  added: boolean
}

export default async function ServicePickerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
  })
  if (!event) notFound()

  const [enabledServices, eventRequests, quotes, eventVendors] = await Promise.all([
    prisma.serviceConfig.findMany({
      where: { is_enabled: true },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.eventRequest.findMany({
      where: { event_id: id },
      include: {
        _count: { select: { matches: true } },
        matches: {
          select: { id: true },
        },
      },
    }),
    prisma.quote.findMany({
      where: {
        match: { event_request: { event_id: id } },
        status: { not: 'DRAFT' },
      },
      select: {
        id: true,
        status: true,
        match: { select: { event_request: { select: { vendor_type: true } } } },
      },
    }),
    prisma.eventVendor.findMany({
      where: { event_id: id },
      select: {
        id: true,
        vendor: { select: { vendor_type: true } },
      },
    }),
  ])

  // Count quotes and accepted per vendor type
  const quotesByType: Record<string, number> = {}
  const acceptedByType: Record<string, number> = {}
  for (const q of quotes) {
    const vt = q.match.event_request.vendor_type
    quotesByType[vt] = (quotesByType[vt] ?? 0) + 1
    if (q.status === 'ACCEPTED') {
      acceptedByType[vt] = (acceptedByType[vt] ?? 0) + 1
    }
  }
  // Also count event vendors
  for (const ev of eventVendors) {
    const vt = ev.vendor.vendor_type
    acceptedByType[vt] = (acceptedByType[vt] ?? 0)
  }

  const requestByType: Record<string, { matchCount: number }> = {}
  for (const r of eventRequests) {
    requestByType[r.vendor_type] = { matchCount: r._count.matches }
  }

  const addedTypes = new Set(eventRequests.map(r => r.vendor_type as string))

  // Build flat list of all services (no grouping)
  const services: ServiceItem[] = []
  const seenTypes = new Set<string>()

  for (const svc of enabledServices) {
    if (ADDON_TYPES.has(svc.vendor_type)) continue
    if (seenTypes.has(svc.vendor_type)) continue
    seenTypes.add(svc.vendor_type)
    services.push({
      vendor_type: svc.vendor_type,
      label: svc.label,
      icon: svc.icon,
      matchCount: requestByType[svc.vendor_type]?.matchCount ?? 0,
      quoteCount: quotesByType[svc.vendor_type] ?? 0,
      acceptedCount: acceptedByType[svc.vendor_type] ?? 0,
      added: addedTypes.has(svc.vendor_type as string),
    })
  }
  // Add orphaned requests that aren't add-ons
  for (const r of eventRequests) {
    if (ADDON_TYPES.has(r.vendor_type)) continue
    if (seenTypes.has(r.vendor_type)) continue
    seenTypes.add(r.vendor_type)
    services.push({
      vendor_type: r.vendor_type,
      label: VENDOR_TYPE_LABELS[r.vendor_type] ?? (r.vendor_type as string).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: '📋',
      matchCount: r._count.matches,
      quoteCount: quotesByType[r.vendor_type] ?? 0,
      acceptedCount: acceptedByType[r.vendor_type] ?? 0,
      added: true,
    })
  }

  // Sort: added first, then alphabetical
  services.sort((a, b) => {
    if (a.added && !b.added) return -1
    if (!a.added && b.added) return 1
    return a.label.localeCompare(b.label)
  })

  const addedCount = services.filter(s => s.added).length

  function statusInfo(svc: ServiceItem) {
    if (svc.acceptedCount > 0) return { label: 'Finalized', color: 'text-green-600', bg: 'bg-green-50', icon: '✅' }
    if (svc.quoteCount > 0) return { label: `${svc.quoteCount} quote${svc.quoteCount > 1 ? 's' : ''}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '💬' }
    if (svc.matchCount > 0) return { label: `${svc.matchCount} matched`, color: 'text-brand', bg: 'bg-cream', icon: '🔍' }
    if (svc.added) return { label: 'Posted', color: 'text-amber-600', bg: 'bg-amber-50', icon: '📝' }
    return null
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/events/${id}`} className="hover:text-brand transition-colors">{event.event_name}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-text-2 font-medium" aria-current="page">Requirements</span>
      </nav>

      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-1">Requirements</h1>
        <p className="text-sm text-text-3 mt-1">
          {addedCount > 0
            ? `${addedCount} service${addedCount > 1 ? 's' : ''} posted — tap any to update requirements or find vendors`
            : 'Post your requirements to start finding vendors'}
        </p>
      </div>

      {/* Flat grid — no category grouping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(svc => {
          const slug = vendorTypeToSlug(svc.vendor_type)
          const status = statusInfo(svc)

          if (svc.added) {
            return (
              <Link
                key={svc.vendor_type}
                href={`/events/${id}/services/${slug}`}
                className="group flex items-start gap-3 rounded-2xl border border-brand-border bg-white dark:bg-cream-2 p-4 hover:border-brand hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-xl flex-shrink-0">
                  {svc.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{svc.label}</span>
                    {svc.acceptedCount > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                  </div>
                  {status && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-text-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          }
          return (
            <Link
              key={svc.vendor_type}
              href={`/events/${id}/services/${slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-dashed border-brand-border bg-white dark:bg-cream-2 p-4 hover:border-brand hover:bg-cream transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-xl flex-shrink-0">
                {svc.icon}
              </div>
              <span className="text-sm font-bold text-text-3 group-hover:text-text-1 transition-colors flex-1">{svc.label}</span>
              <Plus className="h-4 w-4 text-text-4 group-hover:text-brand transition-colors flex-shrink-0" />
            </Link>
          )
        })}
      </div>

      <div className="pt-2">
        <Link href={`/events/${id}`} className="text-sm text-text-4 hover:text-brand transition-colors">
          ← Back to event
        </Link>
      </div>
    </div>
  )
}
