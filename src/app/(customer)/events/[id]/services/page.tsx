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

const SERVICE_CATEGORIES = [
  { label: 'Food & Drink', types: ['CATERER'] },
  { label: 'Photo & Video', types: ['PHOTOGRAPHER'] },
  { label: 'Decor', types: ['DECORATOR'] },
  { label: 'Music & Entertainment', types: ['DJ', 'MC_HOST'] },
  { label: 'Beauty', types: ['MEHENDI_ARTIST', 'MAKEUP_HAIR'] },
  { label: 'Ceremony & Stationery', types: ['PANDIT_OFFICIANT', 'INVITATION_DESIGNER'] },
  { label: 'Logistics', types: ['TRANSPORT', 'SECURITY'] },
]

type ServiceItem = {
  vendor_type: string
  label: string
  icon: string
  matchCount: number
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

  const requestByType: Record<string, { matchCount: number }> = {}
  for (const r of eventRequests) {
    requestByType[r.vendor_type] = { matchCount: r._count.matches }
  }

  const addedTypes = new Set(eventRequests.map(r => r.vendor_type as string))

  // Build a lookup of all services by vendor_type (exclude add-on types)
  const serviceMap: Record<string, ServiceItem> = {}
  for (const svc of enabledServices) {
    if (ADDON_TYPES.has(svc.vendor_type)) continue
    serviceMap[svc.vendor_type] = {
      vendor_type: svc.vendor_type,
      label: svc.label,
      icon: svc.icon,
      matchCount: requestByType[svc.vendor_type]?.matchCount ?? 0,
      added: addedTypes.has(svc.vendor_type as string),
    }
  }
  // Add orphaned requests that aren't add-ons
  for (const r of eventRequests) {
    if (ADDON_TYPES.has(r.vendor_type)) continue
    if (!serviceMap[r.vendor_type]) {
      serviceMap[r.vendor_type] = {
        vendor_type: r.vendor_type,
        label: (r.vendor_type as string).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: '📋',
        matchCount: r._count.matches,
        added: true,
      }
    }
  }

  const addedCount = Object.values(serviceMap).filter(s => s.added).length
  const availableCount = Object.values(serviceMap).filter(s => !s.added).length

  // Group services by category
  const allTypes = new Set(Object.keys(serviceMap))
  const categories = SERVICE_CATEGORIES
    .map(cat => ({
      label: cat.label,
      services: cat.types
        .filter(t => allTypes.has(t))
        .map(t => serviceMap[t])
        .filter(Boolean),
    }))
    .filter(cat => cat.services.length > 0)

  // Catch any services not in any category
  const categorizedTypes = new Set(SERVICE_CATEGORIES.flatMap(c => c.types))
  const uncategorized = Object.values(serviceMap).filter(s => !categorizedTypes.has(s.vendor_type))
  if (uncategorized.length > 0) {
    categories.push({ label: 'Other', services: uncategorized })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/events/${id}`} className="hover:text-brand transition-colors">{event.event_name}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-text-2 font-medium" aria-current="page">Services</span>
      </nav>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-text-1">Services</h1>
        <p className="text-sm text-text-3 mt-1">
          {addedCount > 0
            ? `${addedCount} service${addedCount > 1 ? 's' : ''} added${availableCount > 0 ? ' — tap + to add more' : ''}`
            : 'Select a service to add requirements and find vendors'}
        </p>
      </div>

      {/* Services grouped by category */}
      <div className="space-y-8">
        {categories.map(cat => (
          <section key={cat.label}>
            <h2 className="text-lg font-black text-text-1 mb-3">{cat.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.services.map(svc => {
                const slug = vendorTypeToSlug(svc.vendor_type)
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
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        </div>
                        {svc.matchCount > 0 ? (
                          <span className="text-xs font-bold text-brand">{svc.matchCount} vendor{svc.matchCount > 1 ? 's' : ''} matched</span>
                        ) : (
                          <span className="text-xs text-text-4">Requirements submitted</span>
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
          </section>
        ))}
      </div>

      <div className="pt-2">
        <Link href={`/events/${id}`} className="text-sm text-text-4 hover:text-brand transition-colors">
          ← Back to event
        </Link>
      </div>
    </div>
  )
}
