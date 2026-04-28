import { prisma } from '@/lib/prisma'

export type LeadLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'no_subscription' | 'limit_reached'; limit: number; used: number }

/**
 * Check if a vendor is allowed to receive a new lead.
 * Called from the match job before creating a Match row.
 */
export async function checkLeadLimit(vendorId: string): Promise<LeadLimitResult> {
  const subscription = await prisma.subscription.findFirst({
    where: { vendor_id: vendorId },
    orderBy: { created_at: 'desc' },
  })

  if (!subscription || subscription.status !== 'active') {
    const freeLimit = 3
    const count = await countLeadsThisMonth(vendorId)
    if (count >= freeLimit) {
      return { allowed: false, reason: 'limit_reached', limit: freeLimit, used: count }
    }
    return { allowed: true }
  }

  if (subscription.leads_this_month >= subscription.leads_limit) {
    return {
      allowed: false,
      reason: 'limit_reached',
      limit: subscription.leads_limit,
      used: subscription.leads_this_month,
    }
  }

  return { allowed: true }
}

/**
 * Increment the leads_this_month counter for a vendor.
 * Called after a Match row is successfully created.
 */
export async function incrementLeadCount(vendorId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { vendor_id: vendorId, status: 'active' },
    data: { leads_this_month: { increment: 1 } },
  })
}

/**
 * Reset monthly lead counts — called by a scheduled job on the 1st of each month.
 */
export async function resetMonthlyLeadCounts(): Promise<void> {
  await prisma.subscription.updateMany({
    where: { status: 'active' },
    data: { leads_this_month: 0 },
  })
  console.log('[lead-limit] Monthly lead counts reset')
}

async function countLeadsThisMonth(vendorId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  return prisma.match.count({
    where: {
      vendor_id: vendorId,
      created_at: { gte: startOfMonth },
    },
  })
}
