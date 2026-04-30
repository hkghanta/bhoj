import type { ReactNode } from 'react'
import Link from 'next/link'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-black text-orange-600 text-lg">
            OneSeva
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/register" className="bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 font-medium">
              Join free
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
