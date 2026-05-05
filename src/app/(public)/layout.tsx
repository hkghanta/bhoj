import type { ReactNode } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-white dark:bg-cream-2 border-b border-brand-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="text-lg font-black tracking-tight text-text-1">
              One<span className="text-brand">Seva</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/board" className="text-sm font-medium text-text-3 hover:text-text-1 transition-colors">Open requests</Link>
              <Link href="/vendors" className="text-sm font-medium text-text-3 hover:text-text-1 transition-colors">Browse vendors</Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-text-3 hover:text-text-1 transition-colors">How it works</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-text-2 hover:text-text-1 transition-colors">Sign in</Link>
            <Link href="/register/customer" className="hidden sm:inline-flex text-sm font-bold text-white bg-brand hover:bg-brand-hover px-4 py-2 rounded-lg transition-colors">
              Plan my event →
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-brand-border mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-4">
          <Link href="/" className="font-black text-text-2">One<span className="text-brand">Seva</span></Link>
          <div className="flex items-center gap-6">
            <Link href="/for-vendors" className="hover:text-text-2 transition-colors">For vendors</Link>
            <Link href="/login" className="hover:text-text-2 transition-colors">Sign in</Link>
            <Link href="/register/customer" className="hover:text-text-2 transition-colors">Plan an event</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
