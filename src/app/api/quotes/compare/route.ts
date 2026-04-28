import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const eventRequestId = searchParams.get('eventRequestId')
  if (!eventRequestId) return NextResponse.json({ error: 'eventRequestId required' }, { status: 400 })

  const eventRequest = await prisma.eventRequest.findFirst({
    where: {
      id: eventRequestId,
      event: { customer_id: (session.user!.id as string) },
    },
    include: { event: true, menu_preference: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const quotes = await prisma.quote.findMany({
    where: {
      match: { event_request_id: eventRequestId },
      status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'] },
    },
    include: {
      vendor: {
        select: {
          id: true,
          business_name: true,
          city: true,
          tier: true,
          is_verified: true,
          profile_photo_url: true,
        },
      },
      menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
      match: { select: { score: true, rank: true } },
    },
    orderBy: { total_estimate: 'asc' },
  })

  return NextResponse.json({ event_request: eventRequest, quotes })
}
