import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/events/[id]/spend
 * Event-level spend summary: total spent, breakdown by vendor.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
    select: { id: true, event_name: true, total_budget: true, currency: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get all accepted quotes for this event
  const acceptedQuotes = await prisma.quote.findMany({
    where: {
      status: 'ACCEPTED',
      match: { event_request: { event_id: id } },
    },
    select: {
      total_estimate: true,
      currency: true,
      vendor: { select: { id: true, business_name: true, vendor_type: true } },
    },
  })

  const byVendor = acceptedQuotes.map(q => ({
    vendor_id: q.vendor.id,
    vendor_name: q.vendor.business_name,
    vendor_type: q.vendor.vendor_type,
    amount: Number(q.total_estimate),
    currency: q.currency,
  }))

  const totalSpent = byVendor.reduce((sum, v) => sum + v.amount, 0)

  // Get payment schedule progress
  const schedules = await prisma.paymentSchedule.findMany({
    where: { event_id: id },
    include: { installments: { select: { amount: true, status: true } } },
  })
  const totalPaid = schedules
    .flatMap(s => s.installments)
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  return NextResponse.json({
    event_name: event.event_name,
    budget: Number(event.total_budget),
    total_committed: totalSpent,
    total_paid: totalPaid,
    currency: event.currency,
    by_vendor: byVendor,
  })
}
