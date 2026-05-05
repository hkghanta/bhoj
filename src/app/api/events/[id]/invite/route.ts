import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ALLOWED_IMAGE_HOSTS = ['images.unsplash.com', 'res.cloudinary.com']

const VALID_DIETARY = ['NON_VEG', 'VEGETARIAN', 'VEGAN', 'JAIN', 'HALAL'] as const

const updateSchema = z.object({
  invite_message: z.string().max(500).nullable().optional(),
  invite_image_data_url: z.string().optional(),
  invite_image_url_direct: z.string().url().optional(), // preset photo URL (no upload needed)
  invite_theme: z.string().optional(),
  clear_image: z.boolean().optional(),
  dietary_options: z.array(z.enum(VALID_DIETARY)).optional(),
  collect_allergens: z.boolean().optional(),
})

export async function PATCH(
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
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { invite_image_data_url, invite_image_url_direct, invite_message, invite_theme, clear_image, dietary_options, collect_allergens } = parsed.data
  let invite_image_url: string | null | undefined = undefined

  if (clear_image) {
    invite_image_url = null
  } else if (invite_image_url_direct) {
    // Validate host is on the allowlist to prevent SSRF
    const host = new URL(invite_image_url_direct).hostname
    if (!ALLOWED_IMAGE_HOSTS.includes(host)) {
      return NextResponse.json({ error: 'Image host not allowed' }, { status: 400 })
    }
    invite_image_url = invite_image_url_direct
  } else if (invite_image_data_url) {
    const { cloudinary } = await import('@/lib/cloudinary')
    const result = await cloudinary.uploader.upload(invite_image_data_url, {
      folder: 'invite-images',
      resource_type: 'image',
      transformation: 'c_fill,w_1600,h_600,q_auto',
    })
    invite_image_url = result.secure_url
  }

  try {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(invite_message !== undefined ? { invite_message } : {}),
        ...(invite_image_url !== undefined ? { invite_image_url } : {}),
        ...(invite_theme !== undefined ? { invite_theme } : {}),
        ...(dietary_options !== undefined ? { dietary_options } : {}),
        ...(collect_allergens !== undefined ? { collect_allergens } : {}),
      },
    })
    return NextResponse.json({
      invite_image_url: updated.invite_image_url,
      invite_message: updated.invite_message,
      invite_theme: updated.invite_theme,
      dietary_options: updated.dietary_options,
      collect_allergens: updated.collect_allergens,
    })
  } catch (e) {
    console.error('[invite PATCH]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
