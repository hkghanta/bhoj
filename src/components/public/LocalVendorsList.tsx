'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Star, MapPin, Phone, Globe, ArrowRight, Loader2 } from 'lucide-react'

type LocalBusiness = {
  place_id: string
  name: string
  address: string
  rating: number | null
  total_ratings: number
  price_level: number | null
  photo_url: string | null
  photo_urls: string[]
  maps_url: string
  phone: string | null
  website: string | null
  business_hours: Record<string, string> | null
  description: string | null
}

const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$']

export default function LocalVendorsList({
  city,
  serviceSlug,
  serviceLabel,
}: {
  city: string
  serviceSlug: string
  serviceLabel: string
}) {
  const PAGE_SIZE = 21
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([])
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const seeded = useRef(false)

  useEffect(() => {
    setLoading(true)
    setSeeding(false)
    setVisible(PAGE_SIZE)
    seeded.current = false

    fetch(`/api/public/local-vendors?city=${encodeURIComponent(city)}&service=${encodeURIComponent(serviceSlug)}`)
      .then(r => r.json())
      .then(data => {
        const items = data.businesses ?? []
        if (items.length > 0) {
          setBusinesses(items)
          setLoading(false)
        } else {
          // No cached data — trigger on-demand seed
          triggerSeed()
        }
      })
      .catch(() => setLoading(false))
  }, [city, serviceSlug])

  function triggerSeed() {
    if (seeded.current) {
      setLoading(false)
      return
    }
    seeded.current = true
    setSeeding(true)

    fetch('/api/public/local-vendors/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, service: serviceSlug }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.count > 0) {
          // Re-fetch from DB now that it's seeded
          return fetch(`/api/public/local-vendors?city=${encodeURIComponent(city)}&service=${encodeURIComponent(serviceSlug)}`)
            .then(r => r.json())
            .then(d => setBusinesses(d.businesses ?? []))
        }
      })
      .catch(() => {})
      .finally(() => {
        setSeeding(false)
        setLoading(false)
      })
  }

  if (loading || seeding) {
    return (
      <section className="my-10">
        {seeding ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
              <h2 className="text-xl font-black text-text-1">
                Discovering {serviceLabel.toLowerCase()} in {city}...
              </h2>
            </div>
            <p className="text-sm text-text-3 mb-5 max-w-2xl leading-relaxed">
              First time viewing this city — finding local businesses from Google. This only takes a moment and results are cached for future visits.
            </p>
          </>
        ) : (
          <>
            <div className="h-7 w-72 bg-cream-2 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-96 bg-cream-2 rounded animate-pulse mb-5" />
          </>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
              <div className="h-44 bg-cream animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-cream-2 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-cream-2 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (businesses.length === 0) return null

  return (
    <section className="my-10">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-xl font-black text-text-1">
          Local {serviceLabel.toLowerCase()} in {city}
        </h2>
        <span className="text-xs font-medium text-text-4 bg-cream-2 px-2.5 py-1 rounded-full whitespace-nowrap mt-1">
          {businesses.length} found
        </span>
      </div>
      <p className="text-sm text-text-3 mb-6 max-w-2xl leading-relaxed">
        Local businesses in {city} sourced from Google Maps. Own one of these? Claim your listing to manage your profile on OneSeva.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {businesses.slice(0, visible).map(biz => (
          <Link
            href={`/vendors/local/${biz.place_id}`}
            key={biz.place_id}
            className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border overflow-hidden hover:shadow-md hover:border-brand/30 transition-all group"
          >
            {/* Photo */}
            <div className="aspect-[16/9] bg-gradient-to-br from-cream to-cream-2 relative overflow-hidden">
              {biz.photo_url ? (
                <img
                  src={biz.photo_url}
                  alt={biz.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-black text-brand/10">
                    {biz.name.charAt(0)}
                  </span>
                </div>
              )}
              {/* Rating overlay */}
              {biz.rating && (
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-cream-2/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-text-1">{biz.rating.toFixed(1)}</span>
                  <span className="text-xs text-text-4">({biz.total_ratings.toLocaleString()})</span>
                </div>
              )}
              {/* Price level */}
              {biz.price_level != null && biz.price_level > 0 && (
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-cream-2/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-xs font-bold text-text-2">{PRICE_LABELS[biz.price_level]}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-5">
              <h3 className="font-bold text-text-1 leading-tight mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                {biz.name}
              </h3>

              <div className="flex items-start gap-1.5 text-text-4 text-sm mb-3">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1 leading-snug">{biz.address}</span>
              </div>

              {/* Phone & website indicators */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-3 mb-3">
                {biz.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{biz.phone}</span>
                  </span>
                )}
                {biz.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </span>
                )}
              </div>

              {/* View details link */}
              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <span className="text-xs text-text-4">
                  {biz.total_ratings.toLocaleString()} Google reviews
                </span>
                <span className="text-xs font-semibold text-brand flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                  View details <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Show more button */}
      {businesses.length > visible && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 bg-white dark:bg-cream-2 border border-brand-border hover:border-brand text-text-1 font-semibold px-8 py-3 rounded-xl hover:shadow-sm transition-all text-sm"
          >
            Show more ({businesses.length - visible} remaining)
          </button>
        </div>
      )}
    </section>
  )
}
