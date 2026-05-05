import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MenuMode } from '@prisma/client'
import { z } from 'zod'
import { runMatchJob } from '@/lib/jobs/match'

const schema = z.object({ sub_event_id: z.string() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { sub_event_id } = parsed.data

  const attendees = await prisma.guestAttendee.findMany({
    where: { invite: { sub_event_id } },
  })

  if (attendees.length === 0) {
    return NextResponse.json({ message: 'No confirmed attendees yet' })
  }

  const dietaryCounts: Record<string, number> = {}
  const allergenCounts: Record<string, number> = {}
  for (const a of attendees) {
    dietaryCounts[a.dietary_type] = (dietaryCounts[a.dietary_type] ?? 0) + 1
    for (const al of a.allergens) allergenCounts[al] = (allergenCounts[al] ?? 0) + 1
  }

  const is_vegetarian = (dietaryCounts['VEGETARIAN'] ?? 0) + (dietaryCounts['VEGAN'] ?? 0) > 0
  const is_vegan = (dietaryCounts['VEGAN'] ?? 0) > 0
  const is_jain = (dietaryCounts['JAIN'] ?? 0) > 0
  const is_halal = (dietaryCounts['HALAL'] ?? 0) > 0
  const nut_free = (allergenCounts['nut_free'] ?? 0) > 0
  const gluten_free = (allergenCounts['gluten_free'] ?? 0) > 0
  const dairy_free = (allergenCounts['dairy_free'] ?? 0) > 0

  const dietaryNote = Object.entries(dietaryCounts)
    .map(([type, n]) => `${n} ${type.toLowerCase().replace('_', '-')}`)
    .join(', ')

  const caterRequest = await prisma.eventRequest.findFirst({
    where: {
      event_id: id,
      vendor_type: 'CATERER',
      sub_event_id: sub_event_id,
      status: { in: ['OPEN', 'MATCHED'] },
    },
  })

  if (caterRequest) {
    await prisma.eventMenuPreference.upsert({
      where: { caterer_request_id: caterRequest.id },
      update: {
        is_vegetarian, is_vegan, is_jain, is_halal, nut_free, gluten_free, dairy_free,
        special_notes: `Guest dietary breakdown (${attendees.length} confirmed): ${dietaryNote}`,
      },
      create: {
        event_id: id,
        caterer_request_id: caterRequest.id,
        menu_mode: 'CATERER_PROPOSES' as MenuMode,
        is_vegetarian, is_vegan, is_jain, is_halal, nut_free, gluten_free, dairy_free,
        special_notes: `Guest dietary breakdown (${attendees.length} confirmed): ${dietaryNote}`,
      },
    })
    runMatchJob({ eventRequestId: caterRequest.id }).catch(() => {})
  }

  return NextResponse.json({ applied: true, attendees: attendees.length, dietaryCounts, allergenCounts })
}
