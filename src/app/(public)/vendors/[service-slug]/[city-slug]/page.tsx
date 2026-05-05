import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Star, CheckCircle2, MapPin, ArrowRight, ChevronRight } from 'lucide-react'
import LocalVendorsList from '@/components/public/LocalVendorsList'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

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

const SERVICE_EMOJI: Record<string, string> = {
  catering: '🍽️', photographer: '📷', videographer: '🎬', decorator: '✨',
  dj: '🎧', florist: '💐', 'mehendi-artist': '🌿', 'makeup-hair': '💄',
  'dhol-player': '🥁', 'live-band': '🎸', choreographer: '🩰',
  'pandit-officiant': '🪔', 'chai-station': '🍵', 'dessert-vendor': '🍮',
  bartender: '🍸', 'food-truck': '🚚', lighting: '💡', transport: '🚗',
  'tent-marquee': '⛺', 'classical-musician': '🎻', 'mc-host': '🎤',
  'games-entertainment': '🎮', 'invitation-designer': '💌',
  'furniture-rental': '🪑', 'equipment-rental': '🔧', security: '🛡️',
}

const INDIVIDUAL_SLUGS = new Set([
  'photographer', 'videographer', 'dj', 'mehendi-artist', 'makeup-hair',
  'dhol-player', 'live-band', 'classical-musician', 'choreographer',
  'pandit-officiant', 'mc-host', 'bartender', 'chai-station',
  'games-entertainment', 'invitation-designer',
])

const RELATED_SERVICES: Record<string, string[]> = {
  catering: ['decorator', 'bartender', 'dessert-vendor', 'chai-station', 'food-truck'],
  decorator: ['florist', 'lighting', 'tent-marquee', 'furniture-rental'],
  photographer: ['videographer', 'makeup-hair', 'lighting'],
  videographer: ['photographer', 'dj', 'lighting'],
  dj: ['live-band', 'dhol-player', 'mc-host', 'lighting'],
  florist: ['decorator', 'lighting', 'tent-marquee'],
  'mehendi-artist': ['makeup-hair', 'photographer', 'choreographer'],
  'makeup-hair': ['mehendi-artist', 'photographer', 'invitation-designer'],
  bartender: ['catering', 'dessert-vendor', 'chai-station'],
  'dessert-vendor': ['catering', 'bartender', 'chai-station'],
  'dhol-player': ['dj', 'live-band', 'choreographer'],
  'live-band': ['dj', 'dhol-player', 'mc-host'],
  'tent-marquee': ['decorator', 'florist', 'lighting', 'furniture-rental'],
  lighting: ['decorator', 'tent-marquee', 'dj'],
  choreographer: ['dj', 'dhol-player', 'makeup-hair'],
  'pandit-officiant': ['decorator', 'florist', 'photographer'],
  'mc-host': ['dj', 'live-band', 'photographer'],
  transport: ['security', 'photographer'],
  'chai-station': ['catering', 'dessert-vendor', 'bartender'],
  'games-entertainment': ['dj', 'mc-host', 'photographer'],
  'invitation-designer': ['photographer', 'decorator'],
  'furniture-rental': ['tent-marquee', 'decorator', 'lighting'],
  'equipment-rental': ['catering', 'tent-marquee', 'lighting'],
  'food-truck': ['catering', 'bartender', 'dessert-vendor'],
  security: ['transport', 'tent-marquee'],
  'classical-musician': ['pandit-officiant', 'dj', 'live-band'],
}

const SERVICE_FAQ: Record<string, { question: string; answer: string }[]> = {
  catering: [
    { question: 'How much does catering cost per person?', answer: 'Indian catering typically ranges from $25-$75 per person depending on the menu complexity, number of courses, and service style. Live stations and premium dishes cost more.' },
    { question: 'How far in advance should I book a caterer?', answer: 'For weddings and large events, book 6-12 months in advance. For smaller gatherings, 2-3 months is usually sufficient. Peak season (May-October) requires earlier booking.' },
    { question: 'Do caterers provide serving staff?', answer: 'Most full-service caterers include waitstaff, setup, and cleanup in their packages. Always confirm what\'s included — some charge separately for service staff.' },
    { question: 'Can I request a tasting before booking?', answer: 'Yes, most caterers offer tastings either complimentary or for a small fee (usually $50-$150). This is a chance to try the menu and discuss customizations.' },
  ],
  photographer: [
    { question: 'How much does event photography cost?', answer: 'Event photography typically ranges from $500-$5,000+ depending on hours of coverage, number of photographers, and deliverables (edited photos, albums, prints).' },
    { question: 'How many photos should I expect?', answer: 'Most photographers deliver 50-100 edited photos per hour of coverage. A full-day wedding might yield 500-800+ edited images.' },
    { question: 'When will I receive my photos?', answer: 'Turnaround varies from 2-8 weeks. Sneak peeks of 10-20 images are often shared within 48 hours.' },
  ],
  decorator: [
    { question: 'How much does event decoration cost?', answer: 'Decoration costs vary widely — from $1,000 for simple setups to $15,000+ for elaborate mandap designs, stage decor, and venue transformations.' },
    { question: 'Does the decorator handle setup and takedown?', answer: 'Yes, professional decorators include full setup and removal. Confirm the timeline — setup often starts several hours before the event.' },
    { question: 'Can I mix fresh and artificial flowers?', answer: 'Absolutely. Many decorators offer hybrid arrangements to balance aesthetics and budget. Fresh flowers for key pieces and quality silk for volume.' },
  ],
  dj: [
    { question: 'How much does a DJ cost for an event?', answer: 'DJ services range from $300-$2,000+ depending on hours, equipment provided, and whether it includes MC duties, lighting, or special effects.' },
    { question: 'Does the DJ bring their own equipment?', answer: 'Professional DJs bring their own sound system, speakers, and mixing equipment. Confirm what\'s included and whether venue power requirements are met.' },
  ],
}

const DEFAULT_FAQ = [
  { question: 'How do I find the right vendor?', answer: 'Browse vendor profiles, read reviews from past clients, compare packages and pricing, and request quotes from multiple vendors to find the best fit for your event.' },
  { question: 'How far in advance should I book?', answer: 'For large events like weddings, book 6-12 months ahead. For smaller gatherings, 1-3 months is usually enough. Popular dates fill up fast.' },
  { question: 'What should I look for in reviews?', answer: 'Pay attention to comments about reliability, communication, quality of work, and value for money. Look for reviews from events similar to yours.' },
]

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

// ─── Data fetching ──────────────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Metadata ───────────────────────────────────────────────────────────────

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

// ─── Components ─────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: BrowseVendor }) {
  const name = getDisplayName(vendor)

  return (
    <a
      href={`/vendors/v/${vendor.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white dark:bg-cream-2 rounded-2xl border border-brand-border hover:border-text-3/30 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-gradient-to-br from-cream to-cream-2 relative overflow-hidden">
        {vendor.profile_photo_url ? (
          <Image
            src={vendor.profile_photo_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-brand/20">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {vendor.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-cream-2/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            <span className="text-xs font-semibold text-blue-600">Verified</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold text-text-1 leading-tight line-clamp-1">
            {name}
          </h3>
          {vendor.avg_rating && (
            <div className="flex items-center gap-1 flex-shrink-0 bg-cream rounded-md px-1.5 py-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-text-1">{vendor.avg_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-text-4 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{vendor.city}</span>
        </div>

        {vendor.description && (
          <p className="text-sm text-text-3 line-clamp-2 mb-3 leading-relaxed">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-brand-border">
          {vendor.starting_price ? (
            <div>
              <span className="text-xs text-text-4">From </span>
              <span className="text-lg font-black text-text-1">
                {formatPrice(vendor.starting_price, vendor.currency)}
              </span>
              <span className="text-xs text-text-4">/pp</span>
            </div>
          ) : (
            <span className="text-sm text-text-4">Price on request</span>
          )}
          <span className="text-xs font-semibold text-text-3 group-hover:text-text-1 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            View profile <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

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
  const emoji = SERVICE_EMOJI[serviceSlug] ?? '🎉'
  const isIndividual = INDIVIDUAL_SLUGS.has(serviceSlug)
  const faqs = SERVICE_FAQ[serviceSlug] ?? DEFAULT_FAQ
  const related = (RELATED_SERVICES[serviceSlug] ?? []).filter(s => VALID_SLUGS.has(s))

  const vendors = await fetchVendors(serviceSlug, cityName)

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Vendors', item: `${BASE_URL}/vendors` },
      { '@type': 'ListItem', position: 3, name: `${serviceLabel} in ${cityName}`, item: `${BASE_URL}/vendors/${serviceSlug}/${citySlug}` },
    ],
  }

  const itemListJsonLd = vendors.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${serviceLabel} in ${cityName}`,
    numberOfItems: vendors.length,
    itemListElement: vendors.slice(0, 10).map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: getDisplayName(v),
        address: { '@type': 'PostalAddress', addressLocality: v.city, addressCountry: v.country },
        ...(v.profile_photo_url ? { image: v.profile_photo_url } : {}),
        ...(v.avg_rating ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: v.avg_rating.toFixed(1), bestRating: 5 },
        } : {}),
        url: `${BASE_URL}/vendors/v/${v.id}`,
      },
    })),
  } : null

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-text-4 mb-6">
        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/vendors" className="hover:text-brand transition-colors">Vendors</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-2 font-medium">{serviceLabel} in {cityName}</span>
      </nav>

      {/* ── Hero header ───────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-br from-[#1a0904] to-[#3d1f10] rounded-2xl px-8 py-10 sm:px-12 sm:py-14 mb-10">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{emoji}</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {serviceLabel} in {cityName}
          </h1>
        </div>
        <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
          {vendors.length > 0
            ? `Browse ${vendors.length} ${serviceLabel.toLowerCase()} vendor${vendors.length !== 1 ? 's' : ''} in ${cityName}. Compare packages, read reviews, and request quotes — all free.`
            : `Find and connect with the best ${serviceLabel.toLowerCase()} vendors in ${cityName} for your next event.`}
        </p>
      </header>

      {/* ── OneSeva vendor grid ───────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-text-1">
              OneSeva vendors
              <span className="ml-2 text-sm font-medium text-text-4">({vendors.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(vendor => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </section>
      )}

      {/* ── Google Places local businesses ─────────────────────────────────── */}
      <LocalVendorsList city={cityName} serviceSlug={serviceSlug} serviceLabel={serviceLabel} />

      {/* ── Empty state CTA (when no OneSeva vendors) ─────────────────────── */}
      {vendors.length === 0 && (
        <section className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-8 sm:p-10 text-center my-16">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{emoji}</span>
          </div>
          <h2 className="text-xl font-black text-text-1 mb-2">
            Be the first {serviceLabel.toLowerCase()} vendor in {cityName}
          </h2>
          <p className="text-text-3 max-w-md mx-auto mb-6 leading-relaxed">
            We&apos;re growing fast in {cityName}. List your business on OneSeva — it&apos;s free — and start receiving leads from event planners.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            List your business free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="my-16">
        <h2 className="text-xl font-black text-text-1 mb-6">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Browse & compare', desc: `View profiles, packages, reviews, and pricing from ${serviceLabel.toLowerCase()} vendors in ${cityName}.` },
            { step: '2', title: 'Request quotes', desc: 'Share your event details and get personalized quotes from multiple vendors — free, no obligation.' },
            { step: '3', title: 'Book with confidence', desc: 'Compare quotes side by side, check cancellation policies, and book the perfect vendor.' },
          ].map(item => (
            <div key={item.step} className="bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-8">
              <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center text-base font-black text-brand mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-text-1 mb-2">{item.title}</h3>
              <p className="text-base text-text-3 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="my-16">
        <h2 className="text-xl font-black text-text-1 mb-6">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white dark:bg-cream-2 rounded-xl border border-brand-border">
              <summary className="flex items-center justify-between cursor-pointer p-5 select-none">
                <h3 className="text-base font-bold text-text-1 pr-4">{faq.question}</h3>
                <ChevronRight className="w-4 h-4 text-text-4 transition-transform group-open:rotate-90 flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-base text-text-3 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Related services ──────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="my-16">
          <h2 className="text-xl font-black text-text-1 mb-1.5">You might also need</h2>
          <p className="text-text-3 text-sm mb-5">Planning an event in {cityName}? These services pair well with {serviceLabel.toLowerCase()}.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map(slug => (
              <Link
                key={slug}
                href={`/vendors/${slug}/${citySlug}`}
                className="group bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-4 hover:border-text-3/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{SERVICE_EMOJI[slug] ?? '🎉'}</span>
                  <h3 className="text-base font-bold text-text-1 group-hover:text-text-1 transition-colors">{SERVICE_LABELS[slug]}</h3>
                </div>
                <p className="text-base text-text-4">in {cityName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="my-16 bg-cream border border-brand-border rounded-2xl p-10 sm:p-14 text-center">
        <h2 className="text-2xl font-black text-text-1 mb-2">
          {isIndividual
            ? `Are you a ${serviceLabel.toLowerCase().replace(/s$/, '')} in ${cityName}?`
            : `Offer ${serviceLabel.toLowerCase()} in ${cityName}?`}
        </h2>
        <p className="text-text-3 mb-6 max-w-lg mx-auto">
          Join OneSeva free and get leads from events in your area.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          List your business free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </>
  )
}
