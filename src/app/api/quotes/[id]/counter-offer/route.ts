import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NegotiationAction, QuoteStatus } from '@prisma/client'

const counterOfferSchema = z.object({
  message: z.string().optional(),
  suggested_total: z.number().positive().optional(),
  suggested_per_head: z.number().positive().optional(),
  menu_changes: z.array(z.object({
    action: z.enum(['add', 'remove', 'modify']),
    item_name: z.string(),
    category: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  proposed_menu: z.any().optional(),
})

const NEGOTIABLE_STATUSES: QuoteStatus[] = ['SENT', 'VIEWED', 'NEGOTIATING']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Only customers can send counter-offers' }, { status: 403 })
  }

  const { id } = await params

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      match: { event_request: { customer_id: userId } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!NEGOTIABLE_STATUSES.includes(quote.status)) {
    return NextResponse.json(
      { error: `Cannot negotiate a quote with status ${quote.status}` },
      { status: 409 },
    )
  }

  const body = await req.json()
  const parsed = counterOfferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { message, suggested_total, suggested_per_head, menu_changes, proposed_menu } = parsed.data

  let actionType: NegotiationAction = 'MESSAGE'
  if (menu_changes || proposed_menu) {
    actionType = 'MENU_CHANGE'
  } else if (suggested_total || suggested_per_head) {
    actionType = 'COUNTER_OFFER'
  }

  const [negotiation] = await prisma.$transaction([
    prisma.quoteNegotiation.create({
      data: {
        quote_id: id,
        sender_id: userId,
        sender_type: 'CUSTOMER',
        message: message ?? null,
        suggested_total: suggested_total ?? null,
        suggested_per_head: suggested_per_head ?? null,
        menu_changes: menu_changes ?? undefined,
        proposed_menu: proposed_menu ?? undefined,
        action_type: actionType,
      },
    }),
    prisma.quote.update({
      where: { id },
      data: { status: 'NEGOTIATING' },
    }),
  ])

  return NextResponse.json(negotiation, { status: 201 })
}
