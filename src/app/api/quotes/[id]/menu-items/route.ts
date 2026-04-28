import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { MenuCategory } from '@prisma/client'

const addItemSchema = z.object({
  menu_item_id: z.string().optional(),
  item_name: z.string().min(1),
  category: z.nativeEnum(MenuCategory),
  is_vegetarian: z.boolean().default(false),
  is_jain: z.boolean().default(false),
  is_halal: z.boolean().default(false),
  contains_nuts: z.boolean().default(false),
  contains_gluten: z.boolean().default(false),
  contains_dairy: z.boolean().default(false),
  is_optional: z.boolean().default(false),
  notes: z.string().optional(),
})

const bulkSchema = z.object({
  items: z.array(addItemSchema),
  replace: z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id, vendor_id: (session.user!.id as string), status: { in: ['DRAFT'] } },
  })
  if (!quote) return NextResponse.json({ error: 'Not found or not editable' }, { status: 404 })

  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  if (parsed.data.replace) {
    await prisma.quoteMenuItem.deleteMany({ where: { quote_id: id } })
  }

  await prisma.quoteMenuItem.createMany({
    data: parsed.data.items.map((item, i) => ({
      ...item,
      quote_id: id,
      sort_order: i,
    })),
  })

  const items = await prisma.quoteMenuItem.findMany({
    where: { quote_id: id },
    orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
  })

  return NextResponse.json(items, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const quote = await prisma.quote.findFirst({ where: { id, vendor_id: (session.user!.id as string) } })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.quoteMenuItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
