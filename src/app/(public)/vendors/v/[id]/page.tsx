import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Star, CheckCircle2, MapPin, Globe, ExternalLink, ChevronRight, Utensils, Users, Package } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface MenuPackage {
  id: string
  name: string
  description: string | null
  price_per_head: number
  currency: string
  min_guests: number | null
  max_guests: number | null
  is_halal: boolean
  is_jain: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  nut_free: boolean
  gluten_free: boolean
  dairy_free: boolean
  includes_service: boolean
  includes_setup: boolean
  cuisine_type: string | null
}

interface Review {
  id: string
  overall_rating: number
  food_quality_rating: number | null
  service_rating: number | null
  value_rating: number | null
  title: string | null
  body: string | null
  event_type: string | null
  created_at: string
  customer: { name: string | null }
}

interface VendorPhoto {
  id: string
  url: string
  caption: string | null
  is_cover: boolean
}

interface VendorBadge {
  badge_type: string
  earned_at: string
}

interface VendorStation {
  id: string
  station_template: { name: string; icon: string | null }
  pricing_model: string
  base_price: number | null
  price_per_person: number | null
  hourly_rate: number | null
}

interface Vendor {
  id: string
  business_name: string
  city: string
  country: string
  vendor_type: string
  profile_type: string
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  description: string | null
  website: string | null
  instagram: string | null
  is_verified: boolean
  avg_rating: number | null
  review_count: number
  photos: VendorPhoto[]
  menu_packages: MenuPackage[]
  reviews: Review[]
  badges: VendorBadge[]
  sustainability_tags: string[]
  stations: VendorStation[]
}

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Caterer',
  DESSERT_VENDOR: 'Dessert Vendor',
  BARTENDER: 'Bartender',
  CHAI_STATION: 'Chai Station',
  FOOD_TRUCK: 'Food Truck',
  DECORATOR: 'Decorator',
  FLORIST: 'Florist',
  TENT_MARQUEE: 'Tent & Marquee',
  LIGHTING: 'Lighting',
  FURNITURE_RENTAL: 'Furniture Rental',
  EQUIPMENT_RENTAL: 'Equipment Rental',
  DJ: 'DJ',
  LIVE_BAND: 'Live Band',
  DHOL_PLAYER: 'Dhol Player',
  CLASSICAL_MUSICIAN: 'Classical Musician',
  GAMES_ENTERTAINMENT: 'Games & Entertainment',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  MEHENDI_ARTIST: 'Mehendi Artist',
  MAKEUP_HAIR: 'Makeup & Hair',
  CHOREOGRAPHER: 'Choreographer',
  PANDIT_OFFICIANT: 'Pandit / Officiant',
  INVITATION_DESIGNER: 'Invitation Designer',
  TRANSPORT: 'Transport',
  SECURITY: 'Security',
  MC_HOST: 'MC / Host',
}

async function fetchVendor(id: string): Promise<Vendor | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/vendors/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const vendor = await fetchVendor(id)
  if (!vendor) return { title: 'Vendor Not Found' }

  const name = vendor.business_name
  const city = vendor.city
  const type = VENDOR_TYPE_LABELS[vendor.vendor_type] ?? vendor.vendor_type

  return {
    title: `${name} — ${type} in ${city} | OneSeva`,
    description: vendor.description?.slice(0, 160) ?? `${name} is a ${type} based in ${city}. View packages, reviews, and request a quote on OneSeva.`,
    openGraph: {
      title: `${name} | OneSeva`,
      description: vendor.description?.slice(0, 160) ?? `${type} in ${city}`,
      images: vendor.profile_photo_url ? [{ url: vendor.profile_photo_url }] : [],
    },
  }
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizes[size]} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border fill-brand-border'}`}
        />
      ))}
    </div>
  )
}

function DietaryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  )
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  TOP_RATED: { label: 'Top Rated', color: 'bg-amber-500/30 text-amber-200', icon: '⭐' },
  FAST_RESPONDER: { label: 'Fast Responder', color: 'bg-blue-500/30 text-blue-200', icon: '⚡' },
  POPULAR: { label: 'Popular', color: 'bg-pink-500/30 text-pink-200', icon: '🔥' },
  NEW_VENDOR: { label: 'New', color: 'bg-green-500/30 text-green-200', icon: '✨' },
  VERIFIED: { label: 'Verified', color: 'bg-blue-500/30 text-blue-200', icon: '✓' },
  PREMIUM: { label: 'Premium', color: 'bg-purple-500/30 text-purple-200', icon: '💎' },
}

const SUSTAINABILITY_LABELS: Record<string, { label: string; icon: string }> = {
  compostable: { label: 'Compostable packaging', icon: '♻️' },
  locally_sourced: { label: 'Locally sourced ingredients', icon: '📍' },
  organic: { label: 'Organic certified', icon: '🌿' },
  zero_waste: { label: 'Zero waste commitment', icon: '🗑️' },
  farm_to_table: { label: 'Farm to table', icon: '🌾' },
  eco_packaging: { label: 'Eco-friendly packaging', icon: '📦' },
  energy_efficient: { label: 'Energy efficient operations', icon: '⚡' },
  carbon_neutral: { label: 'Carbon neutral', icon: '🌍' },
}

function getDisplayName(vendor: Vendor): string {
  if (vendor.profile_type === 'INDIVIDUAL' && vendor.first_name) {
    return [vendor.first_name, vendor.last_name].filter(Boolean).join(' ')
  }
  return vendor.business_name
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vendor = await fetchVendor(id)
  if (!vendor) notFound()

  const displayName = getDisplayName(vendor)
  const serviceLabel = VENDOR_TYPE_LABELS[vendor.vendor_type] ?? vendor.vendor_type
  const coverPhoto = vendor.photos.find(p => p.is_cover) ?? vendor.photos[0]

  // JSON-LD structured data for rich search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: displayName,
    description: vendor.description ?? `${serviceLabel} in ${vendor.city}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.city,
      addressCountry: vendor.country,
    },
    ...(vendor.profile_photo_url ? { image: vendor.profile_photo_url } : {}),
    ...(vendor.website ? { url: vendor.website } : {}),
    ...(vendor.avg_rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: vendor.avg_rating.toFixed(1),
        reviewCount: vendor.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    ...(vendor.menu_packages.length > 0 ? {
      priceRange: `From ${formatPrice(Number(vendor.menu_packages[0].price_per_head), vendor.menu_packages[0].currency)}/person`,
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#1a0904] to-[#3d1f10] overflow-hidden">
        {/* Background photo blur */}
        {coverPhoto && (
          <div className="absolute inset-0">
            <Image
              src={coverPhoto.url}
              alt=""
              fill
              className="object-cover opacity-20 blur-sm scale-105"
              priority
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0904]/80 via-transparent to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {vendor.profile_photo_url ? (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                  <Image
                    src={vendor.profile_photo_url}
                    alt={displayName}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-brand to-[#c8420c] flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                  <span className="text-white text-4xl sm:text-5xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {vendor.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-brand/30 text-brand text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {serviceLabel}
                </span>
                {vendor.is_verified && (
                  <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
                {(vendor.badges ?? []).map(b => {
                  const cfg = BADGE_CONFIG[b.badge_type]
                  if (!cfg) return null
                  return (
                    <span key={b.badge_type} className={`${cfg.color} text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  )
                })}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">{displayName}</h1>
              <div className="flex items-center gap-3 text-brand/80 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {vendor.city}, {vendor.country}
                </span>
                {vendor.avg_rating && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-white font-semibold">{vendor.avg_rating.toFixed(1)}</span>
                    <span>({vendor.review_count} review{vendor.review_count !== 1 ? 's' : ''})</span>
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Link
                href={`/login?redirect=/vendors/v/${vendor.id}`}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Request Quote
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {vendor.description && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <h2 className="text-xl font-black text-text-1 mb-4">About</h2>
                <p className="text-text-3 leading-relaxed whitespace-pre-line">{vendor.description}</p>
              </section>
            )}

            {/* Sustainability tags */}
            {vendor.sustainability_tags?.length > 0 && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <h2 className="text-xl font-black text-text-1 mb-4">Sustainability</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.sustainability_tags.map(tag => {
                    const cfg = SUSTAINABILITY_LABELS[tag]
                    return (
                      <span key={tag} className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
                        {cfg?.icon ?? '🌍'} {cfg?.label ?? tag}
                      </span>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Live stations */}
            {vendor.stations?.length > 0 && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <h2 className="text-xl font-black text-text-1 mb-4">Live Stations</h2>
                <div className="grid grid-cols-2 gap-3">
                  {vendor.stations.map(station => (
                    <div key={station.id} className="flex items-center gap-3 p-4 rounded-xl bg-cream border border-brand-border">
                      <span className="text-lg">🔥</span>
                      <div>
                        <div className="font-semibold text-sm text-text-1">{station.station_template.name}</div>
                        <div className="text-xs text-text-4">
                          {station.pricing_model === 'FLAT' && station.base_price != null && `$${Number(station.base_price).toFixed(0)} flat`}
                          {station.pricing_model === 'PER_PERSON' && station.price_per_person != null && `$${Number(station.price_per_person).toFixed(0)}/person`}
                          {station.pricing_model === 'HOURLY' && station.hourly_rate != null && `$${Number(station.hourly_rate).toFixed(0)}/hr`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Photo gallery */}
            {vendor.photos.length > 1 && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <h2 className="text-xl font-black text-text-1 mb-5">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vendor.photos.slice(0, 6).map(photo => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-cream-2 group">
                      <Image
                        src={photo.url}
                        alt={photo.caption ?? displayName}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Packages */}
            {vendor.menu_packages.length > 0 && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <h2 className="text-xl font-black text-text-1 mb-1">Packages</h2>
                <p className="text-sm text-text-4 mb-6">All packages are customizable — request a quote for your event.</p>
                <div className="space-y-4">
                  {vendor.menu_packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="group border border-brand-border hover:border-brand rounded-xl p-6 transition-all hover:shadow-md hover:bg-cream"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-black text-text-1 text-base">{pkg.name}</h3>
                          {pkg.cuisine_type && (
                            <p className="text-sm text-text-4 mt-0.5">{pkg.cuisine_type}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-black text-text-1">
                            {formatPrice(pkg.price_per_head, pkg.currency)}
                          </div>
                          <div className="text-xs text-text-4">per person</div>
                        </div>
                      </div>

                      {pkg.description && (
                        <p className="text-sm text-text-3 mb-4 leading-relaxed">{pkg.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Guest range */}
                        {(pkg.min_guests || pkg.max_guests) && (
                          <span className="inline-flex items-center gap-1 text-xs text-text-3 bg-cream px-2 py-1 rounded-lg border border-brand-border">
                            <Users className="w-3 h-3" />
                            {pkg.min_guests && pkg.max_guests
                              ? `${pkg.min_guests}–${pkg.max_guests} guests`
                              : pkg.min_guests
                                ? `Min ${pkg.min_guests} guests`
                                : `Up to ${pkg.max_guests} guests`}
                          </span>
                        )}

                        {/* Dietary badges */}
                        {pkg.is_vegetarian && <DietaryBadge label="Vegetarian" color="bg-green-50 text-green-700" />}
                        {pkg.is_vegan && <DietaryBadge label="Vegan" color="bg-emerald-50 text-emerald-700" />}
                        {pkg.is_jain && <DietaryBadge label="Jain" color="bg-lime-50 text-lime-700" />}
                        {pkg.is_halal && <DietaryBadge label="Halal" color="bg-teal-50 text-teal-700" />}
                        {pkg.nut_free && <DietaryBadge label="Nut-Free" color="bg-yellow-50 text-yellow-700" />}
                        {pkg.gluten_free && <DietaryBadge label="Gluten-Free" color="bg-brand/10 text-brand" />}
                        {pkg.dairy_free && <DietaryBadge label="Dairy-Free" color="bg-sky-50 text-sky-700" />}

                        {/* Includes */}
                        {pkg.includes_service && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                            <Utensils className="w-3 h-3" /> Service included
                          </span>
                        )}
                        {pkg.includes_setup && (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                            <Package className="w-3 h-3" /> Setup included
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-brand-border">
                  <Link
                    href={`/login?redirect=/vendors/v/${vendor.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Request a Custom Quote
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </section>
            )}

            {/* Reviews */}
            {vendor.reviews.length > 0 && (
              <section className="bg-white dark:bg-cream-2 rounded-2xl p-8 shadow-sm border border-brand-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-text-1">
                    Reviews
                    <span className="ml-2 text-sm font-normal text-text-4">({vendor.review_count})</span>
                  </h2>
                  {vendor.avg_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-text-1">{vendor.avg_rating.toFixed(1)}</span>
                      <StarRating rating={vendor.avg_rating} size="md" />
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {vendor.reviews.map(review => (
                    <div key={review.id} className="border-b border-brand-border last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-[#c8420c] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {(review.customer.name ?? 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-text-1">{review.customer.name ?? 'Anonymous'}</p>
                              {review.event_type && (
                                <p className="text-xs text-text-4">{review.event_type}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.overall_rating} size="sm" />
                          <span className="text-xs text-text-4">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.title && (
                        <p className="font-semibold text-text-2 text-sm mb-1">{review.title}</p>
                      )}
                      {review.body && (
                        <p className="text-sm text-text-3 leading-relaxed">{review.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick stats */}
            <div className="bg-white dark:bg-cream-2 rounded-2xl p-6 shadow-sm border border-brand-border">
              <h3 className="text-lg font-black text-text-1 mb-5">Quick Info</h3>
              <div className="space-y-4">
                {vendor.avg_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-3">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={vendor.avg_rating} size="sm" />
                      <span className="text-sm font-bold text-text-1">{vendor.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-3">Location</span>
                  <span className="text-sm font-semibold text-text-1">{vendor.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-3">Service</span>
                  <span className="text-sm font-semibold text-text-1">{serviceLabel}</span>
                </div>
                {vendor.menu_packages.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-3">Packages</span>
                    <span className="text-sm font-semibold text-text-1">{vendor.menu_packages.length}</span>
                  </div>
                )}
                {vendor.is_verified && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-3">Status</span>
                    <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Links */}
              {(vendor.website || vendor.instagram) && (
                <div className="mt-5 pt-5 border-t border-brand-border space-y-2">
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-text-3 bg-cream rounded-lg px-3 py-2 hover:text-brand transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {vendor.instagram && (
                    <a
                      href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-text-3 bg-cream rounded-lg px-3 py-2 hover:text-brand transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Instagram: @{vendor.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#1a0904] to-[#3d1f10] rounded-2xl p-6 shadow-sm text-white">
              <h3 className="font-black text-lg mb-1">Ready to book?</h3>
              <p className="text-brand/80 text-sm mb-5 leading-relaxed">
                Get a free, personalized quote for your event. No commitment required.
              </p>
              <Link
                href={`/login?redirect=/vendors/v/${vendor.id}`}
                className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl transition-colors"
              >
                Get Free Quote
              </Link>
              <p className="text-center text-brand/60 text-xs mt-3">
                Free to use · No credit card
              </p>
            </div>

            {/* Package pricing summary */}
            {vendor.menu_packages.length > 0 && (
              <div className="bg-white dark:bg-cream-2 rounded-2xl p-6 shadow-sm border border-brand-border">
                <h3 className="text-lg font-black text-text-1 mb-4">Pricing</h3>
                <div className="space-y-3">
                  {vendor.menu_packages.slice(0, 4).map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between">
                      <span className="text-sm text-text-3 truncate mr-2">{pkg.name}</span>
                      <span className="text-sm font-bold text-text-1 flex-shrink-0">
                        {formatPrice(pkg.price_per_head, pkg.currency)}/pp
                      </span>
                    </div>
                  ))}
                  {vendor.menu_packages.length > 4 && (
                    <p className="text-xs text-text-4 pt-1">+{vendor.menu_packages.length - 4} more packages</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
