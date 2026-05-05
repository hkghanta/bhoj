// src/components/landing/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-text-1 text-white/70 text-xs">
      <div className="max-w-6xl mx-auto px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="text-lg font-black text-white mb-2">
            One<span className="text-brand">Seva</span>
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            Made with ❤️ for every celebration.
          </p>
        </div>

        {/* For customers */}
        <div>
          <div className="text-white font-bold mb-3 text-xs uppercase tracking-widest">
            For customers
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/register/customer" className="hover:text-white transition-colors">Plan an event</Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="/#categories" className="hover:text-white transition-colors">Browse categories</Link>
          </div>
        </div>

        {/* For vendors */}
        <div>
          <div className="text-white font-bold mb-3 text-xs uppercase tracking-widest">
            For vendors
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/register/vendor" className="hover:text-white transition-colors">List your business</Link>
            <Link href="/for-vendors" className="hover:text-white transition-colors">Why OneSeva</Link>
            <Link href="/for-vendors#verified" className="hover:text-white transition-colors">Get verified</Link>
          </div>
        </div>

        {/* Company */}
        <div>
          <div className="text-white font-bold mb-3 text-xs uppercase tracking-widest">
            Company
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 text-center py-4 text-white/30">
        © {new Date().getFullYear()} OneSeva. All rights reserved.
      </div>
    </footer>
  );
}
