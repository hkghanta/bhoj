import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Returns distinct cities, service types, and event types that have open requests
export async function GET() {
  const [cityRows, serviceRows, eventTypeRows] = await Promise.all([
    prisma.eventRequest.findMany({
      where: { public_status: 'OPEN', event: { event_date: { gte: new Date() } } },
      select: { event: { select: { city: true, state: true, country: true, metro_city: true, metro_state: true } } },
      distinct: ['event_id'],
    }),
    prisma.eventRequest.groupBy({
      by: ['vendor_type'],
      where: { public_status: 'OPEN', event: { event_date: { gte: new Date() } } },
      _count: { vendor_type: true },
      orderBy: { _count: { vendor_type: 'desc' } },
    }),
    prisma.event.groupBy({
      by: ['event_type'],
      where: {
        event_date: { gte: new Date() },
        requests: { some: { public_status: 'OPEN' } },
      },
      _count: { event_type: true },
      orderBy: { _count: { event_type: 'desc' } },
    }),
  ])

  // Deduplicate cities
  const seen = new Set<string>()
  const cities: { city: string; country: string }[] = []
  for (const r of cityRows) {
    const displayCity = r.event.metro_city ?? r.event.city
    const displayCountry = r.event.country
    const key = `${displayCity}|${displayCountry}`
    if (!seen.has(key)) {
      seen.add(key)
      cities.push({ city: displayCity, country: displayCountry })
    }
  }
  cities.sort((a, b) => a.city.localeCompare(b.city))

  const services = serviceRows.map(r => ({
    value: r.vendor_type,
    count: r._count.vendor_type,
  }))

  const eventTypes = eventTypeRows.map(r => ({
    value: r.event_type,
    count: r._count.event_type,
  }))

  return NextResponse.json({ cities, services, eventTypes })
}
