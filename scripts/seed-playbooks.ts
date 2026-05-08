import { PrismaClient } from '@prisma/client'
import { PLAYBOOKS } from '../src/lib/playbook-data'

const prisma = new PrismaClient()

async function main() {
  console.log(`Seeding ${PLAYBOOKS.length} playbooks...`)

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
    console.log(`  ✓ ${pb.event_type} — ${pb.name}`)
  }

  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
