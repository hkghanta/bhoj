import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const upsertSchema = z.object({
  preferences: z.record(z.string(), z.unknown()),
  liked_photos: z.array(z.string()).optional(),
})

/**
 * GET /api/customer/style-quiz
 * Get the customer's style quiz response / preferences.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const response = await prisma.styleQuizResponse.findUnique({
    where: { customer_id: userId },
  })

  if (!response) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(response)
}

/**
 * POST /api/customer/style-quiz
 * Save or update style quiz response (upsert).
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

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const prefs = data.preferences as Record<string, unknown>

  const response = await prisma.styleQuizResponse.upsert({
    where: { customer_id: userId },
    create: {
      customer_id: userId,
      preferences: prefs as any,
      liked_photos: data.liked_photos ?? [],
    },
    update: {
      preferences: prefs as any,
      liked_photos: data.liked_photos ?? [],
    },
  })

  return NextResponse.json(response)
}
