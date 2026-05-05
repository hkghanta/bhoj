import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('admin_token')?.value === process.env.ADMIN_SECRET
}

/**
 * POST /api/admin/vendors/[id]/credits
 * Grant bonus credits to a vendor.
 * Body: { amount: number, description?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: vendorId } = await params
  const { amount, description } = await req.json()

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
  }

  const credit = await prisma.vendorCredit.upsert({
    where: { vendor_id: vendorId },
    create: {
      vendor_id: vendorId,
      balance: amount,
      total_bought: amount,
      transactions: {
        create: { amount, type: 'BONUS', description: description ?? 'Admin grant' },
      },
    },
    update: {
      balance: { increment: amount },
      total_bought: { increment: amount },
      transactions: {
        create: { amount, type: 'BONUS', description: description ?? 'Admin grant' },
      },
    },
  })

  return NextResponse.json({ success: true, new_balance: credit.balance + amount })
}
