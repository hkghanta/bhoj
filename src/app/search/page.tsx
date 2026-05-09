'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  ShieldCheck,
  Filter,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { BadgesList } from '@/components/vendor/BadgesList'

type VendorResult = {
  id: string
  business_name: string
  vendor_type: string
  city: string
  rating: number
  review_count: number
  profile_photo_url: string | null
  is_verified: boolean
}

type SearchResponse = {
  vendors: VendorResult[]
  total: number
  page: number
  page_size: number
}

const VENDOR_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'CATERER', label: 'Caterer' },
  { value: 'DJ', label: 'DJ' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'FLORIST', label: 'Florist' },
  { value: 'DECORATOR', label: 'Decorator' },
  { value: 'BAKER', label: 'Baker' },
  { value: 'PLANNER', label: 'Planner' },
  { value: 'VENUE', label: 'Venue' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' },
]

const BADGE_OPTIONS = [
  { value: 'TOP_RATED', label: 'Top Rated' },
  { value: 'FAST_RESPONDER', label: 'Fast Responder' },
  { value: 'POPULAR', label: 'Popular' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PREMIUM', label: 'Premium' },
]

const PAGE_SIZE = 12

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [vendorType, setVendorType] = useState(searchParams.get('type') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') ?? '')
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true')
  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    searchParams.get('badges')?.split(',').filter(Boolean) ?? []
  )
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'rating')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))

  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const buildParams = useCallback(() => {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (vendorType) p.set('type', vendorType)
    if (city) p.set('city', city)
    if (minRating) p.set('min_rating', minRating)
    if (verifiedOnly) p.set('verified', 'true')
    if (selectedBadges.length > 0) p.set('badges', selectedBadges.join(','))
    if (sort) p.set('sort', sort)
    p.set('page', String(page))
    p.set('page_size', String(PAGE_SIZE))
    return p
  }, [query, vendorType, city, minRating, verifiedOnly, selectedBadges, sort, page])

  const fetchResults = useCallback(async () => {
    setLoading(true)
    const params = buildParams()
    router.replace(`/search?${params.toString()}`, { scroll: false })
    try {
      const res = await fetch(`/api/vendors/search?${params.toString()}`)
      if (res.ok) {
        setResults(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [buildParams, router])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  function handleFilterChange() {
    setPage(1)
  }

  function toggleBadge(badge: string) {
    setSelectedBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    )
    handleFilterChange()
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            className={`h-3.5 w-3.5 ${
              n <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-text-4'
            }`}
          />
        ))}
      </div>
    )
  }

  const totalPages = results ? Math.ceil(results.total / PAGE_SIZE) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-1">Find Vendors</h1>
        <p className="text-text-4 mt-1">Search and filter vendors for your events.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-4" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full rounded-xl border border-brand-border pl-10 pr-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              handleFilterChange()
            }}
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            filtersOpen
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-text-2 border-brand-border hover:bg-cream'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-4" />
              <h2 className="font-semibold text-text-1 text-sm">Filters</h2>
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              className="text-text-4 hover:text-text-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Vendor type */}
            <div>
              <label className="block text-xs font-medium text-text-4 mb-1">Vendor Type</label>
              <select
                value={vendorType}
                onChange={e => {
                  setVendorType(e.target.value)
                  handleFilterChange()
                }}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              >
                {VENDOR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-text-4 mb-1">City</label>
              <input
                type="text"
                placeholder="Any city"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                value={city}
                onChange={e => {
                  setCity(e.target.value)
                  handleFilterChange()
                }}
              />
            </div>

            {/* Min rating */}
            <div>
              <label className="block text-xs font-medium text-text-4 mb-1">Min Rating</label>
              <select
                value={minRating}
                onChange={e => {
                  setMinRating(e.target.value)
                  handleFilterChange()
                }}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="">Any</option>
                <option value="1">1+ stars</option>
                <option value="2">2+ stars</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-text-4 mb-1">Sort By</label>
              <select
                value={sort}
                onChange={e => {
                  setSort(e.target.value)
                  handleFilterChange()
                }}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verified toggle + badge checkboxes */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-2">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => {
                  setVerifiedOnly(e.target.checked)
                  handleFilterChange()
                }}
                className="rounded border-brand-border"
              />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified Only
            </label>

            <div className="h-5 w-px bg-cream-2" />

            {BADGE_OPTIONS.map(b => (
              <label key={b.value} className="flex items-center gap-2 text-sm text-text-2">
                <input
                  type="checkbox"
                  checked={selectedBadges.includes(b.value)}
                  onChange={() => toggleBadge(b.value)}
                  className="rounded border-brand-border"
                />
                {b.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-4" />
        </div>
      ) : !results || results.vendors.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Search className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No vendors found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-4 mb-4">
            {results.total} vendor{results.total !== 1 ? 's' : ''} found
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.vendors.map(vendor => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  {vendor.profile_photo_url ? (
                    <img
                      src={vendor.profile_photo_url}
                      alt={vendor.business_name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-brand" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-1 text-sm truncate">
                        {vendor.business_name}
                      </h3>
                      {vendor.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-4 mt-0.5">
                      {vendor.vendor_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-4 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.city}
                  </span>
                  <span className="flex items-center gap-1">
                    {renderStars(vendor.rating)}
                    <span className="ml-1 text-text-4">({vendor.review_count})</span>
                  </span>
                </div>

                <div className="mt-auto pt-2">
                  <BadgesList vendorId={vendor.id} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm text-text-2 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-text-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm text-text-2 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
