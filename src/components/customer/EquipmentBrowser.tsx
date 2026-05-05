'use client'

import { useState, useEffect } from 'react'
import {
  Search, Loader2, Package, DollarSign, Shield, Clock,
} from 'lucide-react'

type EquipmentResult = {
  id: string
  vendor_id: string
  equipment_key: string
  name: string
  description: string | null
  price_per_unit: number | null
  price_per_event: number | null
  quantity_available: number
  min_rental_hours: number
  vendor: {
    id: string
    business_name: string
    city: string
    profile_photo_url: string | null
    is_verified: boolean
  }
}

const EQUIPMENT_TYPES = [
  { key: '', label: 'All Equipment' },
  { key: 'CHAFING_DISH', label: 'Chafing Dishes' },
  { key: 'TABLE', label: 'Tables' },
  { key: 'CHAIR', label: 'Chairs' },
  { key: 'LINEN', label: 'Linens' },
  { key: 'TENT', label: 'Tents' },
  { key: 'SERVING_WARE', label: 'Serving Ware' },
  { key: 'BEVERAGE_DISPENSER', label: 'Beverage Dispensers' },
  { key: 'WARMING_TRAY', label: 'Warming Trays' },
  { key: 'COOLER', label: 'Coolers' },
  { key: 'OTHER', label: 'Other' },
]

type Props = { eventId: string; city?: string }

export default function EquipmentBrowser({ eventId, city: initialCity }: Props) {
  const [results, setResults] = useState<EquipmentResult[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [city, setCity] = useState(initialCity ?? '')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  useEffect(() => {
    if (!initialCity) {
      fetch(`/api/events/${eventId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.city) setCity(d.city) })
        .catch(() => {})
    }
  }, [eventId, initialCity])

  useEffect(() => {
    if (!city) return
    searchEquipment()
  }, [selectedType, city]) // eslint-disable-line react-hooks/exhaustive-deps

  async function searchEquipment() {
    if (!city) return
    setLoading(true)
    const params = new URLSearchParams({ city })
    if (selectedType) params.set('type', selectedType)
    try {
      const res = await fetch(`/api/equipment/search?${params}`)
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
    setSearched(true)
  }

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="text-xs font-medium text-text-4 block mb-1">Equipment Type</label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm bg-white dark:bg-cream-2 focus:outline-none focus:ring-2 focus:ring-brand min-w-[180px]"
          >
            {EQUIPMENT_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-2 text-text-4 py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching...
        </div>
      ) : !searched ? (
        <div className="bg-cream rounded-xl border border-dashed p-6 text-center">
          <Package className="h-6 w-6 text-text-4 mx-auto mb-2" />
          <p className="text-sm text-text-4">Select an equipment type to browse available options.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-cream rounded-xl border border-dashed p-6 text-center">
          <Search className="h-6 w-6 text-text-4 mx-auto mb-2" />
          <p className="text-sm text-text-4">No equipment found in {city}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-4">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(eq => (
            <div key={eq.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-1 text-sm">{eq.name}</span>
                    <span className="text-xs text-text-4 bg-cream px-2 py-0.5 rounded-full">
                      {eq.equipment_key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-4">{eq.vendor.business_name}</span>
                    {eq.vendor.is_verified && (
                      <span className="flex items-center gap-0.5 text-xs text-blue-600">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  {eq.description && (
                    <p className="text-sm text-text-3 mt-2 line-clamp-2">{eq.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {eq.price_per_unit !== null && (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand bg-cream px-2.5 py-1 rounded-xl">
                        <DollarSign className="h-3.5 w-3.5" /> {fmt(Number(eq.price_per_unit))}/unit
                      </span>
                    )}
                    {eq.price_per_event !== null && (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-xl">
                        <DollarSign className="h-3.5 w-3.5" /> {fmt(Number(eq.price_per_event))}/event
                      </span>
                    )}
                    <span className="text-xs text-text-4">
                      {eq.quantity_available} available
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-text-4">
                      <Clock className="h-3 w-3" /> Min {eq.min_rental_hours}h rental
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
