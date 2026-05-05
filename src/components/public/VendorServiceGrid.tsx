'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SERVICES = [
  { slug: 'catering', label: 'Catering', emoji: '🍽️', desc: 'Full-service caterers & food trucks' },
  { slug: 'photographer', label: 'Photography', emoji: '📷', desc: 'Wedding & event photographers' },
  { slug: 'videographer', label: 'Videography', emoji: '🎬', desc: 'Videographers & cinematographers' },
  { slug: 'decorator', label: 'Decoration', emoji: '✨', desc: 'Stage, mandap & venue décor' },
  { slug: 'dj', label: 'DJ', emoji: '🎧', desc: 'DJs & sound system providers' },
  { slug: 'florist', label: 'Florist', emoji: '💐', desc: 'Floral arrangements & garlands' },
  { slug: 'mehendi-artist', label: 'Mehendi Artist', emoji: '🌿', desc: 'Bridal & party mehndi' },
  { slug: 'makeup-hair', label: 'Makeup & Hair', emoji: '💄', desc: 'Bridal & event makeup artists' },
  { slug: 'dhol-player', label: 'Dhol Player', emoji: '🥁', desc: 'Traditional dhol performers' },
  { slug: 'live-band', label: 'Live Band', emoji: '🎸', desc: 'Live music for any occasion' },
  { slug: 'choreographer', label: 'Choreographer', emoji: '🩰', desc: 'Wedding & sangeet choreography' },
  { slug: 'pandit-officiant', label: 'Pandit / Officiant', emoji: '🪔', desc: 'Priests & ceremony officiants' },
  { slug: 'chai-station', label: 'Chai Station', emoji: '🍵', desc: 'Chai bars & beverage stations' },
  { slug: 'dessert-vendor', label: 'Desserts', emoji: '🍮', desc: 'Mithai, cakes & sweet stations' },
]

// Cities with lat/lng for nearest-match
const CITIES = [
  { slug: 'new-york', label: 'New York', lat: 40.7128, lng: -74.006 },
  { slug: 'chicago', label: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { slug: 'houston', label: 'Houston', lat: 29.7604, lng: -95.3698 },
  { slug: 'los-angeles', label: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { slug: 'dallas', label: 'Dallas', lat: 32.7767, lng: -96.797 },
  { slug: 'atlanta', label: 'Atlanta', lat: 33.749, lng: -84.388 },
  { slug: 'new-jersey', label: 'New Jersey', lat: 40.0583, lng: -74.4057 },
  { slug: 'san-jose', label: 'San Jose', lat: 37.3382, lng: -121.8863 },
  { slug: 'pittsburgh', label: 'Pittsburgh', lat: 40.4406, lng: -79.9959 },
  { slug: 'san-francisco', label: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { slug: 'seattle', label: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { slug: 'washington-dc', label: 'Washington DC', lat: 38.9072, lng: -77.0369 },
]

const DEFAULT_CITY_SLUG = 'pittsburgh'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestCity(lat: number, lng: number): string {
  let nearest = DEFAULT_CITY_SLUG
  let minDist = Infinity
  for (const city of CITIES) {
    const d = haversineDistance(lat, lng, city.lat, city.lng)
    if (d < minDist) {
      minDist = d
      nearest = city.slug
    }
  }
  return nearest
}

export default function VendorServiceGrid() {
  const [citySlug, setCitySlug] = useState(DEFAULT_CITY_SLUG)
  const [cityLabel, setCityLabel] = useState('Pittsburgh')
  const [detecting, setDetecting] = useState(true)

  useEffect(() => {
    // Check localStorage first for cached city
    const cached = localStorage.getItem('oneseva_city_slug')
    const cachedLabel = localStorage.getItem('oneseva_city_label')
    if (cached && cachedLabel) {
      setCitySlug(cached)
      setCityLabel(cachedLabel)
      setDetecting(false)
      return
    }

    if (!navigator.geolocation) {
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude)
        const city = CITIES.find(c => c.slug === nearest)!
        setCitySlug(nearest)
        setCityLabel(city.label)
        localStorage.setItem('oneseva_city_slug', nearest)
        localStorage.setItem('oneseva_city_label', city.label)
        setDetecting(false)
      },
      () => {
        // Permission denied or error — use default
        setDetecting(false)
      },
      { timeout: 5000 }
    )
  }, [])

  return (
    <div>
      {!detecting && (
        <p className="text-xs text-text-4 mb-3">
          Showing vendors near <span className="font-semibold text-text-2">{cityLabel}</span>
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SERVICES.map(s => (
          <Link
            key={s.slug}
            href={`/vendors/${s.slug}/${citySlug}`}
            className="group flex flex-col gap-1 bg-white dark:bg-cream-2 border border-brand-border rounded-xl p-4 hover:border-brand hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-sm font-bold text-text-1 group-hover:text-brand transition-colors">{s.label}</span>
            <span className="text-xs text-text-4 leading-snug">{s.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
