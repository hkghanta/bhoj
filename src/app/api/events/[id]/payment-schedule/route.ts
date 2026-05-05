import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const installmentSchema = z.object({
  amount: z.number().positive(),
  due_date: z.string().datetime(),
})

const createSchema = z.object({
  quote_id: z.string(),
  installments: z.array(installmentSchema).min(1),
})

/**
 * GET /api/events/[id]/payment-schedule
 * Get payment schedule for an event's accepted quote. Customer only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const schedules = await prisma.paymentSchedule.findMany({
    where: { event_id: id, customer_id: userId },
    include: {
      installments: {
        orderBy: { due_date: 'asc' },
      },
      quote: {
        select: { id: true, total_estimate: true, status: true, vendor: { select: { id: true, business_name: true } } },
      },
    },
  })

  return NextResponse.json({ schedules })
}

/**
 * POST /api/events/[id]/payment-schedule
 * Create payment schedule for an accepted quote. Customer only.
 * Returns 409 if schedule already exists for that quote.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { quote_id, installments } = parsed.data

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Verify quote exists, is ACCEPTED, and belongs to this event
  const quote = await prisma.quote.findUnique({
    where: { id: quote_id },
    include: {
      match: {
        include: {
          event_request: { select: { event_id: true } },
        },
      },
    },
  })

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (quote.match.event_request.event_id !== id) {
    return NextResponse.json({ error: 'Quote does not belong to this event' }, { status: 400 })
  }

  if (quote.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Quote must be in ACCEPTED status' }, { status: 400 })
  }

  // Check for existing schedule
  const existing = await prisma.paymentSchedule.findUnique({
    where: { quote_id },
  })

  if (existing) {
    return NextResponse.json({ error: 'Payment schedule already exists for this quote' }, { status: 409 })
  }

  // Validate total matches quote
  const installmentTotal = installments.reduce((sum, inst) => sum + inst.amount, 0)
  const quoteTotal = Number(quote.total_estimate)

  if (Math.abs(installmentTotal - quoteTotal) > 0.01) {
    return NextResponse.json(
      { error: `Installment total (${installmentTotal}) does not match quote total (${quoteTotal})` },
      { status: 400 }
    )
  }

  const schedule = await prisma.paymentSchedule.create({
    data: {
      customer_id: userId,
      quote_id,
      event_id: id,
      total_amount: new Decimal(quoteTotal),
      installments: {
        create: installments.map((inst) => ({
          amount: new Decimal(inst.amount),
          due_date: new Date(inst.due_date),
        })),
      },
    },
    include: {
      installments: {
        orderBy: { due_date: 'asc' },
      },
    },
  })

  return NextResponse.json({ schedule }, { status: 201 })
}
