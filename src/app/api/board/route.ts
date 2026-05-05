import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, VendorType } from '@prisma/client'

function budgetBand(amount: number, currency: string): string {
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency
  const bands = [1000, 2500, 5000, 10000, 20000, 50000]
  if (amount < bands[0]) return `${sym}${bands[0].toLocaleString()} or under`
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${sym}${bands[i].toLocaleString()}–${sym}${bands[i + 1].toLocaleString()}`
  }
  return `${sym}${bands[bands.length - 1].toLocaleString()}+`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const serviceFilter = searchParams.get('service')
  const cityFilter    = searchParams.get('city')
  const cursor        = searchParams.get('cursor')
  const sortBy        = searchParams.get('sort') ?? 'newest'

  // New filters
  const budgetMin     = searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined
  const budgetMax     = searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined
  const guestsMin     = searchParams.get('guestsMin') ? Number(searchParams.get('guestsMin')) : undefined
  const guestsMax     = searchParams.get('guestsMax') ? Number(searchParams.get('guestsMax')) : undefined
  const eventDateFrom = searchParams.get('eventDateFrom')
  const eventDateTo   = searchParams.get('eventDateTo')
  const postedWithin  = searchParams.get('postedWithin') ? Number(searchParams.get('postedWithin')) : undefined // hours
  const eventType     = searchParams.get('eventType')
  const dietary       = searchParams.get('dietary') // comma-separated: halal,vegetarian,vegan,jain

  const PAGE_SIZE = 20

  const validService =
    serviceFilter && Object.values(VendorType).includes(serviceFilter as VendorType)
      ? (serviceFilter as VendorType)
      : undefined

  // Build event date filters
  const eventDateFilters: Record<string, unknown> = { gte: new Date() }
  if (eventDateFrom) eventDateFilters.gte = new Date(eventDateFrom)
  if (eventDateTo) eventDateFilters.lte = new Date(eventDateTo)

  // Build budget filters
  const budgetFilters: Record<string, unknown> = {}
  if (budgetMin !== undefined) budgetFilters.gte = budgetMin
  if (budgetMax !== undefined) budgetFilters.lte = budgetMax

  // Build guest count filters
  const guestFilters: Record<string, unknown> = {}
  if (guestsMin !== undefined) guestFilters.gte = guestsMin
  if (guestsMax !== undefined) guestFilters.lte = guestsMax

  // Posted within filter
  const createdAtFilter: Record<string, unknown> = {}
  if (postedWithin) {
    createdAtFilter.gte = new Date(Date.now() - postedWithin * 3600000)
  }

  // Dietary filters on menu_preference
  const dietaryFlags = dietary ? dietary.split(',').filter(Boolean) : []
  const menuWhere: Record<string, boolean> = {}
  for (const d of dietaryFlags) {
    if (d === 'halal') menuWhere.is_halal = true
    if (d === 'vegetarian') menuWhere.is_vegetarian = true
    if (d === 'vegan') menuWhere.is_vegan = true
    if (d === 'jain') menuWhere.is_jain = true
  }

  // Sort order
  type SortOrder = Prisma.EventRequestOrderByWithRelationInput
  let orderBy: SortOrder = { created_at: 'desc' }
  if (sortBy === 'budget_high') orderBy = { event: { total_budget: 'desc' } }
  if (sortBy === 'budget_low') orderBy = { event: { total_budget: 'asc' } }
  if (sortBy === 'soonest') orderBy = { event: { event_date: 'asc' } }
  if (sortBy === 'guests_high') orderBy = { event: { guest_count: 'desc' } }

  const requests = await prisma.eventRequest.findMany({
    where: {
      public_status: 'OPEN',
      ...(validService ? { vendor_type: validService } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
      ...(Object.keys(createdAtFilter).length > 0 ? { created_at: createdAtFilter } : {}),
      ...(eventType ? { event: { event_type: eventType } } : {}),
      ...(Object.keys(menuWhere).length > 0 ? { menu_preference: menuWhere } : {}),
      event: {
        event_date: eventDateFilters,
        ...(Object.keys(budgetFilters).length > 0 ? { total_budget: budgetFilters } : {}),
        ...(Object.keys(guestFilters).length > 0 ? { guest_count: guestFilters } : {}),
        ...(cityFilter ? {
          OR: [
            { metro_city: { contains: cityFilter, mode: 'insensitive' as const } },
            { city: { contains: cityFilter, mode: 'insensitive' as const } },
          ],
        } : {}),
      },
    },
    orderBy,
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      vendor_type: true,
      public_token: true,
      public_status: true,
      service_notes: true,
      created_at: true,
      event: {
        select: {
          event_type: true,
          event_date: true,
          city: true,
          state: true,
          country: true,
          metro_city: true,
          metro_state: true,
          guest_count: true,
          total_budget: true,
          currency: true,
        },
      },
      menu_preference: {
        select: {
          cuisine_preferences: true,
          service_style: true,
          is_halal: true,
          is_vegetarian: true,
          is_jain: true,
          is_vegan: true,
          delivery_required: true,
          setup_required: true,
          serving_staff_required: true,
        },
      },
      _count: { select: { responses: true } },
    },
  })

  const hasMore = requests.length > PAGE_SIZE
  const items = hasMore ? requests.slice(0, PAGE_SIZE) : requests
  const nextCursor = hasMore ? items[items.length - 1].id : null

  const data = items.map(r => {
    const eventDate = new Date(r.event.event_date)
    const now = new Date()
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const timeLabel =
      diffDays <= 30 ? 'This month' :
      diffDays <= 60 ? 'Next month' :
      eventDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const logistics: string[] = []
    if (r.menu_preference?.delivery_required) logistics.push('Delivery')
    if (r.menu_preference?.setup_required) logistics.push('Setup')
    if (r.menu_preference?.serving_staff_required) logistics.push('Serving staff')

    return {
      id: r.id,
      vendor_type: r.vendor_type,
      public_token: r.public_token,
      response_count: r._count.responses,
      posted_at: r.created_at,
      service_notes: r.service_notes,
      event: {
        event_type: r.event.event_type,
        city: r.event.metro_city ?? r.event.city,
        state: r.event.metro_state ?? r.event.state,
        country: r.event.country,
        guest_count: r.event.guest_count,
        budget_band: budgetBand(Number(r.event.total_budget), r.event.currency),
        time_label: timeLabel,
      },
      dietary: {
        is_halal: r.menu_preference?.is_halal ?? false,
        is_vegetarian: r.menu_preference?.is_vegetarian ?? false,
        is_jain: r.menu_preference?.is_jain ?? false,
        is_vegan: r.menu_preference?.is_vegan ?? false,
      },
      cuisines: r.menu_preference?.cuisine_preferences ?? [],
      service_style: r.menu_preference?.service_style ?? null,
      logistics,
    }
  })

  return NextResponse.json({ items: data, nextCursor })
}
