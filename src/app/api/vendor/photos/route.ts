import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  is_cover: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const photos = await prisma.vendorPhoto.findMany({
    where: { vendor_id: (session.user!.id as string) },
    orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }],
  })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const count = await prisma.vendorPhoto.count({ where: { vendor_id: (session.user!.id as string) } })

  if (parsed.data.is_cover) {
    await prisma.vendorPhoto.updateMany({
      where: { vendor_id: (session.user!.id as string), is_cover: true },
      data: { is_cover: false },
    })
  }

  const photo = await prisma.vendorPhoto.create({
    data: {
      ...parsed.data,
      vendor_id: (session.user!.id as string),
      sort_order: count,
    },
  })

  return NextResponse.json(photo, { status: 201 })
}
