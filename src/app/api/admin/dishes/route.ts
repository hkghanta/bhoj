import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/dishes?tab=pending|global&q=...
export async function GET(req: Request) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') ?? 'pending'
  const q = searchParams.get('q')

  if (tab === 'global') {
    const items = await prisma.globalDish.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  }

  // Default: pending vendor suggestions
  const pending = await prisma.menuItem.findMany({
    where: { pending_review: true },
    include: { vendor: { select: { business_name: true } } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(pending)
}

// POST /api/admin/dishes — create a new GlobalDish
export async function POST(req: Request) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const item = await prisma.globalDish.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      category: body.category,
      spice_level: body.spice_level ?? 'MEDIUM',
      is_vegetarian: body.is_vegetarian ?? false,
      is_vegan: body.is_vegan ?? false,
      is_jain: body.is_jain ?? false,
      is_halal: body.is_halal ?? false,
      contains_nuts: body.contains_nuts ?? false,
      contains_gluten: body.contains_gluten ?? false,
      contains_dairy: body.contains_dairy ?? false,
      contains_eggs: body.contains_eggs ?? false,
      proteins: body.proteins ?? [],
      cuisine_type: body.cuisine_type ?? null,
      ingredients: body.ingredients ?? [],
      history: body.history ?? null,
      nutrition: body.nutrition ?? undefined,
      active: true,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
