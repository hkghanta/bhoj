import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lead = await prisma.vendorLead.findUnique({ where: { id } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })

  // Create invite token (expires in 7 days)
  const invite = await prisma.vendorInvite.create({
    data: {
      lead_id: id,
      email: lead.email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Mark lead as invited
  await prisma.vendorLead.update({
    where: { id },
    data: { invited_at: new Date(), status: 'CONTACTED' },
  })

  const onboardUrl = `${APP_URL}/vendor/onboard?token=${invite.token}`

  const html = inviteEmailHtml({
    businessName: lead.business_name,
    onboardUrl,
  })

  await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject: `You're invited to join OneSeva — ${lead.business_name}`,
    html,
  })

  return NextResponse.json({ ok: true, token: invite.token })
}

function inviteEmailHtml({ businessName, onboardUrl }: { businessName: string; onboardUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:40px 0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:#ea580c;padding:32px 40px;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">OneSeva</h1>
        <p style="color:#fed7aa;margin:6px 0 0;font-size:14px;">South Asian Event Marketplace</p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">You're invited to join OneSeva!</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          Hi <strong>${businessName}</strong>,
        </p>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          We'd love to feature your business on <strong>OneSeva</strong> — the marketplace connecting South Asian event hosts with trusted vendors like you.
        </p>
        <p style="color:#374151;line-height:1.6;margin:0 0 28px;">
          Join thousands of families planning weddings, birthdays, and cultural celebrations who are looking for great catering, decoration, photography, and more.
        </p>
        <a href="${onboardUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Complete Your Profile →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:28px 0 0;">
          This invitation link expires in 7 days. If you have questions, reply to this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} OneSeva. You're receiving this because we believe your business would be a great fit for our platform.</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
