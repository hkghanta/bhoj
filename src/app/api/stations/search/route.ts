import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const guests = searchParams.get('guests')
  const city = searchParams.get('city')

  if (!type || !city) {
    return NextResponse.json(
      { error: 'type and city are required' },
      { status: 400 },
    )
  }

  const guestCount = guests ? parseInt(guests, 10) : undefined

  const stations = await prisma.vendorStation.findMany({
    where: {
      is_active: true,
      station_template: { station_key: type },
      vendor: {
        is_active: true,
        city: { equals: city, mode: 'insensitive' },
      },
      ...(guestCount !== undefined
        ? {
            AND: [
              { OR: [{ min_guests: null }, { min_guests: { lte: guestCount } }] },
              { OR: [{ max_guests: null }, { max_guests: { gte: guestCount } }] },
            ],
          }
        : {}),
    },
    include: {
      station_template: true,
      vendor: {
        select: {
          id: true,
          business_name: true,
          city: true,
          profile_photo_url: true,
          is_verified: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(stations)
}
