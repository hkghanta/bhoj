import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/matches/[id]/auto-quote
 *
 * Demo-mode: instantly generate an estimated quote from the vendor's packages,
 * so the customer can see the full flow without waiting for vendor action.
 * Marks quote status as SENT with an "(Auto-estimate)" note.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: matchId } = await params
  const customerId = session.user!.id as string

  const match = await prisma.match.findFirst({
    where: { id: matchId },
    include: {
      event_request: {
        include: { event: true },
      },
      vendor: {
        include: {
          menu_packages: { where: { is_active: true }, take: 3 },
        },
      },
    },
  })

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.event_request.customer_id !== customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if quote already exists for this match
  const existing = await prisma.quote.findFirst({ where: { match_id: matchId } })
  if (existing) {
    return NextResponse.json({ quote: existing, already_exists: true })
  }

  const pkg = match.vendor.menu_packages[0]
  if (!pkg) {
    return NextResponse.json({ error: 'No packages available for auto-estimate' }, { status: 422 })
  }

  const guestCount = match.event_request.event.guest_count
  const pricePerHead = Number(pkg.price_per_head)
  const totalEstimate = pricePerHead * guestCount

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14) // 2 weeks

  const quote = await prisma.quote.create({
    data: {
      match_id: matchId,
      vendor_id: match.vendor_id,
      status: 'SENT',
      price_per_head: pricePerHead,
      total_estimate: totalEstimate,
      currency: match.event_request.event.currency,
      notes: `Auto-estimated based on "${pkg.name}" package (${pkg.is_halal ? 'Halal · ' : ''}${pkg.is_vegetarian ? 'Vegetarian · ' : ''}£${pricePerHead}/head). This is a demo estimate — contact the vendor to customise your menu.`,
      tasting_offered: false,
      expires_at: expiresAt,
    },
  })

  // Update match status to QUOTED
  await prisma.match.update({ where: { id: matchId }, data: { status: 'QUOTED' } })

  return NextResponse.json({ quote }, { status: 201 })
}
