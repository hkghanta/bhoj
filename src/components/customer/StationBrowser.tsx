'use client'

import { useState, useEffect } from 'react'
import {
  Search, Loader2, ChefHat, Users, DollarSign, Shield,
  Clock, UtensilsCrossed, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type StationTemplate = {
  id: string
  station_key: string
  name: string
  description: string | null
  icon: string | null
  typical_min_guests: number | null
  typical_max_guests: number | null
}

type VendorStation = {
  id: string
  vendor_id: string
  pricing_model: 'FLAT' | 'PER_PERSON' | 'HOURLY'
  base_price: number | null
  price_per_person: number | null
  hourly_rate: number | null
  min_guests: number | null
  max_guests: number | null
  includes_chef: boolean
  includes_equipment: boolean
  description: string | null
  vendor: {
    id: string
    business_name: string
    city: string
    profile_photo_url: string | null
    is_verified: boolean
  }
  station_template: {
    station_key: string
    name: string
  }
}

const STATION_ICONS: Record<string, typeof ChefHat> = {
  LIVE_DOSA: UtensilsCrossed,
  LIVE_PASTA: UtensilsCrossed,
  LIVE_CHAAT: UtensilsCrossed,
  LIVE_WOK: UtensilsCrossed,
}

type Props = { eventId: string; city?: string }

export default function StationBrowser({ eventId, city: initialCity }: Props) {
  const [templates, setTemplates] = useState<StationTemplate[]>([])
  const [results, setResults] = useState<VendorStation[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState('')
  const [city, setCity] = useState(initialCity ?? '')
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [searching, setSearching] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  useEffect(() => {
    // Fetch event city if not provided
    if (!initialCity) {
      fetch(`/api/events/${eventId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.city) setCity(d.city) })
        .catch(() => {})
    }
  }, [eventId, initialCity])

  useEffect(() => {
    fetch('/api/stations/templates')
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
      .finally(() => setLoadingTemplates(false))
  }, [])

  async function searchStations(stationKey: string) {
    if (!city) return
    setSelectedType(stationKey)
    setSearching(true)
    setResults([])
    const params = new URLSearchParams({ type: stationKey, city })
    if (guestCount) params.set('guests', guestCount)
    try {
      const res = await fetch(`/api/stations/search?${params}`)
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
    setSearching(false)
  }

  function pricingLabel(s: VendorStation) {
    if (s.pricing_model === 'PER_PERSON' && s.price_per_person) return `${fmt(Number(s.price_per_person))}/person`
    if (s.pricing_model === 'HOURLY' && s.hourly_rate) return `${fmt(Number(s.hourly_rate))}/hr`
    if (s.pricing_model === 'FLAT' && s.base_price) return `${fmt(Number(s.base_price))} flat`
    return 'Contact for pricing'
  }

  if (loadingTemplates) {
    return (
      <div className="flex items-center gap-2 text-text-4 py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading stations...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Guest count filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-text-4" />
          <input
            type="number"
            value={guestCount}
            onChange={e => setGuestCount(e.target.value)}
            placeholder="Guest count"
            className="w-32 rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {selectedType && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSelectedType(null); setResults([]) }}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to all stations
          </Button>
        )}
      </div>

      {/* Station type grid */}
      {!selectedType && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {templates.map(t => {
            const Icon = STATION_ICONS[t.station_key] || ChefHat
            return (
              <button
                key={t.id}
                onClick={() => searchStations(t.station_key)}
                className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 text-left hover:border-brand-border hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center mb-3 group-hover:bg-cream transition-colors">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-bold text-text-1 text-sm">{t.name}</h3>
                {t.description && (
                  <p className="text-xs text-text-4 mt-1 line-clamp-2">{t.description}</p>
                )}
                {(t.typical_min_guests || t.typical_max_guests) && (
                  <p className="text-xs text-text-4 mt-2">
                    {t.typical_min_guests && t.typical_max_guests
                      ? `${t.typical_min_guests}-${t.typical_max_guests} guests`
                      : t.typical_min_guests
                      ? `${t.typical_min_guests}+ guests`
                      : `Up to ${t.typical_max_guests} guests`
                    }
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Search results */}
      {selectedType && (
        <div>
          <h3 className="font-bold text-text-1 mb-4">
            {templates.find(t => t.station_key === selectedType)?.name ?? selectedType}
            {results.length > 0 && (
              <span className="text-text-4 font-normal text-sm ml-2">({results.length} vendors)</span>
            )}
          </h3>

          {searching ? (
            <div className="flex items-center gap-2 text-text-4 py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="bg-cream rounded-xl border border-dashed p-6 text-center">
              <Search className="h-6 w-6 text-text-4 mx-auto mb-2" />
              <p className="text-sm text-text-4">No vendors found for this station type in {city}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(s => (
                <div key={s.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-sm">{s.vendor.business_name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-1 text-sm">{s.vendor.business_name}</span>
                        {s.vendor.is_verified && (
                          <span className="flex items-center gap-0.5 text-xs text-blue-600">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-4 mt-0.5">{s.vendor.city}</p>
                      {s.description && (
                        <p className="text-sm text-text-3 mt-2 line-clamp-2">{s.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand bg-cream px-2.5 py-1 rounded-xl">
                          <DollarSign className="h-3.5 w-3.5" /> {pricingLabel(s)}
                        </span>
                        {s.includes_chef && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            <ChefHat className="h-3 w-3" /> Chef included
                          </span>
                        )}
                        {s.includes_equipment && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            Equipment included
                          </span>
                        )}
                        {(s.min_guests || s.max_guests) && (
                          <span className="text-xs text-text-4">
                            {s.min_guests && s.max_guests
                              ? `${s.min_guests}-${s.max_guests} guests`
                              : s.min_guests
                              ? `${s.min_guests}+ guests`
                              : `Up to ${s.max_guests} guests`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
