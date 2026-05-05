import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  { value: 'SOUP_SALAD', label: 'Soups & Salads' },
  { value: 'APPETIZER', label: 'Appetizers' },
  { value: 'MAIN_COURSE', label: 'Main Course' },
  { value: 'BREAD', label: 'Bread' },
  { value: 'RICE_BIRYANI', label: 'Rice & Biryani' },
  { value: 'DAL', label: 'Dal & Lentils' },
  { value: 'DESSERT', label: 'Desserts' },
  { value: 'BEVERAGE', label: 'Beverages' },
  { value: 'LIVE_COUNTER', label: 'Live Counter' },
  { value: 'OTHER', label: 'Other' },
]

const SPICE_COLORS: Record<string, string> = {
  MILD: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HOT: 'text-brand',
  VERY_HOT: 'text-red-600',
}

export default async function DishesPage() {
  const dishes = await prisma.menuItem.findMany({
    where: { is_global: true, pending_review: false, is_active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, description: true, category: true, spice_level: true,
      is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true,
      contains_nuts: true, contains_gluten: true, contains_dairy: true,
      contains_eggs: true, contains_soy: true, contains_shellfish: true,
    },
  })

  const grouped = CATEGORIES.reduce<Record<string, typeof dishes>>((acc, cat) => {
    acc[cat.value] = dishes.filter(d => d.category === cat.value)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-1">Dish Library</h1>
          <p className="text-text-4 mt-2">
            Explore {dishes.length} traditional and modern Indian dishes — dietary info, allergens and descriptions.
          </p>
        </div>

        <div className="space-y-8">
          {CATEGORIES.filter(cat => grouped[cat.value].length > 0).map(cat => (
            <div key={cat.value}>
              <h2 className="text-lg font-semibold text-text-1 mb-3">{cat.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[cat.value].map(dish => (
                  <Link
                    key={dish.id}
                    href={`/dishes/${dish.id}`}
                    className="bg-white border rounded-xl px-5 py-4 hover:border-brand hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-1 group-hover:text-brand transition-colors">
                          {dish.name}
                        </h3>
                        {dish.description && (
                          <p className="text-sm text-text-4 mt-0.5 line-clamp-2">{dish.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {dish.is_vegetarian && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>
                          )}
                          {dish.is_vegan && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-200">Vegan</Badge>
                          )}
                          {dish.is_jain && (
                            <Badge variant="outline" className="text-xs text-purple-700 border-purple-200">Jain</Badge>
                          )}
                          {dish.is_halal && !dish.is_vegetarian && (
                            <Badge variant="outline" className="text-xs">Halal</Badge>
                          )}
                          {dish.contains_nuts && (
                            <Badge variant="outline" className="text-xs text-brand border-brand">⚠ Nuts</Badge>
                          )}
                          {dish.contains_gluten && (
                            <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-200">Gluten</Badge>
                          )}
                          {dish.contains_dairy && (
                            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">Dairy</Badge>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 mt-0.5 ${SPICE_COLORS[dish.spice_level] ?? ''}`}>
                        {dish.spice_level.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {dishes.length === 0 && (
          <div className="text-center py-20 text-text-4">
            No dishes in the library yet.
          </div>
        )}
      </div>
    </div>
  )
}
