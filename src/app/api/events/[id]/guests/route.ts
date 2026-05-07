import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  label: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const households = await prisma.guestHousehold.findMany({
    where: { event_id: id },
    orderBy: { created_at: 'asc' },
  })
  return NextResponse.json(households)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { email, ...rest } = parsed.data

  const household = await prisma.guestHousehold.create({
    data: {
      event_id: id,
      ...rest,
      email: email || null,
    },
  })
  return NextResponse.json(household, { status: 201 })
}
