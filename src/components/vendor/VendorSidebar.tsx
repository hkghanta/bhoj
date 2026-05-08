'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  UtensilsCrossed,
  Calendar,
  Clock,
  Image,
  Coins,
  Settings,
  Star,
  MessageSquare,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }
type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    title: 'Business',
    items: [
      { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/vendor/leads', label: 'Leads', icon: Users },
      { href: '/vendor/quotes', label: 'Quotes', icon: FileText },
      { href: '/vendor/contracts', label: 'Contracts', icon: ScrollText },
      { href: '/vendor/credits', label: 'Lead Credits', icon: Coins },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
      { href: '/vendor/availability', label: 'Availability', icon: Calendar },
      { href: '/vendor/schedule', label: 'Operating Hours', icon: Clock },
      { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/vendor/photos', label: 'Photos', icon: Image },
      { href: '/vendor/reviews', label: 'Reviews', icon: Star },
      { href: '/vendor/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const navItems = navSections.flatMap(s => s.items)

const mobileNav = [
  { href: '/vendor/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/vendor/leads', label: 'Leads', icon: Users },
  { href: '/vendor/quotes', label: 'Quotes', icon: FileText },
  { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
]

export function VendorSidebar() {
  const pathname = usePathname()

  return (
    <>
    <aside className="hidden md:flex w-56 min-h-screen bg-white dark:bg-cream-2 border-r border-brand-border flex-col">
      <div className="px-6 py-5 border-b border-brand-border">
        <Link href="/vendor/dashboard" className="text-xl font-black tracking-tight text-text-1">
          One<span className="text-brand">Seva</span>
        </Link>
        <p className="text-xs text-text-4 mt-0.5">Vendor Portal</p>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-text-4/60">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-text-3 hover:bg-cream hover:text-text-1'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-white/80')} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>

    {/* Mobile bottom nav */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-cream-2 border-t border-brand-border flex items-center justify-around px-2 py-2 safe-bottom">
      {mobileNav.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-medium transition-colors min-w-[56px]',
            pathname.startsWith(href)
              ? 'text-brand'
              : 'text-text-4'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
    </>
  )
}
