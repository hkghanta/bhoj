import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Utensils, Camera, Palette, Music, Sparkles } from 'lucide-react'
import VendorSearch from '@/components/public/VendorSearch'

export const metadata: Metadata = {
  title: 'Find Indian Event Vendors Near You | OneSeva',
  description: 'Search for Indian caterers, photographers, decorators, DJs, mehendi artists and more in your city. Compare reviews, get quotes, and book — all free on OneSeva.',
  openGraph: {
    title: 'Find Indian Event Vendors Near You | OneSeva',
    description: 'Search for caterers, photographers, decorators and more for your Indian wedding or event.',
  },
}

const TOP_SERVICES = [
  { slug: 'catering', label: 'Catering', icon: Utensils, count: '2,400+', desc: 'Indian restaurants & caterers' },
  { slug: 'photographer', label: 'Photography', icon: Camera, count: '1,800+', desc: 'Wedding & event photographers' },
  { slug: 'decorator', label: 'Decoration', icon: Palette, count: '900+', desc: 'Mandap, stage & venue decor' },
  { slug: 'dj', label: 'DJ & Music', icon: Music, count: '600+', desc: 'DJs, dhol, live bands' },
  { slug: 'mehendi-artist', label: 'Mehendi', icon: Sparkles, count: '500+', desc: 'Bridal & party mehndi' },
  { slug: 'makeup-hair', label: 'Makeup & Hair', icon: Sparkles, count: '700+', desc: 'Bridal beauty artists' },
]

const POPULAR_CITIES = [
  { slug: 'pittsburgh', label: 'Pittsburgh' },
  { slug: 'new-york', label: 'New York' },
  { slug: 'chicago', label: 'Chicago' },
  { slug: 'houston', label: 'Houston' },
  { slug: 'los-angeles', label: 'Los Angeles' },
  { slug: 'dallas', label: 'Dallas' },
  { slug: 'atlanta', label: 'Atlanta' },
  { slug: 'san-francisco', label: 'San Francisco' },
  { slug: 'san-jose', label: 'San Jose' },
  { slug: 'new-jersey', label: 'New Jersey' },
  { slug: 'washington-dc', label: 'Washington DC' },
  { slug: 'seattle', label: 'Seattle' },
]

const ALL_SERVICES = [
  { slug: 'catering', label: 'Catering' },
  { slug: 'photographer', label: 'Photography' },
  { slug: 'videographer', label: 'Videography' },
  { slug: 'decorator', label: 'Decoration' },
  { slug: 'dj', label: 'DJ' },
  { slug: 'florist', label: 'Florist' },
  { slug: 'mehendi-artist', label: 'Mehendi Artist' },
  { slug: 'makeup-hair', label: 'Makeup & Hair' },
  { slug: 'dhol-player', label: 'Dhol Player' },
  { slug: 'live-band', label: 'Live Band' },
  { slug: 'choreographer', label: 'Choreographer' },
  { slug: 'pandit-officiant', label: 'Pandit / Officiant' },
  { slug: 'chai-station', label: 'Chai Station' },
  { slug: 'dessert-vendor', label: 'Desserts' },
  { slug: 'bartender', label: 'Bartender' },
  { slug: 'food-truck', label: 'Food Truck' },
  { slug: 'lighting', label: 'Lighting' },
  { slug: 'mc-host', label: 'MC / Host' },
]

// JSON-LD for the search page
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OneSeva',
  url: 'https://oneseva.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://oneseva.com/vendors/{service}/{city}',
    'query-input': 'required name=service,city',
  },
}

export default function VendorsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero + Search ─────────────────────────────────────────────── */}
      <section className="-mx-6 -mt-8 px-6 pt-14 pb-16 bg-gradient-to-b from-cream via-cream/60 to-transparent">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 leading-[1.1] mb-4">
            Find the perfect vendor
            <br />
            <span className="text-brand">for your event</span>
          </h1>
          <p className="text-text-3 text-lg leading-relaxed max-w-lg mx-auto">
            Search thousands of Indian caterers, photographers, decorators and more —
            read reviews, compare prices, and book.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <VendorSearch />
        </div>
      </section>

      {/* ── Top categories ────────────────────────────────────────────── */}
      <section className="mt-12 mb-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-1 mb-6">Popular services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TOP_SERVICES.map(svc => {
            const Icon = svc.icon
            return (
              <Link
                key={svc.slug}
                href={`/vendors/${svc.slug}/pittsburgh`}
                className="group bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-brand/[0.07] flex items-center justify-center mb-4 group-hover:bg-brand/[0.12] transition-colors">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-text-1 group-hover:text-brand transition-colors">{svc.label}</h3>
                <p className="text-xs text-text-4 mt-1">{svc.desc}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Browse by city ────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-1 mb-2">Browse by city</h2>
        <p className="text-sm text-text-3 mb-6">Find vendors in the largest Indian communities across the US.</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_CITIES.map(city => (
            <Link
              key={city.slug}
              href={`/vendors/catering/${city.slug}`}
              className="group text-center bg-white dark:bg-cream-2 border border-brand-border rounded-xl px-4 py-3.5 hover:border-brand/30 hover:shadow-md hover:shadow-brand/5 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-sm font-semibold text-text-1 group-hover:text-brand transition-colors">{city.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── All services (SEO links) ──────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-1 mb-6">All services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1">
          {ALL_SERVICES.map(svc => (
            <Link
              key={svc.slug}
              href={`/vendors/${svc.slug}/pittsburgh`}
              className="text-sm text-text-2 hover:text-brand font-medium py-2 transition-colors"
            >
              {svc.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cross-link grid: service x city (SEO) ─────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-text-1 mb-5">Vendors by city</h2>
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">City</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">Catering</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">Photography</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">Decoration</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">DJ</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[11px] uppercase tracking-[0.1em] text-text-3">Mehendi</th>
                </tr>
              </thead>
              <tbody>
                {POPULAR_CITIES.slice(0, 8).map((city, i) => (
                  <tr key={city.slug} className={`border-b border-brand-border/60 last:border-0 hover:bg-cream/40 transition-colors ${i % 2 === 0 ? 'bg-cream/20' : ''}`}>
                    <td className="px-5 py-3 font-semibold text-text-1">{city.label}</td>
                    {['catering', 'photographer', 'decorator', 'dj', 'mehendi-artist'].map(svc => (
                      <td key={svc} className="px-5 py-3">
                        <Link href={`/vendors/${svc}/${city.slug}`} className="text-brand hover:text-brand-hover text-xs font-semibold transition-colors hover:underline underline-offset-2">
                          View
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="mb-10 bg-gradient-to-br from-cream to-cream/60 border border-brand-border rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-text-1 mb-2">Don&apos;t want to search?</h3>
          <p className="text-text-3 max-w-md leading-relaxed">
            Post your event requirements and let vendors come to you with personalized quotes. Free, no obligation.
          </p>
        </div>
        <Link
          href="/register/customer"
          className="inline-flex items-center gap-2 bg-brand text-white font-bold px-7 py-3.5 rounded-xl hover:bg-brand-hover transition-all duration-200 whitespace-nowrap shadow-md shadow-brand/15 hover:shadow-lg hover:shadow-brand/25"
        >
          Post my requirements <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </>
  )
}
