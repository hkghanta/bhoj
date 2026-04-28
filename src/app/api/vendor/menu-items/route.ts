import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { MenuCategory, SpiceLevel } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(MenuCategory),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_jain: z.boolean().default(false),
  is_halal: z.boolean().default(false),
  is_kosher: z.boolean().default(false),
  contains_nuts: z.boolean().default(false),
  contains_gluten: z.boolean().default(false),
  contains_dairy: z.boolean().default(false),
  contains_eggs: z.boolean().default(false),
  contains_soy: z.boolean().default(false),
  contains_shellfish: z.boolean().default(false),
  spice_level: z.nativeEnum(SpiceLevel).default('MEDIUM'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.menuItem.findMany({
    where: { vendor_id: (session.user!.id as string), is_active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(items)
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

  const item = await prisma.menuItem.create({
    data: { ...parsed.data, vendor_id: (session.user!.id as string) },
  })

  return NextResponse.json(item, { status: 201 })
}
