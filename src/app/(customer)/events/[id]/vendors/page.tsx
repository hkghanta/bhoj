'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Star, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Match = {
  id: string
  score: number
  rank: number
  status: string
  vendor: {
    id: string
    business_name: string
    city: string
    tier: string
    is_verified: boolean
    avg_rating: number | null
    profile_photo_url: string | null
    photos: { url: string }[]
    menu_packages: { name: string; price_per_head: number; currency: string }[]
    description: string | null
  }
}

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Caterer',
  DECORATOR: 'Decorator',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  DJ: 'DJ',
  FLORIST: 'Florist',
  MEHENDI_ARTIST: 'Mehendi Artist',
  MAKEUP_HAIR: 'Makeup & Hair',
  DHOL_PLAYER: 'Dhol Player',
  LIVE_BAND: 'Live Band',
}

export default function VendorDiscoveryPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [vendorType, setVendorType] = useState<string>('CATERER')
  const [matches, setMatches] = useState<Match[]>([])
  const [eventRequestId, setEventRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  async function requestMatches() {
    setLoading(true)
    setRequested(false)
    setMatches([])

    const res = await fetch('/api/event-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, vendor_type: vendorType }),
    })

    if (!res.ok) {
      const err = await res.json()
      // If already exists, fetch existing matches
      if (res.status === 409 && err.existingId) {
        setEventRequestId(err.existingId)
        await pollMatches(err.existingId)
        return
      }
      setLoading(false)
      return
    }

    const data = await res.json()
    setEventRequestId(data.id)
    setRequested(true)
    await pollMatches(data.id)
  }

  async function pollMatches(reqId: string) {
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const res = await fetch(`/api/matches?eventRequestId=${reqId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setMatches(data)
          setLoading(false)
          return
        }
      }
    }
    setLoading(false)
  }

  const coverUrl = (vendor: Match['vendor']) =>
    vendor.photos[0]?.url ?? vendor.profile_photo_url ?? null

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
          <span>/</span>
          <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
          <span>/</span>
          <span>Find Vendors</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Find Vendors</h1>
        <p className="text-gray-500 mt-1">We'll match you with the best vendors for your event.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Select value={vendorType} onValueChange={(v: string | null) => setVendorType(v ?? 'CATERER')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VENDOR_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={requestMatches}
          disabled={loading}
          className={cn(buttonVariants(), 'bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
        >
          {loading ? 'Finding matches…' : 'Find Matches'}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Showing top {matches.length} matched vendors</p>
          {matches.map(match => (
            <div key={match.id} className="bg-white rounded-xl border p-5 flex gap-5">
              <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {coverUrl(match.vendor) && (
                  <Image
                    src={coverUrl(match.vendor)!}
                    alt={match.vendor.business_name}
                    width={128} height={96}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{match.vendor.business_name}</h3>
                      {match.vendor.tier !== 'FREE' && (
                        <Badge className="bg-orange-600 text-white text-xs">{match.vendor.tier}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {match.vendor.city}
                      </span>
                      {match.vendor.avg_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {match.vendor.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{match.score}</div>
                    <div className="text-xs text-gray-400">match score</div>
                    <div className="text-xs text-gray-400">#{match.rank} match</div>
                  </div>
                </div>

                {match.vendor.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{match.vendor.description}</p>
                )}

                {match.vendor.menu_packages.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {match.vendor.menu_packages.slice(0, 3).map((pkg, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {pkg.name} — £{Number(pkg.price_per_head).toFixed(0)}/head
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/vendors/${match.vendor.id}`}
                    target="_blank"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    View Profile
                  </Link>
                  <Link
                    href={`/quotes/new?matchId=${match.id}`}
                    className={cn(buttonVariants({ size: 'sm' }), 'bg-orange-600 hover:bg-orange-700')}
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {requested && matches.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No matches found yet. Check back in a moment, or try a different vendor type.</p>
        </div>
      )}
    </div>
  )
}
