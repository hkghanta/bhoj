import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

const updateSchema = z.object({
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const vendor = await prisma.vendor.update({
    where: { id },
    data: parsed.data,
  })

  // Send welcome email on approval
  if (parsed.data.is_active === true) {
    try {
      await resend.emails.send({
        from: FROM,
        to: vendor.email,
        subject: `Welcome to OneSeva — Your profile is live!`,
        html: welcomeEmailHtml({ businessName: vendor.business_name, dashboardUrl: `${APP_URL}/vendor/dashboard` }),
      })
    } catch (err) {
      console.error('[approve] Failed to send welcome email:', err)
    }
  }

  return NextResponse.json(vendor)
}

function welcomeEmailHtml({ businessName, dashboardUrl }: { businessName: string; dashboardUrl: string }) {
  return `<!DOCTYPE html>
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
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">🎉 Your profile is live!</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Hi <strong>${businessName}</strong>,</p>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          Your OneSeva vendor profile has been <strong>approved and is now live</strong>. Event hosts in your area can now find and contact you.
        </p>
        <p style="color:#374151;line-height:1.6;margin:0 0 28px;">
          Log in to complete your profile, add photos, set your availability, and start receiving quote requests.
        </p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Go to Dashboard →
        </a>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} OneSeva. Questions? Reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
