import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const SERVICE_SLUGS = [
  'catering', 'photographer', 'videographer', 'decorator', 'dj', 'florist',
  'mehendi-artist', 'makeup-hair', 'transport', 'tent-marquee', 'dhol-player',
  'live-band', 'classical-musician', 'choreographer', 'pandit-officiant',
  'mc-host', 'bartender', 'chai-station', 'games-entertainment',
  'invitation-designer', 'furniture-rental', 'equipment-rental',
  'dessert-vendor', 'food-truck', 'lighting', 'security',
]

// Normalize a city name to a URL slug
function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ─── Static pages ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // ─── Vendor profile pages ────────────────────────────────────────────────
  let vendorRoutes: MetadataRoute.Sitemap = []
  try {
    const vendors = await prisma.vendor.findMany({
      where: { is_active: true },
      select: { id: true, updated_at: true },
    })
    vendorRoutes = vendors.map(v => ({
      url: `${BASE_URL}/vendors/${v.id}`,
      lastModified: v.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable at build time — skip
  }

  // ─── Browse pages by service × city ─────────────────────────────────────
  let browseRoutes: MetadataRoute.Sitemap = []
  try {
    const vendorCities = await prisma.vendor.findMany({
      where: { is_active: true },
      select: { vendor_type: true, city: true },
      distinct: ['vendor_type', 'city'],
    })

    const VENDOR_TYPE_TO_SLUG: Record<string, string> = {
      CATERER: 'catering',
      PHOTOGRAPHER: 'photographer',
      VIDEOGRAPHER: 'videographer',
      DECORATOR: 'decorator',
      DJ: 'dj',
      FLORIST: 'florist',
      MEHENDI_ARTIST: 'mehendi-artist',
      MAKEUP_HAIR: 'makeup-hair',
      TRANSPORT: 'transport',
      TENT_MARQUEE: 'tent-marquee',
      DHOL_PLAYER: 'dhol-player',
      LIVE_BAND: 'live-band',
      CLASSICAL_MUSICIAN: 'classical-musician',
      CHOREOGRAPHER: 'choreographer',
      PANDIT_OFFICIANT: 'pandit-officiant',
      MC_HOST: 'mc-host',
      BARTENDER: 'bartender',
      CHAI_STATION: 'chai-station',
      GAMES_ENTERTAINMENT: 'games-entertainment',
      INVITATION_DESIGNER: 'invitation-designer',
      FURNITURE_RENTAL: 'furniture-rental',
      EQUIPMENT_RENTAL: 'equipment-rental',
      DESSERT_VENDOR: 'dessert-vendor',
      FOOD_TRUCK: 'food-truck',
      LIGHTING: 'lighting',
      SECURITY: 'security',
    }

    browseRoutes = vendorCities
      .map(vc => {
        const serviceSlug = VENDOR_TYPE_TO_SLUG[vc.vendor_type]
        if (!serviceSlug) return null
        const citySlug = cityToSlug(vc.city)
        if (!citySlug) return null
        return {
          url: `${BASE_URL}/vendors/${serviceSlug}/${citySlug}`,
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  } catch {
    // DB unavailable — generate static browse routes for common cities
    const commonCities = ['london', 'birmingham', 'manchester', 'leicester', 'new-york', 'toronto']
    browseRoutes = SERVICE_SLUGS.flatMap(slug =>
      commonCities.map(city => ({
        url: `${BASE_URL}/vendors/${slug}/${city}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    )
  }

  return [...staticRoutes, ...vendorRoutes, ...browseRoutes]
}
