import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  template: z.string().optional(),
  hero_photo: z.string().url().optional(),
  our_story: z.string().optional(),
  travel_info: z.string().optional(),
  accommodation: z.string().optional(),
  faq: z.any().optional(),
  sections: z.any().optional(),
  colors: z.any().optional(),
})

const updateSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  template: z.string().optional(),
  hero_photo: z.string().url().nullable().optional(),
  our_story: z.string().nullable().optional(),
  travel_info: z.string().nullable().optional(),
  accommodation: z.string().nullable().optional(),
  faq: z.any().optional(),
  sections: z.any().optional(),
  colors: z.any().optional(),
  is_published: z.boolean().optional(),
  custom_domain: z.string().nullable().optional(),
})

/**
 * GET /api/events/[id]/website
 * Get event website. Owner or public if published.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const website = await prisma.eventWebsite.findUnique({
    where: { event_id: id },
    include: {
      event: {
        select: { id: true, customer_id: true, event_name: true, event_date: true, city: true, venue: true },
      },
    },
  })

  if (!website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  // Public access if published, otherwise owner only
  if (!website.is_published) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user!.id as string
    if (website.event.customer_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.json(website)
}

/**
 * POST /api/events/[id]/website
 * Create event website. Customer (event owner) only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Check slug uniqueness
  const slugExists = await prisma.eventWebsite.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  })
  if (slugExists) {
    return NextResponse.json({ error: 'Slug is already taken' }, { status: 409 })
  }

  // Check if website already exists for this event
  const existing = await prisma.eventWebsite.findUnique({
    where: { event_id: id },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'Website already exists for this event' }, { status: 409 })
  }

  const website = await prisma.eventWebsite.create({
    data: {
      event_id: id,
      slug: parsed.data.slug,
      template: parsed.data.template,
      hero_photo: parsed.data.hero_photo,
      our_story: parsed.data.our_story,
      travel_info: parsed.data.travel_info,
      accommodation: parsed.data.accommodation,
      faq: parsed.data.faq,
      sections: parsed.data.sections,
      colors: parsed.data.colors,
    },
  })

  return NextResponse.json(website, { status: 201 })
}

/**
 * PATCH /api/events/[id]/website
 * Update event website fields. Customer (event owner) only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const website = await prisma.eventWebsite.findUnique({
    where: { event_id: id },
    select: { id: true },
  })
  if (!website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // If slug is being changed, validate uniqueness
  if (parsed.data.slug) {
    const slugExists = await prisma.eventWebsite.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    })
    if (slugExists && slugExists.id !== website.id) {
      return NextResponse.json({ error: 'Slug is already taken' }, { status: 409 })
    }
  }

  const updated = await prisma.eventWebsite.update({
    where: { event_id: id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}
