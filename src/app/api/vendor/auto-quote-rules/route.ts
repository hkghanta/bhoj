import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  event_types: z.array(z.string()).min(1, 'At least one event type is required'),
  guest_count_min: z.number().int().positive().nullish(),
  guest_count_max: z.number().int().positive().nullish(),
  cuisine_match: z.array(z.string()).default([]),
  menu_package_id: z.string().nullish(),
  markup_percent: z.number().min(0).max(100).default(0),
  include_delivery: z.boolean().default(false),
  auto_message: z.string().nullish(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rules = await prisma.autoQuoteRule.findMany({
    where: { vendor_id: userId },
    include: {
      menu_package: {
        select: { id: true, name: true, price_per_head: true },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Validate guest count range
  if (data.guest_count_min != null && data.guest_count_max != null) {
    if (data.guest_count_min > data.guest_count_max) {
      return NextResponse.json(
        { error: 'guest_count_min cannot exceed guest_count_max' },
        { status: 400 },
      )
    }
  }

  // Validate menu_package_id belongs to this vendor
  if (data.menu_package_id) {
    const pkg = await prisma.menuPackage.findFirst({
      where: { id: data.menu_package_id, vendor_id: userId, is_active: true },
    })
    if (!pkg) {
      return NextResponse.json(
        { error: 'Menu package not found or does not belong to you' },
        { status: 400 },
      )
    }
  }

  const rule = await prisma.autoQuoteRule.create({
    data: {
      vendor_id: userId,
      name: data.name,
      event_types: data.event_types,
      guest_count_min: data.guest_count_min ?? null,
      guest_count_max: data.guest_count_max ?? null,
      cuisine_match: data.cuisine_match,
      menu_package_id: data.menu_package_id ?? null,
      markup_percent: data.markup_percent,
      include_delivery: data.include_delivery,
      auto_message: data.auto_message ?? null,
    },
    include: {
      menu_package: {
        select: { id: true, name: true, price_per_head: true },
      },
    },
  })

  return NextResponse.json(rule, { status: 201 })
}
