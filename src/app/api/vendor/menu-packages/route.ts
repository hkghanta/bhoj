import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_per_head: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
  min_guests: z.number().int().positive().optional(),
  max_guests: z.number().int().positive().optional(),
  cuisine_type: z.string().optional(),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_jain: z.boolean().default(false),
  is_halal: z.boolean().default(false),
  nut_free: z.boolean().default(false),
  gluten_free: z.boolean().default(false),
  dairy_free: z.boolean().default(false),
  includes_service: z.boolean().default(false),
  includes_setup: z.boolean().default(false),
  item_ids: z.array(z.string()).default([]),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const packages = await prisma.menuPackage.findMany({
    where: { vendor_id: (session.user!.id as string), is_active: true },
    include: {
      items: {
        include: { menu_item: true },
        orderBy: { sort_order: 'asc' },
      },
    },
    orderBy: { price_per_head: 'asc' },
  })

  return NextResponse.json(packages)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { item_ids, ...rest } = parsed.data

  const pkg = await prisma.menuPackage.create({
    data: {
      ...rest,
      vendor_id: (session.user!.id as string),
      items: {
        create: item_ids.map((menu_item_id, i) => ({
          menu_item_id,
          sort_order: i,
        })),
      },
    },
    include: { items: { include: { menu_item: true } } },
  })

  return NextResponse.json(pkg, { status: 201 })
}
