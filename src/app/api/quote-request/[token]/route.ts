import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { token: string }

function budgetBand(amount: number, currency: string): string {
  const bands = [500, 1000, 2000, 5000, 10000, 20000]
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${currency}${bands[i].toLocaleString()}–${bands[i + 1].toLocaleString()}`
  }
  return `${currency}${bands[bands.length - 1].toLocaleString()}+`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const response = await prisma.requestResponse.findUnique({
    where: { quote_token: token },
    include: {
      event_request: {
        include: {
          event: {
            select: {
              event_type: true,
              event_date: true,
              city: true,
              guest_count: true,
              total_budget: true,
              currency: true,
            },
          },
          menu_preference: {
            select: { cuisine_preferences: true, service_style: true, special_notes: true },
          },
        },
      },
    },
  })

  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (response.quote_submitted_at) {
    return NextResponse.json({ error: 'Quote already submitted' }, { status: 409 })
  }

  const er = response.event_request
  const event = er.event
  const eventDate = new Date(event.event_date)
  const fuzzyDate = eventDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    responder_name: response.name,
    vendor_type: er.vendor_type,
    service_notes: er.service_notes,
    menu_preference: er.menu_preference,
    event: {
      event_type: event.event_type,
      fuzzy_date: fuzzyDate,
      city: event.city,
      guest_count: event.guest_count,
      budget_band: budgetBand(Number(event.total_budget), event.currency),
      currency: event.currency,
    },
  })
}

const postSchema = z.object({
  quoted_price: z.number().positive(),
  price_unit: z.enum(['per_head', 'per_event', 'per_hour', 'per_day']),
  what_includes: z.string().min(5).max(1000),
  service_details: z.string().max(1000).optional(),
  availability_note: z.enum(['available', 'need_to_confirm', 'not_available']),
  extra_notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const response = await prisma.requestResponse.findUnique({
    where: { quote_token: token },
    select: { id: true, quote_submitted_at: true },
  })

  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (response.quote_submitted_at) {
    return NextResponse.json({ error: 'Quote already submitted' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { quoted_price, price_unit, what_includes, service_details, availability_note, extra_notes } = parsed.data

  await prisma.requestResponse.update({
    where: { id: response.id },
    data: {
      quoted_price,
      price_unit,
      what_includes: extra_notes ? `${what_includes}\n\n${extra_notes}` : what_includes,
      service_details: service_details ?? null,
      availability_note,
      status: 'QUOTE_SUBMITTED',
      quote_submitted_at: new Date(),
    },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}
