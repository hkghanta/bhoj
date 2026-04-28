import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ChecklistStatus } from '@prisma/client'

const updateSchema = z.object({
  status: z.nativeEnum(ChecklistStatus).optional(),
  external_vendor_name: z.string().optional().nullable(),
  external_vendor_phone: z.string().optional().nullable(),
  external_vendor_email: z.string().email().optional().nullable(),
  quoted_price: z.number().positive().optional().nullable(),
  finalized_price: z.number().positive().optional().nullable(),
  deposit_paid: z.boolean().optional(),
  deposit_amount: z.number().positive().optional().nullable(),
  balance_due: z.number().positive().optional().nullable(),
  balance_due_date: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: (session.user!.id as string) },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.balance_due_date) data.balance_due_date = new Date(parsed.data.balance_due_date)
  if (parsed.data.due_date) data.due_date = new Date(parsed.data.due_date)

  const item = await prisma.eventChecklistItem.update({
    where: { id: itemId },
    data,
  })

  const allItems = await prisma.eventChecklistItem.findMany({ where: { event_id: id } })
  const doneStatuses: ChecklistStatus[] = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = allItems.filter(i => doneStatuses.includes(i.status)).length
  const progress = Math.round((doneCount / allItems.length) * 100)

  const totalSpent = allItems.reduce((sum, i) => {
    return sum + (i.finalized_price ? Number(i.finalized_price) : 0)
  }, 0)

  await prisma.event.update({
    where: { id },
    data: { checklist_progress: progress, total_spent: totalSpent },
  })

  return NextResponse.json(item)
}
