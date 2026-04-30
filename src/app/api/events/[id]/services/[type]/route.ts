import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rankVendors, type VendorForRanking } from '@/lib/matching/rank-vendors'
import { VendorType } from '@prisma/client'

const SLUG_TO_TYPE: Record<string, VendorType> = {
  catering: VendorType.CATERER,
  photographer: VendorType.PHOTOGRAPHER,
  videographer: VendorType.VIDEOGRAPHER,
  decorator: VendorType.DECORATOR,
  dj: VendorType.DJ,
  florist: VendorType.FLORIST,
  'mehendi-artist': VendorType.MEHENDI_ARTIST,
  'makeup-hair': VendorType.MAKEUP_HAIR,
  transport: VendorType.TRANSPORT,
  'tent-marquee': VendorType.TENT_MARQUEE,
  'dhol-player': VendorType.DHOL_PLAYER,
  'live-band': VendorType.LIVE_BAND,
  'classical-musician': VendorType.CLASSICAL_MUSICIAN,
  choreographer: VendorType.CHOREOGRAPHER,
  'pandit-officiant': VendorType.PANDIT_OFFICIANT,
  'mc-host': VendorType.MC_HOST,
  bartender: VendorType.BARTENDER,
  'chai-station': VendorType.CHAI_STATION,
  'games-entertainment': VendorType.GAMES_ENTERTAINMENT,
  'invitation-designer': VendorType.INVITATION_DESIGNER,
  'furniture-rental': VendorType.FURNITURE_RENTAL,
  'equipment-rental': VendorType.EQUIPMENT_RENTAL,
}

type Params = { id: string; type: string }

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true, city: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const serviceConfig = await prisma.serviceConfig.findUnique({
    where: { vendor_type: vendorType },
  })
  if (!serviceConfig || !serviceConfig.is_enabled) {
    return NextResponse.json({ error: 'Service not available' }, { status: 404 })
  }

  const eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
    include: {
      menu_preference: true,
      matches: { select: { id: true } },
      responses: { select: { id: true } },
    },
  })

  const rawVendors = await prisma.vendor.findMany({
    where: { vendor_type: vendorType, is_active: true },
    select: {
      id: true,
      business_name: true,
      city: true,
      vendor_type: true,
      is_verified: true,
      profile_photo_url: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      menu_packages: {
        where: { is_active: true },
        select: { is_halal: true, is_jain: true, cuisine_type: true },
      },
      metrics: {
        orderBy: { period: 'desc' },
        take: 1,
        select: { avg_rating: true },
      },
    },
  })

  const vendors: VendorForRanking[] = rawVendors.map(v => ({
    id: v.id,
    business_name: v.business_name,
    city: v.city,
    vendor_type: v.vendor_type,
    avg_rating: v.metrics[0]?.avg_rating ? Number(v.metrics[0].avg_rating) : null,
    is_verified: v.is_verified,
    menu_packages: v.menu_packages.map(p => ({
      is_halal: p.is_halal,
      is_jain: p.is_jain,
      cuisine_type: p.cuisine_type,
    })),
  }))

  const requirements: { city?: string; is_halal?: boolean; is_jain?: boolean; cuisines?: string[] } = {
    city: event.city,
  }
  if (eventRequest?.menu_preference) {
    const mp = eventRequest.menu_preference
    requirements.is_halal = mp.is_halal
    requirements.is_jain = mp.is_jain
    requirements.cuisines = mp.cuisine_preferences
  }

  const ranked = rankVendors(vendors, requirements)

  const vendorDetails = rawVendors.reduce<Record<string, typeof rawVendors[0]>>((acc, v) => {
    acc[v.id] = v
    return acc
  }, {})

  const rankedWithDetails = ranked.map(v => ({
    ...v,
    profile_photo_url: vendorDetails[v.id]?.profile_photo_url ?? null,
    profile_type: vendorDetails[v.id]?.profile_type ?? null,
    first_name: vendorDetails[v.id]?.first_name ?? null,
    last_name: vendorDetails[v.id]?.last_name ?? null,
  }))

  return NextResponse.json({
    service_config: serviceConfig,
    event_request: eventRequest ? {
      id: eventRequest.id,
      service_notes: eventRequest.service_notes,
      public_token: eventRequest.public_token,
      public_status: eventRequest.public_status,
      menu_preference: eventRequest.menu_preference,
      match_count: eventRequest.matches.length,
      response_count: eventRequest.responses.length,
    } : null,
    vendors: rankedWithDetails,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const body = await req.json()

  let eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
  })

  if (!eventRequest) {
    eventRequest = await prisma.eventRequest.create({
      data: {
        event_id: eventId,
        customer_id: customerId,
        vendor_type: vendorType,
        status: 'OPEN',
        service_notes: body.service_notes ?? null,
      },
    })
  } else {
    eventRequest = await prisma.eventRequest.update({
      where: { id: eventRequest.id },
      data: { service_notes: body.service_notes ?? null },
    })
  }

  if (vendorType === VendorType.CATERER && body.catering_prefs) {
    const cp = body.catering_prefs
    const prefData = {
      event_id: eventId,
      caterer_request_id: eventRequest.id,
      menu_mode: cp.menu_mode ?? 'CATERER_PROPOSES',
      cuisine_preferences: cp.cuisines ?? [],
      service_style: (cp.service_styles ?? []).join(',') || null,
      special_notes: cp.special_notes ?? null,
      pricing_preference: cp.pricing_preference ?? 'NO_PREFERENCE',
      customer_tray_requests: cp.customer_tray_requests ?? [],
      is_vegetarian: cp.dietary_type === 'vegetarian' || cp.dietary_type === 'vegan',
      is_vegan: cp.dietary_type === 'vegan',
      is_halal: cp.is_halal ?? false,
      is_jain: cp.is_jain ?? false,
      is_kosher: cp.is_kosher ?? false,
      nut_free: cp.nut_free ?? false,
      gluten_free: cp.gluten_free ?? false,
      dairy_free: cp.dairy_free ?? false,
      egg_free: cp.egg_free ?? false,
    }
    const existing = await prisma.eventMenuPreference.findFirst({ where: { event_id: eventId } })
    if (existing) {
      await prisma.eventMenuPreference.update({ where: { id: existing.id }, data: prefData })
    } else {
      await prisma.eventMenuPreference.create({ data: prefData })
    }
  }

  return NextResponse.json({ id: eventRequest.id })
}
