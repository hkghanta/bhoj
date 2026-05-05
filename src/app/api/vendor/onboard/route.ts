import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// GET — validate token and return lead data for pre-fill
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const invite = await prisma.vendorInvite.findUnique({
    where: { token },
    include: { lead: true },
  })

  if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  if (invite.expires_at < new Date()) return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })

  const { lead } = invite
  return NextResponse.json({
    business_name: lead.business_name,
    email: invite.email,
    phone: lead.phone,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    website: lead.website,
    vendor_type: lead.vendor_type,
  })
}

const registerSchema = z.object({
  token: z.string(),
  contact_name: z.string().min(2),
  password: z.string().min(8),
  business_name: z.string().min(2),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
})

// POST — complete registration
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { token, contact_name, password, business_name, description, phone, website } = parsed.data

  const invite = await prisma.vendorInvite.findUnique({
    where: { token },
    include: { lead: true },
  })

  if (!invite) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  if (invite.expires_at < new Date()) return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })

  const { lead } = invite

  // Check if vendor with this email already exists
  const existing = await prisma.vendor.findUnique({ where: { email: invite.email } })
  if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 12)

  const vendor = await prisma.vendor.create({
    data: {
      email: invite.email,
      business_name,
      vendor_type: lead.vendor_type ?? 'CATERER',
      phone_business: phone ?? lead.phone ?? undefined,
      address: lead.address ?? undefined,
      city: lead.city,
      country: 'US',
      website: website ?? lead.website ?? undefined,
      description: description ?? undefined,
      password_hash,
      is_active: false, // pending admin approval
      lead: { connect: { id: lead.id } },
    },
  })

  // Mark invite as used
  await prisma.vendorInvite.update({
    where: { token },
    data: { used_at: new Date() },
  })

  // Update lead status
  await prisma.vendorLead.update({
    where: { id: lead.id },
    data: { status: 'JOINED', joined_vendor_id: vendor.id },
  })

  return NextResponse.json({ ok: true, vendor_id: vendor.id })
}
