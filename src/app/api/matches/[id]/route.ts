import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const match = await prisma.match.findFirst({
    where: { id },
    include: {
      event_request: {
        include: {
          event: {
            select: { id: true, event_name: true, event_date: true, guest_count: true, city: true },
          },
        },
      },
      vendor: {
        include: {
          menu_packages: { where: { is_active: true }, take: 5 },
          reviews: { where: { is_published: true }, take: 5 },
        },
      },
    },
  })

  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ensure match belongs to this customer
  if (match.event_request.customer_id !== (session.user!.id as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const avg_rating = match.vendor.reviews.length
    ? match.vendor.reviews.reduce((s, r) => s + r.overall_rating, 0) / match.vendor.reviews.length
    : null

  return NextResponse.json({
    ...match,
    vendor: { ...match.vendor, avg_rating },
  })
}
