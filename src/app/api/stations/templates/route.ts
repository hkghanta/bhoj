import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // Public endpoint: return only platform-defined templates (not vendor custom ones)
  const templates = await prisma.stationTemplate.findMany({
    where: { active: true, is_custom: false },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(templates)
}
