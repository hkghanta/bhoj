import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
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

const bodySchema = z.object({ vendor_id: z.string() })

type Params = { id: string; type: string }

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
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })

  const vendor = await prisma.vendor.findUnique({
    where: { id: parsed.data.vendor_id },
    select: { id: true, vendor_type: true },
  })
  if (!vendor || vendor.vendor_type !== vendorType) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  let eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
  })
  if (!eventRequest) {
    eventRequest = await prisma.eventRequest.create({
      data: { event_id: eventId, customer_id: customerId, vendor_type: vendorType, status: 'OPEN' },
    })
  }

  const existingMatch = await prisma.match.findFirst({
    where: { event_request_id: eventRequest.id, vendor_id: vendor.id },
  })
  if (!existingMatch) {
    await prisma.match.create({
      data: {
        event_request_id: eventRequest.id,
        vendor_id: vendor.id,
        vendor_type: vendorType,
        score: 0,
        rank: 1,
        status: 'PENDING',
      },
    })
  }

  return NextResponse.json({ event_request_id: eventRequest.id })
}
