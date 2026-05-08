import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PLAYBOOKS } from '@/lib/playbook-data'

export async function POST() {
  let upserted = 0

  for (const pb of PLAYBOOKS) {
    await prisma.eventPlaybook.upsert({
      where: { event_type: pb.event_type },
      create: {
        event_type: pb.event_type,
        name: pb.name,
        description: pb.description,
        checklist: pb.checklist as any,
        sub_events: pb.sub_events as any,
        budget_tips: pb.budget_tips as any,
        vendor_types: pb.vendor_types,
      },
      update: {
        name: pb.name,
        description: pb.description,
        checklist: pb.checklist as any,
        sub_events: pb.sub_events as any,
        budget_tips: pb.budget_tips as any,
        vendor_types: pb.vendor_types,
      },
    })
    upserted++
  }

  return NextResponse.json({ ok: true, upserted })
}
