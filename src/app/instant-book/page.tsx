'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, DollarSign, Users, Package, Search, Loader2 } from 'lucide-react'

type InstantPackage = {
  id: string
  name: string
  description: string | null
  price: number
  price_type: string
  vendor_name: string
  vendor_type: string
  photo_url: string | null
  includes: string[]
  min_guests: number | null
  max_guests: number | null
}

export default function InstantBookBrowsePage() {
  const [packages, setPackages] = useState<InstantPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [vendorType, setVendorType] = useState('')
  const [city, setCity] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'newest'>('price')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (vendorType) params.set('vendor_type', vendorType)
      if (city) params.set('city', city)
      if (guestCount) params.set('guest_count', guestCount)
      if (maxPrice) params.set('max_price', maxPrice)
      params.set('sort', sortBy)
      const res = await fetch(`/api/instant-book?${params}`)
      if (!res.ok) throw new Error('Failed to search')
      setPackages(await res.json())
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  const sorted = [...packages].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-text-1 flex items-center gap-2">
          <Zap className="h-6 w-6 text-brand" /> Instant Book
        </h1>
        <p className="text-text-4 mt-1">Browse and book vendor packages instantly.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl border p-5 shadow-sm mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Vendor Type</label>
            <select className={inputCls} value={vendorType} onChange={e => setVendorType(e.target.value)}>
              <option value="">All Types</option>
              <option value="caterer">Caterer</option>
              <option value="photographer">Photographer</option>
              <option value="decorator">Decorator</option>
              <option value="dj">DJ</option>
              <option value="florist">Florist</option>
              <option value="venue">Venue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">City</label>
            <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Guest Count</label>
            <input type="number" min="1" className={inputCls} value={guestCount} onChange={e => setGuestCount(e.target.value)} placeholder="e.g. 100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Max Price ($)</label>
            <input type="number" min="0" className={inputCls} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="e.g. 5000" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="bg-brand hover:bg-brand-hover w-full">
              <Search className="h-4 w-4 mr-1" /> {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </form>

      {searched && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-4">{packages.length} package{packages.length !== 1 ? 's' : ''} found</p>
          <select className="rounded-lg border border-brand-border px-3 py-1.5 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="price">Sort by Price</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-4" />
        </div>
      ) : !searched ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Package className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">Search for instant book packages above.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Package className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No packages match your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
              {pkg.photo_url && (
                <img src={pkg.photo_url} alt={pkg.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text-1">{pkg.name}</h3>
                    <p className="text-xs text-text-4">{pkg.vendor_name} &middot; {pkg.vendor_type}</p>
                  </div>
                  <span className="text-lg font-bold text-brand flex items-center">
                    <DollarSign className="h-4 w-4" />{pkg.price.toLocaleString()}
                  </span>
                </div>
                {pkg.description && <p className="text-sm text-text-4 mb-3">{pkg.description}</p>}
                {pkg.includes && pkg.includes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pkg.includes.map(item => (
                      <span key={item} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{item}</span>
                    ))}
                  </div>
                )}
                {(pkg.min_guests || pkg.max_guests) && (
                  <p className="text-xs text-text-4 flex items-center gap-1 mb-3">
                    <Users className="h-3 w-3" />
                    {pkg.min_guests && `${pkg.min_guests}`}{pkg.min_guests && pkg.max_guests && ' - '}{pkg.max_guests && `${pkg.max_guests}`} guests
                  </p>
                )}
                <div className="mt-auto pt-2">
                  <a href={`/instant-book/${pkg.id}`}>
                    <Button className="bg-brand hover:bg-brand-hover w-full">
                      <Zap className="h-4 w-4 mr-1" /> Book Now
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
