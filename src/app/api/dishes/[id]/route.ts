import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const item = await prisma.menuItem.findFirst({
    where: { id, is_global: true, pending_review: false, is_active: true },
    select: {
      id: true, name: true, description: true, category: true, spice_level: true,
      is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true, is_kosher: true,
      contains_nuts: true, contains_gluten: true, contains_dairy: true,
      contains_eggs: true, contains_soy: true, contains_shellfish: true,
      ingredients: true, serves_description: true,
      calories_per_serving: true, protein_g: true, carbs_g: true, fat_g: true,
      prep_notes: true,
    },
  })

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}
