import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'

const schema = z.object({
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { subject, message } = parsed.data

  const households = await prisma.guestHousehold.findMany({
    where: { event_id: id, email: { not: null }, declined: false },
    select: { id: true, email: true, label: true, token: true },
  })

  let sent = 0, skipped = 0
  for (const h of households) {
    if (!h.email) { skipped++; continue }
    try {
      const rsvpUrl = `${APP_URL}/e/${h.token}`
      await resend.emails.send({
        from: FROM,
        to: h.email,
        subject: `Update: ${subject} — ${event.event_name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f9fafb;padding:32px 0;margin:0">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#ea580c,#dc2626);padding:28px 32px">
      <p style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Event Update</p>
      <h1 style="color:white;font-size:22px;font-weight:800;margin:0">${event.event_name}</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#374151;font-size:15px;font-weight:600;margin:0 0 4px">Dear ${h.label},</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px">We have an update to share with you:</p>
      <div style="background:#f9fafb;border-left:3px solid #ea580c;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="color:#111827;font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap">${message}</p>
      </div>
      <a href="${rsvpUrl}" style="display:inline-block;background:#ea580c;color:white;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">View Your Invitation →</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6">
      <p style="color:#9ca3af;font-size:11px;margin:0">You're receiving this because you were invited to ${event.event_name}. <a href="${rsvpUrl}" style="color:#ea580c">Manage your RSVP</a></p>
    </div>
  </div>
</body>
</html>`,
      })
      sent++
      await new Promise(r => setTimeout(r, 100))
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
