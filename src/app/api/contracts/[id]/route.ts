import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  terms_and_conditions: z.string().nullable().optional(),
  status: z.enum(['SENT', 'CANCELLED']).optional(),
})

/**
 * GET /api/contracts/[id]
 * Get contract details with signatures and amendments.
 * Auth: customer or vendor who is a party to the contract.
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
    include: {
      vendor: { select: { id: true, business_name: true } },
      customer: { select: { id: true, name: true } },
      quote: { select: { id: true, total_estimate: true, status: true } },
      event: { select: { id: true, event_name: true, event_date: true } },
      template: { select: { id: true, name: true } },
      signatures: {
        orderBy: { signed_at: 'asc' },
      },
      amendments: {
        orderBy: { created_at: 'desc' },
      },
    },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // Verify caller is a party
  const isParty =
    (role === 'vendor' && contract.vendor_id === userId) ||
    (role === 'customer' && contract.customer_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ contract })
}

/**
 * PATCH /api/contracts/[id]
 * Update contract content/terms or change status.
 * Auth: vendor only, contract must be in DRAFT status for content edits.
 * Status transitions: DRAFT -> SENT (vendor), DRAFT|SENT -> CANCELLED (vendor, if not SIGNED).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden: only vendors can update contracts' }, { status: 403 })
  }

  const { id: contractId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, vendor_id: true, status: true },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }
  if (contract.vendor_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { content, terms_and_conditions, status } = parsed.data

  // Content edits only allowed in DRAFT
  if ((content !== undefined || terms_and_conditions !== undefined) && contract.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Content can only be edited while contract is in DRAFT status' },
      { status: 400 }
    )
  }

  // Validate status transitions
  if (status === 'SENT' && contract.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Can only send a contract that is in DRAFT status' },
      { status: 400 }
    )
  }

  if (status === 'CANCELLED' && contract.status === 'SIGNED') {
    return NextResponse.json(
      { error: 'Cannot cancel a signed contract' },
      { status: 400 }
    )
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      ...(content !== undefined && { content }),
      ...(terms_and_conditions !== undefined && { terms_and_conditions }),
      ...(status !== undefined && { status }),
    },
    include: {
      vendor: { select: { id: true, business_name: true } },
      customer: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ contract: updated })
}
