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
          className={`${sizes[size]} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-orange-950 via-orange-900 to-amber-800 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-orange-950/80 via-transparent to-transparent" />

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
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-2xl ring-4 ring-white/20">
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
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-orange-500/30 text-orange-200 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {serviceLabel}
                </span>
                {vendor.is_verified && (
                  <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">{displayName}</h1>
              <div className="flex items-center gap-3 text-orange-200/80 text-sm">
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
                href={`/login?redirect=/vendors/${vendor.id}`}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {vendor.description && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vendor.description}</p>
              </section>
            )}

            {/* Photo gallery */}
            {vendor.photos.length > 1 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vendor.photos.slice(0, 6).map(photo => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group">
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
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Packages</h2>
                <p className="text-sm text-gray-500 mb-5">All packages are customizable — request a quote for your event.</p>
                <div className="space-y-4">
                  {vendor.menu_packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="group border border-gray-100 hover:border-orange-200 rounded-xl p-5 transition-all hover:shadow-md hover:bg-orange-50/30"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{pkg.name}</h3>
                          {pkg.cuisine_type && (
                            <p className="text-sm text-gray-500 mt-0.5">{pkg.cuisine_type}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-black text-orange-600">
                            {formatPrice(pkg.price_per_head, pkg.currency)}
                          </div>
                          <div className="text-xs text-gray-400">per person</div>
                        </div>
                      </div>

                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{pkg.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Guest range */}
                        {(pkg.min_guests || pkg.max_guests) && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
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
                        {pkg.gluten_free && <DietaryBadge label="Gluten-Free" color="bg-orange-50 text-orange-700" />}
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
                <div className="mt-5 pt-5 border-t border-gray-50">
                  <Link
                    href={`/login?redirect=/vendors/${vendor.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Request a Custom Quote
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </section>
            )}

            {/* Reviews */}
            {vendor.reviews.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    Reviews
                    <span className="ml-2 text-sm font-normal text-gray-400">({vendor.review_count})</span>
                  </h2>
                  {vendor.avg_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-gray-900">{vendor.avg_rating.toFixed(1)}</span>
                      <StarRating rating={vendor.avg_rating} size="md" />
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  {vendor.reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-50 last:border-0 pb-5 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                              {(review.customer.name ?? 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{review.customer.name ?? 'Anonymous'}</p>
                              {review.event_type && (
                                <p className="text-xs text-gray-400">{review.event_type}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.overall_rating} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.title && (
                        <p className="font-semibold text-gray-800 text-sm mb-1">{review.title}</p>
                      )}
                      {review.body && (
                        <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                {vendor.avg_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={vendor.avg_rating} size="sm" />
                      <span className="text-sm font-bold text-gray-900">{vendor.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm font-medium text-gray-900">{vendor.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="text-sm font-medium text-gray-900">{serviceLabel}</span>
                </div>
                {vendor.menu_packages.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Packages</span>
                    <span className="text-sm font-medium text-gray-900">{vendor.menu_packages.length}</span>
                  </div>
                )}
                {vendor.is_verified && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Links */}
              {(vendor.website || vendor.instagram) && (
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
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
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Instagram: @{vendor.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-5 shadow-sm text-white">
              <h3 className="font-bold text-lg mb-1">Ready to book?</h3>
              <p className="text-orange-100 text-sm mb-4 leading-relaxed">
                Get a free, personalized quote for your event. No commitment required.
              </p>
              <Link
                href={`/login?redirect=/vendors/${vendor.id}`}
                className="block w-full text-center bg-white text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
              >
                Get Free Quote
              </Link>
              <p className="text-center text-orange-200 text-xs mt-2">
                Free to use · No credit card
              </p>
            </div>

            {/* Package pricing summary */}
            {vendor.menu_packages.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">Pricing</h3>
                <div className="space-y-2">
                  {vendor.menu_packages.slice(0, 4).map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate mr-2">{pkg.name}</span>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                        {formatPrice(pkg.price_per_head, pkg.currency)}/pp
                      </span>
                    </div>
                  ))}
                  {vendor.menu_packages.length > 4 && (
                    <p className="text-xs text-gray-400 pt-1">+{vendor.menu_packages.length - 4} more packages</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
