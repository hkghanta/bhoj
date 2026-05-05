import { VendorType } from '@prisma/client'

// Canonical URL slug → VendorType (used by API routes)
export const SLUG_TO_VENDOR_TYPE: Record<string, VendorType> = {
  catering:             VendorType.CATERER,
  decorator:            VendorType.DECORATOR,
  photographer:         VendorType.PHOTOGRAPHER,
  videographer:         VendorType.VIDEOGRAPHER,
  dj:                   VendorType.DJ,
  florist:              VendorType.FLORIST,
  'mehendi-artist':     VendorType.MEHENDI_ARTIST,
  'makeup-hair':        VendorType.MAKEUP_HAIR,
  transport:            VendorType.TRANSPORT,
  'tent-marquee':       VendorType.TENT_MARQUEE,
  'dhol-player':        VendorType.DHOL_PLAYER,
  'live-band':          VendorType.LIVE_BAND,
  'classical-musician': VendorType.CLASSICAL_MUSICIAN,
  choreographer:        VendorType.CHOREOGRAPHER,
  'pandit-officiant':   VendorType.PANDIT_OFFICIANT,
  'mc-host':            VendorType.MC_HOST,
  bartender:            VendorType.BARTENDER,
  'chai-station':       VendorType.CHAI_STATION,
  'games-entertainment':VendorType.GAMES_ENTERTAINMENT,
  'invitation-designer':VendorType.INVITATION_DESIGNER,
  'furniture-rental':   VendorType.FURNITURE_RENTAL,
  'equipment-rental':   VendorType.EQUIPMENT_RENTAL,
  'food-truck':         VendorType.FOOD_TRUCK,
  'dessert-vendor':     VendorType.DESSERT_VENDOR,
  lighting:             VendorType.LIGHTING,
  security:             VendorType.SECURITY,
}

// VendorType → canonical URL slug (invert of above)
export const VENDOR_TYPE_TO_SLUG: Partial<Record<VendorType, string>> = Object.fromEntries(
  Object.entries(SLUG_TO_VENDOR_TYPE).map(([slug, type]) => [type, slug])
) as Partial<Record<VendorType, string>>

// Fallback: auto-generate slug from vendor_type string
export function vendorTypeToSlug(vendorType: string): string {
  return VENDOR_TYPE_TO_SLUG[vendorType as VendorType]
    ?? vendorType.toLowerCase().replace(/_/g, '-')
}
