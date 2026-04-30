'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Store, FileText, MessageSquare,
  Users2, ListChecks, CalendarPlus, ChevronLeft,
  LayoutDashboard, LogOut, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerSidebarProps {
  userName: string
}

export function CustomerSidebar({ userName }: CustomerSidebarProps) {
  const pathname = usePathname()

  // Detect if we're inside a specific event
  const eventMatch = pathname.match(/\/events\/([^\/]+)/)
  const eventId = eventMatch?.[1] ?? null

  const topNav = [
    { href: '/dashboard', label: 'My Events', icon: LayoutDashboard },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const planningNav = eventId ? [
    { href: `/events/${eventId}`,         label: 'Overview',        icon: CalendarDays },
    { href: `/events/${eventId}/vendors`, label: 'Browse Vendors',  icon: Store },
    { href: `/events/${eventId}/quotes`,  label: 'Quotes',          icon: FileText },
  ] : []

  const managementNav = eventId ? [
    { href: `/events/${eventId}/guests`,     label: 'Guests',     icon: Users2 },
    { href: `/events/${eventId}/sub-events`, label: 'Sub-Events', icon: CalendarPlus },
    { href: `/events/${eventId}#checklist`,  label: 'Checklist',  icon: ListChecks },
  ] : []

  const isActive = (href: string) => {
    if (href.includes('#')) return false
    if (href === `/events/${eventId}`) return pathname === href || pathname === href + '/'
    return pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-brand-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-brand-border">
        <Link href="/dashboard" className="text-xl font-black tracking-tight text-text-1">
          One<span className="text-brand">Seva</span>
        </Link>
        <p className="text-xs text-text-4 mt-0.5 font-medium tracking-wide">Indian Event Planner</p>
      </div>

      {/* Top nav */}
      <nav className="px-3 pt-4 pb-2 space-y-0.5">
        {topNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'bg-cream text-brand'
                : 'text-text-3 hover:bg-cream hover:text-text-1'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Event-specific nav */}
      {eventId && (
        <>
          <div className="mx-3 my-2 border-t border-brand-border" />
          <div className="px-5 mb-1">
            <Link href="/dashboard"
              className="flex items-center gap-1 text-xs text-text-4 hover:text-brand transition-colors mb-2">
              <ChevronLeft className="h-3 w-3" /> All events
            </Link>
            <p className="text-xs font-black text-text-2 uppercase tracking-wide truncate">This Event</p>
          </div>

          {/* Planning group */}
          <nav className="px-3 pb-1 space-y-0.5">
            {planningNav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-brand text-white'
                    : 'text-text-3 hover:bg-cream hover:text-text-1'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Visual separator between planning and management groups */}
          <div className="mx-4 my-1.5 border-t border-brand-border/50" />

          {/* Management group */}
          <nav className="px-3 pb-2 space-y-0.5">
            {managementNav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-brand text-white'
                    : 'text-text-3 hover:bg-cream hover:text-text-1'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User + sign out */}
      <div className="border-t border-brand-border px-4 py-4">
        <p className="text-sm font-semibold text-text-2 truncate mb-2">{userName}</p>
        <a href="/api/auth/signout"
          className="flex items-center gap-2 text-sm text-text-4 hover:text-brand transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </a>
      </div>
    </aside>
  )
}
