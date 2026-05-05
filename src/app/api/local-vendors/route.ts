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

type DemoBiz = { name: string; address: string; rating: number; totalRatings: number; website?: string; phone?: string }

// Demo/fallback data — US cities with large South Asian communities
const DEMO_BUSINESSES: Record<string, Record<string, DemoBiz[]>> = {
  'New York': {
    CATERER: [
      { name: 'Punjabi Kitchen NYC', address: '72-30 Broadway, Jackson Heights, NY 11372', rating: 4.7, totalRatings: 134, website: 'https://example.com', phone: '(718) 555-1234' },
      { name: 'Desi Bites Catering', address: '37-47 74th St, Jackson Heights, NY 11372', rating: 4.5, totalRatings: 91, phone: '(718) 555-5678' },
      { name: 'South Asian Banquets', address: 'Oak Tree Rd, Edison, NJ 08820', rating: 4.6, totalRatings: 108, website: 'https://example.com', phone: '(732) 555-9012' },
      { name: 'Masala House Catering', address: '545 Oak Tree Rd, Iselin, NJ 08830', rating: 4.4, totalRatings: 67, phone: '(732) 555-3456' },
    ],
    PHOTOGRAPHER: [
      { name: 'Kapil Visuals NYC', address: '250 W 57th St, New York, NY 10019', rating: 4.8, totalRatings: 113, website: 'https://example.com', phone: '(212) 555-2345' },
      { name: 'South Asian Frames', address: '74th St, Jackson Heights, NY 11372', rating: 4.9, totalRatings: 78, website: 'https://example.com', phone: '(718) 555-6789' },
      { name: 'Golden Moments Photography', address: 'Edison, NJ 08820', rating: 4.6, totalRatings: 95, phone: '(732) 555-3456' },
    ],
    DJ: [
      { name: 'DJ Arjun NYC', address: 'Jackson Heights, NY 11372', rating: 4.7, totalRatings: 67, website: 'https://example.com', phone: '(718) 555-4567' },
      { name: 'Bhangra Beats NY', address: 'Flushing, NY 11354', rating: 4.5, totalRatings: 44, phone: '(718) 555-5678' },
      { name: 'Desi Soundz East Coast', address: 'Edison, NJ 08820', rating: 4.4, totalRatings: 38, phone: '(732) 555-6780' },
    ],
    DECORATOR: [
      { name: 'Luxe Mandap Events NY', address: 'Parsippany, NJ 07054', rating: 4.6, totalRatings: 52, website: 'https://example.com', phone: '(973) 555-7891' },
      { name: 'Blossom Event Design', address: 'Edison, NJ 08820', rating: 4.5, totalRatings: 61, phone: '(732) 555-8902' },
    ],
    MEHENDI_ARTIST: [
      { name: 'Henna by Priya NYC', address: 'Jackson Heights, NY 11372', rating: 4.9, totalRatings: 142, website: 'https://example.com', phone: '(718) 555-9013' },
      { name: 'Bridal Mehndi NJ', address: 'Edison, NJ 08820', rating: 4.7, totalRatings: 88, phone: '(732) 555-0124' },
    ],
    MAKEUP_HAIR: [
      { name: 'Glam Bridal Studio NY', address: 'Parsippany, NJ 07054', rating: 4.8, totalRatings: 107, website: 'https://example.com', phone: '(973) 555-1235' },
      { name: 'Radiant Bridal Beauty', address: 'Edison, NJ 08820', rating: 4.6, totalRatings: 73, phone: '(732) 555-2346' },
    ],
  },
  Pittsburgh: {
    CATERER: [
      { name: 'Spice Garden Catering', address: '4611 Liberty Ave, Pittsburgh, PA 15224', rating: 4.7, totalRatings: 88, phone: '(412) 555-1234' },
      { name: 'Masala House Pittsburgh', address: '307 S Craig St, Pittsburgh, PA 15213', rating: 4.5, totalRatings: 62, website: 'https://example.com', phone: '(412) 555-5678' },
      { name: 'Saffron Indian Events', address: '1711 Penn Ave, Pittsburgh, PA 15222', rating: 4.8, totalRatings: 114, website: 'https://example.com', phone: '(412) 555-9012' },
      { name: 'Desi Flavors Catering', address: 'Monroeville, PA 15146', rating: 4.4, totalRatings: 43, phone: '(412) 555-3456' },
      { name: 'Royal Curry Events', address: '2200 Murray Ave, Pittsburgh, PA 15217', rating: 4.6, totalRatings: 77, website: 'https://example.com', phone: '(412) 555-7890' },
      { name: 'Golden Temple Caterers', address: 'Wexford, PA 15090', rating: 4.3, totalRatings: 31, phone: '(724) 555-1234' },
    ],
    PHOTOGRAPHER: [
      { name: 'South Asian Clicks PGH', address: 'Pittsburgh, PA 15213', rating: 4.8, totalRatings: 73, website: 'https://example.com', phone: '(412) 555-2345' },
      { name: 'Desi Frames Photography', address: 'Cranberry Twp, PA 16066', rating: 4.6, totalRatings: 55, phone: '(724) 555-6789' },
    ],
    DJ: [
      { name: 'DJ Raj Pittsburgh', address: 'Pittsburgh, PA 15222', rating: 4.7, totalRatings: 59, phone: '(412) 555-3456' },
      { name: 'Bhangra Beats PGH', address: 'Monroeville, PA 15146', rating: 4.4, totalRatings: 38, phone: '(412) 555-7891' },
    ],
    DECORATOR: [
      { name: 'Luxe Mandap Pittsburgh', address: 'Wexford, PA 15090', rating: 4.5, totalRatings: 47, website: 'https://example.com', phone: '(724) 555-4567' },
      { name: 'Elegant Desi Events', address: 'Pittsburgh, PA 15213', rating: 4.3, totalRatings: 29, phone: '(412) 555-8902' },
    ],
    MEHENDI_ARTIST: [
      { name: 'Henna by Sangita PGH', address: 'Pittsburgh, PA 15217', rating: 4.9, totalRatings: 102, website: 'https://example.com', phone: '(412) 555-9013' },
      { name: 'Bridal Henna PA', address: 'Cranberry Twp, PA 16066', rating: 4.6, totalRatings: 61, phone: '(724) 555-0124' },
    ],
    MAKEUP_HAIR: [
      { name: 'Glam Bridal Studio PGH', address: 'Pittsburgh, PA 15213', rating: 4.7, totalRatings: 84, website: 'https://example.com', phone: '(412) 555-1235' },
    ],
  },
  Chicago: {
    CATERER: [
      { name: 'Spice Route Catering', address: '2456 W Devon Ave, Chicago, IL 60659', rating: 4.5, totalRatings: 98, phone: '(773) 555-1234' },
      { name: 'Taste of India Events', address: '2510 W Devon Ave, Chicago, IL 60659', rating: 4.8, totalRatings: 201, website: 'https://example.com', phone: '(773) 555-5678' },
      { name: 'Chicago Desi Caterers', address: '1820 N Clybourn Ave, Chicago, IL 60614', rating: 4.3, totalRatings: 43, phone: '(312) 555-9012' },
    ],
    PHOTOGRAPHER: [
      { name: 'Moments by Rajan', address: 'Devon Ave, Chicago, IL 60659', rating: 4.7, totalRatings: 66, website: 'https://example.com', phone: '(773) 555-2345' },
      { name: 'Chicago South Asian Weddings', address: 'Naperville, IL 60563', rating: 4.5, totalRatings: 49, phone: '(630) 555-6789' },
    ],
    DJ: [
      { name: 'DJ Vikram Chicago', address: 'Devon Ave, Chicago, IL 60659', rating: 4.6, totalRatings: 53, phone: '(773) 555-3456' },
      { name: 'Bhangra Box Chicago', address: 'Schaumburg, IL 60173', rating: 4.4, totalRatings: 37, phone: '(847) 555-7890' },
    ],
    DECORATOR: [
      { name: 'Luxe Event Design Chicago', address: 'Schaumburg, IL 60173', rating: 4.5, totalRatings: 44, phone: '(847) 555-4567' },
    ],
    MEHENDI_ARTIST: [
      { name: 'Henna Heaven Chicago', address: 'Devon Ave, Chicago, IL 60659', rating: 4.8, totalRatings: 99, website: 'https://example.com', phone: '(773) 555-8901' },
    ],
    MAKEUP_HAIR: [
      { name: 'Bridal Glow Studio Chicago', address: 'Naperville, IL 60563', rating: 4.7, totalRatings: 84, website: 'https://example.com', phone: '(630) 555-5679' },
    ],
  },
  Houston: {
    CATERER: [
      { name: 'Houston Desi Catering', address: '5110 Hillcroft Ave, Houston, TX 77036', rating: 4.6, totalRatings: 77, phone: '(713) 555-1234' },
      { name: 'Curry House Events', address: '5765 Hillcroft Ave, Houston, TX 77036', rating: 4.4, totalRatings: 58, website: 'https://example.com', phone: '(713) 555-5678' },
      { name: 'Masala Catering TX', address: 'Sugar Land, TX 77478', rating: 4.7, totalRatings: 115, phone: '(281) 555-9012' },
    ],
    PHOTOGRAPHER: [
      { name: 'Houston South Asian Photos', address: 'Sugar Land, TX 77478', rating: 4.8, totalRatings: 61, website: 'https://example.com', phone: '(281) 555-2345' },
      { name: 'Texas Desi Weddings', address: 'Houston, TX 77036', rating: 4.5, totalRatings: 43, phone: '(713) 555-6789' },
    ],
    DJ: [
      { name: 'DJ Ravi Houston', address: 'Hillcroft Ave, Houston, TX 77036', rating: 4.6, totalRatings: 48, phone: '(713) 555-3456' },
      { name: 'Bollywood Beats Texas', address: 'Sugar Land, TX 77478', rating: 4.3, totalRatings: 31, phone: '(281) 555-7891' },
    ],
    DECORATOR: [
      { name: 'Texas Event Styling', address: 'Sugar Land, TX 77478', rating: 4.5, totalRatings: 36, phone: '(281) 555-4567' },
    ],
    MEHENDI_ARTIST: [
      { name: 'Houston Henna Studio', address: 'Hillcroft Ave, Houston, TX 77036', rating: 4.7, totalRatings: 72, website: 'https://example.com', phone: '(713) 555-8902' },
    ],
    MAKEUP_HAIR: [
      { name: 'Bridal Beauty Houston', address: 'Sugar Land, TX 77478', rating: 4.6, totalRatings: 55, phone: '(281) 555-5679' },
    ],
  },
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

  // Get ExternalVendor records for this city/type (rich data from Google Places Details)
  const externalVendors = await prisma.externalVendor.findMany({
    where: { city: { contains: city, mode: 'insensitive' }, vendor_type: vendorType as any, is_active: true },
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

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // No API key — use demo data
  if (!apiKey) {
    const cityData = DEMO_BUSINESSES[city] ?? DEMO_BUSINESSES['New York']
    const demos = cityData[vendorType] ?? cityData['CATERER'] ?? []
    const businesses: LocalBusiness[] = demos.map((b, i) => enrichBusiness({
      place_id: `demo_${city}_${vendorType}_${i}`,
      name: b.name,
      address: b.address,
      rating: b.rating,
      total_ratings: b.totalRatings,
      phone: b.phone ?? null,
      website: b.website ?? null,
      photo_url: null,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.address)}`,
      invited: invitedIds.has(`demo_${city}_${vendorType}_${i}`),
    }))
    return NextResponse.json({ businesses, source: 'demo' })
  }

  // Google Places Text Search
  const query = `${TYPE_QUERY[vendorType] ?? 'event catering'} in ${city}`
  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

  try {
    const placesRes = await fetch(placesUrl, { next: { revalidate: 86400 } }) // cache 24h
    const placesData = await placesRes.json()

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('[local-vendors] Google Places error:', placesData.status, placesData.error_message)
      return NextResponse.json({ businesses: [], source: 'google', error: placesData.status })
    }

    const businesses: LocalBusiness[] = (placesData.results ?? []).slice(0, 8).map((place: any) => {
      const photoRef = place.photos?.[0]?.photo_reference
      const photo_url = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
        : null

      return enrichBusiness({
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating ?? null,
        total_ratings: place.user_ratings_total ?? 0,
        phone: null,
        website: null,
        photo_url,
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        invited: invitedIds.has(place.place_id),
      })
    })

    return NextResponse.json({ businesses, source: 'google' })
  } catch (err) {
    console.error('[local-vendors] Fetch error:', err)
    return NextResponse.json({ businesses: [], source: 'error' })
  }
}
