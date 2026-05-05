import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOtp } from '@/lib/otp'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['email', 'phone']),
  code: z.string().length(6),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { type, code } = parsed.data
  const role = (session.user as any).role as 'customer' | 'vendor'
  const userId = session.user.id as string

  // Determine target
  let target: string
  if (type === 'email') {
    target = session.user.email!
  } else {
    if (role === 'customer') {
      const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { phone: true } })
      target = customer?.phone ?? ''
    } else {
      const vendor = await prisma.vendor.findUnique({ where: { id: userId }, select: { phone_business: true } })
      target = vendor?.phone_business ?? ''
    }
    if (!target) return NextResponse.json({ error: 'No phone on file' }, { status: 400 })
  }

  const result = await verifyOtp(target, type, code)
  if (!result.ok) {
    const messages = {
      invalid: 'Incorrect code. Please try again.',
      expired: 'Code has expired. Please request a new one.',
      max_attempts: 'Too many attempts. Please request a new code.',
    }
    return NextResponse.json({ error: messages[result.error] }, { status: 400 })
  }

  // Mark verified in DB
  if (role === 'customer') {
    await prisma.customer.update({
      where: { id: userId },
      data: { [type === 'email' ? 'email_verified' : 'phone_verified']: true },
    })
  } else {
    await prisma.vendor.update({
      where: { id: userId },
      data: { [type === 'email' ? 'email_verified' : 'phone_verified']: true },
    })
  }

  return NextResponse.json({ ok: true })
}
