import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

// Re-checks existing leads with place_ids against Google Places Details API.
// Marks permanently closed, updates phone/website/rating.
// Designed to run every 3–6 months; call with POST.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not set' }, { status: 400 })

  // Only audit leads that haven't already been closed/joined and have a place_id
  const leads = await prisma.vendorLead.findMany({
    where: {
      place_id: { not: null },
      status: { notIn: ['PERMANENTLY_CLOSED', 'JOINED'] },
    },
    select: { id: true, place_id: true },
  })

  let closed = 0
  let updated = 0
  let errors = 0

  for (const lead of leads) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.place_id}&fields=business_status,formatted_phone_number,website,rating,user_ratings_total&key=${apiKey}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.status !== 'OK') {
        errors++
        continue
      }

      const r = data.result
      const isPermanentlyClosed = r.business_status === 'CLOSED_PERMANENTLY'

      await prisma.vendorLead.update({
        where: { id: lead.id },
        data: {
          ...(isPermanentlyClosed ? { status: 'PERMANENTLY_CLOSED' } : {}),
          ...(r.formatted_phone_number ? { phone: r.formatted_phone_number } : {}),
          ...(r.website ? { website: r.website } : {}),
          ...(r.rating != null ? { rating: r.rating } : {}),
          ...(r.user_ratings_total != null ? { total_ratings: r.user_ratings_total } : {}),
        },
      })

      if (isPermanentlyClosed) closed++
      else updated++

      // Respect rate limits
      await new Promise(r => setTimeout(r, 150))
    } catch {
      errors++
    }
  }

  return NextResponse.json({ checked: leads.length, closed, updated, errors })
}
