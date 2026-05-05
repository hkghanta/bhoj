import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/vendor/analytics
 * Compute vendor analytics from existing data.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all needed data in parallel
  const [
    totalLeads,
    totalQuotes,
    acceptedQuotes,
    reviews,
    allQuotes,
    matches,
  ] = await Promise.all([
    prisma.match.count({ where: { vendor_id: userId } }),
    prisma.quote.count({ where: { vendor_id: userId } }),
    prisma.quote.findMany({
      where: { vendor_id: userId, status: 'ACCEPTED' },
      select: { total_estimate: true, created_at: true },
    }),
    prisma.review.findMany({
      where: { vendor_id: userId },
      select: { overall_rating: true },
    }),
    prisma.quote.findMany({
      where: { vendor_id: userId },
      select: { match_id: true, created_at: true },
    }),
    prisma.match.findMany({
      where: { vendor_id: userId },
      select: { id: true, status: true, created_at: true },
    }),
  ])

  // Quote win rate
  const quoteWinRate = totalQuotes > 0
    ? Math.round((acceptedQuotes.length / totalQuotes) * 10000) / 100
    : 0

  // Total revenue from accepted quotes
  const totalRevenue = acceptedQuotes.reduce(
    (sum, q) => sum + Number(q.total_estimate),
    0
  )

  // Average response time: time between match created_at and first quote created_at for that match
  const matchCreatedMap = new Map(matches.map(m => [m.id, m.created_at]))
  const firstQuoteByMatch = new Map<string, Date>()
  for (const q of allQuotes) {
    const existing = firstQuoteByMatch.get(q.match_id)
    if (!existing || q.created_at < existing) {
      firstQuoteByMatch.set(q.match_id, q.created_at)
    }
  }
  let totalResponseHours = 0
  let responseCount = 0
  for (const [matchId, quoteDate] of firstQuoteByMatch) {
    const matchDate = matchCreatedMap.get(matchId)
    if (matchDate) {
      const diffHours = (quoteDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60)
      totalResponseHours += diffHours
      responseCount++
    }
  }
  const avgResponseTimeHours = responseCount > 0
    ? Math.round((totalResponseHours / responseCount) * 100) / 100
    : 0

  // Reviews
  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.overall_rating, 0) / reviewCount) * 100) / 100
    : 0

  // Revenue by month (last 12 months)
  const now = new Date()
  const revenueByMonth: { month: string; total: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    revenueByMonth.push({ month: monthKey, total: 0 })
  }
  for (const q of acceptedQuotes) {
    const d = q.created_at
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = revenueByMonth.find(m => m.month === monthKey)
    if (entry) entry.total += Number(q.total_estimate)
  }

  // Leads by status
  const statusCounts: Record<string, number> = {}
  for (const m of matches) {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
  }
  const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  return NextResponse.json({
    total_leads: totalLeads,
    total_quotes: totalQuotes,
    quote_win_rate: quoteWinRate,
    total_revenue: totalRevenue,
    avg_response_time_hours: avgResponseTimeHours,
    avg_rating: avgRating,
    review_count: reviewCount,
    revenue_by_month: revenueByMonth,
    leads_by_status: leadsByStatus,
  })
}
