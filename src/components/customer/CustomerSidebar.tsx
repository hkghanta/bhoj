'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Store, FileText, MessageSquare,
  ChevronLeft,
  LayoutDashboard, LogOut, User, Mail,
  LayoutGrid, CreditCard, Gift, Search,
  ClipboardList, ScrollText, Layers,
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
    { href: '/contacts', label: 'Guest Book', icon: Mail },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  // ── Event-specific navigation ──
  const eventNav = eventId ? [
    { href: `/events/${eventId}`,             label: 'Overview',       icon: CalendarDays },
    { href: `/events/${eventId}/sub-events`,  label: 'Sub-Events',     icon: Layers },
  ] : []

  const vendorNav = eventId ? [
    { href: `/events/${eventId}/services`,    label: 'Requirements',   icon: Store },
    { href: `/events/${eventId}/vendors`,     label: 'Find Vendors',   icon: Search },
    { href: `/events/${eventId}/quotes`,      label: 'Quotes',         icon: FileText },
    { href: `/events/${eventId}/contracts`,  label: 'Contracts',      icon: ScrollText },
  ] : []

  const guestNav = eventId ? [
    { href: `/events/${eventId}/guests`,      label: 'Invitations & Guests', icon: Mail },
  ] : []

  const planningNav = eventId ? [
    { href: `/events/${eventId}/planning`,         label: 'Event Plan',     icon: ClipboardList },
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-brand/10 text-brand font-semibold border-l-2 border-brand'
          : 'text-text-3 hover:bg-cream-2 hover:text-text-2'
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "opacity-100" : "opacity-70")} />
      {label}
    </Link>
  )

  return (
    <>
    <aside className="hidden md:flex w-56 min-h-screen bg-white dark:bg-cream-2 border-r border-brand-border/60 flex-col flex-shrink-0 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-border">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-brand-border/40">
        <Link href="/dashboard" className="text-[22px] font-extrabold tracking-[-0.03em] text-text-1">
          One<span className="text-brand">Seva</span>
        </Link>
        <p className="text-[10px] text-text-4/60 mt-0.5 font-medium tracking-[0.08em] uppercase">Event Planner</p>
      </div>

      {/* Top nav */}
      <nav className="px-3 pt-4 pb-2 space-y-1">
        {topNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand/10 text-brand font-semibold border-l-2 border-brand'
                  : 'text-text-3 hover:bg-cream-2 hover:text-text-2'
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "opacity-100" : "opacity-70")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Event-specific nav */}
      {eventId && (
        <>
          <div className="mx-3 my-2 border-t border-brand-border" />
          <div className="px-4 mb-1">
            <Link href="/dashboard"
              className="flex items-center gap-1 text-xs text-text-4 hover:text-brand transition-colors mb-2">
              <ChevronLeft className="h-3 w-3" /> All events
            </Link>
            <p className="flex items-center gap-2 text-[10px] font-semibold text-text-4/70 uppercase tracking-[0.15em] truncate">
              <span className="w-0.5 h-3 rounded-full bg-brand inline-block flex-shrink-0" />
              This Event
            </p>
          </div>

          {/* Overview */}
          <nav className="px-3 pb-1 space-y-1">
            {eventNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Vendors & Quotes */}
          <div className="px-4 mt-4 mb-1">
            <p className="flex items-center gap-2 text-[10px] font-semibold text-text-4/70 uppercase tracking-[0.15em]">
              <span className="w-0.5 h-3 rounded-full bg-brand inline-block flex-shrink-0" />
              Vendors
            </p>
          </div>
          <nav className="px-3 pb-1 space-y-1">
            {vendorNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Guests & Events */}
          <div className="px-4 mt-4 mb-1">
            <p className="flex items-center gap-2 text-[10px] font-semibold text-text-4/70 uppercase tracking-[0.15em]">
              <span className="w-0.5 h-3 rounded-full bg-brand inline-block flex-shrink-0" />
              Guests
            </p>
          </div>
          <nav className="px-3 pb-1 space-y-1">
            {guestNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>

          {/* Planning */}
          <div className="px-4 mt-4 mb-1">
            <p className="flex items-center gap-2 text-[10px] font-semibold text-text-4/70 uppercase tracking-[0.15em]">
              <span className="w-0.5 h-3 rounded-full bg-brand inline-block flex-shrink-0" />
              Planning
            </p>
          </div>
          <nav className="px-3 pb-1 space-y-1">
            {planningNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon, isActive(href))
            )}
          </nav>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User + sign out */}
      <div className="border-t border-brand-border/40 px-4 py-4">
        <p className="text-sm font-semibold text-text-2 truncate mb-2">{userName}</p>
        <a href="/api/auth/signout"
          className="flex items-center gap-2 text-sm text-text-4 hover:text-brand transition-colors">
          <LogOut className="h-4 w-4" />
          Sign out
        </a>
      </div>
    </aside>

    {/* Mobile bottom nav */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-cream-2 border-t border-brand-border shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-center justify-around px-2 py-2 safe-bottom">
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
