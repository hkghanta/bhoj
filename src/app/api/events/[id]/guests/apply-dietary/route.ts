import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Sub-event invites and guest attendees have been removed.
// This endpoint is no longer active.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ message: 'Dietary sync from guest attendees is no longer supported' })
}
