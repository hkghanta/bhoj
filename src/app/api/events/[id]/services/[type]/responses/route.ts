import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType, customer_id: customerId },
    include: {
      responses: {
        orderBy: { created_at: 'desc' },
        include: {
          vendor: {
            select: {
              business_name: true,
              profile_photo_url: true,
              profile_type: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  })

  if (!eventRequest) return NextResponse.json({ error: 'No request found' }, { status: 404 })

  return NextResponse.json({
    public_token: eventRequest.public_token,
    public_status: eventRequest.public_status,
    responses: eventRequest.responses,
  })
}
