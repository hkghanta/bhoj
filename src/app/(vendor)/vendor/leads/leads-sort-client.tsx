'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

export function LeadsSortClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'newest'

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={sort}
        onChange={e => handleSort(e.target.value)}
        className="text-xs pl-7 pr-6 py-1.5 rounded-xl border border-brand-border bg-white dark:bg-cream-2 text-text-2 appearance-none cursor-pointer hover:border-brand-border focus:outline-none focus:border-brand"
      >
        <option value="newest">Newest first</option>
        <option value="event_date">Event date</option>
        <option value="score">Match score</option>
      </select>
      <ArrowUpDown className="h-3 w-3 text-text-4 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
