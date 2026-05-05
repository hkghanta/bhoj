import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * GET /api/events/[id]/cancellation-preview?quoteId=xxx
 * Calculate refund amount for a potential cancellation.
 * Auth: customer who owns the event.
 */
export async function GET(
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

  const { id: eventId } = await params
  const quoteId = req.nextUrl.searchParams.get('quoteId')

  if (!quoteId) {
    return NextResponse.json({ error: 'quoteId query parameter is required' }, { status: 400 })
  }

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, customer_id: true, event_date: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (event.customer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify quote exists and is accepted
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      total_estimate: true,
      vendor_id: true,
      status: true,
    },
  })

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Calculate hours remaining until event
  const now = new Date()
  const hoursRemaining = Math.max(
    0,
    (event.event_date.getTime() - now.getTime()) / (1000 * 60 * 60)
  )

  // Find vendor's cancellation policies
  const policies = await prisma.cancellationPolicy.findMany({
    where: { vendor_id: quote.vendor_id },
    orderBy: { hours_before_event: 'desc' },
  })

  // Find the matching tier: the first tier where hours_before_event <= hoursRemaining
  // Policies are ordered DESC, so we iterate and find the first match
  let matchedTier: { refund_percent: number; description: string | null; hours_before_event: number } | null = null

  for (const policy of policies) {
    if (hoursRemaining >= policy.hours_before_event) {
      matchedTier = policy
      break
    }
  }

  const refundPercent = matchedTier?.refund_percent ?? 0
  const quoteTotal = Number(quote.total_estimate)
  const refundAmount = Math.round((quoteTotal * refundPercent) / 100 * 100) / 100

  return NextResponse.json({
    hours_remaining: Math.round(hoursRemaining * 100) / 100,
    refund_percent: refundPercent,
    refund_amount: refundAmount,
    policy_description: matchedTier?.description ?? (policies.length === 0 ? 'No cancellation policy set by vendor' : 'No refund for this cancellation window'),
    quote_total: quoteTotal,
  })
}
