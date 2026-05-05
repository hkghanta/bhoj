import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VendorType } from '@prisma/client'
import { isAdminRequest } from '@/lib/admin-auth'

const TYPE_QUERIES: Record<string, string[]> = {
  CATERER:        ['indian restaurant'],
  PHOTOGRAPHER:   ['indian wedding photographer', 'south asian wedding photography'],
  DECORATOR:      ['indian wedding decorator mandap', 'south asian event decorator'],
  DJ:             ['indian wedding dj bollywood', 'desi wedding dj'],
  MEHENDI_ARTIST: ['mehndi henna artist bridal', 'indian mehndi artist'],
  MAKEUP_HAIR:    ['indian bridal makeup artist', 'south asian bridal hair makeup'],
  FLORIST:        ['indian wedding florist flowers'],
  VIDEOGRAPHER:   ['indian wedding videographer'],
  DHOL_PLAYER:    ['dhol player wedding'],
  LIVE_BAND:      ['indian live band wedding'],
}

const RADIUS_METERS = 80467 // 50 miles

const TARGET_CITIES = [
  { city: 'New York',      state: 'NY', lat: 40.7128,  lng: -74.0060  },
  { city: 'Edison',        state: 'NJ', lat: 40.5187,  lng: -74.4121  },
  { city: 'Jersey City',   state: 'NJ', lat: 40.7178,  lng: -74.0431  },
  { city: 'Chicago',       state: 'IL', lat: 41.8781,  lng: -87.6298  },
  { city: 'Houston',       state: 'TX', lat: 29.7604,  lng: -95.3698  },
  { city: 'Dallas',        state: 'TX', lat: 32.7767,  lng: -96.7970  },
  { city: 'Plano',         state: 'TX', lat: 33.0198,  lng: -96.6989  },
  { city: 'Sugar Land',    state: 'TX', lat: 29.6197,  lng: -95.6349  },
  { city: 'Fremont',       state: 'CA', lat: 37.5485,  lng: -121.9886 },
  { city: 'San Jose',      state: 'CA', lat: 37.3382,  lng: -121.8863 },
  { city: 'Sunnyvale',     state: 'CA', lat: 37.3688,  lng: -122.0363 },
  { city: 'Irvine',        state: 'CA', lat: 33.6846,  lng: -117.8265 },
  { city: 'Los Angeles',   state: 'CA', lat: 34.0522,  lng: -118.2437 },
  { city: 'Atlanta',       state: 'GA', lat: 33.7490,  lng: -84.3880  },
  { city: 'Fairfax',       state: 'VA', lat: 38.8462,  lng: -77.3064  },
  { city: 'Herndon',       state: 'VA', lat: 38.9696,  lng: -77.3861  },
  { city: 'Cary',          state: 'NC', lat: 35.7915,  lng: -78.7811  },
  { city: 'Raleigh',       state: 'NC', lat: 35.7796,  lng: -78.6382  },
  { city: 'Charlotte',     state: 'NC', lat: 35.2271,  lng: -80.8431  },
  { city: 'Philadelphia',  state: 'PA', lat: 39.9526,  lng: -75.1652  },
  { city: 'Seattle',       state: 'WA', lat: 47.6062,  lng: -122.3321 },
  { city: 'Boston',        state: 'MA', lat: 42.3601,  lng: -71.0589  },
]

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not set' }, { status: 400 })

  const body = await req.json()
  const { city, state, vendorType } = body as { city?: string; state?: string; vendorType?: string }

  // Determine which city+type combos to fetch
  const citiesToFetch = city
    ? TARGET_CITIES.find(c => c.city === city) ? [TARGET_CITIES.find(c => c.city === city)!] : [{ city, state: state ?? '', lat: 0, lng: 0 }]
    : TARGET_CITIES

  const typesToFetch = vendorType
    ? [vendorType]
    : Object.keys(TYPE_QUERIES)

  let totalAdded = 0
  let totalSkipped = 0
  const errors: string[] = []

  for (const loc of citiesToFetch) {
    for (const type of typesToFetch) {
      const queries = TYPE_QUERIES[type] ?? []
      for (const q of queries.slice(0, 1)) { // 1 query per type to stay within budget
        const typeFilter = type === 'CATERER' ? '&type=restaurant' : ''
        const locationFilter = loc.lat && loc.lng
          ? `&location=${loc.lat},${loc.lng}&radius=${RADIUS_METERS}`
          : ''
        const baseUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}${typeFilter}${locationFilter}&key=${apiKey}`

        try {
          // Paginate up to 3 pages (60 results)
          let pageUrl = baseUrl
          for (let page = 0; page < 3; page++) {
            const res = await fetch(pageUrl)
            const data = await res.json()

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
              if (page === 0) errors.push(`${loc.city}/${type}: ${data.status}`)
              break
            }

            for (const place of (data.results ?? [])) {
              try {
                const isPermanentlyClosed = place.business_status === 'CLOSED_PERMANENTLY'

                await prisma.vendorLead.upsert({
                  where: { place_id: place.place_id },
                  update: {
                    rating: place.rating ?? null,
                    total_ratings: place.user_ratings_total ?? 0,
                    ...(isPermanentlyClosed ? { status: 'PERMANENTLY_CLOSED' } : {}),
                  },
                  create: {
                    place_id: place.place_id,
                    business_name: place.name,
                    vendor_type: type as VendorType,
                    address: place.formatted_address ?? null,
                    city: loc.city,
                    state: loc.state,
                    rating: place.rating ?? null,
                    total_ratings: place.user_ratings_total ?? 0,
                    maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                    status: isPermanentlyClosed ? 'PERMANENTLY_CLOSED' : 'NEW',
                  },
                })
                totalAdded++
              } catch {
                totalSkipped++
              }
            }

            // Fetch place details for full info
            for (const place of (data.results ?? [])) {
              try {
                const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,international_phone_number,website,formatted_address,opening_hours,business_status&key=${apiKey}`
                const detailRes = await fetch(detailUrl)
                const detail = await detailRes.json()
                if (detail.result) {
                  const r = detail.result
                  const hours = r.opening_hours?.weekday_text
                    ? r.opening_hours.weekday_text.join('\n')
                    : null
                  await prisma.vendorLead.update({
                    where: { place_id: place.place_id },
                    data: {
                      phone: r.formatted_phone_number ?? r.international_phone_number ?? null,
                      website: r.website ?? null,
                      address: r.formatted_address ?? null,
                      opening_hours: hours,
                    },
                  })
                }
                await new Promise(r => setTimeout(r, 100))
              } catch { /* skip details on error */ }
            }

            // Move to next page or stop
            if (!data.next_page_token) break
            pageUrl = `${baseUrl}&pagetoken=${data.next_page_token}`
            // Google requires a short delay before next_page_token is valid
            await new Promise(r => setTimeout(r, 2000))
          }

          await new Promise(r => setTimeout(r, 200))
        } catch (err) {
          errors.push(`${loc.city}/${type}: ${String(err)}`)
        }
      }
    }
  }

  return NextResponse.json({ added: totalAdded, skipped: totalSkipped, errors })
}
