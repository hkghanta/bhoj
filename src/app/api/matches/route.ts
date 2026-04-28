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
      customer_id: (session.user!.id as string),
    },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const matches = await prisma.match.findMany({
    where: { event_request_id: eventRequestId },
    include: {
      vendor: {
        include: {
          photos: { where: { is_cover: true }, take: 1 },
          menu_packages: { where: { is_active: true }, take: 3 },
          reviews: { where: { is_published: true }, take: 5 },
        },
      },
    },
    orderBy: { rank: 'asc' },
  })

  const enriched = matches.map(m => ({
    ...m,
    vendor: {
      ...m.vendor,
      avg_rating: m.vendor.reviews.length
        ? m.vendor.reviews.reduce((s, r) => s + r.overall_rating, 0) / m.vendor.reviews.length
        : null,
    },
  }))

  return NextResponse.json(enriched)
}
