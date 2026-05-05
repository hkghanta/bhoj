import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_id: z.string().optional(),
  is_shared: z.boolean().default(false),
})

/**
 * GET /api/mood-boards
 * List customer's mood boards.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const boards = await prisma.moodBoard.findMany({
    where: { customer_id: userId },
    include: { _count: { select: { items: true } } },
    orderBy: { updated_at: 'desc' },
  })

  return NextResponse.json(boards)
}

/**
 * POST /api/mood-boards
 * Create a mood board. Generates share_token if is_shared.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Verify event ownership if event_id provided
  if (data.event_id) {
    const event = await prisma.event.findFirst({
      where: { id: data.event_id, customer_id: userId },
      select: { id: true },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
  }

  const board = await prisma.moodBoard.create({
    data: {
      customer_id: userId,
      title: data.title,
      description: data.description ?? null,
      event_id: data.event_id ?? null,
      is_shared: data.is_shared,
      share_token: data.is_shared ? crypto.randomBytes(16).toString('hex') : null,
    },
  })

  return NextResponse.json(board, { status: 201 })
}
