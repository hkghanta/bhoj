import { AlertTriangle } from 'lucide-react'

type DishAllergens = {
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_eggs: boolean
  contains_soy: boolean
  contains_shellfish: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
}

type Preference = {
  nut_free: boolean
  gluten_free: boolean
  dairy_free: boolean
  egg_free: boolean
  soy_free: boolean
  shellfish_free: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
}

export function getConflicts(dish: DishAllergens, pref: Preference): string[] {
  const conflicts: string[] = []
  if (pref.nut_free && dish.contains_nuts) conflicts.push('Contains nuts')
  if (pref.gluten_free && dish.contains_gluten) conflicts.push('Contains gluten')
  if (pref.dairy_free && dish.contains_dairy) conflicts.push('Contains dairy')
  if (pref.egg_free && dish.contains_eggs) conflicts.push('Contains eggs')
  if (pref.soy_free && dish.contains_soy) conflicts.push('Contains soy')
  if (pref.shellfish_free && dish.contains_shellfish) conflicts.push('Contains shellfish')
  if (pref.is_vegetarian && !dish.is_vegetarian) conflicts.push('Not vegetarian')
  if (pref.is_vegan && !dish.is_vegan) conflicts.push('Not vegan')
  if (pref.is_jain && !dish.is_jain) conflicts.push('Not Jain-friendly')
  if (pref.is_halal && !dish.is_halal) conflicts.push('Not halal')
  return conflicts
}

type Props = { dish: DishAllergens; preference: Preference }

export function AllergyConflictBadge({ dish, preference }: Props) {
  const conflicts = getConflicts(dish, preference)
  if (conflicts.length === 0) return null

  return (
    <span
      title={conflicts.join(', ')}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200"
    >
      <AlertTriangle className="h-3 w-3" />
      {conflicts.length === 1 ? conflicts[0] : `${conflicts.length} conflicts`}
    </span>
  )
}
