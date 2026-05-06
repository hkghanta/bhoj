import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  label: z.string().min(1).max(200),
  email: z.string().email().nullish().or(z.literal('')),
  phone: z.string().max(30).nullish().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).nullish(),
})

const bulkCreateSchema = z.object({
  contacts: z.array(createSchema).min(1).max(500),
})

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contacts = await prisma.customerContact.findMany({
    where: { customer_id: session.user!.id as string },
    orderBy: { label: 'asc' },
  })

  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = session.user!.id as string
  const body = await req.json()

  // Support bulk create
  if (body.contacts) {
    const parsed = bulkCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    let created = 0
    let skipped = 0
    for (const c of parsed.data.contacts) {
      try {
        await prisma.customerContact.create({
          data: {
            customer_id: customerId,
            label: c.label.trim(),
            email: c.email || null,
            phone: c.phone || null,
            tags: c.tags ?? [],
            notes: c.notes || null,
          },
        })
        created++
      } catch {
        skipped++ // duplicate label
      }
    }

    return NextResponse.json({ created, skipped }, { status: 201 })
  }

  // Single create
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const contact = await prisma.customerContact.create({
      data: {
        customer_id: customerId,
        label: parsed.data.label.trim(),
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        tags: parsed.data.tags ?? [],
        notes: parsed.data.notes || null,
      },
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Contact with this name already exists' }, { status: 409 })
    }
    throw err
  }
}
