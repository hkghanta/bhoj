import { Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { scoreVendor } from '@/lib/matching/scorer'
import { getWeights } from '@/lib/matching/weights'
import { checkLeadLimit, incrementLeadCount } from '@/lib/lead-limit'
import type { VendorForScoring, EventRequestForScoring } from '@/lib/matching/types'
import { VendorType } from '@prisma/client'

const MAX_MATCHES = 5

export interface MatchJobData {
  eventRequestId: string
}

export async function runMatchJob(data: MatchJobData): Promise<void> {
  const { eventRequestId } = data

  const request = await prisma.eventRequest.findUnique({
    where: { id: eventRequestId },
    include: {
      event: true,
      menu_preference: true,
    },
  })

  if (!request) throw new Error(`EventRequest ${eventRequestId} not found`)
  if (request.status !== 'OPEN') return

  const weights = await getWeights()

  const existingMatchVendorIds = (
    await prisma.match.findMany({
      where: { event_request_id: eventRequestId },
      select: { vendor_id: true },
    })
  ).map(m => m.vendor_id)

  const vendors = await prisma.vendor.findMany({
    where: {
      vendor_type: request.vendor_type as VendorType,
      is_active: true,
      id: { notIn: existingMatchVendorIds },
    },
    include: {
      menu_packages: {
        where: { is_active: true },
        select: { price_per_head: true, is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true },
      },
      metrics: {
        orderBy: { period: 'desc' },
        take: 1,
      },
      services: { where: { is_active: true }, select: { name: true } },
    },
  })

  const unavailabilityMap = new Map<string, Set<string>>()
  const blockedRecords = await prisma.vendorAvailability.findMany({
    where: {
      vendor_id: { in: vendors.map(v => v.id) },
      date: request.event.event_date,
      is_available: false,
    },
    select: { vendor_id: true, date: true },
  })
  for (const rec of blockedRecords) {
    if (!unavailabilityMap.has(rec.vendor_id)) {
      unavailabilityMap.set(rec.vendor_id, new Set())
    }
    unavailabilityMap.get(rec.vendor_id)!.add(rec.date.toISOString().split('T')[0])
  }

  const requestForScoring: EventRequestForScoring = {
    id: request.id,
    event_id: request.event_id,
    vendor_type: request.vendor_type as VendorType,
    event: {
      city: request.event.city,
      country: 'GB', // Event model doesn't store country yet — default to GB
      event_date: request.event.event_date,
      guest_count: request.event.guest_count,
      total_budget: Number(request.event.total_budget),
      currency: request.event.currency,
    },
    menu_preference: request.menu_preference
      ? {
          cuisine_preferences: request.menu_preference.cuisine_preferences,
          is_vegetarian: request.menu_preference.is_vegetarian,
          is_vegan: request.menu_preference.is_vegan,
          is_jain: request.menu_preference.is_jain,
          is_halal: request.menu_preference.is_halal,
        }
      : null,
  }

  type ScoredVendor = { vendorId: string; score: number; rank: number }
  const scored: ScoredVendor[] = []

  for (const vendor of vendors) {
    const cuisineTags = vendor.services
      .map(s => s.name.toLowerCase())
      .filter(n => ['north indian', 'south indian', 'punjabi', 'gujarati', 'bengali',
        'rajasthani', 'mughlai', 'hyderabadi', 'halal', 'jain', 'vegetarian'].some(tag => n.includes(tag)))

    const vendorForScoring: VendorForScoring = {
      id: vendor.id,
      city: vendor.city,
      country: vendor.country,
      vendor_type: vendor.vendor_type,
      tier: vendor.tier,
      is_verified: vendor.is_verified,
      menu_packages: vendor.menu_packages.map(p => ({
        price_per_head: Number(p.price_per_head),
        is_vegetarian: p.is_vegetarian,
        is_vegan: p.is_vegan,
        is_jain: p.is_jain,
        is_halal: p.is_halal,
      })),
      metrics: vendor.metrics[0]
        ? {
            avg_rating: Number(vendor.metrics[0].avg_rating),
            avg_response_hrs: Number(vendor.metrics[0].avg_response_hrs),
            booking_rate: Number(vendor.metrics[0].booking_rate),
            quote_rate: Number(vendor.metrics[0].quote_rate),
          }
        : null,
      cuisine_tags: cuisineTags,
    }

    const unavailable = unavailabilityMap.get(vendor.id) ?? new Set<string>()
    const breakdown = scoreVendor(vendorForScoring, requestForScoring, weights, unavailable)
    if (breakdown !== null) {
      scored.push({ vendorId: vendor.id, score: breakdown.total, rank: 0 })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, MAX_MATCHES).map((s, i) => ({ ...s, rank: i + 1 }))

  // Filter out vendors who have hit their lead limit
  const allowedMatches: typeof top = []
  for (const s of top) {
    const limitCheck = await checkLeadLimit(s.vendorId)
    if (limitCheck.allowed) {
      allowedMatches.push(s)
    } else {
      console.log(`[match] Vendor ${s.vendorId} at lead limit, skipping`)
    }
  }

  await prisma.$transaction([
    prisma.match.createMany({
      data: allowedMatches.map(s => ({
        event_request_id: eventRequestId,
        vendor_id: s.vendorId,
        vendor_type: request.vendor_type as VendorType,
        score: s.score,
        rank: s.rank,
        status: 'PENDING',
      })),
    }),
    prisma.eventRequest.update({
      where: { id: eventRequestId },
      data: { status: 'MATCHED' },
    }),
  ])

  await Promise.all(allowedMatches.map(s => incrementLeadCount(s.vendorId)))

  console.log(`[match] EventRequest ${eventRequestId}: ${allowedMatches.length} matches created`)
}

export function startMatchWorker() {
  return new Worker<MatchJobData>(
    'match',
    async (job: Job<MatchJobData>) => runMatchJob(job.data),
    { connection: redis, concurrency: 5 }
  )
}
