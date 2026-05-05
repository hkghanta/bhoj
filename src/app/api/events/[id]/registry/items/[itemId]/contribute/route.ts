import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const contributeSchema = z.object({
  amount: z.number().positive(),
  guest_name: z.string().optional(),
  message: z.string().optional(),
  is_anonymous: z.boolean().optional(),
})

/**
 * POST /api/events/[id]/registry/items/[itemId]/contribute
 * Contribute to a gift/cash fund item.
 * Links customer_id if logged in. Updates current_amount and is_fulfilled.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params

  // Auth is optional -- guests can contribute without an account
  const session = await auth()
  const userId = session?.user?.id as string | undefined

  // Verify registry is published and item belongs to it
  const item = await prisma.giftRegistryItem.findFirst({
    where: {
      id: itemId,
      registry: {
        event_id: id,
        is_published: true,
      },
    },
    select: {
      id: true,
      target_amount: true,
      current_amount: true,
      is_fulfilled: true,
    },
  })

  if (!item) {
    return NextResponse.json({ error: 'Item not found or registry not published' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = contributeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, guest_name, message, is_anonymous } = parsed.data
  const amountDecimal = new Decimal(amount)
  const newCurrentAmount = item.current_amount.add(amountDecimal)
  const isFulfilled = item.target_amount ? newCurrentAmount.gte(item.target_amount) : false

  // Create contribution and update item in a transaction
  const [contribution] = await prisma.$transaction([
    prisma.giftContribution.create({
      data: {
        item_id: itemId,
        customer_id: userId ?? null,
        guest_name: guest_name ?? null,
        amount: amountDecimal,
        message: message ?? null,
        is_anonymous: is_anonymous ?? false,
      },
    }),
    prisma.giftRegistryItem.update({
      where: { id: itemId },
      data: {
        current_amount: newCurrentAmount,
        is_fulfilled: isFulfilled,
      },
    }),
  ])

  return NextResponse.json({ contribution, current_amount: newCurrentAmount, is_fulfilled: isFulfilled }, { status: 201 })
}
