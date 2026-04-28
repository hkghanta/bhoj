'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  UtensilsCrossed,
  Calendar,
  Image,
  CreditCard,
  Settings,
  Star,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/leads', label: 'Leads', icon: Users },
  { href: '/vendor/quotes', label: 'Quotes', icon: FileText },
  { href: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/vendor/availability', label: 'Availability', icon: Calendar },
  { href: '/vendor/photos', label: 'Photos', icon: Image },
  { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/billing', label: 'Billing', icon: CreditCard },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
]

export function VendorSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-white border-r flex flex-col">
      <div className="px-6 py-5 border-b">
        <Link href="/vendor/dashboard" className="text-xl font-bold text-orange-600">
          Bhoj
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Vendor Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
