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
  linked_plan_item_id: z.string().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
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
  if (!parsed.success) {
    console.error('[checklist] Validation failed:', parsed.error.format())
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
  }

  // Clean null/empty values for Prisma
  const cleaned: Record<string, unknown> = {
    event_id: id,
    status: 'PENDING',
    item_name: parsed.data.item_name,
    category: parsed.data.category,
  }
  if (parsed.data.external_vendor_name) cleaned.external_vendor_name = parsed.data.external_vendor_name
  if (parsed.data.external_vendor_phone) cleaned.external_vendor_phone = parsed.data.external_vendor_phone
  if (parsed.data.external_vendor_email) cleaned.external_vendor_email = parsed.data.external_vendor_email
  if (parsed.data.linked_plan_item_id) cleaned.linked_plan_item_id = parsed.data.linked_plan_item_id
  if (parsed.data.due_date) cleaned.due_date = new Date(parsed.data.due_date)
  if (parsed.data.notes) cleaned.notes = parsed.data.notes

  try {
    const item = await prisma.eventChecklistItem.create({
      data: cleaned as any,
    })
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    console.error('[checklist] Create failed:', err.message)
    return NextResponse.json({ error: 'Failed to create task', detail: err.message }, { status: 500 })
  }
}
