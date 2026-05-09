import { SpendAnalyticsDashboard } from '@/components/customer/SpendAnalyticsDashboard'

export default function SpendAnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1">Spend Analytics</h1>
        <p className="text-text-3 mt-1">
          Track your spending across vendors and events.
        </p>
      </div>
      <SpendAnalyticsDashboard />
    </div>
  )
}
