import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  item_name: z.string().min(1),
  category: z.string().min(1),
  external_vendor_name: z.string().optional(),
  external_vendor_phone: z.string().optional(),
  external_vendor_email: z.string().email().optional().or(z.literal('')),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: (session.user!.id as string) } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const item = await prisma.eventChecklistItem.create({
    data: { ...parsed.data, event_id: id, status: 'PENDING' },
  })

  return NextResponse.json(item, { status: 201 })
}
