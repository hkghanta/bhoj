import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CREDITS_LIVE = process.env.LEAD_CREDITS_ENABLED === 'true'

/**
 * GET /api/vendor/credits
 * Returns vendor's credit balance and recent transactions.
 * During beta (LEAD_CREDITS_ENABLED=false): balance shown as "unlimited".
 */
export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vendorId = session.user!.id as string

  // Upsert credit record so every vendor has one
  const credit = await prisma.vendorCredit.upsert({
    where: { vendor_id: vendorId },
    create: { vendor_id: vendorId, balance: 0 },
    update: {},
    include: {
      transactions: {
        orderBy: { created_at: 'desc' },
        take: 50,
      },
    },
  })

  return NextResponse.json({
    credits_live: CREDITS_LIVE,
    balance: CREDITS_LIVE ? credit.balance : null, // null = unlimited
    total_bought: credit.total_bought,
    total_spent: credit.total_spent,
    transactions: credit.transactions,
  })
}

/**
 * POST /api/vendor/credits/bonus
 * Admin only — grant bonus credits to a vendor.
 * (Stripe purchase endpoint will be added when credits go live)
 */
