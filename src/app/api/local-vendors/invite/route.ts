import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'

/**
 * POST /api/local-vendors/invite
 * Records customer interest in a local (non-platform) business.
 * Optionally sends an invitation email to the business if we have their email.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { place_id, business_name, address, phone, website, rating, vendor_type, city, event_id } = body

  if (!place_id || !business_name || !event_id || !vendor_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const customerId = session.user!.id as string

  // Verify event belongs to customer
  const event = await prisma.event.findFirst({ where: { id: event_id, customer_id: customerId } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Upsert invite record
  const invite = await prisma.localVendorInvite.upsert({
    where: { place_id_customer_id_event_id: { place_id, customer_id: customerId, event_id } },
    update: {},
    create: { place_id, business_name, address, phone, website, rating, vendor_type, city, customer_id: customerId, event_id },
  })

  // If we have a website domain, try to derive a contact email (best effort)
  // For now, just log the invite so admin can follow up
  // In production: integrate with Hunter.io or send an outreach email
  console.log(`[invite] Customer ${customerId} interested in ${business_name} (${city}) for ${event.event_name}`)

  // TODO: When admin email is configured, send a vendor outreach email here
  // The admin panel "Invites" section will surface these for manual follow-up

  return NextResponse.json({ invite, message: 'Interest recorded. We\'ll reach out to them.' }, { status: 201 })
}

/**
 * GET /api/local-vendors/invite
 * Admin-facing: list all pending invites so admin can follow up.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  // Allow admin token check
  const adminToken = req.headers.get('x-admin-token')
  const isAdmin = adminToken === process.env.ADMIN_SECRET

  if (!isAdmin && (!session || (session.user as any).role !== 'customer')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invites = await prisma.localVendorInvite.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { event_name: true, city: true } },
    },
  })

  return NextResponse.json(invites)
}
