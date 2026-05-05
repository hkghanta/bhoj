export default function VendorDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight text-text-1 mb-8">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: 'New Leads', value: '0' },
          { label: 'Active Quotes', value: '0' },
          { label: 'Avg Rating', value: '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6">
            <div className="text-3xl font-black text-text-1">{stat.value}</div>
            <div className="text-sm text-text-4 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-cream-2 border-2 border-dashed rounded-2xl p-16 text-center">
        <p className="text-base text-text-4 mb-4">No leads yet. Complete your profile to start receiving matches.</p>
        <a href="/vendor/onboarding" className="inline-block px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover">
          Complete Profile →
        </a>
      </div>
    </div>
  )
}
