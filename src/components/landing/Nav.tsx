// src/components/landing/Nav.tsx
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface NavProps {
  vendorPage?: boolean;
}

export default function Nav({ vendorPage = false }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-cream-2/90 backdrop-blur-xl border-b border-brand-border/60 flex items-center justify-between px-4 sm:px-12 py-0 h-[64px]">
      {/* Logo */}
      <Link href="/" className="text-xl font-black tracking-tight text-text-1 flex items-center gap-1.5">
        One<span className="text-brand">Seva</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2" />
      </Link>

      {/* Centre links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/#how-it-works"
          className="text-[13px] font-semibold text-text-3 hover:text-text-1 transition-colors"
        >
          How it works
        </Link>
        <Link href="/board" className="text-[13px] font-semibold text-text-3 hover:text-text-1 transition-colors">
          Open requests
        </Link>
        <Link href="/vendors" className="text-[13px] font-semibold text-text-3 hover:text-text-1 transition-colors">
          Browse vendors
        </Link>
        <Link
          href="/for-vendors"
          className={`text-[13px] font-semibold transition-colors ${
            vendorPage
              ? "text-brand border-b-2 border-brand pb-px"
              : "text-text-3 hover:text-text-1"
          }`}
        >
          For vendors
        </Link>
        <Link
          href="/#categories"
          className="text-[13px] font-semibold text-text-3 hover:text-text-1 transition-colors"
        >
          Categories
        </Link>
      </div>

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
          href={vendorPage ? "/register/vendor" : "/register/customer"}
          className="text-[13px] font-black text-white rounded-xl px-5 py-2 transition-all duration-200 bg-brand hover:bg-brand-hover shadow-md shadow-brand/15 hover:shadow-lg hover:shadow-brand/25"
        >
          {vendorPage ? "List my business →" : "Plan my event →"}
        </Link>
      </div>
    </nav>
  );
}
