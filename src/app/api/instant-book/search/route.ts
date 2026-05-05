import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { VendorType } from '@prisma/client'

/**
 * GET /api/instant-book/search
 * Public search for instant book packages.
 * Query params: vendor_type, city, min_guests, max_guests, max_price, sort (price|newest), page, limit
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams

  const vendorType = url.get('vendor_type') as VendorType | null
  const city = url.get('city')
  const minGuests = url.get('min_guests') ? Number(url.get('min_guests')) : null
  const maxGuests = url.get('max_guests') ? Number(url.get('max_guests')) : null
  const maxPrice = url.get('max_price') ? Number(url.get('max_price')) : null
  const sort = url.get('sort') || 'newest'
  const page = Math.max(1, Number(url.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, Number(url.get('limit') || '20')))
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    is_active: true,
    vendor: { is_active: true },
  }

  if (vendorType) where.vendor_type = vendorType
  if (city) where.vendor = { ...where.vendor, city: { equals: city, mode: 'insensitive' } }
  if (maxPrice != null) where.price = { lte: maxPrice }
  if (minGuests != null) {
    where.OR = [
      { max_guests: { gte: minGuests } },
      { max_guests: null },
    ]
  }
  if (maxGuests != null) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { min_guests: { lte: maxGuests } },
          { min_guests: null },
        ],
      },
    ]
  }

  const orderBy = sort === 'price'
    ? { price: 'asc' as const }
    : { created_at: 'desc' as const }

  const [packages, total] = await Promise.all([
    prisma.instantBookPackage.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            business_name: true,
            vendor_type: true,
            city: true,
            country: true,
            profile_photo_url: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.instantBookPackage.count({ where }),
  ])

  return NextResponse.json({
    data: packages,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
}
