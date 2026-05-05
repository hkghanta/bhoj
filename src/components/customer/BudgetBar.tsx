import { Progress } from '@/components/ui/progress'

type Props = {
  totalBudget: number
  totalSpent: number
  currency: string
}

export function BudgetBar({ totalBudget, totalSpent, currency }: Props) {
  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0
  const isOverBudget = totalSpent > totalBudget

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-2">Budget Overview</h3>
        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
          {isOverBudget ? `${fmt(Math.abs(remaining))} over budget` : `${fmt(remaining)} remaining`}
        </span>
      </div>
      <Progress value={pct} className={isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-brand'} />
      <div className="flex justify-between mt-2 text-xs text-text-4">
        <span>Committed: <strong className="text-text-1">{fmt(totalSpent)}</strong></span>
        <span>Total budget: <strong className="text-text-1">{fmt(totalBudget)}</strong></span>
      </div>
    </div>
  )
}
