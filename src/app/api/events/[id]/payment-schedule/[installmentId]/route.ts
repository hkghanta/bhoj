import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  stripe_payment_id: z.string().optional(),
})

/**
 * PATCH /api/events/[id]/payment-schedule/[installmentId]
 * Mark installment as paid. Customer only. Validates event ownership.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, installmentId } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify installment exists and belongs to this event via schedule
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: {
      schedule: { select: { event_id: true, customer_id: true } },
    },
  })

  if (!installment) {
    return NextResponse.json({ error: 'Installment not found' }, { status: 404 })
  }

  if (installment.schedule.event_id !== id || installment.schedule.customer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (installment.status === 'PAID') {
    return NextResponse.json({ error: 'Installment is already paid' }, { status: 400 })
  }

  const updated = await prisma.installment.update({
    where: { id: installmentId },
    data: {
      status: 'PAID',
      paid_at: new Date(),
      ...(parsed.data.stripe_payment_id && { stripe_payment_id: parsed.data.stripe_payment_id }),
    },
  })

  return NextResponse.json({ installment: updated })
}
