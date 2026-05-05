import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const addSchema = z.object({
  image_url: z.string().min(1),
  source_url: z.string().url().optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
  sort_order: z.number().int().default(0),
})

const deleteSchema = z.object({
  item_id: z.string().min(1),
})

/**
 * POST /api/mood-boards/[id]/items
 * Add an item to a mood board. Owner only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const board = await prisma.moodBoard.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const item = await prisma.moodBoardItem.create({
    data: {
      board_id: id,
      image_url: data.image_url,
      source_url: data.source_url ?? null,
      caption: data.caption ?? null,
      category: data.category ?? null,
      sort_order: data.sort_order,
    },
  })

  return NextResponse.json(item, { status: 201 })
}

/**
 * DELETE /api/mood-boards/[id]/items
 * Remove an item from a mood board. Body: { item_id }. Owner only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const board = await prisma.moodBoard.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.moodBoardItem.findFirst({
    where: { id: parsed.data.item_id, board_id: id },
  })
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  await prisma.moodBoardItem.delete({ where: { id: parsed.data.item_id } })

  return NextResponse.json({ success: true })
}
