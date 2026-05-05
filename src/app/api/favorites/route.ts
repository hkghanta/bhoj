import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/favorites
 * List the authenticated customer's favorite vendors.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { customer_id: userId },
      include: {
        vendor: {
          select: {
            id: true,
            business_name: true,
            vendor_type: true,
            city: true,
            profile_photo_url: true,
            badges: {
              select: {
                id: true,
                badge_type: true,
                earned_at: true,
                expires_at: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(favorites)
  } catch (err: unknown) {
    console.error('Favorites GET error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/favorites
 * Add a vendor to the customer's favorites.
 * Body: { vendor_id: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { vendor_id } = body as { vendor_id: string }

  if (!vendor_id) {
    return NextResponse.json({ error: 'vendor_id is required' }, { status: 400 })
  }

  const existing = await prisma.favorite.findUnique({
    where: { customer_id_vendor_id: { customer_id: userId, vendor_id } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
  }

  const favorite = await prisma.favorite.create({
    data: { customer_id: userId, vendor_id },
  })

  return NextResponse.json(favorite, { status: 201 })
}
