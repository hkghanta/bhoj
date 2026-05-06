import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Map vendor types to Google Places search queries
// Caterers: Indian/Asian specific. Others: general wedding vendors in the area.
const TYPE_QUERY: Record<string, string> = {
  CATERER:         'indian asian catering events',
  DECORATOR:       'wedding decorator event stylist',
  PHOTOGRAPHER:    'wedding photographer',
  VIDEOGRAPHER:    'wedding videographer cinematography',
  DJ:              'wedding DJ party',
  FLORIST:         'wedding florist flowers',
  MEHENDI_ARTIST:  'mehndi henna artist bridal',
  MAKEUP_HAIR:     'wedding makeup artist bridal hair',
  DHOL_PLAYER:     'dhol player musician',
  LIVE_BAND:       'live band wedding music',
  DESSERT_VENDOR:  'wedding cake desserts',
  BARTENDER:       'bar service cocktail catering',
}

export type LocalBusiness = {
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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') ?? 'New York'
  const vendorType = searchParams.get('vendorType') ?? 'CATERER'
  const eventId = searchParams.get('eventId')
  const customerId = session.user!.id as string

  // Get already-invited place IDs for this event
  const invitedIds = new Set<string>()
  if (eventId) {
    const invites = await prisma.localVendorInvite.findMany({
      where: { customer_id: customerId, event_id: eventId, vendor_type: vendorType },
      select: { place_id: true },
    })
    invites.forEach(i => invitedIds.add(i.place_id))
  }

  // Get ExternalVendor records for this city/type — exclude claimed (they're platform vendors now)
  const externalVendors = await prisma.externalVendor.findMany({
    where: { city: { contains: city, mode: 'insensitive' }, vendor_type: vendorType as any, is_active: true, claimed_by_vendor_id: null },
    include: { quote_requests: eventId ? { where: { event_request: { event_id: eventId } }, select: { id: true } } : false },
  })
  const externalByPlaceId = new Map(externalVendors.map(ev => [ev.place_id, ev]))

  // Get quote-requested place IDs for this event
  const quoteRequestedIds = new Set<string>()
  if (eventId) {
    for (const ev of externalVendors) {
      if (ev.quote_requests && (ev.quote_requests as any[]).length > 0) {
        quoteRequestedIds.add(ev.place_id)
      }
    }
  }

  function enrichBusiness(base: Omit<LocalBusiness, 'description' | 'business_hours' | 'is_claimed' | 'external_vendor_id' | 'photo_urls' | 'quote_requested'>): LocalBusiness {
    const ext = externalByPlaceId.get(base.place_id)
    return {
      ...base,
      phone: ext?.phone ?? base.phone,
      website: ext?.website ?? base.website,
      rating: ext?.rating ?? base.rating,
      total_ratings: ext?.total_ratings ?? base.total_ratings,
      photo_urls: ext?.photo_urls ?? [],
      description: ext?.description ?? null,
      business_hours: (ext?.business_hours as Record<string, string>) ?? null,
      is_claimed: !!ext?.claimed_by_vendor_id,
      external_vendor_id: ext?.id ?? null,
      quote_requested: quoteRequestedIds.has(base.place_id),
    }
  }

  // Serve from DB if we already have results stored
  if (externalVendors.length > 0) {
    const businesses: LocalBusiness[] = externalVendors.map(ev => enrichBusiness({
      place_id: ev.place_id,
      name: ev.name,
      address: ev.address,
      rating: ev.rating,
      total_ratings: ev.total_ratings,
      phone: ev.phone,
      website: ev.website,
      photo_url: ev.photo_urls[0] ?? null,
      maps_url: ev.maps_url,
      invited: invitedIds.has(ev.place_id),
    }))
    return NextResponse.json({ businesses, source: 'cached' })
  }

  // No DB results — try Google Places API
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ businesses: [], source: 'none' })
  }

  const query = `${TYPE_QUERY[vendorType] ?? 'event catering'} in ${city}`
  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

  try {
    const placesRes = await fetch(placesUrl, { next: { revalidate: 86400 } }) // cache 24h
    const placesData = await placesRes.json()

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('[local-vendors] Google Places error:', placesData.status, placesData.error_message)
      return NextResponse.json({ businesses: [], source: 'google', error: placesData.status })
    }

    const results = (placesData.results ?? []).slice(0, 8)

    // Persist each result to ExternalVendor (upsert by place_id)
    for (const place of results) {
      const photoRef = place.photos?.[0]?.photo_reference
      const photoUrls = photoRef
        ? [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`]
        : []

      try {
        await prisma.externalVendor.upsert({
          where: { place_id: place.place_id },
          update: {
            name: place.name,
            address: place.formatted_address,
            rating: place.rating ?? null,
            total_ratings: place.user_ratings_total ?? 0,
            photo_urls: photoUrls,
            maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            lat: place.geometry?.location?.lat ?? null,
            lng: place.geometry?.location?.lng ?? null,
            fetched_at: new Date(),
          },
          create: {
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            city,
            country: 'US',
            vendor_type: vendorType as any,
            rating: place.rating ?? null,
            total_ratings: place.user_ratings_total ?? 0,
            price_level: place.price_level ?? null,
            photo_urls: photoUrls,
            maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            lat: place.geometry?.location?.lat ?? null,
            lng: place.geometry?.location?.lng ?? null,
          },
        })
      } catch (err: any) {
        console.error(`[local-vendors] Failed to upsert ExternalVendor ${place.place_id}:`, err.message)
      }
    }

    // Re-read from DB to get enriched data (including any prior description, hours, claimed status)
    const freshExternals = await prisma.externalVendor.findMany({
      where: { place_id: { in: results.map((p: any) => p.place_id) } },
    })
    const freshByPlaceId = new Map(freshExternals.map(ev => [ev.place_id, ev]))

    const businesses: LocalBusiness[] = results.map((place: any) => {
      const ext = freshByPlaceId.get(place.place_id)
      const photoRef = place.photos?.[0]?.photo_reference
      const photo_url = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
        : null

      return {
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: ext?.rating ?? place.rating ?? null,
        total_ratings: ext?.total_ratings ?? place.user_ratings_total ?? 0,
        phone: ext?.phone ?? null,
        website: ext?.website ?? null,
        photo_url,
        photo_urls: ext?.photo_urls ?? [],
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        description: ext?.description ?? null,
        business_hours: (ext?.business_hours as Record<string, string>) ?? null,
        is_claimed: !!ext?.claimed_by_vendor_id,
        external_vendor_id: ext?.id ?? null,
        invited: invitedIds.has(place.place_id),
        quote_requested: quoteRequestedIds.has(place.place_id),
      } satisfies LocalBusiness
    })

    return NextResponse.json({ businesses, source: 'google' })
  } catch (err) {
    console.error('[local-vendors] Fetch error:', err)
    return NextResponse.json({ businesses: [], source: 'error' })
  }
}
