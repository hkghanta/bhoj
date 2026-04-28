'use client'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { AllergyConflictBadge, getConflicts } from './AllergyConflictBadge'
import { Plus, Minus, Search } from 'lucide-react'
import { MenuCategory } from '@prisma/client'

type MenuItem = {
  id: string
  name: string
  description: string | null
  category: MenuCategory
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  contains_soy: boolean
  contains_shellfish: boolean
  spice_level: string
}

type Preference = {
  nut_free: boolean; gluten_free: boolean; dairy_free: boolean; egg_free: boolean
  soy_free: boolean; shellfish_free: boolean; is_vegetarian: boolean; is_vegan: boolean
  is_jain: boolean; is_halal: boolean
}

type Props = {
  items: MenuItem[]
  selectedIds: Set<string>
  preference: Preference | null
  onToggle: (item: MenuItem) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads',
  APPETIZER: 'Appetizers',
  MAIN_COURSE: 'Mains',
  BREAD: 'Breads',
  RICE_BIRYANI: 'Rice & Biryani',
  DAL: 'Dal',
  DESSERT: 'Desserts',
  BEVERAGE: 'Beverages',
  LIVE_COUNTER: 'Live Counters',
  OTHER: 'Other',
}

const SPICE_DOTS: Record<string, string> = {
  MILD: '🌶',
  MEDIUM: '🌶🌶',
  HOT: '🌶🌶🌶',
  VERY_HOT: '🌶🌶🌶🌶',
}

const EMPTY_PREF: Preference = {
  nut_free: false, gluten_free: false, dairy_free: false, egg_free: false,
  soy_free: false, shellfish_free: false, is_vegetarian: false, is_vegan: false,
  is_jain: false, is_halal: false,
}

export function DishLibrary({ items, selectedIds, preference, onToggle }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const activePref = preference ?? EMPTY_PREF

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category))
    return ['ALL', ...Array.from(cats)]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [items, categoryFilter, search])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [filtered])

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'text-gray-600 border-gray-200 hover:border-orange-400'
              }`}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-2">
              {categoryItems.map(item => {
                const selected = selectedIds.has(item.id)
                const conflicts = getConflicts(item, activePref)
                const hasConflict = conflicts.length > 0

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected
                        ? 'bg-orange-50 border-orange-400'
                        : hasConflict
                        ? 'bg-red-50/50 border-red-200 opacity-70'
                        : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => onToggle(item)}
                  >
                    <button className={`flex-shrink-0 rounded-full w-6 h-6 flex items-center justify-center ${
                      selected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {selected ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{item.name}</span>
                        {item.is_vegetarian && (
                          <span className="text-xs text-green-700 border border-green-300 px-1 rounded">V</span>
                        )}
                        {item.is_halal && (
                          <span className="text-xs text-blue-700 border border-blue-300 px-1 rounded">H</span>
                        )}
                        <span className="text-xs text-gray-400">{SPICE_DOTS[item.spice_level] ?? ''}</span>
                        {hasConflict && (
                          <AllergyConflictBadge dish={item} preference={activePref} />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No dishes found. Try a different search or category.
          </div>
        )}
      </div>
    </div>
  )
}
