import { VendorType } from '@prisma/client'

type ChecklistTemplate = {
  category: string
  item_name: string
  vendor_type?: VendorType
}

const WEDDING_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Wedding Cake / Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Food & Drink', item_name: 'Bar & Bartender', vendor_type: 'BARTENDER' },
  { category: 'Food & Drink', item_name: 'Chai & Coffee Station', vendor_type: 'CHAI_STATION' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist', vendor_type: 'FLORIST' },
  { category: 'Venue & Decor', item_name: 'Lighting', vendor_type: 'LIGHTING' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Entertainment', item_name: 'Dhol Player', vendor_type: 'DHOL_PLAYER' },
  { category: 'Entertainment', item_name: 'Live Band', vendor_type: 'LIVE_BAND' },
  { category: 'Entertainment', item_name: 'Choreographer', vendor_type: 'CHOREOGRAPHER' },
  { category: 'Beauty & Wellness', item_name: 'Mehendi Artist', vendor_type: 'MEHENDI_ARTIST' },
  { category: 'Beauty & Wellness', item_name: 'Makeup & Hair', vendor_type: 'MAKEUP_HAIR' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Photography', item_name: 'Videographer', vendor_type: 'VIDEOGRAPHER' },
  { category: 'Ceremony', item_name: 'Pandit / Officiant', vendor_type: 'PANDIT_OFFICIANT' },
  { category: 'Admin', item_name: 'Invitation Design', vendor_type: 'INVITATION_DESIGNER' },
  { category: 'Admin', item_name: 'Transport', vendor_type: 'TRANSPORT' },
  { category: 'Admin', item_name: 'Security', vendor_type: 'SECURITY' },
  { category: 'Admin', item_name: 'MC / Host', vendor_type: 'MC_HOST' },
]

const CORPORATE_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Bar & Bartender', vendor_type: 'BARTENDER' },
  { category: 'Food & Drink', item_name: 'Chai & Coffee Station', vendor_type: 'CHAI_STATION' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Admin', item_name: 'Transport', vendor_type: 'TRANSPORT' },
]

const BIRTHDAY_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Birthday Cake / Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const ENGAGEMENT_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist', vendor_type: 'FLORIST' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Beauty & Wellness', item_name: 'Mehendi Artist', vendor_type: 'MEHENDI_ARTIST' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Photography', item_name: 'Videographer', vendor_type: 'VIDEOGRAPHER' },
]

const GRADUATION_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Graduation Cake', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Photography', item_name: 'Videographer', vendor_type: 'VIDEOGRAPHER' },
]

const GET_TOGETHER_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const BABYSHOWER_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Cake & Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist', vendor_type: 'FLORIST' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const POOJA_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer (Prasad & Langar)', vendor_type: 'CATERER' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist (Marigold garlands)', vendor_type: 'FLORIST' },
  { category: 'Ceremony', item_name: 'Pandit / Priest', vendor_type: 'PANDIT_OFFICIANT' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const FAREWELL_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Cake', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const COMMUNITY_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Chai & Coffee Station', vendor_type: 'CHAI_STATION' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Entertainment', item_name: 'Live Band / Performers', vendor_type: 'LIVE_BAND' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Admin', item_name: 'MC / Host', vendor_type: 'MC_HOST' },
  { category: 'Admin', item_name: 'Security', vendor_type: 'SECURITY' },
]

// Generic checklist — used for "Other / Custom" and any unmapped event type
const GENERIC_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const TEMPLATE_MAP: Record<string, ChecklistTemplate[]> = {
  wedding: WEDDING_CHECKLIST,
  engagement: ENGAGEMENT_CHECKLIST,
  corporate: CORPORATE_CHECKLIST,
  birthday: BIRTHDAY_CHECKLIST,
  graduation: GRADUATION_CHECKLIST,
  get_together: GET_TOGETHER_CHECKLIST,
  baby_shower: BABYSHOWER_CHECKLIST,
  pooja: POOJA_CHECKLIST,
  farewell: FAREWELL_CHECKLIST,
  community_event: COMMUNITY_CHECKLIST,
  business_lunch: CORPORATE_CHECKLIST,
  diwali: CORPORATE_CHECKLIST,
  eid: CORPORATE_CHECKLIST,
  navratri: CORPORATE_CHECKLIST,
  holi: BIRTHDAY_CHECKLIST,
  other: GENERIC_CHECKLIST,
}

export function getChecklistTemplate(eventType: string): ChecklistTemplate[] {
  const key = eventType.toLowerCase().replace(/[\s-]+/g, '_')
  return TEMPLATE_MAP[key] ?? GENERIC_CHECKLIST
}

// Flat map: VendorType → checklist item to add when service is requested
export const VENDOR_TYPE_CHECKLIST_ITEM: Partial<Record<string, { category: string; item_name: string }>> = {
  CATERER:             { category: 'Food & Drink',      item_name: 'Caterer' },
  DESSERT_VENDOR:      { category: 'Food & Drink',      item_name: 'Cake & Desserts' },
  BARTENDER:           { category: 'Food & Drink',      item_name: 'Bar & Bartender' },
  CHAI_STATION:        { category: 'Food & Drink',      item_name: 'Chai & Coffee Station' },
  FOOD_TRUCK:          { category: 'Food & Drink',      item_name: 'Food Truck' },
  DECORATOR:           { category: 'Venue & Decor',     item_name: 'Decorator' },
  FLORIST:             { category: 'Venue & Decor',     item_name: 'Florist' },
  LIGHTING:            { category: 'Venue & Decor',     item_name: 'Lighting' },
  TENT_MARQUEE:        { category: 'Venue & Decor',     item_name: 'Tent / Marquee' },
  FURNITURE_RENTAL:    { category: 'Venue & Decor',     item_name: 'Furniture Rental' },
  EQUIPMENT_RENTAL:    { category: 'Venue & Decor',     item_name: 'Equipment Rental' },
  DJ:                  { category: 'Entertainment',     item_name: 'DJ' },
  DHOL_PLAYER:         { category: 'Entertainment',     item_name: 'Dhol Player' },
  LIVE_BAND:           { category: 'Entertainment',     item_name: 'Live Band / Performers' },
  CLASSICAL_MUSICIAN:  { category: 'Entertainment',     item_name: 'Classical Musician' },
  CHOREOGRAPHER:       { category: 'Entertainment',     item_name: 'Choreographer' },
  GAMES_ENTERTAINMENT: { category: 'Entertainment',     item_name: 'Games & Entertainment' },
  MC_HOST:             { category: 'Entertainment',     item_name: 'MC / Host' },
  MEHENDI_ARTIST:      { category: 'Beauty & Wellness', item_name: 'Mehendi Artist' },
  MAKEUP_HAIR:         { category: 'Beauty & Wellness', item_name: 'Makeup & Hair' },
  PHOTOGRAPHER:        { category: 'Photography',       item_name: 'Photographer' },
  VIDEOGRAPHER:        { category: 'Photography',       item_name: 'Videographer' },
  PANDIT_OFFICIANT:    { category: 'Ceremony',          item_name: 'Pandit / Officiant' },
  INVITATION_DESIGNER: { category: 'Admin',             item_name: 'Invitation Design' },
  TRANSPORT:           { category: 'Admin',             item_name: 'Transport' },
  SECURITY:            { category: 'Admin',             item_name: 'Security' },
}
