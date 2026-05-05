import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'

/**
 * POST /api/local-vendors/request-quote
 * Creates a RequestResponse with a quote_token for an external vendor,
 * then sends them an outreach email/SMS with a link to submit their quote.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { place_id, business_name, phone, email, vendor_type, event_id } = body

  if (!place_id || !business_name || !event_id || !vendor_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const customerId = session.user!.id as string

  // Verify event belongs to customer
  const event = await prisma.event.findFirst({
    where: { id: event_id, customer_id: customerId },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Find or ensure EventRequest exists for this vendor type + event
  let eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id, vendor_type, customer_id: customerId },
  })

  if (!eventRequest) {
    eventRequest = await prisma.eventRequest.create({
      data: { event_id, vendor_type, customer_id: customerId, status: 'OPEN' },
    })
  }

  // Find the ExternalVendor record if it exists
  const externalVendor = await prisma.externalVendor.findUnique({
    where: { place_id },
  })

  // Check if we already sent a quote request for this vendor + event request
  const existing = await prisma.requestResponse.findFirst({
    where: {
      event_request_id: eventRequest.id,
      external_vendor_id: externalVendor?.id ?? undefined,
      name: business_name,
    },
  })

  if (existing) {
    return NextResponse.json({
      error: 'Quote already requested',
      quote_token: existing.quote_token,
    }, { status: 409 })
  }

  // Create RequestResponse with quote_token
  const response = await prisma.requestResponse.create({
    data: {
      event_request_id: eventRequest.id,
      external_vendor_id: externalVendor?.id ?? null,
      name: business_name,
      phone: phone ?? externalVendor?.phone ?? null,
      email: email ?? null,
      pitch: `Quote request from ${event.event_name} host`,
      status: 'QUOTE_REQUESTED',
    },
  })

  const quoteUrl = `${APP_URL}/quote-request/${response.quote_token}`
  const vendorEmail = email ?? externalVendor?.phone // fallback info for logging

  // Send outreach email if we have an email address
  if (email || externalVendor?.website) {
    const recipientEmail = email // Only send if we actually have an email
    if (recipientEmail) {
      try {
        await resend.emails.send({
          from: FROM,
          to: recipientEmail,
          subject: `New enquiry for ${event.event_name} - ${format(event.event_date, 'd MMM yyyy')}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
              <h2 style="color: #B45309;">You've got a new enquiry on OneSeva!</h2>
              <p>Hi <strong>${business_name}</strong>,</p>
              <p>A customer is planning an event and is interested in your services:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Event</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${event.event_name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${format(event.event_date, 'd MMMM yyyy')}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${event.city}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Guests</td><td style="padding: 8px; border-bottom: 1px solid #eee;">~${event.guest_count}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Service</td><td style="padding: 8px;">${vendor_type.replace(/_/g, ' ')}</td></tr>
              </table>
              <p>Submit your quote using the link below. It only takes a couple of minutes:</p>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${quoteUrl}" style="background: #B45309; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Submit Your Quote
                </a>
              </p>
              <p style="color: #999; font-size: 13px;">If you're not interested, no action is needed. This link expires after the event date.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">OneSeva — Indian Event Planning Platform</p>
            </div>
          `,
        })
        console.log(`[request-quote] Outreach email sent to ${recipientEmail} for ${business_name}`)
      } catch (err: any) {
        console.error(`[request-quote] Failed to send outreach email:`, err.message)
      }
    }
  }

  console.log(`[request-quote] Quote requested from ${business_name} (${place_id}) for event ${event.event_name}. Token: ${response.quote_token}`)

  return NextResponse.json({
    ok: true,
    quote_token: response.quote_token,
    quote_url: quoteUrl,
    email_sent: !!email,
  }, { status: 201 })
}
