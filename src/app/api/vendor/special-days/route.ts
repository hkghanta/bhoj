import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = await prisma.vendorSpecialDay.findMany({
    where: { vendor_id: session.user!.id as string },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(days)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const day = await prisma.vendorSpecialDay.create({
    data: {
      vendor_id: session.user!.id as string,
      date: new Date(body.date),
      is_open: body.is_open ?? false,
      opens_at: body.opens_at || null,
      closes_at: body.closes_at || null,
      reason: body.reason || null,
    },
  })
  return NextResponse.json(day, { status: 201 })
}
