import { cn } from '@/lib/utils'

type StatusBadgeProps = {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  default: { dot: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  success: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  danger:  { dot: 'bg-red-500',   text: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
  info:    { dot: 'bg-blue-500',  text: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
}

const SIZE_STYLES: Record<string, { wrapper: string; dot: string; text: string }> = {
  sm: { wrapper: 'px-2 py-0.5', dot: 'w-1.5 h-1.5', text: 'text-[10px]' },
  md: { wrapper: 'px-2.5 py-1', dot: 'w-1.5 h-1.5', text: 'text-xs' },
}

export function StatusBadge({ status, variant = 'default', size = 'sm' }: StatusBadgeProps) {
  const v = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default
  const s = SIZE_STYLES[size] ?? SIZE_STYLES.sm

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-bold',
      v.bg,
      s.wrapper,
    )}>
      <span className={cn('rounded-full flex-shrink-0', v.dot, s.dot)} />
      <span className={cn('whitespace-nowrap', v.text, s.text)}>{status}</span>
    </span>
  )
}
