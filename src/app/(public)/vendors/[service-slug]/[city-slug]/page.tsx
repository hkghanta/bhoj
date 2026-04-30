import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Star, CheckCircle2, MapPin, ChevronRight, ArrowRight } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Service configuration ──────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  catering: 'Catering',
  photographer: 'Photography',
  videographer: 'Videography',
  decorator: 'Decoration',
  dj: 'DJ Services',
  florist: 'Floristry',
  'mehendi-artist': 'Mehendi Artist',
  'makeup-hair': 'Makeup & Hair',
  transport: 'Transport',
  'tent-marquee': 'Tent & Marquee',
  'dhol-player': 'Dhol Player',
  'live-band': 'Live Band',
  'classical-musician': 'Classical Music',
  choreographer: 'Choreography',
  'pandit-officiant': 'Pandit / Officiant',
  'mc-host': 'MC / Host',
  bartender: 'Bartending',
  'chai-station': 'Chai Station',
  'games-entertainment': 'Games & Entertainment',
  'invitation-designer': 'Invitation Design',
  'furniture-rental': 'Furniture Rental',
  'equipment-rental': 'Equipment Rental',
  'dessert-vendor': 'Desserts',
  'food-truck': 'Food Truck',
  lighting: 'Lighting',
  security: 'Security',
}

// Services that are typically hired by businesses (not individuals)
const BUSINESS_SERVICES = new Set([
  'tent-marquee', 'lighting', 'furniture-rental', 'equipment-rental', 'security',
])

// Services typically offered by individuals
const INDIVIDUAL_SLUGS = new Set([
  'mehendi-artist', 'makeup-hair', 'choreographer', 'pandit-officiant',
  'mc-host', 'dhol-player', 'classical-musician',
])

const VALID_SLUGS = new Set(Object.keys(SERVICE_LABELS))

// ─── Types ──────────────────────────────────────────────────────────────────

interface BrowseVendor {
  id: string
  business_name: string
  city: string
  country: string
  vendor_type: string
  profile_type: string
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  is_verified: boolean
  description: string | null
  avg_rating: number | null
  starting_price: number | null
  currency: string
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchVendors(serviceSlug: string, city: string): Promise<BrowseVendor[]> {
  try {
    const url = `${BASE_URL}/api/vendors/browse?service=${encodeURIComponent(serviceSlug)}&city=${encodeURIComponent(city)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDisplayName(vendor: BrowseVendor): string {
  if (
    INDIVIDUAL_SLUGS.has(vendor.vendor_type.toLowerCase().replace('_', '-')) ||
    vendor.profile_type === 'INDIVIDUAL'
  ) {
    if (vendor.first_name) {
      return [vendor.first_name, vendor.last_name].filter(Boolean).join(' ')
    }
  }
  return vendor.business_name
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'service-slug': string; 'city-slug': string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const serviceSlug = resolvedParams['service-slug']
  const citySlug = resolvedParams['city-slug']

  if (!VALID_SLUGS.has(serviceSlug)) return { title: 'Not Found' }

  const serviceLabel = SERVICE_LABELS[serviceSlug]
  const cityName = formatCityName(citySlug)

  return {
    title: `Best ${serviceLabel} in ${cityName} | OneSeva`,
    description: `Find and compare top ${serviceLabel.toLowerCase()} vendors in ${cityName}. Read reviews, view packages, and request quotes — all in one place on OneSeva.`,
    openGraph: {
      title: `${serviceLabel} in ${cityName} | OneSeva`,
      description: `Discover the best ${serviceLabel.toLowerCase()} vendors in ${cityName} for your Indian event.`,
    },
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function VendorCard({ vendor, serviceSlug }: { vendor: BrowseVendor; serviceSlug: string }) {
  const name = getDisplayName(vendor)

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all overflow-hidden"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-50 relative overflow-hidden">
        {vendor.profile_photo_url ? (
          <Image
            src={vendor.profile_photo_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-orange-300/60">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {vendor.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            <span className="text-xs font-semibold text-blue-600">Verified</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">
            {name}
          </h3>
          {vendor.avg_rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-700">{vendor.avg_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{vendor.city}</span>
        </div>

        {vendor.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {vendor.starting_price ? (
            <div>
              <span className="text-xs text-gray-400">From </span>
              <span className="text-sm font-black text-orange-600">
                {formatPrice(vendor.starting_price, vendor.currency)}
              </span>
              <span className="text-xs text-gray-400">/pp</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Price on request</span>
          )}
          <span className="text-xs font-semibold text-orange-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            View profile <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ serviceLabel, cityName }: { serviceLabel: string; cityName: string }) {
  return (
    <div className="text-center py-20 px-4">
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <span className="text-3xl">🌟</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Be the first {serviceLabel} in {cityName}
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
        We haven&apos;t listed any {serviceLabel.toLowerCase()} vendors in {cityName} yet.
        If you offer this service, join OneSeva and reach thousands of event planners.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
      >
        List your business free
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ 'service-slug': string; 'city-slug': string }>
}) {
  const resolvedParams = await params
  const serviceSlug = resolvedParams['service-slug']
  const citySlug = resolvedParams['city-slug']

  if (!VALID_SLUGS.has(serviceSlug)) notFound()

  const serviceLabel = SERVICE_LABELS[serviceSlug]
  const cityName = formatCityName(citySlug)

  const vendors = await fetchVendors(serviceSlug, cityName)

  const isBusinessService = BUSINESS_SERVICES.has(serviceSlug)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/vendors" className="hover:text-orange-600 transition-colors">Vendors</Link>
            <span>/</span>
            <span className="text-gray-600">{serviceLabel} in {cityName}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            {serviceLabel} in {cityName}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
            {vendors.length > 0
              ? `Browse ${vendors.length} ${serviceLabel.toLowerCase()} vendor${vendors.length !== 1 ? 's' : ''} in ${cityName}. Compare packages, read reviews, and request quotes — all free.`
              : `Find and connect with ${serviceLabel.toLowerCase()} vendors in ${cityName} for your next event.`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {vendors.length === 0 ? (
          <EmptyState serviceLabel={serviceLabel} cityName={cityName} />
        ) : (
          <>
            {/* Business services info banner */}
            {isBusinessService && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">💡</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Working with {serviceLabel} vendors</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {serviceLabel} is typically handled by specialist companies. Request a quote and our concierge team will help coordinate the details for your event.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vendor grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} serviceSlug={serviceSlug} />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 bg-gradient-to-br from-orange-900 to-amber-800 rounded-2xl p-8 text-center text-white">
              <h2 className="text-2xl font-black mb-2">Planning an event in {cityName}?</h2>
              <p className="text-orange-200 mb-6 max-w-lg mx-auto">
                Our concierge team matches you with the best vendors for your budget and guest count. Free to use.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-orange-700 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
              >
                Start planning free
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
