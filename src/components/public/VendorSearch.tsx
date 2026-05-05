'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ChevronDown, Locate, X } from 'lucide-react'

const SERVICES = [
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

const POPULAR_CITIES = [
  { slug: 'pittsburgh', label: 'Pittsburgh', lat: 40.4406, lng: -79.9959 },
  { slug: 'new-york', label: 'New York', lat: 40.7128, lng: -74.006 },
  { slug: 'chicago', label: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { slug: 'houston', label: 'Houston', lat: 29.7604, lng: -95.3698 },
  { slug: 'los-angeles', label: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { slug: 'dallas', label: 'Dallas', lat: 32.7767, lng: -96.797 },
  { slug: 'atlanta', label: 'Atlanta', lat: 33.749, lng: -84.388 },
  { slug: 'new-jersey', label: 'New Jersey', lat: 40.0583, lng: -74.4057 },
  { slug: 'san-jose', label: 'San Jose', lat: 37.3382, lng: -121.8863 },
  { slug: 'san-francisco', label: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { slug: 'washington-dc', label: 'Washington DC', lat: 38.9072, lng: -77.0369 },
  { slug: 'seattle', label: 'Seattle', lat: 47.6062, lng: -122.3321 },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function VendorSearch() {
  const router = useRouter()
  const [service, setService] = useState('')
  const [serviceInput, setServiceInput] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [citySlug, setCitySlug] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceError, setServiceError] = useState(false)
  const serviceRef = useRef<HTMLDivElement>(null)
  const serviceInputRef = useRef<HTMLInputElement>(null)

  // Auto-detect location on mount
  useEffect(() => {
    const cached = localStorage.getItem('oneseva_city_slug')
    const cachedLabel = localStorage.getItem('oneseva_city_label')
    if (cached && cachedLabel) {
      setCitySlug(cached)
      setCityInput(cachedLabel)
      return
    }
    detectLocation()
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (serviceRef.current && !serviceRef.current.contains(e.target as Node)) setServiceOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function detectLocation() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let nearest = POPULAR_CITIES[0]
        let minDist = Infinity
        for (const c of POPULAR_CITIES) {
          const d = haversineDistance(pos.coords.latitude, pos.coords.longitude, c.lat, c.lng)
          if (d < minDist) { minDist = d; nearest = c }
        }
        setCitySlug(nearest.slug)
        setCityInput(nearest.label)
        localStorage.setItem('oneseva_city_slug', nearest.slug)
        localStorage.setItem('oneseva_city_label', nearest.label)
        setDetecting(false)
      },
      () => setDetecting(false),
      { timeout: 5000 }
    )
  }

  function handleSearch() {
    if (!service) {
      setServiceError(true)
      setServiceOpen(true)
      serviceInputRef.current?.focus()
      return
    }
    setServiceError(false)
    const city = citySlug || cityInput.toLowerCase().replace(/\s+/g, '-') || 'pittsburgh'
    router.push(`/vendors/${service}/${city}`)
  }

  function selectService(slug: string, label: string) {
    setService(slug)
    setServiceInput(label)
    setServiceError(false)
    setServiceOpen(false)
  }

  function clearService() {
    setService('')
    setServiceInput('')
    setServiceOpen(false)
  }


  // Filter services based on typed input
  const q = serviceInput.toLowerCase().trim()
  const filteredServices = q
    ? SERVICES.filter(s => s.label.toLowerCase().includes(q))
    : SERVICES

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border shadow-sm focus-within:border-brand focus-within:shadow-md transition-all">
        {/* Service picker — now a typeable autocomplete */}
        <div ref={serviceRef} className={`relative flex-1 border-b sm:border-b-0 sm:border-r ${serviceError ? 'border-red-300 bg-red-50/50' : 'border-brand-border'}`}>
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-text-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text-4 uppercase tracking-wide">What do you need?</div>
              <input
                ref={serviceInputRef}
                type="text"
                value={serviceInput}
                onChange={(e) => {
                  setServiceInput(e.target.value)
                  setService('')
                  setServiceError(false)
                  setServiceOpen(true)
                }}
                onFocus={() => setServiceOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredServices.length > 0) {
                    selectService(filteredServices[0].slug, filteredServices[0].label)
                    e.preventDefault()
                  }
                  if (e.key === 'Escape') setServiceOpen(false)
                }}
                placeholder={serviceError ? 'Please select a service' : 'Type to search services...'}
                className={`w-full text-[15px] font-medium bg-transparent outline-none ${
                  service ? 'text-text-1' : serviceError ? 'text-red-500 placeholder:text-red-400' : 'text-text-1 placeholder:text-text-4'
                }`}
              />
            </div>
            {service ? (
              <button type="button" onClick={clearService} className="p-1 rounded-lg hover:bg-cream transition-colors">
                <X className="w-4 h-4 text-text-4" />
              </button>
            ) : (
              <ChevronDown className={`w-4 h-4 text-text-4 transition-transform ${serviceOpen ? 'rotate-180' : ''}`} />
            )}
          </div>

          {serviceOpen && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-cream-2 border border-brand-border rounded-xl shadow-lg mt-1 max-h-72 overflow-y-auto">
              {filteredServices.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-4">No services found</div>
              ) : (
                filteredServices.map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    onMouseDown={() => selectService(s.slug, s.label)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors ${
                      service === s.slug ? 'bg-cream font-semibold text-brand' : 'text-text-2'
                    }`}
                  >
                    {s.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* City input — free text, any city */}
        <div className="relative flex-1">
          <div className="flex items-center gap-3 px-5 py-4">
            <MapPin className="w-5 h-5 text-text-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text-4 uppercase tracking-wide">Where?</div>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value)
                  setCitySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder={detecting ? 'Detecting...' : 'Any city worldwide...'}
                className="w-full text-[15px] font-medium text-text-1 placeholder:text-text-4 bg-transparent outline-none"
              />
            </div>
            <button
              type="button"
              onClick={detectLocation}
              className="p-1.5 rounded-lg hover:bg-cream transition-colors"
              title="Detect my location"
            >
              <Locate className={`w-4 h-4 ${detecting ? 'text-brand animate-pulse' : 'text-text-4 hover:text-brand'}`} />
            </button>
          </div>
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          className="bg-brand hover:bg-brand-hover text-white font-bold px-8 py-4 sm:rounded-r-2xl sm:rounded-l-none rounded-b-2xl sm:rounded-b-none transition-colors text-[15px]"
        >
          Find vendors
        </button>
      </div>
    </div>
  )
}
