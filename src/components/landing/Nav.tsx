// src/components/landing/Nav.tsx
import Link from "next/link";

interface NavProps {
  /** Highlight "For vendors" link when on the vendor page */
  vendorPage?: boolean;
}

export default function Nav({ vendorPage = false }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-brand-border flex items-center justify-between px-12 py-0 h-[62px]">
      {/* Logo */}
      <Link href="/" className="text-xl font-black tracking-tight text-text-1">
        One<span className="text-brand">Seva</span>
      </Link>

      {/* Centre links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/#how-it-works"
          className="text-sm font-semibold text-text-3 hover:text-text-1 transition-colors"
        >
          How it works
        </Link>
        <Link href="/vendors/catering/london" className="text-sm font-semibold text-text-3 hover:text-text-1 transition-colors">
          Browse vendors
        </Link>
        <Link
          href="/for-vendors"
          className={`text-sm font-semibold transition-colors ${
            vendorPage
              ? "text-brand border-b-2 border-brand pb-px"
              : "text-text-3 hover:text-text-1"
          }`}
        >
          For vendors
        </Link>
        <Link
          href="/#categories"
          className="text-sm font-semibold text-text-3 hover:text-text-1 transition-colors"
        >
          Categories
        </Link>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-semibold text-text-2 border border-brand-border rounded-lg px-4 py-2 hover:bg-cream transition-colors"
        >
          Sign in
        </Link>
        <Link
          href={vendorPage ? "/register/vendor" : "/register/customer"}
          className="text-sm font-bold text-white rounded-lg px-4 py-2 transition-colors"
          style={{ background: vendorPage ? "#e85510" : "#1a0904" }}
        >
          {vendorPage ? "List my business →" : "Plan My Event →"}
        </Link>
      </div>
    </nav>
  );
}
