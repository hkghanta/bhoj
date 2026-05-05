import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const role = searchParams.get('role')
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }

  const listings = await prisma.vendorStaffListing.findMany({
    where: {
      is_active: true,
      ...(role ? { staff_role_key: role } : {}),
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

  return NextResponse.json(listings)
}
