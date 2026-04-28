import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QuoteStatus } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      ...(role === 'vendor' ? { vendor_id: (session.user!.id as string) } : {
        match: { event_request: { event: { customer_id: (session.user!.id as string) } } },
      }),
    },
    include: {
      vendor: true,
      menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
      match: {
        include: {
          event_request: {
            include: {
              event: true,
              menu_preference: true,
            },
          },
        },
      },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'customer' && quote.status === 'SENT') {
    await prisma.quote.update({ where: { id }, data: { status: 'VIEWED' } })
  }

  return NextResponse.json(quote)
}

const updateSchema = z.object({
  price_per_head: z.number().positive().optional(),
  total_estimate: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
  tasting_offered: z.boolean().optional(),
  tasting_cost: z.number().nonnegative().optional().nullable(),
  tasting_date: z.string().datetime().optional().nullable(),
  tasting_location: z.string().optional().nullable(),
  status: z.nativeEnum(QuoteStatus).optional(),
  expires_at: z.string().datetime().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      ...(role === 'vendor' ? { vendor_id: (session.user!.id as string) } : {
        match: { event_request: { event: { customer_id: (session.user!.id as string) } } },
      }),
    },
  })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  if (role === 'customer') {
    const allowedStatuses: QuoteStatus[] = ['ACCEPTED', 'DECLINED']
    if (parsed.data.status && !allowedStatuses.includes(parsed.data.status)) {
      return NextResponse.json({ error: 'Customers can only accept or decline quotes' }, { status: 403 })
    }
    const updated = await prisma.quote.update({
      where: { id },
      data: { status: parsed.data.status },
    })
    return NextResponse.json(updated)
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.tasting_date) data.tasting_date = new Date(parsed.data.tasting_date)
  if (parsed.data.expires_at) data.expires_at = new Date(parsed.data.expires_at)

  const updated = await prisma.quote.update({ where: { id }, data })
  return NextResponse.json(updated)
}
