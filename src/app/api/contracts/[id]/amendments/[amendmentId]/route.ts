import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
})

/**
 * PATCH /api/contracts/[id]/amendments/[amendmentId]
 * Accept or reject an amendment.
 * Auth: the OTHER party (not the one who proposed).
 * If ACCEPTED and new_total is set, updates the linked quote's total_estimate.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; amendmentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer' && role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: contractId, amendmentId } = await params

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

  // Fetch the contract
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, vendor_id: true, customer_id: true, quote_id: true },
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

  // Fetch the amendment
  const amendment = await prisma.contractAmendment.findUnique({
    where: { id: amendmentId },
  })

  if (!amendment) {
    return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
  }

  if (amendment.contract_id !== contractId) {
    return NextResponse.json({ error: 'Amendment does not belong to this contract' }, { status: 400 })
  }

  if (amendment.status !== 'PROPOSED') {
    return NextResponse.json({ error: 'Amendment has already been responded to' }, { status: 400 })
  }

  // The responder must be the OTHER party (not the proposer)
  const callerRole = role === 'vendor' ? 'VENDOR' : 'CUSTOMER'
  if (amendment.proposed_by_role === callerRole) {
    return NextResponse.json(
      { error: 'You cannot respond to your own amendment. The other party must respond.' },
      { status: 403 }
    )
  }

  const { status } = parsed.data

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.contractAmendment.update({
      where: { id: amendmentId },
      data: {
        status,
        responded_at: new Date(),
      },
    })

    // If accepted and new_total provided, update the linked quote
    if (status === 'ACCEPTED' && amendment.new_total && contract.quote_id) {
      await tx.quote.update({
        where: { id: contract.quote_id },
        data: { total_estimate: amendment.new_total },
      })
    }

    return updated
  })

  return NextResponse.json({ amendment: result })
}
