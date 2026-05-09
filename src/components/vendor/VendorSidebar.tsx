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
    <aside className="hidden md:flex w-52 min-h-screen bg-white dark:bg-cream-2 border-r border-brand-border flex-col">
      <div className="px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <Link href="/vendor/dashboard" className="text-lg font-black tracking-tight text-text-1">
            One<span className="text-brand">Seva</span>
          </Link>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-brand bg-brand/8 px-1.5 py-0.5 rounded-full leading-none">Pro</span>
        </div>
      </div>
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title} className={cn(sectionIdx > 0 && 'mt-5 pt-4 border-t border-brand-border/50')}>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-4/60">
              {section.title}
            </p>
            <div className="space-y-px">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-cream text-brand font-semibold border-l-2 border-brand'
                        : 'text-text-3 hover:bg-cream/60 hover:text-text-2'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-brand' : 'text-text-4')} />
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-cream-2 border-t border-brand-border flex items-center justify-around px-1 py-1.5 safe-bottom">
      {mobileNav.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={cn(
            'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-150 min-w-[48px]',
            pathname.startsWith(href)
              ? 'text-brand font-semibold'
              : 'text-text-4'
          )}
        >
          <Icon className={cn('h-[18px] w-[18px]', pathname.startsWith(href) ? 'text-brand' : 'text-text-4')} />
          {label}
        </Link>
      ))}
    </nav>
    </>
  )
}
