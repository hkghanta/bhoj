import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VendorType } from '@prisma/client'

/**
 * GET /api/public/local-vendors?city=Pittsburgh&service=catering
 * Returns external vendors from the database (no auth required).
 * These are Google Places businesses stored locally via sync.
 */

const SLUG_TO_TYPE: Record<string, VendorType> = {
  catering: 'CATERER',
  photographer: 'PHOTOGRAPHER',
  videographer: 'VIDEOGRAPHER',
  decorator: 'DECORATOR',
  dj: 'DJ',
  florist: 'FLORIST',
  'mehendi-artist': 'MEHENDI_ARTIST',
  'makeup-hair': 'MAKEUP_HAIR',
  'dhol-player': 'DHOL_PLAYER',
  'live-band': 'LIVE_BAND',
  'dessert-vendor': 'DESSERT_VENDOR',
  bartender: 'BARTENDER',
  'chai-station': 'CHAI_STATION',
  choreographer: 'CHOREOGRAPHER',
  'pandit-officiant': 'PANDIT_OFFICIANT',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') ?? 'Pittsburgh'
  const serviceSlug = searchParams.get('service') ?? 'catering'
  const vendorType = SLUG_TO_TYPE[serviceSlug]

  if (!vendorType) {
    return NextResponse.json({ businesses: [], source: 'db' })
  }

  let vendors
  try {
    vendors = await prisma.externalVendor.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        vendor_type: vendorType,
        is_active: true,
        claimed_by_vendor_id: null,
      },
      orderBy: { total_ratings: 'desc' },
    })
  } catch (err) {
    console.error('[public/local-vendors] DB error:', err)
    return NextResponse.json({ businesses: [], source: 'error', error: String(err) })
  }

  const businesses = vendors.map(v => ({
    place_id: v.place_id,
    name: v.name,
    address: v.address,
    rating: v.rating,
    total_ratings: v.total_ratings,
    price_level: v.price_level,
    photo_url: v.photo_urls[0] ?? null,
    photo_urls: v.photo_urls,
    maps_url: v.maps_url,
    phone: v.phone,
    website: v.website,
    business_hours: v.business_hours,
    description: v.description,
  }))

  return NextResponse.json({ businesses, source: 'db', total: vendors.length })
}
