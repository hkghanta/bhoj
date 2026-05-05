import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/local-vendors/[placeId]
 * Returns full details for a single external vendor by place_id.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params

  const vendor = await prisma.externalVendor.findUnique({
    where: { place_id: placeId },
  })

  if (!vendor || !vendor.is_active) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    place_id: vendor.place_id,
    name: vendor.name,
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    country: vendor.country,
    lat: vendor.lat,
    lng: vendor.lng,
    phone: vendor.phone,
    website: vendor.website,
    rating: vendor.rating,
    total_ratings: vendor.total_ratings,
    price_level: vendor.price_level,
    vendor_type: vendor.vendor_type,
    photo_urls: vendor.photo_urls,
    maps_url: vendor.maps_url,
    business_hours: vendor.business_hours,
    description: vendor.description,
    claimed: !!vendor.claimed_by_vendor_id,
  })
}
