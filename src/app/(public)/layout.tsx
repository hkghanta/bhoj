import type { ReactNode } from 'react'
import Nav from '@/components/landing/Nav'
import Footer from '@/components/landing/Footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
