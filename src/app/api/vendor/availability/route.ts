import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? new Date().toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

  const availability = await prisma.vendorAvailability.findMany({
    where: {
      vendor_id: (session.user!.id as string),
      date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(availability)
}

const upsertSchema = z.object({
  dates: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      is_available: z.boolean(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const results = await Promise.all(
    parsed.data.dates.map(({ date, is_available, reason, notes }) =>
      prisma.vendorAvailability.upsert({
        where: { vendor_id_date: { vendor_id: (session.user!.id as string), date: new Date(date) } },
        update: { is_available, reason, notes },
        create: { vendor_id: (session.user!.id as string), date: new Date(date), is_available, reason, notes },
      })
    )
  )

  return NextResponse.json(results)
}
