'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Store, FileText, MessageSquare,
  ListChecks, CalendarPlus, ChevronLeft,
  LayoutDashboard, LogOut, User, Mail,
  Globe, LayoutGrid, CreditCard, Gift, Search,
  ClipboardList,
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
    { href: '/contacts', label: 'My Guests', icon: Mail },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  // ── Event-specific navigation ──
  const eventNav = eventId ? [
    { href: `/events/${eventId}`,             label: 'Overview',       icon: CalendarDays },
  ] : []

  const vendorNav = eventId ? [
    { href: `/events/${eventId}/services`,    label: 'Services',       icon: Store },
    { href: `/events/${eventId}/vendors`,     label: 'Find Vendors',   icon: Search },
    { href: `/events/${eventId}/quotes`,      label: 'Quotes',         icon: FileText },
  ] : []

  const guestNav = eventId ? [
    { href: `/events/${eventId}/guests`,      label: 'Invitations & Guests', icon: Mail },
    { href: `/events/${eventId}/website`,     label: 'Event Website',  icon: Globe },
    { href: `/events/${eventId}/sub-events`,  label: 'Sub-Events',    icon: CalendarPlus },
  ] : []

  const planningNav = eventId ? [
    { href: `/events/${eventId}/planning`,         label: 'Event Plan',     icon: ClipboardList },
    { href: `/events/${eventId}/checklist`,        label: 'Checklist',      icon: ListChecks },
    { href: `/events/${eventId}/seating`,          label: 'Seating',        icon: LayoutGrid },
    { href: `/events/${eventId}/payment-schedule`, label: 'Payments',       icon: CreditCard },
    { href: `/events/${eventId}/registry`,         label: 'Gift Registry',  icon: Gift },
  ] : []

  const isActive = (href: string) => {
    if (href.includes('#')) return false
    if (href === `/events/${eventId}`) return pathname === href || pathname === href + '/'
    return pathname.startsWith(href + '/') || pathname === href
  }

  const navLink = (href: string, label: string, Icon: React.ComponentType<{ className?: string }>, active: boolean) => (
    <Link key={href} href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
        active
          ? 'bg-brand text-white'
          : 'text-text-3 hover:bg-cream hover:text-text-1'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  )

  return (
    <>
    <aside className="hidden md:flex w-56 min-h-screen bg-white dark:bg-cream-2 border-r border-brand-border flex-col flex-shrink-0">
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
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
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

          {/* Overview */}
          <nav className="px-3 pb-1 space-y-0.5">
            {eventNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Vendors & Quotes */}
          <div className="px-5 mt-3 mb-1">
            <p className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Vendors</p>
          </div>
          <nav className="px-3 pb-1 space-y-0.5">
            {vendorNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Guests & Events */}
          <div className="px-5 mt-3 mb-1">
            <p className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Guests</p>
          </div>
          <nav className="px-3 pb-1 space-y-0.5">
            {guestNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Planning */}
          <div className="px-5 mt-3 mb-1">
            <p className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Planning</p>
          </div>
          <nav className="px-3 pb-1 space-y-0.5">
            {planningNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
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

    {/* Mobile bottom nav */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-cream-2 border-t border-brand-border flex items-center justify-around px-2 py-2 safe-bottom">
      {[
        { href: '/dashboard', label: 'Events', icon: LayoutDashboard },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
        ...(eventId ? [{ href: `/events/${eventId}`, label: 'Event', icon: CalendarDays }] : []),
        ...(eventId ? [{ href: `/events/${eventId}/quotes`, label: 'Quotes', icon: FileText }] : []),
        { href: '/profile', label: 'Profile', icon: User },
      ].map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-medium transition-colors min-w-[56px]',
            (pathname === href || pathname.startsWith(href + '/'))
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
