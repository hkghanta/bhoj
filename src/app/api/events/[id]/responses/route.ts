import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { id: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const eventRequests = await prisma.eventRequest.findMany({
    where: { event_id: eventId },
    select: {
      id: true,
      vendor_type: true,
      public_token: true,
      responses: {
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          pitch: true,
          price_note: true,
          portfolio_url: true,
          status: true,
          quote_token: true,
          quoted_price: true,
          price_unit: true,
          what_includes: true,
          service_details: true,
          availability_note: true,
          quote_submitted_at: true,
          created_at: true,
        },
      },
    },
  })

  const responses: Array<Record<string, unknown>> = []
  const token_map: Record<string, string> = {}

  for (const er of eventRequests) {
    for (const r of er.responses) {
      responses.push({
        ...r,
        phone: r.status === 'ACCEPTED_RESPONSE' || r.status === 'ACCEPTED' ? r.phone : null,
        vendor_type: er.vendor_type,
      })
      token_map[r.id] = er.public_token
    }
  }

  return NextResponse.json({ responses, token_map })
}
