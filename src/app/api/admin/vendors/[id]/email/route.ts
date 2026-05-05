import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value
  return token === process.env.ADMIN_SECRET
}

/**
 * POST /api/admin/vendors/[id]/email
 * Send a direct email to a vendor from the admin panel.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: vendorId } = await params
  const { subject, body, replyTo } = await req.json()

  if (!subject || !body) {
    return NextResponse.json({ error: 'Subject and body required' }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { email: true, business_name: true } })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #fff7f0; border-left: 4px solid #e85510; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
        <p style="margin:0; font-size:12px; color:#e85510; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Message from OneSeva Team</p>
      </div>
      <p style="color:#1a1a1a; font-size:15px; line-height:1.6;">Hi ${vendor.business_name},</p>
      <div style="color:#374151; font-size:15px; line-height:1.7; white-space:pre-wrap;">${body}</div>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin: 32px 0;" />
      <p style="color:#9ca3af; font-size:12px;">OneSeva — The South Asian Event Marketplace<br/>
      <a href="https://oneseva.com" style="color:#e85510;">oneseva.com</a></p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: vendor.email,
    subject,
    html,
    replyTo: replyTo ?? FROM,
  })

  if (error) {
    console.error('[admin/email] Resend error:', error)
    return NextResponse.json({ error: 'Failed to send email', detail: error }, { status: 500 })
  }

  return NextResponse.json({ success: true, to: vendor.email })
}
