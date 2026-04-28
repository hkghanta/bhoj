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
    new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Budget Overview</h3>
        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
          {isOverBudget ? `${fmt(Math.abs(remaining))} over budget` : `${fmt(remaining)} remaining`}
        </span>
      </div>
      <Progress value={pct} className={isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-orange-500'} />
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Committed: <strong className="text-gray-900">{fmt(totalSpent)}</strong></span>
        <span>Total budget: <strong className="text-gray-900">{fmt(totalBudget)}</strong></span>
      </div>
    </div>
  )
}
