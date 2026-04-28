'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MenuBrief } from '@/components/quotes/MenuBrief'
import { DishLibrary } from '@/components/quotes/DishLibrary'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { MenuCategory } from '@prisma/client'

type MenuItem = {
  id: string; name: string; description: string | null; category: MenuCategory
  is_vegetarian: boolean; is_vegan: boolean; is_jain: boolean; is_halal: boolean
  contains_nuts: boolean; contains_gluten: boolean; contains_dairy: boolean
  contains_eggs: boolean; contains_soy: boolean; contains_shellfish: boolean
  spice_level: string
}

type Quote = {
  id: string
  match: {
    event_request: {
      event: { event_name: string; guest_count: number; currency: string }
      menu_preference: {
        cuisine_preferences: string[]
        service_style: string | null
        is_vegetarian: boolean
        is_vegan: boolean
        is_jain: boolean
        is_halal: boolean
        nut_free: boolean
        gluten_free: boolean
        dairy_free: boolean
        egg_free: boolean
        soy_free: boolean
        shellfish_free: boolean
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
      } | null
    }
  }
}

export default function MenuBuilderPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [libraryItems, setLibraryItems] = useState<MenuItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<string, MenuItem>>(new Map())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${quoteId}`).then(r => r.json()),
      fetch('/api/vendor/menu-items').then(r => r.json()),
    ]).then(([quoteData, items]) => {
      setQuote(quoteData)
      setLibraryItems(Array.isArray(items) ? items : [])
    })
  }, [quoteId])

  const selectedByCategory = useCallback((): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const item of selectedItems.values()) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return counts
  }, [selectedItems])

  function toggleItem(item: MenuItem) {
    setSelectedItems(prev => {
      const next = new Map(prev)
      if (next.has(item.id)) next.delete(item.id)
      else next.set(item.id, item)
      return next
    })
  }

  async function saveMenuItems() {
    setSaving(true)
    await fetch(`/api/quotes/${quoteId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replace: true,
        items: Array.from(selectedItems.values()).map((item, i) => ({
          menu_item_id: item.id,
          item_name: item.name,
          category: item.category,
          is_vegetarian: item.is_vegetarian,
          is_jain: item.is_jain,
          is_halal: item.is_halal,
          contains_nuts: item.contains_nuts,
          contains_gluten: item.contains_gluten,
          contains_dairy: item.contains_dairy,
          sort_order: i,
        })),
      }),
    })
    setSaving(false)
  }

  function handleSubmitted() {
    router.push('/vendor/quotes')
  }

  if (!quote) return <div className="text-gray-400 p-8">Loading…</div>

  const pref = quote.match.event_request.menu_preference
  const event = quote.match.event_request.event

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Build Quote</h1>
        <p className="text-gray-500 mt-1">{event.event_name} — {event.guest_count} guests</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 h-[700px]">
          <MenuBrief
            preference={pref}
            selectedByCategory={selectedByCategory()}
            guestCount={event.guest_count}
          />
        </div>

        <div className="col-span-5 h-[700px] bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Dish Library
              {selectedItems.size > 0 && (
                <span className="ml-2 text-sm font-normal text-orange-600">{selectedItems.size} selected</span>
              )}
            </h3>
            <button
              onClick={saveMenuItems}
              disabled={saving || selectedItems.size === 0}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save selection'}
            </button>
          </div>
          <DishLibrary
            items={libraryItems}
            selectedIds={new Set(selectedItems.keys())}
            preference={pref}
            onToggle={toggleItem}
          />
        </div>

        <div className="col-span-4">
          <QuoteForm
            quoteId={quoteId}
            guestCount={event.guest_count}
            currency={event.currency}
            onSubmitted={handleSubmitted}
          />
        </div>
      </div>
    </div>
  )
}
