'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Star, MapPin, ChevronRight, RefreshCw, Sparkles, Plus, X, Zap, FileText,
  Leaf, Shield, ArrowUpDown, ExternalLink, Phone, Globe, UserPlus, CheckCircle2,
  Filter, Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type LocalBusiness = {
  place_id: string
  name: string
  address: string
  rating: number | null
  total_ratings: number
  phone: string | null
  website: string | null
  photo_url: string | null
  photo_urls: string[]
  maps_url: string
  description: string | null
  business_hours: Record<string, string> | null
  is_claimed: boolean
  external_vendor_id: string | null
  invited: boolean
  quote_requested: boolean
}

type Match = {
  id: string
  score: number
  rank: number
  distance_miles: number | null
  status: string
  vendor_type: string
  vendor: {
    id: string
    business_name: string
    city: string
    tier: string
    is_verified: boolean
    avg_rating: number | null
    profile_photo_url: string | null
    photos: { url: string }[]
    menu_packages: { name: string; price_per_head: number; currency: string; is_halal: boolean; is_vegetarian: boolean }[]
    description: string | null
  }
}

const ALL_SERVICE_TYPES = [
  { type: 'CATERER',           emoji: '🍽',  label: 'Catering' },
  { type: 'DECORATOR',         emoji: '🌸',  label: 'Decoration' },
  { type: 'PHOTOGRAPHER',      emoji: '📷',  label: 'Photography' },
  { type: 'VIDEOGRAPHER',      emoji: '🎬',  label: 'Videography' },
  { type: 'DJ',                emoji: '🎵',  label: 'DJ' },
  { type: 'FLORIST',           emoji: '💐',  label: 'Florist' },
  { type: 'MEHENDI_ARTIST',    emoji: '🌿',  label: 'Mehendi Artist' },
  { type: 'MAKEUP_HAIR',       emoji: '💄',  label: 'Makeup & Hair' },
  { type: 'DHOL_PLAYER',       emoji: '🥁',  label: 'Dhol Player' },
  { type: 'LIVE_BAND',         emoji: '🎸',  label: 'Live Band' },
  { type: 'CHOREOGRAPHER',     emoji: '💃',  label: 'Choreographer' },
  { type: 'PANDIT_OFFICIANT',  emoji: '🙏',  label: 'Pandit / Officiant' },
  { type: 'DESSERT_VENDOR',    emoji: '🎂',  label: 'Cake & Desserts' },
  { type: 'BARTENDER',         emoji: '🍹',  label: 'Bar & Bartender' },
  { type: 'CHAI_STATION',      emoji: '☕',  label: 'Chai / Coffee Station' },
  { type: 'LIGHTING',          emoji: '✨',  label: 'Lighting' },
  { type: 'MC_HOST',           emoji: '🎤',  label: 'MC / Host' },
  { type: 'TRANSPORT',         emoji: '🚗',  label: 'Transport' },
  { type: 'SECURITY',          emoji: '🛡️', label: 'Security' },
  { type: 'INVITATION_DESIGNER', emoji: '✉️', label: 'Invitations' },
]

const VENDOR_TYPE_EMOJIS: Record<string, string> = Object.fromEntries(
  ALL_SERVICE_TYPES.map(s => [s.type, s.emoji])
)
const VENDOR_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_SERVICE_TYPES.map(s => [s.type, s.label])
)

const AVAILABLE_TYPES = new Set([
  'CATERER', 'DECORATOR', 'PHOTOGRAPHER', 'DJ',
  'MEHENDI_ARTIST', 'MAKEUP_HAIR', 'FLORIST',
])

type SortOption = 'score' | 'price_asc' | 'price_desc'

export default function VendorDiscoveryPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [grouped, setGrouped] = useState<Record<string, Match[]>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showAddService, setShowAddService] = useState(false)
  const [addingType, setAddingType] = useState<string | null>(null)
  const [estimating, setEstimating] = useState<string | null>(null)
  const [estimatedMatchIds, setEstimatedMatchIds] = useState<Set<string>>(new Set())
  // Filters
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [vegOnly, setVegOnly] = useState(false)
  const [halalOnly, setHalalOnly] = useState(false)
  // Local businesses (Google Places)
  const [localBusinesses, setLocalBusinesses] = useState<LocalBusiness[]>([])
  const [localLoading, setLocalLoading] = useState(false)
  const [localSource, setLocalSource] = useState<string>('')
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const [requestingQuoteId, setRequestingQuoteId] = useState<string | null>(null)
  const [quoteRequestedIds, setQuoteRequestedIds] = useState<Set<string>>(new Set())
  const [expandedBizId, setExpandedBizId] = useState<string | null>(null)
  const [eventCity, setEventCity] = useState<string>('')
  // Confirmed event vendors
  const [eventVendors, setEventVendors] = useState<any[]>([])
  const [eventVendorTotal, setEventVendorTotal] = useState(0)

  useEffect(() => {
    fetch(`/api/events/${eventId}/vendors`)
      .then(r => r.ok ? r.json() : { vendors: [], total_spend: 0 })
      .then(data => {
        setEventVendors(data.vendors ?? [])
        setEventVendorTotal(data.total_spend ?? 0)
      })
    // Fetch event city for local businesses
    fetch(`/api/events/${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEventCity(data.metro_city ?? data.city ?? '') })
    loadMatches()
  }, [eventId])

  useEffect(() => {
    if (activeType && eventCity) loadLocalBusinesses(activeType)
  }, [activeType, eventCity])

  async function loadLocalBusinesses(vendorType: string) {
    setLocalLoading(true)
    const res = await fetch(`/api/local-vendors?city=${encodeURIComponent(eventCity)}&vendorType=${vendorType}&eventId=${eventId}`)
    if (res.ok) {
      const data = await res.json()
      setLocalBusinesses(data.businesses ?? [])
      setLocalSource(data.source ?? '')
      // Track already-invited and quote-requested
      const alreadyInvited = new Set<string>(
        (data.businesses ?? []).filter((b: LocalBusiness) => b.invited).map((b: LocalBusiness) => b.place_id)
      )
      setInvitedIds(alreadyInvited)
      const alreadyRequested = new Set<string>(
        (data.businesses ?? []).filter((b: LocalBusiness) => b.quote_requested).map((b: LocalBusiness) => b.place_id)
      )
      setQuoteRequestedIds(alreadyRequested)
    }
    setLocalLoading(false)
  }

  async function inviteBusiness(business: LocalBusiness) {
    setInvitingId(business.place_id)
    const res = await fetch('/api/local-vendors/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_id: business.place_id,
        business_name: business.name,
        address: business.address,
        phone: business.phone,
        website: business.website,
        rating: business.rating,
        vendor_type: activeType,
        city: eventCity,
        event_id: eventId,
      }),
    })
    if (res.ok) {
      setInvitedIds(prev => new Set([...prev, business.place_id]))
      setLocalBusinesses(prev => prev.map(b => b.place_id === business.place_id ? { ...b, invited: true } : b))
    }
    setInvitingId(null)
  }

  async function requestQuote(business: LocalBusiness) {
    setRequestingQuoteId(business.place_id)
    const res = await fetch('/api/local-vendors/request-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_id: business.place_id,
        business_name: business.name,
        phone: business.phone,
        email: null, // TODO: collect email from user if not available
        vendor_type: activeType,
        event_id: eventId,
      }),
    })
    if (res.ok || res.status === 409) {
      setQuoteRequestedIds(prev => new Set([...prev, business.place_id]))
      setLocalBusinesses(prev => prev.map(b =>
        b.place_id === business.place_id ? { ...b, quote_requested: true } : b
      ))
    }
    setRequestingQuoteId(null)
  }

  async function loadMatches(refresh = false) {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    const url = `/api/matches?eventId=${eventId}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const incoming = data.grouped ?? {}
      setGrouped(incoming)
      const types = Object.keys(incoming)
      if (types.length > 0) {
        setActiveType(prev => prev ?? types[0])
      } else {
        // No platform matches — default to CATERER so local businesses still load
        setActiveType(prev => prev ?? 'CATERER')
      }
    }

    if (refresh) setRefreshing(false)
    else setLoading(false)
  }

  async function requestAutoEstimate(matchId: string) {
    setEstimating(matchId)
    const res = await fetch(`/api/matches/${matchId}/auto-quote`, { method: 'POST' })
    if (res.ok) {
      setEstimatedMatchIds(prev => new Set([...prev, matchId]))
      await loadMatches(true)
    }
    setEstimating(null)
  }

  async function addService(vendorType: string) {
    setAddingType(vendorType)
    const res = await fetch('/api/event-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, vendor_type: vendorType }),
    })
    if (res.ok || res.status === 409) {
      setShowAddService(false)
      setActiveType(vendorType)
      await loadMatches(true)
    }
    setAddingType(null)
  }

  const vendorTypes = Object.keys(grouped)
  // "Add a service" shows types not already visible in the left panel
  const shownTypes = new Set([...vendorTypes, ...ALL_SERVICE_TYPES.filter(s => AVAILABLE_TYPES.has(s.type)).map(s => s.type)])
  const availableToAdd = ALL_SERVICE_TYPES.filter(
    s => !shownTypes.has(s.type) && AVAILABLE_TYPES.has(s.type)
  )

  const coverUrl = (vendor: Match['vendor']) =>
    vendor.photos[0]?.url ?? vendor.profile_photo_url ?? null

  const lowestPrice = (vendor: Match['vendor']) => {
    const pkgs = vendor.menu_packages
    if (!pkgs.length) return null
    const filtered = vegOnly ? pkgs.filter(p => p.is_vegetarian) : pkgs
    const hFiltered = halalOnly ? filtered.filter(p => p.is_halal) : filtered
    const source = hFiltered.length > 0 ? hFiltered : pkgs
    return Math.min(...source.map(p => Number(p.price_per_head)))
  }

  const fmtPrice = (n: number, vendor: Match['vendor']) => {
    const currency = vendor.menu_packages[0]?.currency ?? 'GBP'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  }

  function applyFiltersAndSort(matches: Match[]): Match[] {
    let list = [...matches]

    if (vegOnly) {
      list = list.filter(m => m.vendor.menu_packages.some(p => p.is_vegetarian))
    }
    if (halalOnly) {
      list = list.filter(m => m.vendor.menu_packages.some(p => p.is_halal))
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => {
        const pa = lowestPrice(a.vendor) ?? Infinity
        const pb = lowestPrice(b.vendor) ?? Infinity
        return pa - pb
      })
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => {
        const pa = lowestPrice(a.vendor) ?? 0
        const pb = lowestPrice(b.vendor) ?? 0
        return pb - pa
      })
    }
    // default 'score' keeps rank order from API

    return list
  }

  const activeMatches = applyFiltersAndSort(activeType ? (grouped[activeType] ?? []) : [])
  const hasActiveFilters = vegOnly || halalOnly || sortBy !== 'score'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-sm text-text-4 mb-4">
        <Link href="/dashboard" className="hover:text-brand">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-brand">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2">Vendor Matches</span>
      </div>

      {/* Confirmed vendors summary */}
      {eventVendors.length > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-xl border shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Confirmed Vendors ({eventVendors.length})
            </h2>
            <span className="text-sm font-semibold text-text-1">
              Total: ${eventVendorTotal.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {eventVendors.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                {ev.vendor.profile_photo_url ? (
                  <Image src={ev.vendor.profile_photo_url} alt="" width={36} height={36} className="rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-sm font-bold">
                    {ev.vendor.business_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-1 truncate">{ev.vendor.business_name}</div>
                  <div className="text-xs text-text-3">
                    {VENDOR_TYPE_LABELS[ev.vendor.vendor_type] ?? ev.vendor.vendor_type}
                    {ev.quote && ` · $${Number(ev.quote.total_estimate).toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-5 w-5 text-brand" />
            <h1 className="text-2xl sm:text-3xl font-black text-text-1">Your Vendor Matches</h1>
          </div>
          <p className="text-sm text-text-3">
            {loading ? 'Finding the best vendors for your event…' :
              vendorTypes.length === 0 ? 'Browse local vendors in your area.' :
              `Vendors across ${vendorTypes.length} categories matched for your event.`}
          </p>
        </div>
        <button
          onClick={() => loadMatches(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 text-sm text-text-3 hover:text-text-1 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-cream-2 rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left: vendor type list + add service */}
          <div className="w-52 flex-shrink-0 space-y-2">
            <div className="bg-white dark:bg-cream-2 rounded-xl border overflow-hidden">
              {(() => {
                // Show matched vendor types + available types (so local businesses are always browsable)
                const matchedTypes = vendorTypes
                const availableServiceTypes = ALL_SERVICE_TYPES
                  .filter(s => AVAILABLE_TYPES.has(s.type))
                  .map(s => s.type)
                // Merge: matched types first, then unmatched available types
                const allTypes = [...matchedTypes, ...availableServiceTypes.filter(t => !matchedTypes.includes(t))]
                return allTypes.map(type => {
                  const count = grouped[type]?.length ?? 0
                  const isActive = activeType === type
                  return (
                    <button
                      key={type}
                      onClick={() => { setActiveType(type); setShowAddService(false) }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors border-b last:border-0 ${
                        isActive
                          ? 'bg-cream text-brand font-medium'
                          : 'text-text-2 hover:bg-cream'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{VENDOR_TYPE_EMOJIS[type] ?? '🏢'}</span>
                        <span className="truncate">{VENDOR_TYPE_LABELS[type] ?? type}</span>
                      </span>
                      {count > 0 && (
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium flex-shrink-0 ml-1 ${
                          isActive ? 'bg-cream-2 text-brand' : 'bg-cream-2 text-text-3'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })
              })()}
            </div>

            {availableToAdd.length > 0 && (
              <button
                onClick={() => { setShowAddService(s => !s); setActiveType(null) }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm transition-colors ${
                  showAddService
                    ? 'border-brand bg-cream text-brand font-medium'
                    : 'border-brand-border text-text-3 hover:border-brand-border hover:text-brand'
                }`}
              >
                <Plus className="h-4 w-4" />
                Add a service
              </button>
            )}
          </div>

          {/* Right: vendor cards or add-service picker */}
          <div className="flex-1 min-w-0">
            {showAddService ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-text-1">Add a service</h2>
                  <button onClick={() => setShowAddService(false)} className="p-1 text-text-4 hover:text-text-3">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-text-3 mb-4">
                  Select a service to find matched vendors for your event.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableToAdd.map(({ type, emoji, label }) => (
                    <button
                      key={type}
                      onClick={() => addService(type)}
                      disabled={addingType === type}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-cream-2 rounded-xl border hover:border-brand hover:bg-cream transition-all text-left disabled:opacity-50"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-text-1">{label}</p>
                        {addingType === type && (
                          <p className="text-xs text-brand">Finding matches…</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {ALL_SERVICE_TYPES.filter(s => !vendorTypes.includes(s.type) && !AVAILABLE_TYPES.has(s.type)).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-text-4 mb-2">Coming soon</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SERVICE_TYPES
                        .filter(s => !vendorTypes.includes(s.type) && !AVAILABLE_TYPES.has(s.type))
                        .map(({ type, emoji, label }) => (
                          <span key={type} className="flex items-center gap-1.5 text-xs text-text-4 bg-cream border border-dashed border-brand-border px-3 py-1.5 rounded-full">
                            {emoji} {label}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : activeType ? (
              <>
                {/* Filter bar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <h2 className="text-base font-bold text-text-1 mr-1">
                    {VENDOR_TYPE_EMOJIS[activeType]} {VENDOR_TYPE_LABELS[activeType] ?? activeType}
                  </h2>
                  <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                    {/* Sort */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortOption)}
                        className="text-xs pl-7 pr-6 py-1.5 rounded-xl border border-brand-border bg-white dark:bg-cream-2 text-text-2 appearance-none cursor-pointer hover:border-brand-border focus:outline-none focus:border-brand"
                      >
                        <option value="score">Best Match</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </select>
                      <ArrowUpDown className="h-3 w-3 text-text-4 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {/* Veg filter */}
                    <button
                      onClick={() => setVegOnly(v => !v)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                        vegOnly ? 'border-green-400 bg-green-50 text-green-700 font-medium' : 'border-brand-border text-text-3 hover:border-green-300'
                      }`}
                    >
                      <Leaf className="h-3 w-3" /> Veg
                    </button>
                    {/* Halal filter */}
                    <button
                      onClick={() => setHalalOnly(h => !h)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                        halalOnly ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium' : 'border-brand-border text-text-3 hover:border-emerald-300'
                      }`}
                    >
                      Halal
                    </button>
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setSortBy('score'); setVegOnly(false); setHalalOnly(false) }}
                        className="text-xs text-text-4 hover:text-text-3 flex items-center gap-0.5"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {activeMatches.length === 0 ? (
                  <div className="bg-white dark:bg-cream-2 rounded-xl border p-8 text-center">
                    {hasActiveFilters ? (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center mx-auto mb-3">
                          <Filter className="h-5 w-5 text-text-4/40" />
                        </div>
                        <p className="text-sm text-text-3">No vendors match your current filters.</p>
                        <button
                          onClick={() => { setSortBy('score'); setVegOnly(false); setHalalOnly(false) }}
                          className="mt-3 text-sm text-brand font-medium hover:underline"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center mx-auto mb-3">
                          <Users className="h-5 w-5 text-text-4/40" />
                        </div>
                        <p className="text-sm text-text-3 mb-1">No platform matches yet for this service.</p>
                        <p className="text-xs text-text-4 mb-3">Check the local businesses section below, or try refreshing.</p>
                        <button onClick={() => loadMatches(true)} className="text-sm text-brand font-medium hover:underline">
                          Refresh matches
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMatches.map(match => {
                      const price = lowestPrice(match.vendor)
                      const isQuoted = match.status === 'QUOTED'
                      const hasVeg = match.vendor.menu_packages.some(p => p.is_vegetarian)
                      const hasHalal = match.vendor.menu_packages.some(p => p.is_halal)

                      return (
                        <div key={match.id} className="bg-white dark:bg-cream-2 rounded-xl border hover:shadow-md transition-all overflow-hidden group">
                          <div className="flex gap-4 p-4">
                            {/* Photo */}
                            <Link
                              href={`/events/${eventId}/vendors/${match.vendor.id}?matchId=${match.id}`}
                              className="w-28 h-24 rounded-xl overflow-hidden bg-cream-2 flex-shrink-0 block relative"
                            >
                              {coverUrl(match.vendor) ? (
                                <Image
                                  src={coverUrl(match.vendor)!}
                                  alt={match.vendor.business_name}
                                  width={112} height={96}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl bg-cream">
                                  {VENDOR_TYPE_EMOJIS[activeType] ?? '🏢'}
                                </div>
                              )}
                              {/* Verification badge overlay */}
                              {match.vendor.is_verified && (
                                <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                                  <Shield className="h-3 w-3 text-blue-500" />
                                </div>
                              )}
                            </Link>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                      href={`/events/${eventId}/vendors/${match.vendor.id}?matchId=${match.id}`}
                                      className="font-black text-text-1 hover:text-brand transition-colors"
                                    >
                                      {match.vendor.business_name}
                                    </Link>
                                    {match.vendor.tier !== 'FREE' && (
                                      <Badge className="bg-brand text-white text-xs">{match.vendor.tier}</Badge>
                                    )}
                                    {match.rank === 1 && (
                                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-0.5">
                                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Top Match
                                      </span>
                                    )}
                                  </div>

                                  {/* Rating + Location row */}
                                  <div className="flex items-center gap-3 text-xs text-text-3 mt-1 flex-wrap">
                                    {match.vendor.avg_rating && (
                                      <span className="flex items-center gap-0.5 font-medium">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {match.vendor.avg_rating.toFixed(1)}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />{match.vendor.city}
                                      {match.distance_miles !== null && (
                                        <span className="text-text-4">
                                          ({match.distance_miles < 10
                                            ? '< 10 mi'
                                            : `${Math.round(match.distance_miles)} mi`})
                                        </span>
                                      )}
                                    </span>
                                    {hasVeg && (
                                      <span className="flex items-center gap-0.5 text-green-600">
                                        <Leaf className="h-3 w-3" /> Veg
                                      </span>
                                    )}
                                    {hasHalal && (
                                      <span className="text-green-700 font-medium">Halal</span>
                                    )}
                                  </div>
                                </div>

                                {/* Price + score */}
                                <div className="text-right flex-shrink-0">
                                  {price !== null ? (
                                    <>
                                      <div className="text-lg font-black text-brand">
                                        {fmtPrice(price, match.vendor)}
                                      </div>
                                      <div className="text-[10px] text-text-4 font-medium">per head</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-xl font-bold text-brand">{match.score}</div>
                                      <div className="text-[10px] text-text-4">match score</div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {match.vendor.description && (
                                <p className="text-xs text-text-3 mt-1.5 line-clamp-1">{match.vendor.description}</p>
                              )}

                              {/* Package pills + starting price */}
                              {match.vendor.menu_packages.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                  {match.vendor.menu_packages.slice(0, 3).map((pkg, i) => (
                                    <span key={i} className="text-[10px] bg-cream-2 text-text-3 px-2 py-0.5 rounded-full border border-brand-border/50">
                                      {pkg.name} &mdash; {fmtPrice(Number(pkg.price_per_head), match.vendor)}/head
                                    </span>
                                  ))}
                                  {match.vendor.menu_packages.length > 3 && (
                                    <span className="text-[10px] text-text-4 px-1.5 py-0.5">
                                      +{match.vendor.menu_packages.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action bar */}
                          <div className="flex items-center gap-2 px-4 py-2.5 border-t bg-cream flex-wrap">
                            <Link
                              href={`/events/${eventId}/vendors/${match.vendor.id}?matchId=${match.id}`}
                              className="text-xs text-brand font-medium hover:underline mr-auto"
                            >
                              View full profile
                            </Link>
                            {isQuoted ? (
                              <Link
                                href={`/events/${eventId}/quotes`}
                                className={cn(buttonVariants({ size: 'sm' }), 'bg-green-600 hover:bg-green-700 text-xs')}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> View Quote
                              </Link>
                            ) : (
                              <>
                                <Link
                                  href={`/quotes/new?matchId=${match.id}`}
                                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'text-xs')}
                                >
                                  Request Quote
                                </Link>
                                <button
                                  onClick={() => requestAutoEstimate(match.id)}
                                  disabled={estimating === match.id}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  {estimating === match.id ? 'Estimating...' : 'AI Estimate'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Local businesses section */}
                {eventCity && (
                  <div className="mt-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-black text-text-1">
                        Local Businesses near {eventCity}
                      </h3>
                      <p className="text-sm text-text-3 mt-0.5">
                        Not on OneSeva yet — request a quote or invite them to join
                      </p>
                    </div>

                    {localLoading ? (
                      <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-20 bg-white dark:bg-cream-2 rounded-xl border animate-pulse" />)}
                      </div>
                    ) : localBusinesses.length === 0 ? (
                      <p className="text-sm text-text-4 py-4">
                        No local businesses found for this category in {eventCity}.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {localBusinesses.map(biz => {
                          const isInvited = invitedIds.has(biz.place_id) || biz.invited
                          const isQuoteRequested = quoteRequestedIds.has(biz.place_id) || biz.quote_requested
                          const isExpanded = expandedBizId === biz.place_id
                          const hasPhotos = biz.photo_urls.length > 0
                          const hasDetails = biz.description || biz.business_hours || hasPhotos

                          return (
                            <div key={biz.place_id} className="bg-white dark:bg-cream-2 rounded-xl border overflow-hidden">
                              <div className="flex gap-4 p-4">
                                {/* Photo */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                                  {(biz.photo_urls[0] || biz.photo_url) ? (
                                    <img
                                      src={biz.photo_urls[0] || biz.photo_url!}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full flex items-center justify-center text-xl bg-cream text-text-4 ${(biz.photo_urls[0] || biz.photo_url) ? 'hidden' : ''}`}>
                                    {VENDOR_TYPE_EMOJIS[activeType] ?? '🏢'}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-text-1 truncate">{biz.name}</span>
                                    {biz.rating != null && (
                                      <span className="flex items-center gap-0.5 text-xs text-text-3">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {biz.rating}
                                        {biz.total_ratings > 0 && <span className="text-text-4">({biz.total_ratings})</span>}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-4 mt-0.5 truncate">
                                    {biz.address}
                                  </p>
                                  {biz.description && (
                                    <p className="text-xs text-text-3 mt-1 line-clamp-1">{biz.description}</p>
                                  )}
                                </div>

                                {/* Quick links */}
                                <div className="flex items-start gap-1.5 flex-shrink-0">
                                  <a href={biz.maps_url} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-text-4 hover:text-brand transition-colors"
                                    title="Google Maps"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                  {biz.phone && (
                                    <a href={`tel:${biz.phone}`}
                                      className="p-1.5 rounded-lg text-text-4 hover:text-green-600 transition-colors"
                                      title={biz.phone}
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {biz.website && (
                                    <a href={biz.website} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg text-text-4 hover:text-blue-600 transition-colors"
                                      title="Website"
                                    >
                                      <Globe className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Expanded detail panel */}
                              {isExpanded && hasDetails && (
                                <div className="px-4 pb-3 border-t">
                                  {hasPhotos && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                      {biz.photo_urls.slice(0, 5).map((url, i) => (
                                        <img key={i} src={url} alt=""
                                          className="w-24 h-20 rounded-lg object-cover flex-shrink-0 border"
                                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {biz.business_hours && (
                                    <div className="mt-3">
                                      <p className="text-xs font-medium text-text-2 mb-1">Business Hours</p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {Object.entries(biz.business_hours).map(([day, hours]) => (
                                          <div key={day} className="flex justify-between text-xs">
                                            <span className="text-text-3 capitalize">{day}</span>
                                            <span className="text-text-2">{hours}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 px-4 py-2.5 border-t">
                                {hasDetails ? (
                                  <button
                                    onClick={() => setExpandedBizId(isExpanded ? null : biz.place_id)}
                                    className="text-xs text-text-4 hover:text-text-2 mr-auto"
                                  >
                                    {isExpanded ? 'Hide details' : 'More details'}
                                  </button>
                                ) : (
                                  <div className="mr-auto" />
                                )}

                                <button
                                  onClick={() => !isInvited && inviteBusiness(biz)}
                                  disabled={isInvited || invitingId === biz.place_id}
                                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                                    isInvited
                                      ? 'bg-green-50 border-green-200 text-green-600 cursor-default'
                                      : invitingId === biz.place_id
                                      ? 'opacity-50 cursor-wait border-brand-border text-text-4'
                                      : 'border-brand-border text-text-3 hover:border-brand hover:text-brand'
                                  }`}
                                >
                                  {isInvited ? (
                                    <><CheckCircle2 className="h-3 w-3" /> Invited</>
                                  ) : (
                                    <><UserPlus className="h-3 w-3" /> Invite</>
                                  )}
                                </button>

                                <button
                                  onClick={() => !isQuoteRequested && requestQuote(biz)}
                                  disabled={isQuoteRequested || requestingQuoteId === biz.place_id}
                                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                    isQuoteRequested
                                      ? 'bg-green-50 border border-green-200 text-green-600 cursor-default'
                                      : requestingQuoteId === biz.place_id
                                      ? 'opacity-50 cursor-wait bg-brand text-white'
                                      : 'bg-brand text-white hover:bg-brand/90'
                                  }`}
                                >
                                  {isQuoteRequested ? (
                                    <><CheckCircle2 className="h-3 w-3" /> Quote Requested</>
                                  ) : requestingQuoteId === biz.place_id ? (
                                    'Sending...'
                                  ) : (
                                    <><FileText className="h-3 w-3" /> Request Quote</>
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-cream-2 rounded-xl border p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-brand/50" />
                </div>
                <h3 className="font-bold text-text-1 mb-1">Select a category</h3>
                <p className="text-sm text-text-4 max-w-xs mx-auto">
                  Choose a service type from the left panel to browse matched vendors and local businesses for your event.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
