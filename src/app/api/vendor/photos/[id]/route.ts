import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloudinary } from '@/lib/cloudinary'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const photo = await prisma.vendorPhoto.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const urlParts = photo.url.split('/')
    const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '')
    await cloudinary.uploader.destroy(publicId)
  } catch {
    console.error('Cloudinary delete failed for', photo.url)
  }

  await prisma.vendorPhoto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
