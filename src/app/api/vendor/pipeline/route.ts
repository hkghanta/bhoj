import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  match_id: z.string().optional(),
  quote_id: z.string().optional(),
  stage: z.enum([
    'INQUIRY', 'PROPOSAL_SENT', 'TASTING_SCHEDULED', 'NEGOTIATING',
    'CONTRACT_SENT', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'LOST',
  ]).default('INQUIRY'),
  notes: z.string().optional(),
  follow_up_date: z.string().datetime().optional(),
})

/**
 * GET /api/vendor/pipeline
 * List pipeline entries for the vendor grouped by stage. Includes match/quote info.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const entries = await prisma.vendorPipelineEntry.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  // Group by stage
  const grouped: Record<string, typeof entries> = {}
  for (const entry of entries) {
    if (!grouped[entry.stage]) grouped[entry.stage] = []
    grouped[entry.stage].push(entry)
  }

  return NextResponse.json(grouped)
}

/**
 * POST /api/vendor/pipeline
 * Create a new pipeline entry.
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

  const entry = await prisma.vendorPipelineEntry.create({
    data: {
      vendor_id: userId,
      match_id: data.match_id ?? null,
      quote_id: data.quote_id ?? null,
      stage: data.stage,
      notes: data.notes ?? null,
      follow_up_date: data.follow_up_date ? new Date(data.follow_up_date) : null,
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
