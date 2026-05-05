import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VendorType } from '@prisma/client'

/**
 * POST /api/admin/sync-external-vendors
 * Fetches businesses from Google Places for a given city + vendor type
 * and upserts them into the ExternalVendor table.
 *
 * Body: { city: string, vendorType: string, state?: string }
 * Supports pagination (fetches up to 60 results via next_page_token).
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

const TYPE_QUERY: Record<string, string> = {
  CATERER: 'indian restaurant OR indian catering OR asian catering',
  PHOTOGRAPHER: 'wedding photographer',
  VIDEOGRAPHER: 'wedding videographer',
  DECORATOR: 'wedding decorator event decorator',
  DJ: 'wedding DJ desi DJ',
  FLORIST: 'wedding florist',
  MEHENDI_ARTIST: 'mehndi henna artist',
  MAKEUP_HAIR: 'bridal makeup artist',
  DHOL_PLAYER: 'dhol player musician',
  LIVE_BAND: 'live band wedding music',
  DESSERT_VENDOR: 'indian desserts mithai bakery',
  BARTENDER: 'bar catering cocktail service',
  CHAI_STATION: 'chai tea cafe indian',
  CHOREOGRAPHER: 'wedding choreographer dance',
  PANDIT_OFFICIANT: 'hindu priest pandit temple',
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json()
  const city = body.city as string
  const vendorTypeInput = body.vendorType as string
  const state = (body.state as string) ?? ''

  // Resolve vendor type
  const vendorType = SLUG_TO_TYPE[vendorTypeInput] ?? (vendorTypeInput as VendorType)
  const searchQuery = TYPE_QUERY[vendorType] ?? 'indian restaurant catering'

  const query = `${searchQuery} in ${city}${state ? `, ${state}` : ''}`
  let allResults: any[] = []
  let nextPageToken: string | null = null

  // Fetch up to 3 pages (60 results max)
  for (let page = 0; page < 3; page++) {
    const fetchUrl: string = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

    const fetchRes = await fetch(fetchUrl)
    const data = await fetchRes.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[sync-external] Places error:', data.status, data.error_message)
      break
    }

    allResults.push(...(data.results ?? []))
    nextPageToken = data.next_page_token ?? null

    if (!nextPageToken) break
    // Google requires a short delay before using next_page_token
    await sleep(2000)
  }

  // Filter: rating >= 3 or no rating
  const filtered = allResults.filter(
    (p: any) => !p.rating || p.rating >= 3
  )

  let upserted = 0

  for (const place of filtered) {
    const photoUrls = (place.photos ?? []).slice(0, 5).map((p: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
    )

    await prisma.externalVendor.upsert({
      where: { place_id: place.place_id },
      create: {
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address ?? '',
        city,
        state,
        lat: place.geometry?.location?.lat ?? null,
        lng: place.geometry?.location?.lng ?? null,
        rating: place.rating ?? null,
        total_ratings: place.user_ratings_total ?? 0,
        price_level: place.price_level ?? null,
        vendor_type: vendorType,
        photo_urls: photoUrls,
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      },
      update: {
        name: place.name,
        address: place.formatted_address ?? '',
        rating: place.rating ?? null,
        total_ratings: place.user_ratings_total ?? 0,
        price_level: place.price_level ?? null,
        photo_urls: photoUrls,
        fetched_at: new Date(),
      },
    })
    upserted++
  }

  return NextResponse.json({
    city,
    vendor_type: vendorType,
    fetched: allResults.length,
    filtered: filtered.length,
    upserted,
  })
}
