import { NextRequest, NextResponse } from 'next/server'
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
  'dessert-vendor': VendorType.DESSERT_VENDOR,
  'food-truck': VendorType.FOOD_TRUCK,
  lighting: VendorType.LIGHTING,
  security: VendorType.SECURITY,
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const serviceSlug = searchParams.get('service')
  const city = searchParams.get('city')

  if (!serviceSlug || !city) {
    return NextResponse.json({ error: 'service and city params required' }, { status: 400 })
  }

  const vendorType = SLUG_TO_TYPE[serviceSlug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const rawVendors = await prisma.vendor.findMany({
    where: {
      vendor_type: vendorType,
      is_active: true,
      city: { contains: city, mode: 'insensitive' },
    },
    select: {
      id: true,
      business_name: true,
      city: true,
      country: true,
      vendor_type: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      profile_photo_url: true,
      is_verified: true,
      description: true,
      metrics: {
        orderBy: { period: 'desc' },
        take: 1,
        select: { avg_rating: true },
      },
      menu_packages: {
        where: { is_active: true },
        select: { price_per_head: true, currency: true },
        orderBy: { price_per_head: 'asc' },
        take: 1,
      },
    },
    take: 50,
  })

  // Sort: verified first, then by avg_rating desc
  const vendors = rawVendors
    .map(v => ({
      id: v.id,
      business_name: v.business_name,
      city: v.city,
      country: v.country,
      vendor_type: v.vendor_type,
      profile_type: v.profile_type,
      first_name: v.first_name,
      last_name: v.last_name,
      profile_photo_url: v.profile_photo_url,
      is_verified: v.is_verified,
      description: v.description,
      avg_rating: v.metrics[0]?.avg_rating ? Number(v.metrics[0].avg_rating) : null,
      starting_price: v.menu_packages[0]?.price_per_head ? Number(v.menu_packages[0].price_per_head) : null,
      currency: v.menu_packages[0]?.currency ?? 'USD',
    }))
    .sort((a, b) => {
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1
      if (a.avg_rating !== b.avg_rating) {
        if (a.avg_rating === null) return 1
        if (b.avg_rating === null) return -1
        return b.avg_rating - a.avg_rating
      }
      return 0
    })

  return NextResponse.json(vendors)
}
