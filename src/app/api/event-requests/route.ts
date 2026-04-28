import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchQueue } from '@/lib/jobs/queues'
import { z } from 'zod'
import { VendorType, MenuMode } from '@prisma/client'

const createSchema = z.object({
  event_id: z.string(),
  vendor_type: z.nativeEnum(VendorType),
  menu_preference: z.object({
    menu_mode: z.nativeEnum(MenuMode).default('CATERER_PROPOSES'),
    cuisine_preferences: z.array(z.string()).default([]),
    service_style: z.string().optional(),
    is_vegetarian: z.boolean().default(false),
    is_vegan: z.boolean().default(false),
    is_jain: z.boolean().default(false),
    is_halal: z.boolean().default(false),
    is_kosher: z.boolean().default(false),
    nut_free: z.boolean().default(false),
    gluten_free: z.boolean().default(false),
    dairy_free: z.boolean().default(false),
    special_notes: z.string().optional(),
    soup_salad_count: z.number().int().optional(),
    appetizer_count: z.number().int().optional(),
    main_count: z.number().int().optional(),
    bread_count: z.number().int().optional(),
    rice_biryani_count: z.number().int().optional(),
    dal_count: z.number().int().optional(),
    dessert_count: z.number().int().optional(),
    beverage_count: z.number().int().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.event_id, customer_id: (session.user!.id as string) },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const existing = await prisma.eventRequest.findFirst({
    where: {
      event_id: parsed.data.event_id,
      vendor_type: parsed.data.vendor_type,
      status: { in: ['OPEN', 'MATCHED'] },
    },
  })
  if (existing) {
    return NextResponse.json({ error: 'A request for this vendor type already exists' }, { status: 409 })
  }

  const { menu_preference, ...requestData } = parsed.data

  const eventRequest = await prisma.eventRequest.create({
    data: {
      ...requestData,
      customer_id: (session.user!.id as string),
      status: 'OPEN',
      menu_preference: menu_preference
        ? {
            create: {
              event_id: parsed.data.event_id,
              ...menu_preference,
            },
          }
        : undefined,
    },
    include: { menu_preference: true },
  })

  await matchQueue.add(
    'run-match',
    { eventRequestId: eventRequest.id },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  )

  return NextResponse.json(eventRequest, { status: 201 })
}
