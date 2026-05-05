import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const DEFAULT_SCHEDULE = DAYS.map(day => ({
  day_of_week: day,
  is_open: day !== 'SUN',
  opens_at: '09:00',
  closes_at: '22:00',
  notes: null,
}))

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = session.user!.id as string
    const rows = await prisma.vendorOperatingSchedule.findMany({
      where: { vendor_id: vendorId },
      orderBy: { id: 'asc' },
    })

    if (rows.length === 0) return NextResponse.json(DEFAULT_SCHEDULE)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[schedule GET]', err)
    return NextResponse.json(DEFAULT_SCHEDULE)
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = session.user!.id as string
    const days: Array<{
      day_of_week: string
      is_open: boolean
      opens_at?: string
      closes_at?: string
      notes?: string
    }> = await req.json()

    const results = await Promise.all(
      days.map(day =>
        prisma.vendorOperatingSchedule.upsert({
          where: { vendor_id_day_of_week: { vendor_id: vendorId, day_of_week: day.day_of_week } },
          create: { vendor_id: vendorId, ...day },
          update: {
            is_open: day.is_open,
            opens_at: day.opens_at ?? null,
            closes_at: day.closes_at ?? null,
            notes: day.notes ?? null,
          },
        })
      )
    )

    return NextResponse.json(results)
  } catch (err) {
    console.error('[schedule PUT]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
