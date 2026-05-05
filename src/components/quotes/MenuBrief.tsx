import { CheckCircle2, Circle } from 'lucide-react'
import { MenuCategory } from '@prisma/client'

type MenuPreference = {
  cuisine_preferences: string[]
  service_style: string | null
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
  nut_free: boolean
  gluten_free: boolean
  dairy_free: boolean
  special_notes: string | null
  soup_salad_count: number | null
  appetizer_count: number | null
  main_count: number | null
  bread_count: number | null
  rice_biryani_count: number | null
  dal_count: number | null
  dessert_count: number | null
  beverage_count: number | null
  live_counter_count: number | null
}

type Props = {
  preference: MenuPreference | null
  selectedByCategory: Record<string, number>
  guestCount: number
}

const CATEGORY_MAP: { key: keyof MenuPreference; label: string; category: MenuCategory }[] = [
  { key: 'soup_salad_count', label: 'Soups & Salads', category: 'SOUP_SALAD' },
  { key: 'appetizer_count', label: 'Appetizers', category: 'APPETIZER' },
  { key: 'main_count', label: 'Mains', category: 'MAIN_COURSE' },
  { key: 'bread_count', label: 'Breads', category: 'BREAD' },
  { key: 'rice_biryani_count', label: 'Rice & Biryani', category: 'RICE_BIRYANI' },
  { key: 'dal_count', label: 'Dal', category: 'DAL' },
  { key: 'dessert_count', label: 'Desserts', category: 'DESSERT' },
  { key: 'beverage_count', label: 'Beverages', category: 'BEVERAGE' },
  { key: 'live_counter_count', label: 'Live Counters', category: 'LIVE_COUNTER' },
]

export function MenuBrief({ preference, selectedByCategory, guestCount }: Props) {
  const flags = preference ? [
    preference.is_vegetarian && 'Vegetarian',
    preference.is_vegan && 'Vegan',
    preference.is_jain && 'Jain',
    preference.is_halal && 'Halal',
    preference.nut_free && 'Nut-free',
    preference.gluten_free && 'Gluten-free',
    preference.dairy_free && 'Dairy-free',
  ].filter(Boolean) as string[] : []

  return (
    <div className="bg-cream rounded-xl border p-5 h-full overflow-y-auto">
      <h3 className="font-semibold text-text-1 mb-4">Event Requirements</h3>

      <div className="space-y-2 mb-5 text-sm">
        <div className="flex justify-between text-text-3">
          <span>Guests</span>
          <span className="font-medium">{guestCount}</span>
        </div>
        {preference?.service_style && (
          <div className="flex justify-between text-text-3">
            <span>Service style</span>
            <span className="font-medium">{preference.service_style}</span>
          </div>
        )}
        {preference?.cuisine_preferences && preference.cuisine_preferences.length > 0 && (
          <div className="text-text-3">
            <span>Cuisines: </span>
            <span className="font-medium">{preference.cuisine_preferences.join(', ')}</span>
          </div>
        )}
      </div>

      {flags.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-text-4 uppercase tracking-wide mb-2">Dietary Requirements</p>
          <div className="flex flex-wrap gap-1.5">
            {flags.map(f => (
              <span key={f} className="px-2 py-0.5 text-xs bg-cream text-brand border border-brand rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-text-4 uppercase tracking-wide mb-3">Menu Checklist</p>
        <div className="space-y-2">
          {CATEGORY_MAP.map(({ key, label, category }) => {
            const required = preference ? (preference[key] as number | null) ?? 0 : 0
            if (required === 0) return null
            const selected = selectedByCategory[category] ?? 0
            const done = selected >= required

            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Circle className="h-4 w-4 text-text-4" />}
                  <span className={done ? 'text-green-700' : 'text-text-2'}>{label}</span>
                </div>
                <span className={`text-xs font-medium ${done ? 'text-green-600' : 'text-brand'}`}>
                  {selected}/{required}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {preference?.special_notes && (
        <div className="mt-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-medium text-yellow-800 mb-1">Special notes</p>
          <p className="text-xs text-yellow-700">{preference.special_notes}</p>
        </div>
      )}
    </div>
  )
}
