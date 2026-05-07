import { NextRequest, NextResponse } from 'next/server'

// Sub-event invites have been removed. This endpoint is no longer active.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; inviteId: string }> }
) {
  return NextResponse.json(
    { error: 'Sub-event invites are no longer supported' },
    { status: 410 }
  )
}
