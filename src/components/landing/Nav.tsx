// src/components/landing/Nav.tsx
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-cream-2/95 backdrop-blur-xl border-b border-brand-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 sm:px-12 py-0 h-[56px]">
      {/* Logo */}
      <Link href="/" className="text-xl font-extrabold tracking-tight text-text-1 flex items-center gap-1.5">
        One<span className="text-brand">Seva</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2" />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="text-[13px] font-semibold text-text-2 border border-brand-border rounded-xl px-4 py-2 hover:bg-cream transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/register/customer"
          className="text-[13px] font-extrabold tracking-tight text-white rounded-xl px-5 py-2 transition-all duration-200 bg-brand hover:bg-brand-hover shadow-md shadow-brand/15 hover:shadow-lg hover:shadow-brand/25"
        >
          Get started →
        </Link>
      </div>
    </nav>
  );
}
