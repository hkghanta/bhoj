import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  vendor_type: z.enum([
    'CATERER', 'DESSERT_VENDOR', 'BARTENDER', 'CHAI_STATION', 'FOOD_TRUCK',
    'DECORATOR', 'FLORIST', 'TENT_MARQUEE', 'LIGHTING', 'FURNITURE_RENTAL',
    'EQUIPMENT_RENTAL', 'DJ', 'LIVE_BAND', 'DHOL_PLAYER', 'CLASSICAL_MUSICIAN',
    'GAMES_ENTERTAINMENT', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'MEHENDI_ARTIST',
    'MAKEUP_HAIR', 'CHOREOGRAPHER', 'PANDIT_OFFICIANT', 'INVITATION_DESIGNER',
    'TRANSPORT', 'SECURITY', 'MC_HOST', 'EVENT_MANAGER',
  ]),
  price_type: z.enum(['FLAT', 'PER_PERSON', 'HOURLY']).default('FLAT'),
  price: z.number().positive(),
  min_guests: z.number().int().positive().optional(),
  max_guests: z.number().int().positive().optional(),
  min_hours: z.number().int().positive().optional(),
  includes: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  advance_notice_hours: z.number().int().min(0).default(72),
})

/**
 * GET /api/vendor/instant-book
 * List vendor's instant book packages.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const packages = await prisma.instantBookPackage.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(packages)
}

/**
 * POST /api/vendor/instant-book
 * Create an instant book package.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  if (data.min_guests != null && data.max_guests != null && data.min_guests > data.max_guests) {
    return NextResponse.json({ error: 'min_guests cannot exceed max_guests' }, { status: 400 })
  }

  const pkg = await prisma.instantBookPackage.create({
    data: {
      vendor_id: userId,
      name: data.name,
      description: data.description ?? null,
      vendor_type: data.vendor_type,
      price_type: data.price_type,
      price: data.price,
      min_guests: data.min_guests ?? null,
      max_guests: data.max_guests ?? null,
      min_hours: data.min_hours ?? null,
      includes: (data.includes ?? null) as any,
      photos: data.photos ?? [],
      advance_notice_hours: data.advance_notice_hours,
    },
  })

  return NextResponse.json(pkg, { status: 201 })
}
