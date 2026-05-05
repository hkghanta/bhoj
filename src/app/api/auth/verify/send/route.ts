import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailOtp, sendPhoneOtp } from '@/lib/otp'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['email', 'phone']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { type } = parsed.data
  const role = (session.user as any).role as 'customer' | 'vendor'
  const userId = session.user.id as string

  try {
    if (type === 'email') {
      const email = session.user.email!
      await sendEmailOtp(email, role)
    } else {
      // Fetch phone from DB
      let phone: string | null = null
      if (role === 'customer') {
        const customer = await prisma.customer.findUnique({ where: { id: userId }, select: { phone: true } })
        phone = customer?.phone ?? null
      } else {
        const vendor = await prisma.vendor.findUnique({ where: { id: userId }, select: { phone_business: true } })
        phone = vendor?.phone_business ?? null
      }
      if (!phone) return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
      await sendPhoneOtp(phone, role)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verify/send]', err)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
