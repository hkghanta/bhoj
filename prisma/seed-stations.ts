import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stationTemplates = [
  {
    station_key: 'chaat_counter',
    name: 'Chaat Counter',
    description: 'Live chaat station serving pani puri, bhel puri, sev puri, dahi puri, and more with fresh chutneys and toppings.',
    icon: 'soup',
    typical_min_guests: 20,
    typical_max_guests: 300,
  },
  {
    station_key: 'dosa_station',
    name: 'Dosa Station',
    description: 'Live dosa counter with crispy dosas made to order — masala, rava, cheese, and specialty dosas with sambhar and chutneys.',
    icon: 'crepe',
    typical_min_guests: 20,
    typical_max_guests: 200,
  },
  {
    station_key: 'tandoor_station',
    name: 'Tandoor Station',
    description: 'Live tandoor oven serving fresh naan, roti, tandoori kebabs, tikka, and paneer straight from the clay oven.',
    icon: 'flame',
    typical_min_guests: 25,
    typical_max_guests: 250,
  },
  {
    station_key: 'biryani_station',
    name: 'Biryani Station',
    description: 'Aromatic dum biryani served from traditional handis with raita, salan, and accompaniments.',
    icon: 'cooking-pot',
    typical_min_guests: 30,
    typical_max_guests: 500,
  },
  {
    station_key: 'pani_puri',
    name: 'Pani Puri Station',
    description: 'Interactive pani puri station with multiple flavored waters, fillings, and toppings for a fun guest experience.',
    icon: 'droplets',
    typical_min_guests: 15,
    typical_max_guests: 200,
  },
  {
    station_key: 'dessert_station',
    name: 'Dessert Station',
    description: 'Live dessert counter with gulab jamun, jalebi, kulfi, or custom desserts prepared fresh.',
    icon: 'candy',
    typical_min_guests: 15,
    typical_max_guests: 200,
  },
  {
    station_key: 'sushi_rolling',
    name: 'Sushi Rolling Station',
    description: 'Interactive sushi rolling station where guests create their own rolls with fresh fish, rice, and toppings guided by a sushi chef.',
    icon: 'fish',
    typical_min_guests: 20,
    typical_max_guests: 150,
  },
  {
    station_key: 'taco_bar',
    name: 'Taco Bar',
    description: 'Build-your-own taco station with a variety of proteins, salsas, toppings, and fresh tortillas.',
    icon: 'sandwich',
    typical_min_guests: 15,
    typical_max_guests: 200,
  },
  {
    station_key: 'pasta_station',
    name: 'Live Pasta Station',
    description: 'Made-to-order pasta with choice of noodles, sauces, proteins, and fresh toppings tossed in front of guests.',
    icon: 'utensils',
    typical_min_guests: 20,
    typical_max_guests: 200,
  },
  {
    station_key: 'pizza_oven',
    name: 'Wood-Fired Pizza Oven',
    description: 'Portable wood-fired oven serving freshly made pizzas with artisanal toppings and dough.',
    icon: 'pizza',
    typical_min_guests: 25,
    typical_max_guests: 250,
  },
  {
    station_key: 'carving_station',
    name: 'Carving Station',
    description: 'Chef-attended carving station featuring slow-roasted meats carved to order with accompaniments.',
    icon: 'beef',
    typical_min_guests: 30,
    typical_max_guests: 300,
  },
  {
    station_key: 'wok_station',
    name: 'Live Wok Station',
    description: 'High-heat wok cooking with guests choosing proteins, vegetables, and sauces for stir-fry dishes.',
    icon: 'flame',
    typical_min_guests: 20,
    typical_max_guests: 200,
  },
  {
    station_key: 'crepe_station',
    name: 'Crepe Station',
    description: 'Sweet and savory crepes made to order with a selection of fillings and toppings.',
    icon: 'cake-slice',
    typical_min_guests: 15,
    typical_max_guests: 150,
  },
  {
    station_key: 'cocktail_bar',
    name: 'Cocktail Bar',
    description: 'Full-service cocktail bar with a professional mixologist crafting signature and classic cocktails.',
    icon: 'wine',
    typical_min_guests: 20,
    typical_max_guests: 300,
  },
  {
    station_key: 'coffee_bar',
    name: 'Espresso & Coffee Bar',
    description: 'Barista-staffed coffee station serving espresso drinks, pour-overs, and specialty beverages.',
    icon: 'coffee',
    typical_min_guests: 15,
    typical_max_guests: 250,
  },
  {
    station_key: 'raw_bar',
    name: 'Raw Bar',
    description: 'Fresh seafood display with oysters, shrimp, ceviche, and accompaniments on ice.',
    icon: 'shell',
    typical_min_guests: 25,
    typical_max_guests: 200,
  },
  {
    station_key: 'build_your_own',
    name: 'Build Your Own Bowl',
    description: 'Customizable grain or salad bowls where guests pick bases, proteins, toppings, and dressings.',
    icon: 'salad',
    typical_min_guests: 15,
    typical_max_guests: 200,
  },
  {
    station_key: 'hibachi',
    name: 'Hibachi Grill',
    description: 'Teppanyaki-style flat-top grilling with theatrical cooking and fresh ingredients prepared tableside.',
    icon: 'flame-kindling',
    typical_min_guests: 20,
    typical_max_guests: 150,
  },
  {
    station_key: 'smoker_bbq',
    name: 'Smoker & BBQ Station',
    description: 'Low-and-slow smoked meats with house-made rubs and sauces, served with classic BBQ sides.',
    icon: 'drumstick',
    typical_min_guests: 30,
    typical_max_guests: 300,
  },
  {
    station_key: 'fondue_station',
    name: 'Fondue Station',
    description: 'Cheese and chocolate fondue with an assortment of dippers including bread, fruits, and vegetables.',
    icon: 'cheese',
    typical_min_guests: 15,
    typical_max_guests: 100,
  },
]

const cancellationPresets = [
  {
    name: 'Flexible',
    description: 'Generous refund policy — ideal for building customer trust.',
    tiers: [
      { hours_before: 48, refund_percent: 100 },
      { hours_before: 24, refund_percent: 75 },
      { hours_before: 0, refund_percent: 50 },
    ],
  },
  {
    name: 'Moderate',
    description: 'Balanced policy — full refund with advance notice, partial otherwise.',
    tiers: [
      { hours_before: 72, refund_percent: 100 },
      { hours_before: 24, refund_percent: 50 },
      { hours_before: 0, refund_percent: 0 },
    ],
  },
  {
    name: 'Strict',
    description: 'Firm policy — refunds only with significant advance notice.',
    tiers: [
      { hours_before: 168, refund_percent: 100 },
      { hours_before: 72, refund_percent: 50 },
      { hours_before: 0, refund_percent: 0 },
    ],
  },
]

async function main() {
  console.log('Seeding station templates...')

  for (const template of stationTemplates) {
    await prisma.stationTemplate.upsert({
      where: { station_key: template.station_key },
      update: {
        name: template.name,
        description: template.description,
        icon: template.icon,
        typical_min_guests: template.typical_min_guests,
        typical_max_guests: template.typical_max_guests,
      },
      create: template,
    })
  }

  console.log(`Seeded ${stationTemplates.length} station templates.`)

  console.log('Seeding cancellation presets...')

  for (const preset of cancellationPresets) {
    await prisma.cancellationPreset.upsert({
      where: { name: preset.name },
      update: {
        description: preset.description,
        tiers: preset.tiers,
      },
      create: preset,
    })
  }

  console.log(`Seeded ${cancellationPresets.length} cancellation presets.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
