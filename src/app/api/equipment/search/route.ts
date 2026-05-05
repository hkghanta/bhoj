import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }

  const equipment = await prisma.vendorEquipment.findMany({
    where: {
      is_active: true,
      ...(type ? { equipment_key: type } : {}),
      vendor: {
        is_active: true,
        city: { equals: city, mode: 'insensitive' },
      },
    },
    include: {
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

  return NextResponse.json(equipment)
}
