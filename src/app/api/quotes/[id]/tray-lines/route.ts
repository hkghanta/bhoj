import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const lineSchema = z.object({
  item_name:   z.string().min(1),
  serves_note: z.string().optional(),
  unit_price:  z.number().positive(),
  qty:         z.number().int().min(1),
})

const bodySchema = z.object({
  lines:          z.array(lineSchema).min(1),
  discount_type:  z.enum(['FLAT', 'PERCENTAGE']).nullable().optional(),
  discount_value: z.number().nonnegative().nullable().optional(),
  discount_note:  z.string().nullable().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id, vendor_id: session.user!.id as string },
  })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { lines, discount_type, discount_value, discount_note } = parsed.data

  // Calculate totals
  const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.qty, 0)
  let discount = 0
  if (discount_type === 'FLAT' && discount_value) {
    discount = Math.min(discount_value, subtotal)
  } else if (discount_type === 'PERCENTAGE' && discount_value) {
    discount = subtotal * (discount_value / 100)
  }
  const total = Math.max(0, subtotal - discount)

  await prisma.$transaction([
    prisma.quoteTrayLine.deleteMany({ where: { quote_id: id } }),
    prisma.quoteTrayLine.createMany({
      data: lines.map((l, i) => ({
        quote_id:    id,
        item_name:   l.item_name,
        serves_note: l.serves_note ?? null,
        unit_price:  l.unit_price,
        qty:         l.qty,
        line_total:  l.unit_price * l.qty,
        sort_order:  i,
      })),
    }),
    prisma.quote.update({
      where: { id },
      data: {
        pricing_type:   'PER_TRAY',
        total_estimate: total,
        discount_type:  discount_type ?? null,
        discount_value: discount_value ?? null,
        discount_note:  discount_note ?? null,
        price_per_head: null,
      },
    }),
  ])

  const updated = await prisma.quote.findUnique({
    where: { id },
    include: { tray_lines: { orderBy: { sort_order: 'asc' } } },
  })
  return NextResponse.json(updated)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const lines = await prisma.quoteTrayLine.findMany({
    where: { quote_id: id },
    orderBy: { sort_order: 'asc' },
  })
  return NextResponse.json(lines)
}
