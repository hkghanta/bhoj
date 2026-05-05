'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, UserSearch, UtensilsCrossed, CreditCard, LogOut, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/vendors',       label: 'Vendors',      icon: Users },
  { href: '/admin/leads',         label: 'Leads',        icon: UserSearch },
  { href: '/admin/dishes',        label: 'Dish Library', icon: UtensilsCrossed },
  { href: '/admin/subscriptions', label: 'Subscriptions',icon: CreditCard },
  { href: '/admin/services',     label: 'Services',     icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', redirect: 'manual' })
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-brand-border flex flex-col">
        <div className="px-5 py-5 border-b border-brand-border">
          <span className="text-lg font-bold text-brand">Bhoj Admin</span>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cream text-brand'
                    : 'text-text-3 hover:bg-cream hover:text-text-1'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-text-3 hover:bg-cream hover:text-text-1 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
