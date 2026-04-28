import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getChecklistTemplate } from '@/lib/checklist-templates'

const createSchema = z.object({
  event_name: z.string().min(2),
  event_type: z.string().min(2),
  event_date: z.string().datetime(),
  city: z.string().min(2),
  venue: z.string().optional(),
  guest_count: z.number().int().positive(),
  total_budget: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    where: { customer_id: (session.user!.id as string) },
    include: {
      checklist_items: true,
      _count: { select: { requests: true } },
    },
    orderBy: { event_date: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { total_budget, event_date, ...rest } = parsed.data
  const template = getChecklistTemplate(parsed.data.event_type)

  const event = await prisma.event.create({
    data: {
      ...rest,
      event_date: new Date(event_date),
      total_budget,
      customer_id: (session.user!.id as string),
      checklist_items: {
        create: template.map(item => ({
          category: item.category,
          item_name: item.item_name,
          status: 'PENDING',
        })),
      },
    },
    include: { checklist_items: true },
  })

  return NextResponse.json(event, { status: 201 })
}
