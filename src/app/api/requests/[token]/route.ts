import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { token: string }

// Budget range helper — turns exact budget into a display band
function budgetBand(amount: number, currency: string): string {
  const bands = [500, 1000, 2000, 5000, 10000, 20000]
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${currency}${bands[i].toLocaleString()}–${bands[i + 1].toLocaleString()}`
  }
  return `${currency}${bands[bands.length - 1].toLocaleString()}+`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
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
        select: {
          cuisine_preferences: true,
          service_style: true,
          special_notes: true,
          is_vegetarian: true,
          is_vegan: true,
          is_jain: true,
          is_halal: true,
          is_kosher: true,
          nut_free: true,
          gluten_free: true,
          dairy_free: true,
          egg_free: true,
          shellfish_free: true,
          soy_free: true,
        },
      },
      _count: { select: { responses: true } },
    },
  })

  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { event } = eventRequest
  // Fuzzy date: return month + year only
  const eventDate = new Date(event.event_date)
  const fuzzyDate = eventDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    id: eventRequest.id,
    vendor_type: eventRequest.vendor_type,
    public_status: eventRequest.public_status,
    service_notes: eventRequest.service_notes,
    response_count: eventRequest._count.responses,
    event: {
      event_type: event.event_type,
      fuzzy_date: fuzzyDate,
      city: event.city,
      guest_count: event.guest_count,
      budget_band: budgetBand(Number(event.total_budget), event.currency),
    },
    menu_preference: eventRequest.menu_preference,
  })
}

const responseSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  pitch: z.string().min(10).max(500),
  price_note: z.string().max(200).optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    select: { id: true, public_status: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (eventRequest.public_status === 'FILLED') {
    return NextResponse.json({ error: 'This request has already been filled' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Check if this phone number already responded (basic dedup)
  if (parsed.data.phone) {
    const existing = await prisma.requestResponse.findFirst({
      where: { event_request_id: eventRequest.id, phone: parsed.data.phone },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already responded to this request' }, { status: 409 })
    }
  }

  // If the submitter is a logged-in vendor, attach their vendor_id
  // Note: for vendor sessions, session.user.id IS the vendor's id directly
  const session = await auth()
  let vendorId: string | null = null
  if (session && (session.user as any).role === 'vendor') {
    vendorId = session.user!.id as string
  }

  if (vendorId) {
    const existingVendorResponse = await prisma.requestResponse.findFirst({
      where: { event_request_id: eventRequest.id, vendor_id: vendorId },
    })
    if (existingVendorResponse) {
      return NextResponse.json({ error: 'You have already responded to this request' }, { status: 409 })
    }
  }

  const response = await prisma.requestResponse.create({
    data: {
      event_request_id: eventRequest.id,
      vendor_id: vendorId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      pitch: parsed.data.pitch,
      price_note: parsed.data.price_note ?? null,
      portfolio_url: parsed.data.portfolio_url || null,
    },
  })

  return NextResponse.json({ id: response.id }, { status: 201 })
}

const patchSchema = z.object({
  action: z.enum(['accept', 'fill', 'decline_response']),
  response_id: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params
  const customerId = session.user!.id as string

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    select: { id: true, customer_id: true, public_status: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (eventRequest.customer_id !== customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  if (parsed.data.action === 'fill') {
    await prisma.eventRequest.update({
      where: { id: eventRequest.id },
      data: { public_status: 'FILLED' },
    })
    return NextResponse.json({ ok: true })
  }

  if (parsed.data.action === 'accept' && parsed.data.response_id) {
    await prisma.requestResponse.update({
      where: { id: parsed.data.response_id, event_request_id: eventRequest.id },
      data: { status: 'ACCEPTED' },
    })
    return NextResponse.json({ ok: true })
  }

  if (parsed.data.action === 'decline_response' && parsed.data.response_id) {
    await prisma.requestResponse.update({
      where: { id: parsed.data.response_id, event_request_id: eventRequest.id },
      data: { status: 'DECLINED' },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
