import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function VendorDashboard() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">Bhoj</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user?.name}</span>
          <Link href="/api/auth/signout" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Sign out
          </Link>
        </div>
      </nav>
      <div className="flex">
        <aside className="w-56 min-h-screen bg-white border-r p-4">
          <nav className="space-y-1">
            {[
              { href: '/vendor/dashboard', label: 'Dashboard' },
              { href: '/vendor/leads', label: 'Leads' },
              { href: '/vendor/quotes', label: 'Quotes' },
              { href: '/vendor/menu', label: 'Menu & Packages' },
              { href: '/vendor/availability', label: 'Availability' },
              { href: '/vendor/profile', label: 'Profile' },
              { href: '/vendor/analytics', label: 'Analytics' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Dashboard</h1>
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
            <p className="text-gray-500">No leads yet. Complete your profile to start receiving matches.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
