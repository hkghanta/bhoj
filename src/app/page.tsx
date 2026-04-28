import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-orange-600">Bhoj</span>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>Sign in</Link>
          <Link href="/register/customer" className={cn(buttonVariants(), 'bg-orange-600 hover:bg-orange-700')}>
            Get Started
          </Link>
        </div>
      </nav>
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-orange-50 text-orange-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          Now serving UK · US · Canada · Australia
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Find the perfect vendors for your Indian celebration
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Algorithmic matching connects you with vetted caterers, decorators, DJs, photographers and more. Built for the Indian diaspora.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register/customer" className={cn(buttonVariants({ size: 'lg' }), 'bg-orange-600 hover:bg-orange-700')}>
            Plan My Event
          </Link>
          <Link href="/register/vendor" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            List My Business
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-orange-600">26+</div>
            <div className="text-sm text-gray-500 mt-1">Vendor categories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">4</div>
            <div className="text-sm text-gray-500 mt-1">Countries</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">Free</div>
            <div className="text-sm text-gray-500 mt-1">To get started</div>
          </div>
        </div>
      </section>
    </main>
  )
}
