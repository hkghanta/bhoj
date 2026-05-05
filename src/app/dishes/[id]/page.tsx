import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Flame } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Main Course',
  BREAD: 'Bread', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal & Lentils',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counter', OTHER: 'Other',
}

const SPICE_INFO: Record<string, { label: string; color: string; dots: number }> = {
  MILD:    { label: 'Mild',     color: 'text-green-600 bg-green-50',  dots: 1 },
  MEDIUM:  { label: 'Medium',   color: 'text-yellow-700 bg-yellow-50', dots: 2 },
  HOT:     { label: 'Hot',      color: 'text-brand bg-cream', dots: 3 },
  VERY_HOT:{ label: 'Very Hot', color: 'text-red-700 bg-red-50',       dots: 4 },
}

export default async function DishDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const dish = await prisma.menuItem.findFirst({
    where: { id, is_global: true, pending_review: false, is_active: true },
  })

  if (!dish) notFound()

  const spice = SPICE_INFO[dish.spice_level] ?? SPICE_INFO.MEDIUM

  const dietaryBadges = [
    dish.is_vegetarian && { label: 'Vegetarian', class: 'text-green-700 border-green-200 bg-green-50' },
    dish.is_vegan && { label: 'Vegan', class: 'text-green-700 border-green-200 bg-green-50' },
    dish.is_jain && { label: 'Jain', class: 'text-purple-700 border-purple-200 bg-purple-50' },
    (dish.is_halal && !dish.is_vegetarian) && { label: 'Halal', class: 'text-teal-700 border-teal-200 bg-teal-50' },
    dish.is_kosher && { label: 'Kosher', class: 'text-blue-700 border-blue-200 bg-blue-50' },
  ].filter(Boolean) as { label: string; class: string }[]

  const allergens = [
    dish.contains_nuts && 'Tree nuts',
    dish.contains_gluten && 'Gluten (wheat)',
    dish.contains_dairy && 'Dairy (milk)',
    dish.contains_eggs && 'Eggs',
    dish.contains_soy && 'Soya',
    dish.contains_shellfish && 'Crustaceans / shellfish',
  ].filter(Boolean) as string[]

  const freeFrom = [
    !dish.contains_nuts && 'Nut-free',
    !dish.contains_gluten && 'Gluten-free',
    !dish.contains_dairy && 'Dairy-free',
    !dish.contains_eggs && 'Egg-free',
    !dish.contains_soy && 'Soy-free',
    !dish.contains_shellfish && 'Shellfish-free',
  ].filter(Boolean) as string[]

  const hasNutrition =
    dish.calories_per_serving != null ||
    dish.protein_g != null ||
    dish.carbs_g != null ||
    dish.fat_g != null

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Back */}
        <Link href="/dishes" className="flex items-center gap-1.5 text-sm text-text-4 hover:text-brand mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dish Library
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border p-7 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-brand uppercase tracking-wide mb-1">
                {CATEGORY_LABELS[dish.category] ?? dish.category}
              </p>
              <h1 className="text-3xl font-bold text-text-1">{dish.name}</h1>
              {dish.description && (
                <p className="text-text-3 mt-2 text-base leading-relaxed">{dish.description}</p>
              )}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 ${spice.color}`}>
              <Flame className="h-3.5 w-3.5" />
              {spice.label}
            </div>
          </div>

          {/* Dietary badges */}
          {dietaryBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {dietaryBadges.map(b => (
                <Badge key={b.label} variant="outline" className={`text-sm px-3 py-0.5 ${b.class}`}>
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proteins */}
          {dish.proteins.length > 0 && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold text-text-1 mb-3">Protein Sources</h2>
              <div className="flex flex-wrap gap-2">
                {dish.proteins.map(p => (
                  <Badge key={p} variant="outline" className="text-sm px-3 py-0.5 text-text-2">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-semibold text-text-1 mb-4">Allergen Information</h2>
            {allergens.length > 0 ? (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-700 mb-2">Contains:</p>
                <div className="flex flex-wrap gap-2">
                  {allergens.map(a => (
                    <Badge key={a} variant="outline" className="text-xs text-red-700 border-red-200 bg-red-50">
                      ⚠ {a}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-green-700 mb-4">No major allergens listed.</p>
            )}
            {freeFrom.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">Free from:</p>
                <div className="flex flex-wrap gap-2">
                  {freeFrom.map(a => (
                    <Badge key={a} variant="outline" className="text-xs text-green-700 border-green-200">
                      ✓ {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-text-4 mt-4">
              Always confirm allergen details directly with your caterer before finalising.
            </p>
          </div>

          {/* Ingredients */}
          {dish.ingredients.length > 0 && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold text-text-1 mb-4">Ingredients</h2>
              <ul className="space-y-1">
                {dish.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-text-2 flex items-start gap-2">
                    <span className="text-brand mt-0.5">•</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nutrition */}
          {hasNutrition && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold text-text-1 mb-1">Nutrition</h2>
              {dish.serves_description && (
                <p className="text-xs text-text-4 mb-4">Per {dish.serves_description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {dish.calories_per_serving != null && (
                  <div className="bg-cream rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-brand">{dish.calories_per_serving}</p>
                    <p className="text-xs text-text-4 mt-0.5">kcal</p>
                  </div>
                )}
                {dish.protein_g != null && (
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-700">{String(dish.protein_g)}g</p>
                    <p className="text-xs text-text-4 mt-0.5">Protein</p>
                  </div>
                )}
                {dish.carbs_g != null && (
                  <div className="bg-yellow-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-yellow-700">{String(dish.carbs_g)}g</p>
                    <p className="text-xs text-text-4 mt-0.5">Carbs</p>
                  </div>
                )}
                {dish.fat_g != null && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-700">{String(dish.fat_g)}g</p>
                    <p className="text-xs text-text-4 mt-0.5">Fat</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prep notes */}
          {dish.prep_notes && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold text-text-1 mb-3">Preparation & Serving</h2>
              <p className="text-sm text-text-3 leading-relaxed">{dish.prep_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
