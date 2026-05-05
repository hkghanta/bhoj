import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { VendorType, BadgeType, Prisma } from '@prisma/client'

/**
 * GET /api/vendors/search
 * Advanced vendor search. Public endpoint (no auth required).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const q = searchParams.get('q')
  const vendorType = searchParams.get('vendor_type')
  const city = searchParams.get('city')
  const minRating = searchParams.get('min_rating')
  const maxPrice = searchParams.get('max_price')
  const badges = searchParams.get('badges')
  const hasAvailability = searchParams.get('has_availability')
  const isVerified = searchParams.get('is_verified')
  const sort = searchParams.get('sort') || 'rating'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

  // Build where conditions
  const where: Prisma.VendorWhereInput = {
    is_active: true,
  }

  const andConditions: Prisma.VendorWhereInput[] = []

  // Text search
  if (q) {
    andConditions.push({
      OR: [
        { business_name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  // Vendor type filter
  if (vendorType) {
    const validType = Object.values(VendorType).find(t => t === vendorType)
    if (validType) {
      andConditions.push({ vendor_type: validType })
    }
  }

  // City filter
  if (city) {
    andConditions.push({ city: { contains: city, mode: 'insensitive' } })
  }

  // Verified filter
  if (isVerified !== null && isVerified !== undefined) {
    andConditions.push({ is_verified: isVerified === 'true' })
  }

  // Badges filter
  if (badges) {
    const badgeList = badges.split(',').filter(b => Object.values(BadgeType).includes(b as BadgeType)) as BadgeType[]
    if (badgeList.length > 0) {
      andConditions.push({
        badges: { some: { badge_type: { in: badgeList } } },
      })
    }
  }

  // Availability filter
  if (hasAvailability) {
    const availDate = new Date(hasAvailability)
    if (!isNaN(availDate.getTime())) {
      andConditions.push({
        availability: {
          some: {
            date: availDate,
            is_available: true,
          },
        },
      })
    }
  }

  // Max price filter (check menu_packages price_per_head)
  if (maxPrice) {
    const maxPriceNum = parseFloat(maxPrice)
    if (!isNaN(maxPriceNum)) {
      andConditions.push({
        menu_packages: {
          some: {
            is_active: true,
            price_per_head: { lte: maxPriceNum },
          },
        },
      })
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  // Get total count for pagination
  const total = await prisma.vendor.count({ where })

  const skip = (page - 1) * limit

  // Determine orderBy
  let orderBy: Prisma.VendorOrderByWithRelationInput = { created_at: 'desc' }
  if (sort === 'name') {
    orderBy = { business_name: 'asc' }
  } else if (sort === 'newest') {
    orderBy = { created_at: 'desc' }
  }
  // For 'rating' and 'price' sorts, we apply post-query sorting

  const rawVendors = await prisma.vendor.findMany({
    where,
    select: {
      id: true,
      business_name: true,
      vendor_type: true,
      city: true,
      profile_photo_url: true,
      description: true,
      is_verified: true,
      created_at: true,
      reviews: {
        select: { overall_rating: true },
      },
      badges: {
        select: { badge_type: true },
      },
      menu_packages: {
        where: { is_active: true },
        select: { price_per_head: true },
        orderBy: { price_per_head: 'asc' },
        take: 1,
      },
    },
    orderBy: sort === 'name' || sort === 'newest' ? orderBy : { created_at: 'desc' },
    // For rating/price sorts we fetch all matching then sort & paginate in memory
    ...(sort === 'rating' || sort === 'price'
      ? {}
      : { skip, take: limit }),
  })

  // Compute avg_rating and review_count
  let vendors = rawVendors.map(v => {
    const reviewCount = v.reviews.length
    const avgRating = reviewCount > 0
      ? Math.round((v.reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviewCount) * 100) / 100
      : null

    return {
      id: v.id,
      business_name: v.business_name,
      vendor_type: v.vendor_type,
      city: v.city,
      profile_photo_url: v.profile_photo_url,
      description: v.description,
      avg_rating: avgRating,
      review_count: reviewCount,
      badges: v.badges.map(b => b.badge_type),
      is_verified: v.is_verified,
      starting_price: v.menu_packages[0]?.price_per_head ? Number(v.menu_packages[0].price_per_head) : null,
    }
  })

  // Filter by min_rating (post-query since it requires aggregation)
  if (minRating) {
    const minRatingNum = parseFloat(minRating)
    if (!isNaN(minRatingNum)) {
      vendors = vendors.filter(v => v.avg_rating !== null && v.avg_rating >= minRatingNum)
    }
  }

  // Sort by rating or price (in-memory)
  if (sort === 'rating') {
    vendors.sort((a, b) => {
      if (a.avg_rating === null && b.avg_rating === null) return 0
      if (a.avg_rating === null) return 1
      if (b.avg_rating === null) return -1
      return b.avg_rating - a.avg_rating
    })
  } else if (sort === 'price') {
    vendors.sort((a, b) => {
      if (a.starting_price === null && b.starting_price === null) return 0
      if (a.starting_price === null) return 1
      if (b.starting_price === null) return -1
      return a.starting_price - b.starting_price
    })
  }

  // Apply pagination for in-memory sorted results
  const finalTotal = sort === 'rating' || sort === 'price' || minRating
    ? vendors.length
    : total

  if (sort === 'rating' || sort === 'price' || minRating) {
    vendors = vendors.slice(skip, skip + limit)
  }

  const pages = Math.ceil(finalTotal / limit)

  return NextResponse.json({
    vendors,
    pagination: {
      total: finalTotal,
      page,
      limit,
      pages,
    },
  })
}
