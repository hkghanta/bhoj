import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  terms_and_conditions: z.string().optional(),
  is_default: z.boolean().optional(),
})

/**
 * GET /api/vendor/contract-templates
 * List vendor's contract templates (auth: vendor).
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await prisma.contractTemplate.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ templates })
}

/**
 * POST /api/vendor/contract-templates
 * Create a new contract template (auth: vendor).
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, content, terms_and_conditions, is_default } = parsed.data

  const template = await prisma.$transaction(async (tx) => {
    // If setting as default, unset other defaults first
    if (is_default) {
      await tx.contractTemplate.updateMany({
        where: { vendor_id: userId, is_default: true },
        data: { is_default: false },
      })
    }

    return tx.contractTemplate.create({
      data: {
        vendor_id: userId,
        name,
        content,
        terms_and_conditions: terms_and_conditions ?? null,
        is_default: is_default ?? false,
      },
    })
  })

  return NextResponse.json({ template }, { status: 201 })
}
