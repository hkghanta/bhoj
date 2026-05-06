import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  email: z.string().email().nullish().or(z.literal('')),
  phone: z.string().max(30).nullish().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).nullish(),
})

type Params = { id: string }

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customerId = session.user!.id as string

  const existing = await prisma.customerContact.findFirst({
    where: { id, customer_id: customerId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.label !== undefined) data.label = parsed.data.label.trim()
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null
  if (parsed.data.tags !== undefined) data.tags = parsed.data.tags
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null

  const updated = await prisma.customerContact.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customerId = session.user!.id as string

  const existing = await prisma.customerContact.findFirst({
    where: { id, customer_id: customerId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.customerContact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
