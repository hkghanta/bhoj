import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendEmailOtp, sendPhoneOtp } from '@/lib/otp'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  location: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }
  const { name, email, phone, password, location } = parsed.data

  const existing = await prisma.customer.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  await prisma.customer.create({ data: { name, email, phone, password_hash, location } })

  // Send verification OTPs (non-blocking — don't fail registration if OTP send fails)
  await Promise.allSettled([
    sendEmailOtp(email, 'customer'),
    sendPhoneOtp(phone, 'customer'),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
