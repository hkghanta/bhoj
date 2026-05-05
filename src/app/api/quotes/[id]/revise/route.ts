import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reviseSchema = z.object({
  total_estimate: z.number().positive().optional(),
  price_per_head: z.number().positive().optional(),
  proposed_menu: z.any().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Only vendors can revise quotes' }, { status: 403 })
  }

  const { id } = await params

  const quote = await prisma.quote.findFirst({
    where: { id, vendor_id: userId },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (quote.status !== 'NEGOTIATING') {
    return NextResponse.json(
      { error: `Cannot revise a quote with status ${quote.status}` },
      { status: 409 },
    )
  }

  const body = await req.json()
  const parsed = reviseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { total_estimate, price_per_head, proposed_menu, notes } = parsed.data

  const quoteUpdateData: Record<string, unknown> = { status: 'SENT' }
  if (total_estimate !== undefined) quoteUpdateData.total_estimate = total_estimate
  if (price_per_head !== undefined) quoteUpdateData.price_per_head = price_per_head
  if (notes !== undefined) quoteUpdateData.notes = notes

  const [, updatedQuote] = await prisma.$transaction([
    prisma.quoteNegotiation.create({
      data: {
        quote_id: id,
        sender_id: userId,
        sender_type: 'VENDOR',
        message: notes ?? null,
        suggested_total: total_estimate ?? null,
        suggested_per_head: price_per_head ?? null,
        proposed_menu: proposed_menu ?? undefined,
        action_type: 'REVISION',
      },
    }),
    prisma.quote.update({
      where: { id },
      data: quoteUpdateData,
      include: {
        vendor: true,
        menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
        tray_lines: { orderBy: { sort_order: 'asc' } },
        negotiations: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    }),
  ])

  return NextResponse.json(updatedQuote)
}
