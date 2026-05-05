import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signSchema = z.object({
  signer_name: z.string().min(1),
  signature_data: z.string().min(1),
  signature_type: z.enum(['DRAWN', 'TYPED']),
})

/**
 * POST /api/contracts/[id]/sign
 * Sign a contract. Either party (customer or vendor) can sign.
 * When both parties have signed, the contract status is updated to SIGNED.
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

  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      signatures: { select: { id: true, signer_role: true, signer_id: true } },
    },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // Verify caller is a party to the contract
  const isParty =
    (role === 'vendor' && contract.vendor_id === userId) ||
    (role === 'customer' && contract.customer_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Contract must be in SENT or DRAFT status to be signed (not CANCELLED or already SIGNED)
  if (contract.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot sign a cancelled contract' }, { status: 400 })
  }
  if (contract.status === 'SIGNED') {
    return NextResponse.json({ error: 'Contract is already fully signed' }, { status: 400 })
  }

  // Check if this party has already signed
  const signerRole = role === 'vendor' ? 'VENDOR' : 'CUSTOMER'
  const alreadySigned = contract.signatures.some(
    (s) => s.signer_role === signerRole && s.signer_id === userId
  )

  if (alreadySigned) {
    return NextResponse.json({ error: 'You have already signed this contract' }, { status: 409 })
  }

  const { signer_name, signature_data, signature_type } = parsed.data

  // Capture IP and user-agent
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  // Create signature and potentially update contract status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const signature = await tx.contractSignature.create({
      data: {
        contract_id: contractId,
        signer_id: userId,
        signer_role: signerRole,
        signer_name,
        signature_data,
        signature_type,
        ip_address: ip,
        user_agent: userAgent,
      },
    })

    // Check if both parties have now signed
    const allSignatures = await tx.contractSignature.findMany({
      where: { contract_id: contractId },
      select: { signer_role: true },
    })

    const roles = new Set(allSignatures.map((s) => s.signer_role))
    const bothSigned = roles.has('CUSTOMER') && roles.has('VENDOR')

    let updatedContract = null
    if (bothSigned) {
      updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: { status: 'SIGNED' },
      })
    }

    return { signature, contractStatus: updatedContract?.status ?? contract.status }
  })

  return NextResponse.json({
    signature: result.signature,
    contract_status: result.contractStatus,
  }, { status: 201 })
}
