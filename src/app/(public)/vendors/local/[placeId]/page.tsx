import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, MapPin, Phone, Globe, ExternalLink, ChevronRight, Clock, BadgeCheck, Share2, Navigation } from 'lucide-react'
import { prisma } from '@/lib/prisma'

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Indian Restaurant',
  PHOTOGRAPHER: 'Photographer',
  DECORATOR: 'Decorator',
  DJ: 'DJ',
  FLORIST: 'Florist',
  MEHENDI_ARTIST: 'Mehendi Artist',
  MAKEUP_HAIR: 'Makeup & Hair',
  DESSERT_VENDOR: 'Desserts',
  VIDEOGRAPHER: 'Videographer',
  DHOL_PLAYER: 'Dhol Player',
  LIVE_BAND: 'Live Band',
  BARTENDER: 'Bartender',
  CHAI_STATION: 'Chai Station',
  CHOREOGRAPHER: 'Choreographer',
  PANDIT_OFFICIANT: 'Pandit / Officiant',
}

const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ placeId: string }>
}): Promise<Metadata> {
  const { placeId } = await params
  const vendor = await prisma.externalVendor.findUnique({
    where: { place_id: placeId },
    select: { name: true, city: true, vendor_type: true },
  })

  if (!vendor) return { title: 'Not Found' }

  return {
    title: `${vendor.name} — ${vendor.city} | OneSeva`,
    description: `${vendor.name} in ${vendor.city}. View details, photos, hours, and contact information.`,
  }
}

export default async function ExternalVendorPage({
  params,
}: {
  params: Promise<{ placeId: string }>
}) {
  const { placeId } = await params

  const vendor = await prisma.externalVendor.findUnique({
    where: { place_id: placeId },
  })

  if (!vendor || !vendor.is_active) notFound()

  const typeLabel = VENDOR_TYPE_LABELS[vendor.vendor_type] ?? 'Vendor'
  const hours = vendor.business_hours as Record<string, string> | null
  const serviceSlug = vendor.vendor_type.toLowerCase().replace('_', '-')
  const citySlug = vendor.city.toLowerCase().replace(/\s+/g, '-')

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: vendor.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: vendor.address,
      addressLocality: vendor.city,
      addressRegion: vendor.state,
      addressCountry: vendor.country,
    },
    ...(vendor.phone ? { telephone: vendor.phone } : {}),
    ...(vendor.website ? { url: vendor.website } : {}),
    ...(vendor.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: vendor.rating,
        reviewCount: vendor.total_ratings,
        bestRating: 5,
      },
    } : {}),
    ...(vendor.photo_urls[0] ? { image: vendor.photo_urls[0] } : {}),
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const sortedHours = hours
    ? dayOrder.filter(d => hours[d]).map(d => ({ day: d, time: hours[d] }))
    : []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-text-4 mb-5">
        <Link href="/" className="hover:text-text-2 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/vendors" className="hover:text-text-2 transition-colors">Vendors</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/vendors/catering/${citySlug}`} className="hover:text-text-2 transition-colors">
          {vendor.city}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-2 font-medium truncate max-w-[200px]">{vendor.name}</span>
      </nav>

      {/* ── Photo Gallery (Airbnb-style) ── */}
      {vendor.photo_urls.length > 0 && (
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 mb-8">
          <div className="rounded-2xl overflow-hidden">
            {vendor.photo_urls.length === 1 ? (
              <div className="aspect-[21/9] relative overflow-hidden">
                <img src={vendor.photo_urls[0]} alt={vendor.name} className="w-full h-full object-cover" />
              </div>
            ) : vendor.photo_urls.length === 2 ? (
              <div className="grid grid-cols-2 gap-1">
                {vendor.photo_urls.slice(0, 2).map((url, i) => (
                  <div key={i} className="aspect-[4/3] relative overflow-hidden">
                    <img src={url} alt={`${vendor.name} photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-1 max-h-[420px]">
                <div className="col-span-2 row-span-2 relative overflow-hidden">
                  <img src={vendor.photo_urls[0]} alt={vendor.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                {vendor.photo_urls.slice(1, 5).map((url, i) => (
                  <div key={i} className="relative overflow-hidden">
                    <img src={url} alt={`${vendor.name} photo ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Title Section ── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-10">
        <div className="flex-1 min-w-0">
          {/* Type + Price badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold text-brand bg-brand/8 border border-brand/15 px-3 py-1 rounded-full uppercase tracking-widest">
              {typeLabel}
            </span>
            {vendor.price_level != null && vendor.price_level > 0 && (
              <span className="text-xs font-bold text-text-2 bg-cream-2 px-2.5 py-1 rounded-full">
                {PRICE_LABELS[vendor.price_level]}
              </span>
            )}
          </div>

          {/* Vendor name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-1 tracking-tight leading-tight mb-3">
            {vendor.name}
          </h1>

          {/* Rating + location row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {vendor.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-lg font-extrabold tracking-tight text-text-1">{vendor.rating.toFixed(1)}</span>
                <span className="text-sm text-text-3">({vendor.total_ratings.toLocaleString()} reviews)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-text-3">
              <MapPin className="w-4 h-4 text-text-4" />
              <span>{vendor.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {vendor.rating && (
              <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 text-center">
                <div className="text-3xl font-extrabold tracking-tight text-text-1 mb-1">{vendor.rating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(vendor.rating!) ? 'text-amber-500 fill-amber-500' : 'text-brand-border'}`} />
                  ))}
                </div>
                <div className="text-xs text-text-4 font-medium">{vendor.total_ratings.toLocaleString()} Google reviews</div>
              </div>
            )}
            {vendor.price_level != null && vendor.price_level > 0 && (
              <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 text-center">
                <div className="text-3xl font-extrabold tracking-tight text-text-1 mb-1">{PRICE_LABELS[vendor.price_level]}</div>
                <div className="text-xs text-text-4 font-medium">Price range</div>
              </div>
            )}
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 text-center">
              <div className="text-3xl font-extrabold tracking-tight text-brand mb-1">
                <Navigation className="w-7 h-7 mx-auto" />
              </div>
              <a href={vendor.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand font-bold hover:underline">
                Get directions
              </a>
            </div>
          </div>

          {/* Location */}
          <section>
            <h2 className="text-xl font-extrabold tracking-tight text-text-1 mb-4">Location</h2>
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6">
              <p className="text-base text-text-2 leading-relaxed mb-4">{vendor.address}</p>
              <a
                href={vendor.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-hover transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          </section>

          {/* Business hours */}
          {sortedHours.length > 0 && (
            <section>
              <h2 className="text-xl font-extrabold tracking-tight text-text-1 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-3" />
                Business Hours
              </h2>
              <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
                {sortedHours.map(({ day, time }, i) => (
                  <div
                    key={day}
                    className={`flex justify-between items-center px-6 py-4 ${
                      i < sortedHours.length - 1 ? 'border-b border-brand-border' : ''
                    }`}
                  >
                    <span className="font-bold text-text-1 capitalize">{day}</span>
                    <span className={`text-sm font-medium ${
                      time.toLowerCase() === 'closed' ? 'text-red-500' : 'text-text-3'
                    }`}>{time}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Additional photos */}
          {vendor.photo_urls.length > 5 && (
            <section>
              <h2 className="text-xl font-extrabold tracking-tight text-text-1 mb-4">More Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                {vendor.photo_urls.slice(5).map((url, i) => (
                  <div key={i} className="aspect-square relative overflow-hidden group rounded-xl">
                    <img
                      src={url}
                      alt={`${vendor.name} photo`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">

          {/* Contact card — sticky */}
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 lg:sticky lg:top-20">
            <h2 className="text-xl font-extrabold tracking-tight text-text-1 mb-5">Get in touch</h2>

            <div className="space-y-3 mb-6">
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-cream hover:bg-cream-2 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/15 transition-colors">
                    <Phone className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-text-1 truncate">{vendor.phone}</div>
                    <div className="text-xs text-text-4 mt-0.5">Tap to call</div>
                  </div>
                </a>
              )}

              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-cream hover:bg-cream-2 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/15 transition-colors">
                    <Globe className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-text-1 truncate">
                      {vendor.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </div>
                    <div className="text-xs text-text-4 mt-0.5">Visit website</div>
                  </div>
                </a>
              )}

              <a
                href={vendor.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-cream hover:bg-cream-2 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/15 transition-colors">
                  <MapPin className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <div className="text-base font-bold text-text-1">Google Maps</div>
                  <div className="text-xs text-text-4 mt-0.5">Get directions</div>
                </div>
              </a>
            </div>

            {/* Claim CTA */}
            <div className="border-t border-brand-border pt-5">
              <Link
                href={`/claim?place_id=${vendor.place_id}&name=${encodeURIComponent(vendor.name)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-5 py-4 rounded-xl transition-colors text-base"
              >
                <BadgeCheck className="w-5 h-5" />
                Is this your business? Claim it
              </Link>
              <p className="text-xs text-text-4 text-center leading-relaxed mt-3">
                Claim your listing to manage your profile, receive booking requests, and grow your business on OneSeva.
              </p>
            </div>
          </div>

          {/* Share card */}
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-1 mb-2">Share this vendor</h2>
            <p className="text-sm text-text-3 mb-4 leading-relaxed">Know someone planning an event? Share this listing.</p>
            <button
              className="w-full inline-flex items-center justify-center gap-2 bg-cream hover:bg-cream-2 text-text-1 font-bold px-4 py-3 rounded-xl transition-colors text-sm border border-brand-border"
            >
              <Share2 className="w-4 h-4" />
              Copy link
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
