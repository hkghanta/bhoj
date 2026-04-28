import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { VendorType } from '@prisma/client'

const schema = z.object({
  business_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  vendor_type: z.nativeEnum(VendorType),
  city: z.string().min(1),
  country: z.string().length(2),
  phone_business: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { business_name, email, password, vendor_type, city, country, phone_business } = parsed.data
  const existing = await prisma.vendor.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }
  const password_hash = await bcrypt.hash(password, 12)
  const vendor = await prisma.vendor.create({
    data: { business_name, email, password_hash, vendor_type, city, country, phone_business },
  })
  await prisma.subscription.create({
    data: { vendor_id: vendor.id, tier: 'FREE', status: 'active', leads_limit: 3 },
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}
