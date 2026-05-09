// src/components/landing/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a0904] text-white/60 text-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-extrabold tracking-tight text-white mb-3 flex items-center gap-1.5">
              One<span className="text-brand">Seva</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5" />
            </div>
            <p className="text-white/35 text-sm leading-relaxed max-w-[200px]">
              The complete platform for planning celebrations. Made with care.
            </p>
          </div>

          {/* For customers */}
          <div>
            <div className="text-white/50 font-extrabold tracking-tight mb-4 text-[11px] uppercase tracking-[0.15em]">
              For customers
            </div>
            <div className="flex flex-col gap-2.5">
              <Link href="/register/customer" className="hover:text-white transition-colors">Plan an event</Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="/#categories" className="hover:text-white transition-colors">Browse categories</Link>
            </div>
          </div>

          {/* For vendors */}
          <div>
            <div className="text-white/50 font-extrabold tracking-tight mb-4 text-[11px] uppercase tracking-[0.15em]">
              For vendors
            </div>
            <div className="flex flex-col gap-2.5">
              <Link href="/register/vendor" className="hover:text-white transition-colors">List your business</Link>
              <Link href="/for-vendors" className="hover:text-white transition-colors">Why OneSeva</Link>
              <Link href="/for-vendors#verified" className="hover:text-white transition-colors">Get verified</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-white/50 font-extrabold tracking-tight mb-4 text-[11px] uppercase tracking-[0.15em]">
              Company
            </div>
            <div className="flex flex-col gap-2.5">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white/25 text-xs">© {new Date().getFullYear()} OneSeva. All rights reserved.</span>
          <span className="text-white/25 text-xs">Made in the USA</span>
        </div>
      </div>
    </footer>
  );
}
