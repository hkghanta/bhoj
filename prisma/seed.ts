import { PrismaClient, VendorType, VendorTier, MenuCategory, SpiceLevel, ChecklistStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo accounts…')

  const hash = await bcrypt.hash('demo1234', 10)

  // ── Customer ──────────────────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { email: 'priya@demo.bhoj' },
    update: {},
    create: {
      email: 'priya@demo.bhoj',
      name: 'Priya Sharma',
      phone: '+44 7700 900001',
      location: 'London',
      password_hash: hash,
    },
  })
  console.log('✓ Customer:', customer.email)

  // Demo event for the customer
  const existingEvent = await prisma.event.findFirst({ where: { customer_id: customer.id } })
  if (!existingEvent) {
    const event = await prisma.event.create({
      data: {
        customer_id: customer.id,
        event_name: 'Priya & Arjun Wedding',
        event_type: 'WEDDING',
        event_date: new Date('2026-09-15'),
        city: 'London',
        venue: 'The Grand Ballroom',
        guest_count: 250,
        total_budget: 15000,
        currency: 'GBP',
        status: 'PLANNING',
      },
    })

    // Auto-generate a few checklist items
    await prisma.eventChecklistItem.createMany({
      data: [
        { event_id: event.id, category: 'CATERING', item_name: 'Book caterer', status: ChecklistStatus.SEARCHING },
        { event_id: event.id, category: 'CATERING', item_name: 'Confirm menu & dietary requirements', status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'CATERING', item_name: 'Book bar service', status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'CATERING', item_name: 'Order wedding cake', status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'SETUP', item_name: 'Confirm guest list', status: ChecklistStatus.FINALIZED },
        { event_id: event.id, category: 'SETUP', item_name: 'Send invitations', status: ChecklistStatus.SHORTLISTED },
      ],
    })

    console.log('✓ Demo event created:', event.event_name)
  }

  // ── Vendor ────────────────────────────────────────────────────────────────
  const vendor = await prisma.vendor.upsert({
    where: { email: 'spice@demo.bhoj' },
    update: {},
    create: {
      email: 'spice@demo.bhoj',
      business_name: 'Spice Route Catering',
      vendor_type: VendorType.CATERER,
      city: 'London',
      country: 'GB',
      description: 'Award-winning North Indian and Fusion catering for weddings and corporate events. 15 years experience, fully licensed and insured.',
      phone_business: '+44 20 7946 0001',
      phone_cell: '+44 7700 900002',
      password_hash: hash,
      is_active: true,
      is_verified: true,
      tier: VendorTier.PRO,
    },
  })
  console.log('✓ Vendor:', vendor.email)

  // Services / cuisine tags
  const existingServices = await prisma.vendorService.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingServices) {
    await prisma.vendorService.createMany({
      data: [
        { vendor_id: vendor.id, name: 'North Indian', is_active: true },
        { vendor_id: vendor.id, name: 'Punjabi', is_active: true },
        { vendor_id: vendor.id, name: 'Mughlai', is_active: true },
        { vendor_id: vendor.id, name: 'Fusion', is_active: true },
      ],
    })
  }

  // Menu packages
  const existingPkg = await prisma.menuPackage.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingPkg) {
    const pkg = await prisma.menuPackage.create({
      data: {
        vendor_id: vendor.id,
        name: 'Royal Wedding Package',
        description: 'Full wedding spread — starters, live stations, mains, desserts and chai',
        price_per_head: 45,
        min_guests: 50,
        max_guests: 500,
        currency: 'GBP',
        is_vegetarian: false,
        is_vegan: false,
        is_jain: false,
        is_halal: true,
        is_active: true,
      },
    })

    console.log('✓ Menu package created')
  }

  // Dish library (MenuItem rows — also linked to the package via MenuPackageItem)
  const existingItems = await prisma.menuItem.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingItems) {
    const dishData = [
      { name: 'Paneer Tikka', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Grilled cottage cheese with spiced marinade' },
      { name: 'Seekh Kebab', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Minced lamb kebabs on skewers' },
      { name: 'Dal Makhani', category: MenuCategory.MAIN_COURSE, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Slow-cooked black lentils in butter and cream' },
      { name: 'Butter Chicken', category: MenuCategory.MAIN_COURSE, spice_level: SpiceLevel.MILD, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: true, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Tender chicken in a rich tomato-butter sauce' },
      { name: 'Lamb Biryani', category: MenuCategory.RICE_BIRYANI, spice_level: SpiceLevel.MEDIUM, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: true, contains_gluten: false, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Slow-cooked aromatic rice with tender lamb' },
      { name: 'Garlic Naan', category: MenuCategory.BREAD, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Freshly baked leavened bread with garlic butter' },
      { name: 'Gulab Jamun', category: MenuCategory.DESSERT, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Soft milk dumplings in rose syrup' },
      { name: 'Samosa Chaat', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: true, is_vegan: true, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Crispy samosas topped with chutneys' },
      { name: 'Pani Puri Station', category: MenuCategory.LIVE_COUNTER, spice_level: SpiceLevel.HOT, is_vegetarian: true, is_vegan: true, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Interactive live pani puri station' },
      { name: 'Masala Chai Station', category: MenuCategory.BEVERAGE, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Traditional spiced tea, made fresh' },
    ]

    const createdItems = []
    for (let i = 0; i < dishData.length; i++) {
      const item = await prisma.menuItem.create({
        data: { ...dishData[i], vendor_id: vendor.id, is_active: true },
      })
      createdItems.push(item)
    }

    // Link first 7 dishes to the package
    const pkg = await prisma.menuPackage.findFirst({ where: { vendor_id: vendor.id } })
    if (pkg) {
      for (let i = 0; i < Math.min(7, createdItems.length); i++) {
        await prisma.menuPackageItem.create({
          data: { package_id: pkg.id, menu_item_id: createdItems[i].id, sort_order: i },
        })
      }
    }

    console.log('✓ Dish library + package items created')
  }

  // Vendor metrics
  const existingMetrics = await prisma.vendorMetrics.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingMetrics) {
    await prisma.vendorMetrics.create({
      data: {
        vendor_id: vendor.id,
        vendor_type: VendorType.CATERER,
        period: new Date('2026-04-01'),
        avg_rating: 4.7,
        avg_response_hrs: 3.2,
        booking_rate: 0.68,
        quote_rate: 0.85,
        lead_count: 34,
      },
    })
    console.log('✓ Vendor metrics created')
  }

  console.log('\n──────────────────────────────────────')
  console.log('Demo credentials:')
  console.log('  Customer  → priya@demo.bhoj  / demo1234')
  console.log('  Vendor    → spice@demo.bhoj  / demo1234')
  console.log('  Admin     → /admin/login     (password: change-me-in-production)')
  console.log('──────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
