import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_shared: z.boolean().optional(),
})

/**
 * GET /api/mood-boards/[id]
 * Get board with items. Accessible by owner or via share_token query param.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const shareToken = req.nextUrl.searchParams.get('share_token')

  // If share_token provided, allow public access
  if (shareToken) {
    const board = await prisma.moodBoard.findFirst({
      where: { id, share_token: shareToken, is_shared: true },
      include: { items: { orderBy: { sort_order: 'asc' } } },
    })
    if (!board) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(board)
  }

  // Otherwise require auth + ownership
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const board = await prisma.moodBoard.findFirst({
    where: { id, customer_id: userId },
    include: { items: { orderBy: { sort_order: 'asc' } } },
  })

  if (!board) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(board)
}

/**
 * PATCH /api/mood-boards/[id]
 * Update a mood board. Owner only.
 */
export async function PATCH(
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

  const existing = await prisma.moodBoard.findFirst({
    where: { id, customer_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Generate share_token when enabling sharing
  const updateData: Record<string, unknown> = { ...data }
  if (data.is_shared === true && !existing.share_token) {
    updateData.share_token = crypto.randomBytes(16).toString('hex')
  } else if (data.is_shared === false) {
    updateData.share_token = null
  }

  const updated = await prisma.moodBoard.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/mood-boards/[id]
 * Delete a mood board. Owner only.
 */
export async function DELETE(
  _req: NextRequest,
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

  const existing = await prisma.moodBoard.findFirst({
    where: { id, customer_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.moodBoard.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
