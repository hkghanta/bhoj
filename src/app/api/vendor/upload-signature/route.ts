import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cloudinary } from '@/lib/cloudinary'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = `bhoj/vendors/${(session.user!.id as string)}`
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation: 'c_limit,w_1600,q_auto' },
    process.env.CLOUDINARY_API_SECRET!
  )

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  })
}
