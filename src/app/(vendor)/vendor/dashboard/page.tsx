export default function VendorDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'New Leads', value: '0' },
          { label: 'Active Quotes', value: '0' },
          { label: 'Avg Rating', value: '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border rounded-lg p-5">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-lg p-12 text-center">
        <p className="text-gray-500 mb-4">No leads yet. Complete your profile to start receiving matches.</p>
        <a href="/vendor/onboarding" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
          Complete Profile →
        </a>
      </div>
    </div>
  )
}
