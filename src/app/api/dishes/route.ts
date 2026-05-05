import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    const items = await prisma.globalDish.findMany({
      where: {
        active: true,
        ...(category ? { category: category as any } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      take: limit,
      select: {
        id: true, name: true, description: true, category: true,
        is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true,
        contains_nuts: true, contains_gluten: true, contains_dairy: true,
        contains_eggs: true, spice_level: true, proteins: true, cuisine_type: true,
        ingredients: true, history: true, nutrition: true,
      },
    })

    return NextResponse.json(items)
  } catch (err) {
    console.error('[/api/dishes]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
