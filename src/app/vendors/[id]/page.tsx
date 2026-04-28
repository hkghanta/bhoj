import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vendor = await prisma.vendor.findUnique({ where: { id, is_active: true } })
  if (!vendor) return { title: 'Vendor not found' }
  return {
    title: `${vendor.business_name} — Bhoj`,
    description: vendor.description ?? `${vendor.business_name} on Bhoj Indian Events`,
  }
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const vendor = await prisma.vendor.findUnique({
    where: { id, is_active: true },
    include: {
      photos: { orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }], take: 12 },
      services: { where: { is_active: true } },
      menu_packages: {
        where: { is_active: true },
        include: { items: { include: { menu_item: true }, orderBy: { sort_order: 'asc' } } },
        orderBy: { price_per_head: 'asc' },
      },
      reviews: {
        where: { is_published: true },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { customer: { select: { name: true, avatar_url: true } } },
      },
    },
  })

  if (!vendor) notFound()

  const avgRating = vendor.reviews.length
    ? vendor.reviews.reduce((sum, r) => sum + r.overall_rating, 0) / vendor.reviews.length
    : null

  const coverPhoto = vendor.photos.find(p => p.is_cover) ?? vendor.photos[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <a href="/" className="text-xl font-bold text-orange-600">Bhoj</a>
      </nav>

      {/* Cover */}
      <div className="relative h-64 bg-gray-200">
        {coverPhoto && (
          <Image src={coverPhoto.url} alt={vendor.business_name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-6 left-8 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{vendor.business_name}</h1>
            {vendor.is_verified && <CheckCircle2 className="h-6 w-6 text-blue-400" />}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {vendor.city}, {vendor.country}
            </span>
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)} ({vendor.reviews.length} reviews)
              </span>
            )}
            <Badge variant="outline" className="text-white border-white text-xs">
              {vendor.vendor_type.replace(/_/g, ' ')}
            </Badge>
            {vendor.tier !== 'FREE' && (
              <Badge className="bg-orange-600 text-white text-xs">{vendor.tier}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-8">
          {vendor.description && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{vendor.description}</p>
            </section>
          )}

          {vendor.services.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {vendor.services.map(s => (
                  <Badge key={s.id} variant="secondary">{s.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {vendor.menu_packages.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Menu Packages</h2>
              <div className="space-y-4">
                {vendor.menu_packages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      <span className="text-lg font-bold text-orange-600">
                        £{Number(pkg.price_per_head).toFixed(2)}<span className="text-sm font-normal text-gray-500">/head</span>
                      </span>
                    </div>
                    {pkg.description && <p className="text-gray-500 text-sm mb-3">{pkg.description}</p>}
                    <div className="flex flex-wrap gap-1">
                      {pkg.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">Vegetarian</Badge>}
                      {pkg.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                      {pkg.includes_service && <Badge variant="outline" className="text-xs">Service included</Badge>}
                    </div>
                    {pkg.items.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        {pkg.items.slice(0, 6).map(i => i.menu_item.name).join(', ')}
                        {pkg.items.length > 6 && ` +${pkg.items.length - 6} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {vendor.photos.length > 1 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {vendor.photos.slice(0, 9).map(photo => (
                  <div key={photo.id} className="aspect-video relative rounded-lg overflow-hidden">
                    <Image src={photo.url} alt={photo.caption ?? ''} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {vendor.reviews.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {vendor.reviews.map(review => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{review.customer.name}</span>
                      {review.event_type && <span className="text-xs text-gray-400">· {review.event_type}</span>}
                    </div>
                    {review.title && <p className="font-medium text-sm text-gray-800">{review.title}</p>}
                    {review.body && <p className="text-sm text-gray-600 mt-1">{review.body}</p>}
                    {review.vendor_reply && (
                      <div className="mt-2 pl-3 border-l-2 border-orange-200">
                        <p className="text-xs text-orange-700 font-medium">Response from {vendor.business_name}</p>
                        <p className="text-sm text-gray-600">{review.vendor_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: contact card */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Request a quote</h3>
            <a
              href={`/events/new?vendor=${vendor.id}`}
              className="block w-full text-center py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Get a Quote
            </a>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Free to request. Usually responds within 24 hours.
            </p>
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                className="mt-4 block text-sm text-center text-orange-600 hover:underline">
                Visit website →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
