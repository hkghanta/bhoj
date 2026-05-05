import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VendorType } from '@prisma/client'

/**
 * POST /api/public/local-vendors/seed
 * On-demand Google Places sync for a city + vendor type.
 * Called when a user browses a city we haven't seeded yet.
 * Results are cached in DB for future visits.
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

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

const TYPE_QUERIES: Record<string, string[]> = {
  CATERER: [
    'indian restaurant',
    'indian catering',
    'indian food',
    'biryani restaurant',
    'tandoori restaurant',
    'dosa restaurant',
    'vegetarian indian food',
    'indian cuisine',
  ],
  PHOTOGRAPHER: ['indian wedding photographer', 'south asian wedding photographer'],
  DECORATOR: ['indian wedding decorator', 'mandap decor'],
  DJ: ['indian wedding DJ', 'bollywood DJ'],
  MEHENDI_ARTIST: ['mehndi henna artist', 'bridal henna'],
  MAKEUP_HAIR: ['indian bridal makeup artist'],
  DESSERT_VENDOR: ['indian sweets mithai', 'indian bakery desserts'],
  VIDEOGRAPHER: ['indian wedding videographer'],
  FLORIST: ['indian wedding florist'],
  DHOL_PLAYER: ['dhol player'],
  LIVE_BAND: ['bollywood live band'],
  BARTENDER: ['event bartender'],
  CHAI_STATION: ['chai tea catering'],
  CHOREOGRAPHER: ['bollywood dance choreographer'],
  PANDIT_OFFICIANT: ['hindu priest pandit'],
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAllPages(query: string): Promise<any[]> {
  const all: any[] = []
  let nextPageToken: string | null = null

  for (let page = 0; page < 3; page++) {
    const url: string = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${API_KEY}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') break

    all.push(...(data.results ?? []))
    nextPageToken = data.next_page_token ?? null

    if (!nextPageToken) break
    await sleep(2500) // Google requires delay before using next_page_token
  }

  return all
}

async function fetchDetails(placeId: string): Promise<{ phone?: string; website?: string; hours?: any }> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours&key=${API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK') return {}
    const result = data.result ?? {}
    return {
      phone: result.formatted_phone_number ?? undefined,
      website: result.website ?? undefined,
      hours: result.opening_hours?.weekday_text
        ? Object.fromEntries(
            result.opening_hours.weekday_text.map((line: string) => {
              const [day, ...rest] = line.split(': ')
              return [day.toLowerCase(), rest.join(': ')]
            })
          )
        : undefined,
    }
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { city, service } = body as { city?: string; service?: string }

  if (!city || !service) {
    return NextResponse.json({ error: 'city and service required' }, { status: 400 })
  }

  // India — only seed high-rated vendors (4.0+) to keep quality high and volume manageable
  const INDIA_CITIES = ['india', 'delhi', 'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'surat', 'noida', 'gurgaon', 'gurugram', 'chandigarh', 'indore', 'kochi', 'coimbatore', 'thiruvananthapuram', 'visakhapatnam', 'nagpur', 'bhopal', 'patna', 'vadodara', 'goa']
  const cityLower = city.toLowerCase()
  const isIndia = INDIA_CITIES.some(r => cityLower.includes(r))
  const MIN_RATING = isIndia ? 4.0 : 0

  const vendorType = SLUG_TO_TYPE[service]
  if (!vendorType) {
    return NextResponse.json({ error: 'Invalid service type' }, { status: 400 })
  }

  // Check if we already have data (another request may have seeded while we waited)
  const existingCount = await prisma.externalVendor.count({
    where: {
      city: { equals: city, mode: 'insensitive' },
      vendor_type: vendorType,
      is_active: true,
    },
  })

  if (existingCount > 0) {
    return NextResponse.json({ seeded: false, message: 'Already has data', count: existingCount })
  }

  // Derive state from city (best effort)
  const state = ''

  const queries = TYPE_QUERIES[vendorType] ?? ['indian ' + service]
  const seenPlaceIds = new Set<string>()
  let upsertCount = 0

  // Fetch all pages from each query to maximize coverage
  for (const q of queries) {
    const fullQuery = `${q} in ${city}`
    const places = await fetchAllPages(fullQuery)

    for (const place of places) {
      if (seenPlaceIds.has(place.place_id)) continue
      if ((place.rating ?? 0) < MIN_RATING) continue
      seenPlaceIds.add(place.place_id)

      const photoUrls = (place.photos ?? []).slice(0, 5).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
      )

      // Fetch details for first 20 (phone, website, hours)
      let details: { phone?: string; website?: string; hours?: any } = {}
      if (upsertCount < 20) {
        details = await fetchDetails(place.place_id)
        await sleep(50)
      }

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
          phone: details.phone ?? null,
          website: details.website ?? null,
          business_hours: details.hours ?? undefined,
        },
        update: {
          name: place.name,
          address: place.formatted_address ?? '',
          rating: place.rating ?? null,
          total_ratings: place.user_ratings_total ?? 0,
          price_level: place.price_level ?? null,
          photo_urls: photoUrls,
          ...(details.phone ? { phone: details.phone } : {}),
          ...(details.website ? { website: details.website } : {}),
          ...(details.hours ? { business_hours: details.hours } : {}),
          fetched_at: new Date(),
        },
      })
      upsertCount++
    }

    await sleep(200)
  }

  return NextResponse.json({ seeded: true, count: upsertCount })
}
