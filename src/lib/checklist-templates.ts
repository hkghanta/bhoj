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

const TEMPLATE_MAP: Record<string, ChecklistTemplate[]> = {
  wedding: WEDDING_CHECKLIST,
  engagement: ENGAGEMENT_CHECKLIST,
  corporate: CORPORATE_CHECKLIST,
  birthday: BIRTHDAY_CHECKLIST,
  diwali: CORPORATE_CHECKLIST,
  eid: CORPORATE_CHECKLIST,
  navratri: CORPORATE_CHECKLIST,
  holi: BIRTHDAY_CHECKLIST,
}

export function getChecklistTemplate(eventType: string): ChecklistTemplate[] {
  const key = eventType.toLowerCase().replace(/\s+/g, '_')
  return TEMPLATE_MAP[key] ?? CORPORATE_CHECKLIST
}
