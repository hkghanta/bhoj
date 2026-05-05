/**
 * Script: Sync external vendors from Google Places into the database.
 *
 * Usage: npx tsx scripts/sync-external-vendors.ts
 *
 * Fetches all pages of results (up to 60 per query),
 * uses multiple search queries per type to maximize coverage,
 * enriches with Place Details (phone, website, hours),
 * and upserts into ExternalVendor table.
 */

import { PrismaClient, VendorType } from '@prisma/client'

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

if (!API_KEY) {
  console.error('Set GOOGLE_PLACES_API_KEY env var')
  process.exit(1)
}

const CITIES = [
  { city: 'Pittsburgh', state: 'PA' },
  { city: 'New York', state: 'NY' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
]

// Multiple queries per type to maximize coverage
const TYPES_TO_SYNC: { type: VendorType; queries: string[] }[] = [
  {
    type: 'CATERER',
    queries: [
      'indian restaurant',
      'indian catering',
      'indian food',
      'biryani restaurant',
      'tandoori restaurant',
      'dosa restaurant',
      'vegetarian indian food',
      'indian cuisine',
    ],
  },
  {
    type: 'PHOTOGRAPHER',
    queries: [
      'indian wedding photographer',
      'south asian wedding photographer',
      'desi wedding photographer',
    ],
  },
  {
    type: 'DECORATOR',
    queries: [
      'indian wedding decorator',
      'mandap decor',
      'south asian event decorator',
    ],
  },
  {
    type: 'DJ',
    queries: [
      'indian wedding DJ',
      'bollywood DJ',
      'desi DJ',
    ],
  },
  {
    type: 'MEHENDI_ARTIST',
    queries: [
      'mehndi henna artist',
      'bridal henna',
    ],
  },
  {
    type: 'MAKEUP_HAIR',
    queries: [
      'indian bridal makeup artist',
      'south asian bridal makeup',
    ],
  },
  {
    type: 'DESSERT_VENDOR',
    queries: [
      'indian sweets mithai',
      'indian bakery desserts',
    ],
  },
]

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

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      break
    }

    all.push(...(data.results ?? []))
    nextPageToken = data.next_page_token ?? null

    if (!nextPageToken) break
    await sleep(2500)
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

async function main() {
  let totalUpserted = 0
  const seenPlaceIds = new Set<string>()

  for (const { city, state } of CITIES) {
    for (const { type, queries } of TYPES_TO_SYNC) {
      console.log(`\n=== ${type} in ${city}, ${state} ===`)
      let typeCount = 0

      for (const q of queries) {
        const fullQuery = `${q} in ${city}, ${state}`
        console.log(`  Query: "${fullQuery}"`)

        const places = await fetchAllPages(fullQuery)
        console.log(`    Found ${places.length} results`)

        // Filter: rating >= 3 or no rating, and deduplicate
        const filtered = places.filter(
          (p: any) => (!p.rating || p.rating >= 3) && !seenPlaceIds.has(p.place_id)
        )

        for (const place of filtered) {
          seenPlaceIds.add(place.place_id)

          const photoUrls = (place.photos ?? []).slice(0, 5).map((p: any) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
          )

          // Check if we already have details
          const existing = await prisma.externalVendor.findUnique({
            where: { place_id: place.place_id },
            select: { phone: true, website: true, business_hours: true },
          })

          // Fetch details only if we don't have phone/website yet
          let details: { phone?: string; website?: string; hours?: any } = {}
          if (!existing?.phone && !existing?.website) {
            details = await fetchDetails(place.place_id)
            await sleep(100)
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
              vendor_type: type,
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
              phone: details.phone ?? existing?.phone ?? undefined,
              website: details.website ?? existing?.website ?? undefined,
              business_hours: details.hours ?? existing?.business_hours ?? undefined,
              fetched_at: new Date(),
            },
          })
          typeCount++
          totalUpserted++
        }

        await sleep(300)
      }

      console.log(`  Total upserted for ${type} in ${city}: ${typeCount}`)
    }
  }

  console.log(`\nDone! Total upserted: ${totalUpserted}`)

  // Print summary
  const counts = await prisma.externalVendor.groupBy({
    by: ['city', 'vendor_type'],
    _count: { id: true },
    orderBy: [{ city: 'asc' }, { vendor_type: 'asc' }],
  })
  console.log('\nDatabase summary:')
  for (const c of counts) {
    console.log(`  ${c.city} / ${c.vendor_type}: ${c._count.id}`)
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
