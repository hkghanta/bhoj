import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SERVICES = [
  // Business services — registered businesses, appear on Google Maps
  { vendor_type: 'CATERER',            label: 'Catering',            icon: '🍽',  service_class: 'BUSINESS',   is_enabled: true,  sort_order: 1  },
  { vendor_type: 'DECORATOR',          label: 'Decoration',          icon: '✨',  service_class: 'BUSINESS',   is_enabled: true,  sort_order: 2  },
  { vendor_type: 'FLORIST',            label: 'Florist',             icon: '💐',  service_class: 'BUSINESS',   is_enabled: true,  sort_order: 7  },
  { vendor_type: 'DESSERT_VENDOR',     label: 'Desserts & Sweets',   icon: '🍰',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 10 },
  { vendor_type: 'BARTENDER',          label: 'Bar & Bartender',     icon: '🍹',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 11 },
  { vendor_type: 'CHAI_STATION',       label: 'Chai Station',        icon: '☕',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 12 },
  { vendor_type: 'TENT_MARQUEE',       label: 'Tent & Marquee',      icon: '⛺',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 14 },
  { vendor_type: 'FURNITURE_RENTAL',   label: 'Furniture Rental',    icon: '🪑',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 16 },
  { vendor_type: 'EQUIPMENT_RENTAL',   label: 'Equipment Rental',    icon: '🔧',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 17 },
  { vendor_type: 'TRANSPORT',          label: 'Transport',           icon: '🚗',  service_class: 'BUSINESS',   is_enabled: false, sort_order: 18 },
  // Individual services — freelancers and sole traders, not on Google Maps
  { vendor_type: 'PHOTOGRAPHER',       label: 'Photography',         icon: '📷',  service_class: 'INDIVIDUAL', is_enabled: true,  sort_order: 3  },
  { vendor_type: 'DJ',                 label: 'DJ',                  icon: '🎵',  service_class: 'INDIVIDUAL', is_enabled: true,  sort_order: 4  },
  { vendor_type: 'MEHENDI_ARTIST',     label: 'Mehendi Artist',      icon: '🌿',  service_class: 'INDIVIDUAL', is_enabled: true,  sort_order: 5  },
  { vendor_type: 'MAKEUP_HAIR',        label: 'Makeup & Hair',       icon: '💄',  service_class: 'INDIVIDUAL', is_enabled: true,  sort_order: 6  },
  { vendor_type: 'VIDEOGRAPHER',       label: 'Videography',         icon: '🎬',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 20 },
  { vendor_type: 'DHOL_PLAYER',        label: 'Dhol Player',         icon: '🥁',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 21 },
  { vendor_type: 'LIVE_BAND',          label: 'Live Band',           icon: '🎸',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 22 },
  { vendor_type: 'CLASSICAL_MUSICIAN', label: 'Classical Musician',  icon: '🎻',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 23 },
  { vendor_type: 'CHOREOGRAPHER',      label: 'Choreographer',       icon: '💃',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 24 },
  { vendor_type: 'PANDIT_OFFICIANT',   label: 'Pandit / Officiant',  icon: '🙏',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 25 },
  { vendor_type: 'MC_HOST',            label: 'MC / Host',           icon: '🎤',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 26 },
  { vendor_type: 'INVITATION_DESIGNER',label: 'Invitation Designer', icon: '✉️',  service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 27 },
  { vendor_type: 'GAMES_ENTERTAINMENT',label: 'Games & Entertainment',icon: '🎮', service_class: 'INDIVIDUAL', is_enabled: false, sort_order: 28 },
]

async function main() {
  console.log('Seeding ServiceConfig...')
  for (const s of SERVICES) {
    await prisma.serviceConfig.upsert({
      where: { vendor_type: s.vendor_type },
      update: { label: s.label, icon: s.icon, service_class: s.service_class, sort_order: s.sort_order },
      create: s,
    })
  }
  console.log(`✓ Seeded ${SERVICES.length} service types`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
