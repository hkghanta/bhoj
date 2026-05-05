import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? 'admin@oneseva.com'

/**
 * POST /api/concierge
 * Customer submits a concierge request.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = session.user!.id as string
  const body = await req.json()
  const { event_date, event_type, guest_count, budget, city, vendor_types, notes } = body

  if (!city || !vendor_types?.length) {
    return NextResponse.json({ error: 'City and at least one vendor type required' }, { status: 400 })
  }

  const request = await prisma.conciergeRequest.create({
    data: {
      customer_id: customerId,
      event_date: event_date ? new Date(event_date) : null,
      event_type,
      guest_count: guest_count ? parseInt(guest_count) : null,
      budget,
      city,
      vendor_types,
      notes,
    },
    include: { customer: { select: { name: true, email: true } } },
  })

  // Notify admin
  if (process.env.RESEND_API_KEY) {
    const typeList = (vendor_types as string[]).join(', ').replace(/_/g, ' ').toLowerCase()
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[OneSeva Concierge] New request from ${request.customer.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#e85510;">New Concierge Request</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Customer</td><td><strong>${request.customer.name}</strong> (${request.customer.email})</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">City</td><td>${city}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Event date</td><td>${event_date ?? 'Not specified'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Event type</td><td>${event_type ?? 'Not specified'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Guests</td><td>${guest_count ?? 'Not specified'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Budget</td><td>${budget ?? 'Not specified'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Needs</td><td>${typeList}</td></tr>
            ${notes ? `<tr><td style="padding:6px 0;color:#6b7280;">Notes</td><td>${notes}</td></tr>` : ''}
          </table>
          <p style="margin-top:24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'}/admin/vendors" style="background:#e85510;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View in Admin Panel</a></p>
        </div>
      `,
    }).catch(e => console.error('[concierge] Admin notify failed:', e))
  }

  return NextResponse.json({ request: { id: request.id, status: request.status } }, { status: 201 })
}

/**
 * GET /api/concierge
 * Returns the logged-in customer's own concierge requests.
 */
export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requests = await prisma.conciergeRequest.findMany({
    where: { customer_id: session.user!.id as string },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(requests)
}
