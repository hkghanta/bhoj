import { PrismaClient, VendorType, VendorTier, MenuCategory, SpiceLevel, ChecklistStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const trial = () => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d }

// Vendor types that commonly travel long distances
const WIDE_TRAVEL_TYPES = new Set<VendorType>(['CATERER', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'DJ', 'MEHENDI_ARTIST', 'MAKEUP_HAIR'])

async function upsertVendor(hash: string, data: {
  email: string; business_name: string; vendor_type: VendorType
  city: string; description: string; phone_business: string
  services: string[]; avg_rating?: number; avg_response_hrs?: number
  packages?: { name: string; price_per_head: number; is_halal?: boolean; is_vegetarian?: boolean }[]
}) {
  const trialEndsAt = trial()
  const travel_radius_miles = WIDE_TRAVEL_TYPES.has(data.vendor_type) ? 300 : 75
  const vendor = await prisma.vendor.upsert({
    where: { email: data.email },
    update: { tier: 'PRO', trial_ends_at: trialEndsAt, city: data.city, country: 'US', travel_radius_miles },
    create: {
      email: data.email,
      business_name: data.business_name,
      vendor_type: data.vendor_type,
      city: data.city,
      country: 'US',
      travel_radius_miles,
      description: data.description,
      phone_business: data.phone_business,
      password_hash: hash,
      is_active: true,
      is_verified: true,
      tier: VendorTier.PRO,
      trial_ends_at: trialEndsAt,
    },
  })

  const existingServices = await prisma.vendorService.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingServices) {
    await prisma.vendorService.createMany({
      data: data.services.map(name => ({ vendor_id: vendor.id, name, is_active: true })),
    })
  }

  const existingMetrics = await prisma.vendorMetrics.findFirst({ where: { vendor_id: vendor.id } })
  if (!existingMetrics) {
    await prisma.vendorMetrics.create({
      data: {
        vendor_id: vendor.id,
        vendor_type: data.vendor_type,
        period: new Date('2026-04-01'),
        avg_rating: data.avg_rating ?? (3.8 + Math.random() * 1.2),
        avg_response_hrs: data.avg_response_hrs ?? (2 + Math.random() * 8),
        booking_rate: 0.5 + Math.random() * 0.4,
        quote_rate: 0.6 + Math.random() * 0.35,
        lead_count: Math.floor(10 + Math.random() * 50),
      },
    })
  }

  if (data.packages) {
    const existingPkg = await prisma.menuPackage.findFirst({ where: { vendor_id: vendor.id } })
    if (!existingPkg) {
      for (const pkg of data.packages) {
        await prisma.menuPackage.create({
          data: {
            vendor_id: vendor.id,
            name: pkg.name,
            description: `${pkg.name} by ${data.business_name}`,
            price_per_head: pkg.price_per_head,
            min_guests: 30,
            max_guests: 500,
            currency: 'USD',
            is_vegetarian: pkg.is_vegetarian ?? false,
            is_vegan: false,
            is_jain: false,
            is_halal: pkg.is_halal ?? true,
            is_active: true,
          },
        })
      }
    }
  }

  return vendor
}

async function main() {
  console.log('Seeding OneSeva demo data…')

  const hash = await bcrypt.hash('demo1234', 10)

  // ── Customer ──────────────────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { email: 'priya@demo.oneseva' },
    update: {},
    create: {
      email: 'priya@demo.oneseva',
      name: 'Priya Sharma',
      phone: '+1 (646) 555-0001',
      location: 'New York',
      password_hash: hash,
    },
  })
  console.log('✓ Customer:', customer.email)

  // ── Demo event ────────────────────────────────────────────────────────────
  let event = await prisma.event.findFirst({ where: { customer_id: customer.id } })
  if (!event) {
    event = await prisma.event.create({
      data: {
        customer_id: customer.id,
        event_name: 'Priya & Arjun Wedding',
        event_type: 'wedding',
        event_date: new Date('2026-09-15'),
        city: 'New York',
        venue: 'The Grand Ballroom, Midtown Manhattan',
        guest_count: 250,
        total_budget: 35000,
        currency: 'USD',
        status: 'PLANNING',
      },
    })
    await prisma.eventChecklistItem.createMany({
      data: [
        { event_id: event.id, category: 'Catering', item_name: 'Book caterer',                  status: ChecklistStatus.SEARCHING },
        { event_id: event.id, category: 'Catering', item_name: 'Confirm menu & dietary needs',  status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Catering', item_name: 'Order wedding cake',            status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Catering', item_name: 'Book bar & drinks service',     status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Décor',    item_name: 'Mandap & stage decoration',     status: ChecklistStatus.SEARCHING },
        { event_id: event.id, category: 'Décor',    item_name: 'Floral arrangements',            status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Décor',    item_name: 'Table centerpieces',             status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Photography', item_name: 'Wedding photographer',       status: ChecklistStatus.SHORTLISTED },
        { event_id: event.id, category: 'Photography', item_name: 'Videographer',               status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Entertainment', item_name: 'DJ / music',               status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Entertainment', item_name: 'Dhol player',              status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Beauty',   item_name: 'Bridal makeup & hair',          status: ChecklistStatus.SEARCHING },
        { event_id: event.id, category: 'Beauty',   item_name: 'Mehendi artist',                status: ChecklistStatus.PENDING },
        { event_id: event.id, category: 'Guest Management', item_name: 'Confirm guest list',    status: ChecklistStatus.FINALIZED },
        { event_id: event.id, category: 'Guest Management', item_name: 'Send invitations',      status: ChecklistStatus.FINALIZED },
        { event_id: event.id, category: 'Guest Management', item_name: 'Arrange transport',     status: ChecklistStatus.PENDING },
      ],
    })
    console.log('✓ Demo event created')
  }

  // ── CATERERS (6) ──────────────────────────────────────────────────────────
  const trialEndsAt = trial()

  const caterer1 = await prisma.vendor.upsert({
    where: { email: 'spice@demo.oneseva' },
    update: { tier: 'PRO', trial_ends_at: trialEndsAt, city: 'New York', country: 'US' },
    create: {
      email: 'spice@demo.oneseva',
      business_name: 'Spice Route Catering',
      vendor_type: VendorType.CATERER,
      city: 'New York', country: 'US',
      description: 'Award-winning North Indian and Fusion catering for weddings and corporate events. 15 years experience, fully licensed and insured. Serving Jackson Heights and all of tri-state area.',
      phone_business: '(718) 555-0001',
      password_hash: hash,
      is_active: true, is_verified: true,
      tier: VendorTier.PRO, trial_ends_at: trialEndsAt,
    },
  })
  console.log('✓ Caterer 1:', caterer1.email)

  // Caterer 1 services + dishes
  if (!await prisma.vendorService.findFirst({ where: { vendor_id: caterer1.id } })) {
    await prisma.vendorService.createMany({ data: [
      { vendor_id: caterer1.id, name: 'North Indian', is_active: true },
      { vendor_id: caterer1.id, name: 'Punjabi', is_active: true },
      { vendor_id: caterer1.id, name: 'Mughlai', is_active: true },
      { vendor_id: caterer1.id, name: 'Fusion', is_active: true },
    ]})
  }
  if (!await prisma.menuPackage.findFirst({ where: { vendor_id: caterer1.id } })) {
    await prisma.menuPackage.create({ data: {
      vendor_id: caterer1.id, name: 'Royal Wedding Package',
      description: 'Full wedding spread — starters, live stations, mains, desserts and chai',
      price_per_head: 75, min_guests: 50, max_guests: 500, currency: 'USD',
      is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, is_active: true,
    }})
    await prisma.menuPackage.create({ data: {
      vendor_id: caterer1.id, name: 'Pure Veg Celebration',
      description: 'Jain-friendly vegetarian feast with live counters',
      price_per_head: 58, min_guests: 30, max_guests: 300, currency: 'USD',
      is_vegetarian: true, is_vegan: false, is_jain: true, is_halal: true, is_active: true,
    }})
  }
  if (!await prisma.menuItem.findFirst({ where: { vendor_id: caterer1.id } })) {
    const dishes = [
      { name: 'Paneer Tikka', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Grilled cottage cheese marinated in spiced yogurt, served with mint chutney.', is_global: true, proteins: ['Paneer'] },
      { name: 'Seekh Kebab', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Minced lamb kebabs seasoned with herbs and spices, charcoal-grilled on skewers.', is_global: true, proteins: ['Lamb'] },
      { name: 'Dal Makhani', category: MenuCategory.MAIN_COURSE, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Slow-cooked black lentils simmered overnight in butter, cream and aromatic spices.', is_global: true, proteins: ['Lentils'] },
      { name: 'Butter Chicken', category: MenuCategory.MAIN_COURSE, spice_level: SpiceLevel.MILD, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: true, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Tender tandoor-cooked chicken in a velvety tomato, butter and cashew sauce.', is_global: true, proteins: ['Chicken'] },
      { name: 'Lamb Biryani', category: MenuCategory.RICE_BIRYANI, spice_level: SpiceLevel.MEDIUM, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: true, contains_gluten: false, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Fragrant slow-cooked basmati rice layered with tender lamb and whole spices.', is_global: true, proteins: ['Lamb'] },
      { name: 'Garlic Naan', category: MenuCategory.BREAD, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Freshly baked leavened flatbread brushed with garlic butter, straight from the tandoor.', is_global: true, proteins: [] },
      { name: 'Gulab Jamun', category: MenuCategory.DESSERT, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Soft milk-solid dumplings deep-fried and soaked in rose-flavored sugar syrup.', is_global: true, proteins: [] },
      { name: 'Samosa Chaat', category: MenuCategory.APPETIZER, spice_level: SpiceLevel.MEDIUM, is_vegetarian: true, is_vegan: true, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Crispy spiced potato samosas crushed and topped with tamarind chutney and chaat masala.', is_global: true, proteins: [] },
      { name: 'Pani Puri Station', category: MenuCategory.LIVE_COUNTER, spice_level: SpiceLevel.HOT, is_vegetarian: true, is_vegan: true, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: true, contains_dairy: false, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Interactive live station where guests fill crispy puris with spiced potato and tangy flavored water.', is_global: true, proteins: [] },
      { name: 'Masala Chai Station', category: MenuCategory.BEVERAGE, spice_level: SpiceLevel.MILD, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true, contains_nuts: false, contains_gluten: false, contains_dairy: true, contains_eggs: false, contains_soy: false, contains_shellfish: false, description: 'Live station serving freshly brewed traditional spiced tea with ginger, cardamom and cinnamon.', is_global: true, proteins: [] },
    ]
    const created = []
    for (const d of dishes) {
      const item = await prisma.menuItem.create({ data: { ...d, vendor_id: caterer1.id, is_active: true } })
      created.push(item)
    }
    const pkg = await prisma.menuPackage.findFirst({ where: { vendor_id: caterer1.id } })
    if (pkg) {
      for (let i = 0; i < Math.min(8, created.length); i++) {
        await prisma.menuPackageItem.create({ data: { package_id: pkg.id, menu_item_id: created[i].id, sort_order: i } })
      }
    }
  }
  if (!await prisma.vendorMetrics.findFirst({ where: { vendor_id: caterer1.id } })) {
    await prisma.vendorMetrics.create({ data: { vendor_id: caterer1.id, vendor_type: VendorType.CATERER, period: new Date('2026-04-01'), avg_rating: 4.7, avg_response_hrs: 3.2, booking_rate: 0.68, quote_rate: 0.85, lead_count: 34 } })
  }

  const caterer2 = await upsertVendor(hash, {
    email: 'tandoori@demo.oneseva', business_name: 'Tandoori Palace Events', vendor_type: VendorType.CATERER,
    city: 'New York', description: 'Specialising in authentic Punjabi and Mughlai cuisine for large weddings. Fully halal kitchen, live tandoor stations. Serving Jackson Heights, Queens and tri-state area.',
    phone_business: '(718) 555-0002', avg_rating: 4.5,
    services: ['Punjabi', 'Mughlai', 'Halal', 'Live Tandoor'],
    packages: [
      { name: 'Grand Banquet', price_per_head: 65, is_halal: true },
      { name: 'Veg Delight', price_per_head: 52, is_vegetarian: true },
    ],
  })

  const caterer3 = await upsertVendor(hash, {
    email: 'mughal@demo.oneseva', business_name: 'Mughal Kitchen', vendor_type: VendorType.CATERER,
    city: 'Chicago', description: 'Traditional Mughlai and Awadhi cuisine specialists on Devon Ave. Slow-cooked dum biryanis, kebabs and rich curries for discerning guests.',
    phone_business: '(773) 555-0001', avg_rating: 4.6,
    services: ['Mughlai', 'Awadhi', 'Biryani', 'Kebabs'],
    packages: [
      { name: 'Nawabi Feast', price_per_head: 70, is_halal: true },
      { name: 'Biryani Banquet', price_per_head: 55, is_halal: true },
    ],
  })

  const caterer4 = await upsertVendor(hash, {
    email: 'punjab@demo.oneseva', business_name: 'Punjab Express Catering', vendor_type: VendorType.CATERER,
    city: 'Houston', description: 'Vibrant Punjabi food with high-energy service on Hillcroft Ave. Dhaba-style food stations loved at bhangra weddings.',
    phone_business: '(713) 555-0001', avg_rating: 4.3,
    services: ['Punjabi', 'Street Food', 'Live Counters'],
    packages: [
      { name: 'Bhangra Package', price_per_head: 50, is_halal: true },
    ],
  })

  const caterer5 = await upsertVendor(hash, {
    email: 'zafrani@demo.oneseva', business_name: 'Zafrani Fine Dining', vendor_type: VendorType.CATERER,
    city: 'New York', description: 'Premium fine-dining catering with a South Asian twist. Silver service, elegant presentation for luxury events in Manhattan and New Jersey.',
    phone_business: '(212) 555-0001', avg_rating: 4.8,
    services: ['Fine Dining', 'South Asian', 'Silver Service'],
    packages: [
      { name: 'Luxury Wedding', price_per_head: 110, is_halal: true },
      { name: 'Corporate Gala', price_per_head: 90, is_halal: true },
    ],
  })

  const caterer6 = await upsertVendor(hash, {
    email: 'royalfeast@demo.oneseva', business_name: 'Royal Feast Caterers', vendor_type: VendorType.CATERER,
    city: 'Houston', description: 'Family-run catering business serving the Houston South Asian community for 20 years. Homestyle Indian cooking with generous portions.',
    phone_business: '(713) 555-0002', avg_rating: 4.2,
    services: ['North Indian', 'Gujarati', 'South Indian'],
    packages: [
      { name: 'Family Package', price_per_head: 45, is_halal: true },
      { name: 'Jain Special', price_per_head: 42, is_vegetarian: true },
    ],
  })

  console.log('✓ 6 caterers seeded')

  // ── DECORATORS (5) ────────────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'dreamdecor@demo.oneseva', business_name: 'Dream Decor Events', vendor_type: VendorType.DECORATOR,
    city: 'New York', description: 'Luxury wedding decorators specializing in mandap design, floral installations and stage backdrops. We turn venues into fairytales.',
    phone_business: '(212) 555-0010', avg_rating: 4.9,
    services: ['Mandap', 'Floral', 'Stage Design', 'Lighting'],
    packages: [{ name: 'Full Wedding Décor', price_per_head: 35 }],
  })
  await upsertVendor(hash, {
    email: 'floralfantasy@demo.oneseva', business_name: 'Floral Fantasy', vendor_type: VendorType.DECORATOR,
    city: 'Chicago', description: 'Bespoke floral design studio on Devon Ave. Stunning ceremony and reception arrangements. Specialty in marigold and rose installations.',
    phone_business: '(773) 555-0010', avg_rating: 4.7,
    services: ['Floral Design', 'Marigold Garlands', 'Table Centerpieces'],
    packages: [{ name: 'Full Floral Package', price_per_head: 25 }],
  })
  await upsertVendor(hash, {
    email: 'regalsetups@demo.oneseva', business_name: 'Regal Setups', vendor_type: VendorType.DECORATOR,
    city: 'Houston', description: 'Modern and traditional wedding décor. LED walls, draping, photo booths and thematic event design serving all of greater Houston.',
    phone_business: '(713) 555-0010', avg_rating: 4.5,
    services: ['LED Walls', 'Draping', 'Photo Booth', 'Thematic Design'],
    packages: [{ name: 'Platinum Décor', price_per_head: 30 }],
  })
  await upsertVendor(hash, {
    email: 'goldentouch@demo.oneseva', business_name: 'Golden Touch Décor', vendor_type: VendorType.DECORATOR,
    city: 'New York', description: 'Elegant décor solutions for weddings and celebrations. Known for our intricate mehndi night and sangeet setups in New Jersey and New York.',
    phone_business: '(732) 555-0010', avg_rating: 4.4,
    services: ['Mehndi Night', 'Sangeet Setup', 'Wedding Décor'],
    packages: [{ name: 'Wedding Package', price_per_head: 22 }],
  })
  await upsertVendor(hash, {
    email: 'celebration@demo.oneseva', business_name: 'Celebration Designs', vendor_type: VendorType.DECORATOR,
    city: 'Chicago', description: 'Budget-friendly yet beautiful décor for Indian weddings in Chicago and the suburbs. No compromise on style — just smart choices.',
    phone_business: '(847) 555-0010', avg_rating: 4.1,
    services: ['Budget Weddings', 'Floral', 'Furniture'],
    packages: [{ name: 'Essential Package', price_per_head: 16 }],
  })
  console.log('✓ 5 decorators seeded')

  // ── PHOTOGRAPHERS (5) ─────────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'momentz@demo.oneseva', business_name: 'Momentz Photography', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'New York', description: 'Award-winning wedding photographers capturing authentic emotions. Specialists in South Asian weddings with editorial flair throughout NYC and New Jersey.',
    phone_business: '(212) 555-0020', avg_rating: 4.9,
    services: ['South Asian Weddings', 'Editorial', 'Same-Day Edit'],
  })
  await upsertVendor(hash, {
    email: 'vividframes@demo.oneseva', business_name: 'Vivid Frames', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'Chicago', description: 'Candid and documentary-style wedding photography on Devon Ave and throughout Chicagoland. We capture real moments, real emotions — naturally.',
    phone_business: '(773) 555-0020', avg_rating: 4.7,
    services: ['Documentary', 'Candid', 'Drone Photography'],
  })
  await upsertVendor(hash, {
    email: 'candidclicks@demo.oneseva', business_name: 'Candid Clicks', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'Houston', description: 'Specialist in Indian wedding photography in Houston and Sugar Land. Covering all pre-wedding events: mehndi, sangeet, baraat and reception.',
    phone_business: '(713) 555-0020', avg_rating: 4.6,
    services: ['Full Coverage', 'Pre-Wedding', 'Photo Albums'],
  })
  await upsertVendor(hash, {
    email: 'everlasting@demo.oneseva', business_name: 'Everlasting Memories', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'New York', description: 'Experienced wedding photographers with a warm, relaxed approach. Serving Jackson Heights, Edison NJ and all of New York.',
    phone_business: '(718) 555-0020', avg_rating: 4.4,
    services: ['Wedding Photography', 'Videography'],
  })
  await upsertVendor(hash, {
    email: 'goldenhour@demo.oneseva', business_name: 'Golden Hour Photography', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'Chicago', description: 'Fine-art wedding photography with a cinematic edge. Films and photos that look like they belong in a magazine. Serving all of Illinois.',
    phone_business: '(630) 555-0020', avg_rating: 4.8,
    services: ['Fine Art', 'Cinematic', 'Engagement Shoots'],
  })
  console.log('✓ 5 photographers seeded')

  // ── DJs (5) ───────────────────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'djarjun@demo.oneseva', business_name: 'DJ Arjun NYC', vendor_type: VendorType.DJ,
    city: 'New York', description: 'Professional DJ and MC for South Asian weddings in NYC and New Jersey. Specializing in Bollywood, Bhangra and chart hits. 10 years of experience.',
    phone_business: '(718) 555-0030', avg_rating: 4.8,
    services: ['Bollywood', 'Bhangra', 'MC Services', 'Live Mixing'],
  })
  await upsertVendor(hash, {
    email: 'punjabi.beats@demo.oneseva', business_name: 'Bhangra Beats Chicago', vendor_type: VendorType.DJ,
    city: 'Chicago', description: 'High-energy DJ bringing the best of Punjabi, Bhangra and commercial music. State-of-the-art sound and lighting rig serving all of Chicagoland.',
    phone_business: '(773) 555-0030', avg_rating: 4.7,
    services: ['Bhangra', 'Commercial', 'Sound & Lighting'],
  })
  await upsertVendor(hash, {
    email: 'rhythmmasters@demo.oneseva', business_name: 'Rhythm Masters', vendor_type: VendorType.DJ,
    city: 'Houston', description: 'Multi-award winning DJ duo for South Asian weddings in Houston and Sugar Land. Seamless transitions, reading the crowd perfectly.',
    phone_business: '(713) 555-0030', avg_rating: 4.9,
    services: ['Bollywood', 'RnB', 'Fusion', 'Photo Booth'],
  })
  await upsertVendor(hash, {
    email: 'djfusion@demo.oneseva', business_name: 'DJ Fusion NY', vendor_type: VendorType.DJ,
    city: 'New York', description: 'Versatile DJ playing everything from classical Bollywood to current charts. Perfect for multigenerational wedding crowds in Queens and Long Island.',
    phone_business: '(718) 555-0031', avg_rating: 4.5,
    services: ['Bollywood', 'Classical', 'Multi-Genre'],
  })
  await upsertVendor(hash, {
    email: 'bassbeats@demo.oneseva', business_name: 'Bass & Beats Events', vendor_type: VendorType.DJ,
    city: 'Chicago', description: 'Full event DJ service with premium audio-visual equipment. Professional setup, on-time delivery guaranteed throughout Illinois.',
    phone_business: '(847) 555-0030', avg_rating: 4.3,
    services: ['Weddings', 'Corporate', 'Birthdays'],
  })
  console.log('✓ 5 DJs seeded')

  // ── MEHENDI ARTISTS (4) ───────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'hennapriya@demo.oneseva', business_name: 'Henna by Priya NYC', vendor_type: VendorType.MEHENDI_ARTIST,
    city: 'New York', description: 'Exquisite bridal mehndi with intricate Rajasthani and Arabic designs. Over 500 brides served. Featured in South Asian Bride magazine. Based in Jackson Heights.',
    phone_business: '(718) 555-0040', avg_rating: 4.9,
    services: ['Bridal Mehndi', 'Rajasthani', 'Arabic', 'Guest Mehndi'],
  })
  await upsertVendor(hash, {
    email: 'mehendimgc@demo.oneseva', business_name: 'Mehendi Magic Chicago', vendor_type: VendorType.MEHENDI_ARTIST,
    city: 'Chicago', description: 'Traditional and contemporary mehndi designs for brides and bridal parties on Devon Ave. Quick application for guest sessions.',
    phone_business: '(773) 555-0040', avg_rating: 4.7,
    services: ['Bridal', 'Guest Mehndi', 'Moroccan', 'Jagua'],
  })
  await upsertVendor(hash, {
    email: 'intricatedesigns@demo.oneseva', business_name: 'Intricate Designs Mehndi', vendor_type: VendorType.MEHENDI_ARTIST,
    city: 'Houston', description: 'Specialist in fine-line bridal mehndi. Full hands, full feet, full arms — beautifully dark stain guaranteed. Serving Houston and Sugar Land.',
    phone_business: '(713) 555-0040', avg_rating: 4.6,
    services: ['Fine Line', 'Full Bridal', 'Dark Stain'],
  })
  await upsertVendor(hash, {
    email: 'saharahenna@demo.oneseva', business_name: 'Sahara Henna', vendor_type: VendorType.MEHENDI_ARTIST,
    city: 'New York', description: 'African and South Asian fusion mehndi designs. Unique patterns that blend tradition with modern art. Based in Edison, NJ.',
    phone_business: '(732) 555-0040', avg_rating: 4.5,
    services: ['Fusion', 'African', 'Bridal', 'Contemporary'],
  })
  console.log('✓ 4 mehendi artists seeded')

  // ── MAKEUP & HAIR (4) ─────────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'glamourneha@demo.oneseva', business_name: 'Glamour Studio by Neha', vendor_type: VendorType.MAKEUP_HAIR,
    city: 'New York', description: 'Celebrity makeup artist and hair stylist. Bridal glam, editorial looks and party makeup. Team of 5 artists available throughout NYC and NJ.',
    phone_business: '(212) 555-0050', avg_rating: 4.9,
    services: ['Bridal Makeup', 'Hair Styling', 'Party Makeup', 'Team Available'],
  })
  await upsertVendor(hash, {
    email: 'bridalbliss@demo.oneseva', business_name: 'Bridal Bliss MUA', vendor_type: VendorType.MAKEUP_HAIR,
    city: 'Chicago', description: 'Qualified makeup artist specializing in South Asian bridal looks on Devon Ave. HD makeup, airbrush techniques for long-lasting results.',
    phone_business: '(773) 555-0050', avg_rating: 4.7,
    services: ['HD Makeup', 'Airbrush', 'South Asian Bridal'],
  })
  await upsertVendor(hash, {
    email: 'radiantbridal@demo.oneseva', business_name: 'Radiant Bridal', vendor_type: VendorType.MAKEUP_HAIR,
    city: 'Houston', description: 'Natural, dewy bridal looks that photograph beautifully. Skin prep, trial sessions and on-the-day services in Sugar Land and Houston.',
    phone_business: '(281) 555-0050', avg_rating: 4.8,
    services: ['Natural Looks', 'Skin Prep', 'Trial Sessions'],
  })
  await upsertVendor(hash, {
    email: 'elitemua@demo.oneseva', business_name: 'Elite Makeup Artists', vendor_type: VendorType.MAKEUP_HAIR,
    city: 'New York', description: 'Affordable bridal and bridesmaids makeup in Queens and New Jersey. Full team packages with hair, makeup and touch-up kits included.',
    phone_business: '(718) 555-0051', avg_rating: 4.4,
    services: ['Bridal', 'Bridesmaids', 'Hair & Makeup Package'],
  })
  console.log('✓ 4 makeup artists seeded')

  // ── FLORISTS (3) ──────────────────────────────────────────────────────────
  await upsertVendor(hash, {
    email: 'bloomlondon@demo.oneseva', business_name: 'Bloom NY Florals', vendor_type: VendorType.FLORIST,
    city: 'New York', description: 'Luxury floral design for weddings and events in New York and New Jersey. Specialty in seasonal blooms with South Asian color palettes.',
    phone_business: '(212) 555-0060', avg_rating: 4.8,
    services: ['Bridal Bouquets', 'Ceremony Flowers', 'Reception Centerpieces'],
  })
  await upsertVendor(hash, {
    email: 'petalcraft@demo.oneseva', business_name: 'Petal Craft Flowers', vendor_type: VendorType.FLORIST,
    city: 'Chicago', description: 'Fresh flower specialists for Indian weddings on Devon Ave. Marigold garlands, rose walls and traditional phulkari arrangements.',
    phone_business: '(773) 555-0060', avg_rating: 4.6,
    services: ['Marigold Garlands', 'Rose Walls', 'Traditional Arrangements'],
  })
  await upsertVendor(hash, {
    email: 'springblooms@demo.oneseva', business_name: 'Spring Blooms Houston', vendor_type: VendorType.FLORIST,
    city: 'Houston', description: 'Affordable and beautiful floral arrangements for all event sizes. Same-week delivery available throughout greater Houston.',
    phone_business: '(713) 555-0060', avg_rating: 4.3,
    services: ['Bouquets', 'Table Flowers', 'Event Flowers'],
  })
  console.log('✓ 3 florists seeded')

  // ── LAUNCH CITY DEPTH: extra vendors for New York, Chicago, Houston ─────
  // New York caterers (depth)
  await upsertVendor(hash, {
    email: 'desistreet@demo.oneseva', business_name: 'Desi Street Kitchen', vendor_type: VendorType.CATERER,
    city: 'New York', description: 'Street-food style catering with a twist — chaat stations, kathi rolls and live grill counters. Popular for sangeet and mehndi nights in NYC.',
    phone_business: '(718) 555-0003', avg_rating: 4.6,
    services: ['Street Food', 'Live Chaat', 'Kathi Rolls', 'Sangeet Catering'],
    packages: [
      { name: 'Street Fiesta', price_per_head: 48, is_halal: true },
      { name: 'Mehndi Night Special', price_per_head: 38, is_vegetarian: true },
    ],
  })
  await upsertVendor(hash, {
    email: 'southindian@demo.oneseva', business_name: 'Madras & More Events', vendor_type: VendorType.CATERER,
    city: 'New York', description: 'Authentic South Indian catering for weddings and corporate. Banana leaf service, dosa stations, filter coffee and more. Serving New York and Edison NJ.',
    phone_business: '(732) 555-0003', avg_rating: 4.4,
    services: ['South Indian', 'Banana Leaf', 'Dosa Station', 'Filter Coffee'],
    packages: [
      { name: 'South Indian Feast', price_per_head: 52, is_vegetarian: true },
      { name: 'Non-Veg Special', price_per_head: 62, is_halal: false },
    ],
  })
  await upsertVendor(hash, {
    email: 'kormapalace@demo.oneseva', business_name: 'Korma Palace Catering', vendor_type: VendorType.CATERER,
    city: 'New York', description: 'Specialist in Pakistani and Kashmiri cuisine in New York. Whole roast lamb, dum gosht and aromatic biryanis for discerning wedding guests.',
    phone_business: '(212) 555-0003', avg_rating: 4.7,
    services: ['Pakistani', 'Kashmiri', 'Whole Roast', 'Biryani'],
    packages: [
      { name: 'Kashmiri Wedding', price_per_head: 80, is_halal: true },
      { name: 'Classic Banquet', price_per_head: 62, is_halal: true },
    ],
  })
  // Chicago caterers (depth)
  await upsertVendor(hash, {
    email: 'saffronbham@demo.oneseva', business_name: 'Saffron Events Chicago', vendor_type: VendorType.CATERER,
    city: 'Chicago', description: 'Full-service catering for Chicago area weddings. North and South Indian menu options with dedicated live cooking stations on Devon Ave.',
    phone_business: '(773) 555-0004', avg_rating: 4.5,
    services: ['North Indian', 'South Indian', 'Live Stations', 'Full Service'],
    packages: [
      { name: 'Chicago Wedding Package', price_per_head: 58, is_halal: true },
      { name: 'Budget Package', price_per_head: 42, is_vegetarian: true },
    ],
  })
  await upsertVendor(hash, {
    email: 'royaldurbar@demo.oneseva', business_name: 'Royal Durbar Catering', vendor_type: VendorType.CATERER,
    city: 'Chicago', description: 'Premium Hyderabadi and Mughlai cuisine in Chicago. Dum-cooked biryanis, kebab platters and traditional Nawabi desserts.',
    phone_business: '(773) 555-0005', avg_rating: 4.8,
    services: ['Hyderabadi', 'Mughlai', 'Dum Biryani', 'Nawabi Desserts'],
    packages: [
      { name: 'Hyderabadi Wedding', price_per_head: 75, is_halal: true },
      { name: 'Executive Package', price_per_head: 62, is_halal: true },
    ],
  })
  // Houston caterers (depth)
  await upsertVendor(hash, {
    email: 'rusholme@demo.oneseva', business_name: 'Hillcroft Catering Co.', vendor_type: VendorType.CATERER,
    city: 'Houston', description: 'Born on Hillcroft Ave, taken to the wedding hall. Authentic South Asian flavors with professional event-scale delivery throughout Houston.',
    phone_business: '(713) 555-0003', avg_rating: 4.5,
    services: ['North Indian', 'Pakistani', 'Hillcroft Heritage', 'Halal'],
    packages: [
      { name: 'Heritage Package', price_per_head: 55, is_halal: true },
      { name: 'Street Food Package', price_per_head: 42, is_halal: true },
    ],
  })
  await upsertVendor(hash, {
    email: 'gujaratimanchester@demo.oneseva', business_name: 'Gujarati Sweets & Caterers', vendor_type: VendorType.CATERER,
    city: 'Houston', description: 'Pure vegetarian Gujarati and Jain catering in Houston. Thali service, farsan and traditional Gujarati wedding sweets for celebrations.',
    phone_business: '(281) 555-0003', avg_rating: 4.6,
    services: ['Gujarati', 'Jain', 'Pure Veg', 'Thali Service', 'Wedding Sweets'],
    packages: [
      { name: 'Gujarati Thali', price_per_head: 44, is_vegetarian: true },
      { name: 'Jain Special', price_per_head: 46, is_vegetarian: true },
    ],
  })
  // New York photographers (depth)
  await upsertVendor(hash, {
    email: 'southasianshots@demo.oneseva', business_name: 'South Asian Shots', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'New York', description: 'Specialist South Asian wedding photography in NYC and NJ. Baraat, nikkah, civil ceremony, reception — we cover every moment.',
    phone_business: '(718) 555-0021', avg_rating: 4.8,
    services: ['Full Day Coverage', 'Baraat', 'Nikkah', 'Same-Day Highlights'],
  })
  await upsertVendor(hash, {
    email: 'lightandlens@demo.oneseva', business_name: 'Light & Lens Studio', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'New York', description: 'Two-photographer team with cinematic post-processing. Drone shots, wide angles and intimate close-ups. Prints included. Based in Manhattan.',
    phone_business: '(212) 555-0021', avg_rating: 4.7,
    services: ['Two Photographers', 'Drone', 'Fine Art Prints', 'Video'],
  })
  // Chicago photographers (depth)
  await upsertVendor(hash, {
    email: 'momentsbham@demo.oneseva', business_name: 'Moments by Kapil', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'Chicago', description: 'Storytelling wedding photography for South Asian couples in Chicago. Natural, unposed moments captured in beautiful light.',
    phone_business: '(773) 555-0021', avg_rating: 4.9,
    services: ['Storytelling', 'Natural Light', 'Engagement Shoots'],
  })
  // Houston photographers (depth)
  await upsertVendor(hash, {
    email: 'northernweddings@demo.oneseva', business_name: 'Texas Wedding Photography', vendor_type: VendorType.PHOTOGRAPHER,
    city: 'Houston', description: 'Award-winning photography team covering Houston and Sugar Land. Asian wedding specialists since 2010.',
    phone_business: '(713) 555-0021', avg_rating: 4.7,
    services: ['Full Coverage', 'Asian Weddings', 'Same-Day Edit', 'Albums'],
  })
  // New York DJs (depth)
  await upsertVendor(hash, {
    email: 'djkabir@demo.oneseva', business_name: 'DJ Kabir NYC', vendor_type: VendorType.DJ,
    city: 'New York', description: 'Top-rated DJ for Bollywood and Bhangra events across NYC and NJ. Premium sound system, custom lighting rigs.',
    phone_business: '(718) 555-0032', avg_rating: 4.9,
    services: ['Bollywood', 'Bhangra', 'MC Services', 'Premium Sound'],
  })
  await upsertVendor(hash, {
    email: 'decibelslondon@demo.oneseva', business_name: 'Decibels Events NYC', vendor_type: VendorType.DJ,
    city: 'New York', description: 'Full events company offering DJ, live dhol, MC and lighting. One-stop-shop for South Asian wedding entertainment in New York.',
    phone_business: '(718) 555-0033', avg_rating: 4.6,
    services: ['DJ', 'Dhol Player', 'MC', 'Lighting Package'],
  })
  console.log('✓ Launch city extra vendors seeded (New York, Chicago, Houston)')

  // ── GLOBAL DISHES: mark all vendor dishes as global ───────────────────────
  await prisma.menuItem.updateMany({
    where: { vendor_id: caterer1.id, is_global: false, pending_review: false },
    data: { is_global: true },
  })

  // ── END-TO-END TEST DATA: always recreate for fresh demo state ───────────
  console.log('Recreating E2E test data (event request → matches → quotes)…')

  // Delete old E2E data to ensure fresh state
  const oldRequest = await prisma.eventRequest.findFirst({
    where: { event_id: event.id, vendor_type: VendorType.CATERER },
    include: { matches: { include: { quotes: true } } },
  })
  if (oldRequest) {
    for (const match of oldRequest.matches) {
      for (const q of match.quotes) {
        await prisma.quoteMenuItem.deleteMany({ where: { quote_id: q.id } })
        await prisma.quote.delete({ where: { id: q.id } })
      }
    }
    await prisma.match.deleteMany({ where: { event_request_id: oldRequest.id } })
    await prisma.eventRequest.delete({ where: { id: oldRequest.id } })
  }

  // Event request for caterer
  const eventRequest = await prisma.eventRequest.create({
    data: {
      event_id: event.id,
      customer_id: customer.id,
      vendor_type: VendorType.CATERER,
      status: 'MATCHED',
    },
  })

  // Matches: link 3 caterers to this event request
  const caterers = [caterer1, caterer2, caterer3]
  const matchScores = [87, 79, 71]
  const createdMatches = []
  for (let i = 0; i < caterers.length; i++) {
    const m = await prisma.match.create({
      data: {
        event_request_id: eventRequest.id,
        vendor_id: caterers[i].id,
        vendor_type: VendorType.CATERER,
        score: matchScores[i],
        rank: i + 1,
        status: 'QUOTED',
      },
    })
    createdMatches.push(m)
  }

  // Quote from caterer1 (SENT — fully filled with menu items)
  const quote1 = await prisma.quote.create({
    data: {
      match_id: createdMatches[0].id,
      vendor_id: caterer1.id,
      status: 'SENT',
      price_per_head: 75,
      total_estimate: 75 * 250,
      currency: 'USD',
      notes: 'Includes 2 live counters (Pani Puri + Masala Chai), 2 starters, 3 mains, 1 dal, 2 breads, rice, dessert and welcome drinks. Halal menu throughout. Setup 4 hours before event.',
      tasting_offered: true,
      tasting_cost: 0,
      tasting_location: 'Our Jackson Heights kitchen — by appointment',
      expires_at: new Date('2026-09-01'),
    },
  })
  // Copy full menu items including descriptions and dietary tags
  const menuItemsForQuote = await prisma.menuItem.findMany({
    where: { vendor_id: caterer1.id },
    take: 10,
    orderBy: { category: 'asc' },
  })
  if (menuItemsForQuote.length > 0) {
    await prisma.quoteMenuItem.createMany({
      data: menuItemsForQuote.map((item, idx) => ({
        quote_id: quote1.id,
        item_name: item.name,
        description: item.description,
        category: item.category,
        is_vegetarian: item.is_vegetarian,
        is_jain: item.is_jain,
        is_halal: item.is_halal,
        contains_nuts: item.contains_nuts,
        contains_gluten: item.contains_gluten,
        contains_dairy: item.contains_dairy,
        is_optional: false,
        sort_order: idx,
      })),
    })
  }

  // Quote from caterer2 (SENT — with menu items)
  const quote2 = await prisma.quote.create({
    data: {
      match_id: createdMatches[1].id,
      vendor_id: caterer2.id,
      status: 'SENT',
      price_per_head: 65,
      total_estimate: 65 * 250,
      currency: 'USD',
      notes: 'Full wedding spread including live tandoor station. Halal certified. Service staff included.',
      tasting_offered: true,
      tasting_cost: 20,
      tasting_location: 'Queens venue — flexible dates',
      expires_at: new Date('2026-09-05'),
    },
  })
  // caterer2 has no dishes yet — add a representative menu
  await prisma.quoteMenuItem.createMany({
    data: [
      { quote_id: quote2.id, item_name: 'Chicken Tikka', description: 'Tender boneless chicken marinated in spiced yogurt, grilled in a live tandoor.', category: MenuCategory.APPETIZER, is_vegetarian: false, is_halal: true, contains_dairy: true, sort_order: 0 },
      { quote_id: quote2.id, item_name: 'Veg Seekh Kebab', description: 'Herbed mixed vegetable kebabs from the live tandoor station.', category: MenuCategory.APPETIZER, is_vegetarian: true, is_halal: true, sort_order: 1 },
      { quote_id: quote2.id, item_name: 'Lamb Rogan Josh', description: 'Slow-braised Kashmiri lamb in aromatic whole spices and yogurt gravy.', category: MenuCategory.MAIN_COURSE, is_vegetarian: false, is_halal: true, contains_dairy: true, sort_order: 2 },
      { quote_id: quote2.id, item_name: 'Paneer Makhani', description: 'Soft paneer in a rich tomato and cream sauce with fenugreek.', category: MenuCategory.MAIN_COURSE, is_vegetarian: true, is_halal: true, contains_dairy: true, sort_order: 3 },
      { quote_id: quote2.id, item_name: 'Tarka Dal', description: 'Yellow lentils tempered with mustard seeds, cumin and dried chilli.', category: MenuCategory.DAL, is_vegetarian: true, is_halal: true, sort_order: 4 },
      { quote_id: quote2.id, item_name: 'Lamb Biryani', description: 'Fragrant dum-cooked basmati rice with tender lamb and fried onions.', category: MenuCategory.RICE_BIRYANI, is_vegetarian: false, is_halal: true, contains_nuts: true, sort_order: 5 },
      { quote_id: quote2.id, item_name: 'Peshwari Naan', description: 'Sweet stuffed naan with coconut, almonds and sultanas from the tandoor.', category: MenuCategory.BREAD, is_vegetarian: true, is_halal: true, contains_gluten: true, contains_nuts: true, contains_dairy: true, sort_order: 6 },
      { quote_id: quote2.id, item_name: 'Kheer', description: 'Creamy slow-cooked rice pudding with cardamom, saffron and pistachios.', category: MenuCategory.DESSERT, is_vegetarian: true, is_halal: true, contains_dairy: true, contains_nuts: true, sort_order: 7 },
    ],
  })

  // Quote from caterer3 (DRAFT — vendor working on it)
  await prisma.quote.create({
    data: {
      match_id: createdMatches[2].id,
      vendor_id: caterer3.id,
      status: 'DRAFT',
      price_per_head: 70,
      total_estimate: 0,
      currency: 'USD',
    },
  })

  // Update checklist item for caterer
  await prisma.eventChecklistItem.updateMany({
    where: { event_id: event.id, item_name: 'Book caterer' },
    data: { status: ChecklistStatus.SHORTLISTED, external_vendor_name: 'Shortlisted 2 caterers' },
  })

  // Update event progress
  const allItems = await prisma.eventChecklistItem.findMany({ where: { event_id: event.id } })
  const doneStatuses: ChecklistStatus[] = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = allItems.filter(i => doneStatuses.includes(i.status)).length
  const progress = Math.round((doneCount / allItems.length) * 100)
  await prisma.event.update({
    where: { id: event.id },
    data: { checklist_progress: progress },
  })

  console.log('✓ E2E test data created (event request → 3 matches → 2 sent quotes with menus)')

  // ── Ensure all menu items are marked global ────────────────────────────────
  await prisma.menuItem.updateMany({
    where: { is_global: false, pending_review: false },
    data: { is_global: true },
  })

  console.log('\n──────────────────────────────────────────────────────')
  console.log('OneSeva Demo Credentials')
  console.log('──────────────────────────────────────────────────────')
  console.log('  CUSTOMER   priya@demo.oneseva        / demo1234')
  console.log('  CATERER    spice@demo.oneseva         / demo1234  (New York)')
  console.log('  CATERER    tandoori@demo.oneseva      / demo1234  (New York)')
  console.log('  CATERER    mughal@demo.oneseva        / demo1234  (Chicago)')
  console.log('  CATERER    punjab@demo.oneseva        / demo1234  (Houston)')
  console.log('  CATERER    zafrani@demo.oneseva       / demo1234  (New York)')
  console.log('  CATERER    royalfeast@demo.oneseva    / demo1234  (Houston)')
  console.log('  DECORATOR  dreamdecor@demo.oneseva    / demo1234  (New York)')
  console.log('  DECORATOR  floralfantasy@demo.oneseva / demo1234  (Chicago)')
  console.log('  DECORATOR  regalsetups@demo.oneseva   / demo1234  (Houston)')
  console.log('  DECORATOR  goldentouch@demo.oneseva   / demo1234  (New York)')
  console.log('  DECORATOR  celebration@demo.oneseva   / demo1234  (Chicago)')
  console.log('  PHOTO      momentz@demo.oneseva       / demo1234  (New York)')
  console.log('  PHOTO      vividframes@demo.oneseva   / demo1234  (Chicago)')
  console.log('  PHOTO      candidclicks@demo.oneseva  / demo1234  (Houston)')
  console.log('  PHOTO      everlasting@demo.oneseva   / demo1234  (New York)')
  console.log('  PHOTO      goldenhour@demo.oneseva    / demo1234  (Chicago)')
  console.log('  DJ         djarjun@demo.oneseva       / demo1234  (New York)')
  console.log('  DJ         punjabi.beats@demo.oneseva / demo1234  (Chicago)')
  console.log('  DJ         rhythmmasters@demo.oneseva / demo1234  (Houston)')
  console.log('  DJ         djfusion@demo.oneseva      / demo1234  (New York)')
  console.log('  DJ         bassbeats@demo.oneseva     / demo1234  (Chicago)')
  console.log('  MEHENDI    hennapriya@demo.oneseva    / demo1234  (New York)')
  console.log('  MEHENDI    mehendimgc@demo.oneseva    / demo1234  (Chicago)')
  console.log('  MEHENDI    intricatedesigns@demo.oneseva / demo1234  (Houston)')
  console.log('  MEHENDI    saharahenna@demo.oneseva   / demo1234  (New York/NJ)')
  console.log('  MUA        glamourneha@demo.oneseva   / demo1234  (New York)')
  console.log('  MUA        bridalbliss@demo.oneseva   / demo1234  (Chicago)')
  console.log('  MUA        radiantbridal@demo.oneseva / demo1234  (Houston)')
  console.log('  MUA        elitemua@demo.oneseva      / demo1234  (New York)')
  console.log('  FLORIST    bloomlondon@demo.oneseva   / demo1234  (New York)')
  console.log('  FLORIST    petalcraft@demo.oneseva    / demo1234  (Chicago)')
  console.log('  FLORIST    springblooms@demo.oneseva  / demo1234  (Houston)')
  console.log('  ADMIN      /admin/login            / change-me-in-production')
  console.log('──────────────────────────────────────────────────────')

  // Backfill lat/lng for vendors missing coordinates
  const vendorsWithoutGeo = await prisma.vendor.findMany({
    where: { OR: [{ lat: null }, { lng: null }] },
    select: { id: true, city: true },
  })
  if (vendorsWithoutGeo.length > 0) {
    console.log(`Geocoding ${vendorsWithoutGeo.length} vendors...`)
    // Known cities hardcoded to avoid rate limiting during seed
    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'chicago':  { lat: 41.8781, lng: -87.6298 },
      'houston':  { lat: 29.7604, lng: -95.3698 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'dallas':   { lat: 32.7767, lng: -96.7970 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'atlanta':  { lat: 33.7490, lng: -84.3880 },
      'boston':   { lat: 42.3601, lng: -71.0589 },
      'seattle':  { lat: 47.6062, lng: -122.3321 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
    }
    for (const v of vendorsWithoutGeo) {
      const key = v.city.split(',')[0].trim().toLowerCase()
      const geo = CITY_COORDS[key]
      if (geo) {
        await prisma.vendor.update({ where: { id: v.id }, data: geo })
      }
    }
    console.log('✓ Vendor geocoding complete')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
