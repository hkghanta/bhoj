'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Star, ChevronRight, ChevronLeft, CheckCircle2,
  MessageSquare, Zap, ArrowLeftRight, Globe,
  Shield, Users, Leaf, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MenuCategory } from '@prisma/client'

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Mains',
  BREAD: 'Breads', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counters',
}

type VendorDetail = {
  id: string
  business_name: string
  vendor_type: string
  description: string | null
  city: string
  country: string
  website: string | null
  instagram: string | null
  phone_business: string | null
  tier: string
  is_verified: boolean
  is_halal: boolean
  avg_rating: number | null
  review_count: number
  photos: { id: string; url: string; is_cover: boolean; caption: string | null }[]
  menu_packages: { id: string; name: string; price_per_head: number; currency: string; min_guests: number | null; max_guests: number | null; is_halal: boolean; is_vegetarian: boolean; description: string | null }[]
  menu_items: { id: string; name: string; category: MenuCategory; is_optional?: boolean }[]
  reviews: { id: string; overall_rating: number; body: string | null; created_at: string; customer: { name: string | null } }[]
  services: { id: string; service_type: string; base_price: number | null; currency: string }[]
  match: { id: string; score: number; rank: number; status: string } | null
}

export default function VendorProfilePage() {
  const { id: eventId, vendorId } = useParams<{ id: string; vendorId: string }>()
  const searchParams = useSearchParams()
  const matchId = searchParams.get('matchId')
  const router = useRouter()

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'reviews'>('overview')
  const [estimating, setEstimating] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [estimated, setEstimated] = useState(false)

  useEffect(() => {
    const url = matchId
      ? `/api/vendors/${vendorId}?matchId=${matchId}&eventId=${eventId}`
      : `/api/vendors/${vendorId}?eventId=${eventId}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setVendor(data); setLoading(false) })
  }, [vendorId, matchId, eventId])

  async function openOrCreateConversation(mId: string): Promise<string | null> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: mId }),
    })
    if (res.ok) return (await res.json()).id
    const list = await (await fetch('/api/conversations')).json()
    return list.find((c: any) => c.match_id === mId)?.id ?? null
  }

  async function handleMessage() {
    if (!vendor?.match) return
    setMessaging(true)
    const convId = await openOrCreateConversation(vendor.match.id)
    if (convId) router.push(`/messages/${convId}`)
    setMessaging(false)
  }

  async function handleEstimate() {
    if (!vendor?.match) return
    setEstimating(true)
    const res = await fetch(`/api/matches/${vendor.match.id}/auto-quote`, { method: 'POST' })
    if (res.ok) {
      setEstimated(true)
      router.push(`/events/${eventId}/quotes`)
    }
    setEstimating(false)
  }

  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="h-64 bg-white dark:bg-cream-2 rounded-2xl border animate-pulse mb-4" />
        <div className="h-32 bg-white dark:bg-cream-2 rounded-2xl border animate-pulse" />
      </div>
    )
  }
  if (!vendor) return <div className="p-8 text-text-4">Vendor not found.</div>

  const photos = vendor.photos.length > 0 ? vendor.photos : []
  const currentPhoto = photos[photoIdx]
  const lowestPkg = vendor.menu_packages[0]
  const hasMatch = !!vendor.match
  const isQuoted = vendor.match?.status === 'QUOTED'

  // Group menu items by category
  const menuByCategory: Record<string, typeof vendor.menu_items> = {}
  for (const item of vendor.menu_items ?? []) {
    if (!menuByCategory[item.category]) menuByCategory[item.category] = []
    menuByCategory[item.category].push(item)
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4 mb-4">
        <Link href="/dashboard" className="hover:text-brand">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-brand">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}/vendors`} className="hover:text-brand">Vendors</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2 truncate max-w-[200px]">{vendor.business_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">

          {/* Photo gallery */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border overflow-hidden">
            {photos.length > 0 ? (
              <div className="relative">
                <div className="aspect-video w-full overflow-hidden bg-cream-2">
                  <Image
                    src={currentPhoto.url}
                    alt={currentPhoto.caption ?? vendor.business_name}
                    width={800} height={450}
                    className="w-full h-full object-cover"
                  />
                </div>
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-cream-2/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-text-2" />
                    </button>
                    <button
                      onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-cream-2/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-text-2" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? 'bg-white dark:bg-cream-2' : 'bg-white/50 dark:bg-cream-2/50'}`}
                        />
                      ))}
                    </div>
                    <div className="absolute bottom-3 right-3 text-xs text-white bg-black/40 rounded-full px-2 py-0.5">
                      {photoIdx + 1}/{photos.length}
                    </div>
                  </>
                )}
                {/* Thumbnail strip */}
                {photos.length > 1 && (
                  <div className="flex gap-1.5 p-3 bg-cream overflow-x-auto">
                    {photos.slice(0, 8).map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => setPhotoIdx(i)}
                        className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${i === photoIdx ? 'border-brand' : 'border-transparent'}`}
                      >
                        <Image src={p.url} alt="" width={56} height={40} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center">
                <span className="text-6xl">🍽</span>
              </div>
            )}

            {/* Vendor header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl font-black text-text-1">{vendor.business_name}</h1>
                    {vendor.is_verified && (
                      <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {vendor.tier !== 'FREE' && (
                      <Badge className="bg-brand text-white text-xs">{vendor.tier}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.city}</span>
                    {vendor.avg_rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {vendor.avg_rating.toFixed(1)}
                        <span className="text-text-4">({vendor.review_count})</span>
                      </span>
                    )}
                    {vendor.is_halal && (
                      <span className="flex items-center gap-1 text-green-700"><Leaf className="h-3 w-3" /> Halal certified</span>
                    )}
                  </div>
                </div>
                {hasMatch && vendor.match && (
                  <div className="flex-shrink-0 text-center bg-cream rounded-xl px-4 py-2.5 border border-brand-border">
                    <div className="text-2xl font-black text-brand">{vendor.match.score}</div>
                    <div className="text-xs text-text-3">match score</div>
                    {vendor.match.rank === 1 && (
                      <div className="text-xs text-amber-700 font-semibold mt-0.5">⭐ #1 match</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border overflow-hidden">
            <div className="flex border-b">
              {(['overview', 'menu', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-brand border-b-2 border-brand -mb-px'
                      : 'text-text-3 hover:text-text-2'
                  }`}
                >
                  {tab === 'reviews' ? `Reviews${vendor.review_count > 0 ? ` (${vendor.review_count})` : ''}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {vendor.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-2 mb-2">About</h3>
                      <p className="text-sm text-text-3 leading-relaxed">{vendor.description}</p>
                    </div>
                  )}
                  {/* Contact */}
                  <div className="flex flex-wrap gap-3">
                    {vendor.website && (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-text-3 hover:text-brand">
                        <Globe className="h-4 w-4" /> Website
                      </a>
                    )}
                    {vendor.instagram && (
                      <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-text-3 hover:text-brand">
                        <ExternalLink className="h-4 w-4" /> @{vendor.instagram.replace('@', '')}
                      </a>
                    )}
                  </div>
                  {/* Package summary */}
                  {vendor.menu_packages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-2 mb-2">Packages</h3>
                      <div className="space-y-2">
                        {vendor.menu_packages.map(pkg => (
                          <div key={pkg.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-1">{pkg.name}</span>
                                {pkg.is_halal && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">Halal</span>}
                                {pkg.is_vegetarian && <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"><Leaf className="h-3 w-3" />Veg</span>}
                              </div>
                              {pkg.description && <p className="text-xs text-text-3 mt-0.5">{pkg.description}</p>}
                              {(pkg.min_guests || pkg.max_guests) && (
                                <p className="text-xs text-text-4 mt-0.5 flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {pkg.min_guests && `Min ${pkg.min_guests}`}{pkg.min_guests && pkg.max_guests && ' · '}{pkg.max_guests && `Max ${pkg.max_guests}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-brand">
                                {fmt(Number(pkg.price_per_head), pkg.currency)}
                              </div>
                              <div className="text-xs text-text-4">per head</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'menu' && (
                <div>
                  {Object.keys(menuByCategory).length === 0 ? (
                    <div className="text-center py-8 text-text-4">
                      <p className="text-sm">Menu details not available yet.</p>
                      <p className="text-xs mt-1">Message the vendor directly to ask about their menu.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                      {Object.entries(menuByCategory).map(([cat, items]) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-1.5">
                            {CATEGORY_LABELS[cat] ?? cat}
                          </p>
                          <ul className="space-y-0.5">
                            {items.map((item, i) => (
                              <li key={i} className="text-xs text-text-2 flex items-start gap-1">
                                <span className="text-text-4 mt-0.5">·</span>
                                {item.name}
                                {item.is_optional && <span className="text-text-4 ml-0.5">(opt)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {vendor.reviews.length === 0 ? (
                    <div className="text-center py-8 text-text-4">
                      <Star className="h-8 w-8 mx-auto mb-2 text-text-4" />
                      <p className="text-sm">No reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="text-4xl font-black text-text-1">{vendor.avg_rating?.toFixed(1)}</div>
                        <div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`h-4 w-4 ${s <= Math.round(vendor.avg_rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-text-4'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-text-3 mt-0.5">{vendor.review_count} review{vendor.review_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {vendor.reviews.map(review => (
                        <div key={review.id} className="pb-4 border-b last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-cream-2 flex items-center justify-center text-xs font-bold text-brand">
                                {review.customer.name?.[0] ?? '?'}
                              </div>
                              <span className="text-sm font-medium text-text-1">{review.customer.name ?? 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`h-3 w-3 ${s <= review.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-text-4'}`} />
                              ))}
                            </div>
                          </div>
                          {review.body && <p className="text-sm text-text-3 ml-9">{review.body}</p>}
                          <p className="text-xs text-text-4 ml-9 mt-1">{new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA sidebar */}
        <div className="space-y-4">
          {/* Pricing card */}
          {lowestPkg && (
            <div className="bg-white dark:bg-cream-2 rounded-2xl border p-5">
              <p className="text-xs text-text-4 uppercase tracking-wide font-medium mb-1">Starting from</p>
              <div className="text-3xl font-black text-brand mb-0.5">
                {fmt(Number(lowestPkg.price_per_head), lowestPkg.currency)}
              </div>
              <p className="text-sm text-text-3">per person · {lowestPkg.name}</p>
              {lowestPkg.min_guests && (
                <p className="text-xs text-text-4 mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Minimum {lowestPkg.min_guests} guests
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {hasMatch && (
            <div className="bg-white dark:bg-cream-2 rounded-2xl border p-5 space-y-2.5">
              <h3 className="text-sm font-semibold text-text-2">Get in touch</h3>

              {isQuoted ? (
                <Link href={`/events/${eventId}/quotes`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                    <CheckCircle2 className="h-4 w-4" /> View Quote
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full bg-brand hover:bg-brand-hover gap-2"
                  onClick={handleEstimate}
                  disabled={estimating}
                >
                  <Zap className="h-4 w-4" />
                  {estimating ? 'Generating…' : 'Get AI Estimate'}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleMessage}
                disabled={messaging}
              >
                <MessageSquare className="h-4 w-4" />
                {messaging ? 'Opening…' : 'Message Vendor'}
              </Button>

              {!isQuoted && (
                <Link href={`/quotes/new?matchId=${vendor.match!.id}`} className="block">
                  <Button variant="outline" className="w-full gap-2 text-amber-700 border-amber-200 hover:bg-amber-50">
                    <ArrowLeftRight className="h-4 w-4" />
                    Request Custom Quote
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Trust signals */}
          <div className="bg-cream rounded-2xl border border-brand-border p-5 space-y-2.5">
            {vendor.is_verified && (
              <div className="flex items-center gap-2 text-sm text-text-2">
                <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>Verified business</span>
              </div>
            )}
            {vendor.is_halal && (
              <div className="flex items-center gap-2 text-sm text-text-2">
                <Leaf className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Halal certified</span>
              </div>
            )}
            {vendor.menu_packages.some(p => p.is_vegetarian) && (
              <div className="flex items-center gap-2 text-sm text-text-2">
                <Leaf className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Vegetarian menu available</span>
              </div>
            )}
            {vendor.menu_packages.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-text-2">
                <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
                <span>{vendor.menu_packages.length} package{vendor.menu_packages.length !== 1 ? 's' : ''} available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
