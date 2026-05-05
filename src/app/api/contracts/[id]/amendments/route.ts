import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  description: z.string().min(1),
  new_total: z.number().positive().optional(),
})

/**
 * GET /api/contracts/[id]/amendments
 * List amendments for a contract (auth: party to the contract).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer' && role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: contractId } = await params

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, vendor_id: true, customer_id: true },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const isParty =
    (role === 'vendor' && contract.vendor_id === userId) ||
    (role === 'customer' && contract.customer_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const amendments = await prisma.contractAmendment.findMany({
    where: { contract_id: contractId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ amendments })
}

/**
 * POST /api/contracts/[id]/amendments
 * Propose an amendment (auth: customer or vendor who is a party).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer' && role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: contractId } = await params

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

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, vendor_id: true, customer_id: true, status: true },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const isParty =
    (role === 'vendor' && contract.vendor_id === userId) ||
    (role === 'customer' && contract.customer_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { description, new_total } = parsed.data
  const proposedByRole = role === 'vendor' ? 'VENDOR' : 'CUSTOMER'

  const amendment = await prisma.contractAmendment.create({
    data: {
      contract_id: contractId,
      proposed_by: userId,
      proposed_by_role: proposedByRole,
      description,
      new_total: new_total ?? null,
      status: 'PROPOSED',
    },
  })

  return NextResponse.json({ amendment }, { status: 201 })
}
