import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationChannel } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role

  const prefs = role === 'customer'
    ? await prisma.customerNotificationPref.findMany({ where: { customer_id: session.user!.id as string } })
    : await prisma.vendorNotificationPref.findMany({ where: { vendor_id: session.user!.id as string } })

  return NextResponse.json(prefs)
}

const updateSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  event_type: z.string(),
  is_enabled: z.boolean(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const body = await req.json()
  const items = Array.isArray(body) ? body : [body]

  for (const item of items) {
    const parsed = updateSchema.safeParse(item)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    if (role === 'customer') {
      await prisma.customerNotificationPref.upsert({
        where: {
          customer_id_channel_event_type: {
            customer_id: session.user!.id as string,
            channel: parsed.data.channel,
            event_type: parsed.data.event_type,
          },
        },
        update: { is_enabled: parsed.data.is_enabled },
        create: {
          customer_id: session.user!.id as string,
          channel: parsed.data.channel,
          event_type: parsed.data.event_type,
          is_enabled: parsed.data.is_enabled,
        },
      })
    } else {
      await prisma.vendorNotificationPref.upsert({
        where: {
          vendor_id_channel_event_type: {
            vendor_id: session.user!.id as string,
            channel: parsed.data.channel,
            event_type: parsed.data.event_type,
          },
        },
        update: { is_enabled: parsed.data.is_enabled },
        create: {
          vendor_id: session.user!.id as string,
          channel: parsed.data.channel,
          event_type: parsed.data.event_type,
          is_enabled: parsed.data.is_enabled,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
