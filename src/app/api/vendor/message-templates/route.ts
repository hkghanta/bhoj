import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  category: z.string().optional(),
})

/**
 * GET /api/vendor/message-templates
 * List vendor's message templates.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await prisma.vendorMessageTemplate.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(templates)
}

/**
 * POST /api/vendor/message-templates
 * Create a message template.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
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

  const template = await prisma.vendorMessageTemplate.create({
    data: {
      vendor_id: userId,
      name: data.name,
      subject: data.subject ?? null,
      body: data.body,
      category: data.category ?? null,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
