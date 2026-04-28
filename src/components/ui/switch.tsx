'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

function Switch({ checked, onCheckedChange, className }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        checked ? 'bg-orange-600' : 'bg-gray-200',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export { Switch }
