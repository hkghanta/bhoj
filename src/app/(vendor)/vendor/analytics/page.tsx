import { VendorAnalyticsDashboard } from '@/components/vendor/VendorAnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Analytics</h1>
        <p className="text-text-4 mt-1">
          Track your business performance and key metrics.
        </p>
      </div>
      <VendorAnalyticsDashboard />
    </div>
  )
}
