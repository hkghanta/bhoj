# Landing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the customer landing page (`/`) and vendor marketing page (`/for-vendors`) in Next.js, faithful to the approved HTML mockups.

**Architecture:** Two static server-component pages sharing a Nav and Footer. Interactive pieces (hero search form, FAQ accordion) are isolated "use client" components. Design tokens (brand orange, cream palette, dot-grid texture, script font) are added to `globals.css` and `layout.tsx`. No API calls on these pages — pure marketing HTML.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, Tailwind CSS v4, `next/font/google` (Inter + Dancing Script), TypeScript, Vitest + React Testing Library.

**Reference mockups:**
- Customer page: `/home/hareesh/projects/bhoj/.superpowers/brainstorm/50357-1777418771/content/full-page-mockup.html`
- Vendor page: `/home/hareesh/projects/bhoj/.superpowers/brainstorm/50357-1777418771/content/vendor-page.html`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/globals.css` | Modify | Add brand design tokens + dot-grid utility |
| `src/app/layout.tsx` | Modify | Add Dancing Script font alongside Inter |
| `src/components/landing/Nav.tsx` | Create | Shared top nav (server component) |
| `src/components/landing/Footer.tsx` | Create | Shared footer (server component) |
| `src/components/landing/HeroSearch.tsx` | Create | Interactive event search form (client component) |
| `src/components/landing/VendorFaq.tsx` | Create | Accordion FAQ for vendor page (client component) |
| `src/app/page.tsx` | Replace | Full customer landing page |
| `src/app/for-vendors/page.tsx` | Create | Full vendor marketing page |
| `src/test/landing.test.tsx` | Create | Render tests for both pages |

---

### Task 1: Design tokens, fonts, and shared utilities

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Dancing Script font to layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "OneSeva — Plan Your Perfect Celebration",
  description:
    "Find, compare and book trusted caterers, decorators, photographers and more for your wedding, birthday, corporate event or any celebration.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add brand design tokens to globals.css**

Append after the existing `@theme inline { ... }` block (do NOT replace it):

```css
/* ── Brand design tokens ── */
@theme inline {
  --color-brand:    #e85510;
  --color-brand-hover: #c8420c;
  --color-cream:    #faf5f0;
  --color-cream-2:  #f2ebe3;
  --color-brand-border: #e8ddd4;
  --color-text-1:   #1a0904;
  --color-text-2:   #3d1f10;
  --color-text-3:   #7a5240;
  --color-text-4:   #b08070;
  --font-script:    var(--font-dancing-script);
}

/* ── Dot-grid hero texture ── */
@layer utilities {
  .bg-dot-grid {
    background-image: radial-gradient(
      circle at 1px 1px,
      rgba(180, 120, 70, 0.12) 1px,
      transparent 0
    );
    background-size: 28px 28px;
  }
}
```

- [ ] **Step 3: Verify dev server still starts**

```bash
cd /home/hareesh/projects/bhoj
npm run dev -- --port 3002
```

Expected: Server starts on port 3002, no TypeScript/CSS errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add brand design tokens, dot-grid utility, and Dancing Script font"
```

---

### Task 2: Shared Nav component

**Files:**
- Create: `src/components/landing/Nav.tsx`

- [ ] **Step 1: Create the Nav component**

```tsx
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
          {vendorPage ? "List my business →" : "Start planning →"}
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/Nav.tsx
git commit -m "feat: add shared landing Nav component"
```

---

### Task 3: Shared Footer component

**Files:**
- Create: `src/components/landing/Footer.tsx`

- [ ] **Step 1: Create the Footer component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/Footer.tsx
git commit -m "feat: add shared landing Footer component"
```

---

### Task 4: Hero search (client component)

**Files:**
- Create: `src/components/landing/HeroSearch.tsx`

- [ ] **Step 1: Create the interactive hero search form**

```tsx
// src/components/landing/HeroSearch.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPES = [
  "Wedding", "Birthday", "Graduation", "Corporate", "Mehendi",
  "Engagement", "Arangetram", "Baby Shower", "Anniversary", "House Warming",
];

export default function HeroSearch() {
  const router = useRouter();
  const [eventType, setEventType] = useState("Birthday");
  const [guests, setGuests] = useState("60");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      `/register/customer?event=${encodeURIComponent(eventType)}&guests=${guests}`
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white border border-brand-border rounded-xl p-2 shadow-sm w-full max-w-xl"
    >
      {/* Event type */}
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        className="flex-1 text-sm font-semibold text-text-1 bg-cream rounded-lg px-3 py-2.5 border-0 outline-none cursor-pointer"
      >
        {EVENT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Divider */}
      <div className="hidden sm:block w-px h-6 bg-brand-border" />

      {/* Guest count */}
      <select
        value={guests}
        onChange={(e) => setGuests(e.target.value)}
        className="flex-1 text-sm font-semibold text-text-1 bg-cream rounded-lg px-3 py-2.5 border-0 outline-none cursor-pointer"
      >
        {["10","25","50","60","100","150","200","300","500"].map((n) => (
          <option key={n} value={n}>{n} guests</option>
        ))}
      </select>

      {/* Submit */}
      <button
        type="submit"
        className="bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-brand-hover transition-colors whitespace-nowrap"
      >
        Find vendors →
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/HeroSearch.tsx
git commit -m "feat: add HeroSearch client component"
```

---

### Task 5: Vendor FAQ accordion (client component)

**Files:**
- Create: `src/components/landing/VendorFaq.tsx`

- [ ] **Step 1: Create the FAQ accordion**

```tsx
// src/components/landing/VendorFaq.tsx
"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do I need to pay to get leads?",
    a: "No. Listing your business and receiving matched leads is completely free. There are no hidden fees to get started.",
  },
  {
    q: "How does the matching algorithm work?",
    a: "We score your profile against each event request — matching cuisine, capacity, city, dietary requirements, budget, and event type. The more complete your profile, the higher you rank. Events are sent to you automatically.",
  },
  {
    q: "What do I need to list my business?",
    a: "Your business name, service description, location, photos, and a menu or service list. You can also add packages and special-day pricing later.",
  },
  {
    q: "Can I choose which leads I respond to?",
    a: "Always. Every lead is a request — you choose to quote or decline. No obligation, no penalty for passing on events that don't fit.",
  },
  {
    q: "Is there a commission on bookings?",
    a: "No commission, ever. What you earn from a booking is entirely yours. OneSeva is free to list and use — we don't take a cut from your events.",
  },
  {
    q: "How soon can I start receiving leads?",
    a: "Same day. Once your profile is live, our algorithm starts matching you to incoming event requests immediately.",
  },
];

export default function VendorFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-brand-border border border-brand-border rounded-xl overflow-hidden max-w-3xl mx-auto">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left text-sm font-semibold text-text-1 hover:bg-cream transition-colors"
          >
            {faq.q}
            <span className="text-text-4 text-lg font-light ml-4 flex-shrink-0">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-text-3 leading-relaxed bg-cream">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/VendorFaq.tsx
git commit -m "feat: add VendorFaq accordion client component"
```

---

### Task 6: Customer landing page

**Files:**
- Replace: `src/app/page.tsx`

- [ ] **Step 1: Write the full customer landing page**

```tsx
// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import HeroSearch from "@/components/landing/HeroSearch";

export const metadata: Metadata = {
  title: "OneSeva — Plan Your Perfect Celebration",
  description:
    "Find, compare and book trusted caterers, decorators, photographers and more for weddings, birthdays, corporate events and every celebration.",
  openGraph: {
    title: "OneSeva — Plan Your Perfect Celebration",
    description:
      "Smart vendor matching for every celebration. Free to use.",
    url: "https://oneseva.com",
    siteName: "OneSeva",
    type: "website",
  },
};

const CATEGORIES = [
  "🍽️ Catering", "🌸 Floral & Décor", "📷 Photography", "🎵 DJ & Music",
  "🎤 Live Band", "🎂 Cake & Desserts", "🚗 Transportation", "💄 Hair & Makeup",
  "🎪 Tent & Venue", "🪔 Mehendi Artist", "🎬 Videography", "💃 Dance & Performers",
  "🎁 Invitations", "🕯️ Lighting", "🛋️ Furniture Rental", "🧘 Yoga & Wellness",
  "🍹 Bartending", "🎠 Kids Entertainment", "🔊 Sound & AV", "🏨 Hotel Blocks",
  "🌿 Mandap Décor", "🧧 Favors & Gifts", "🎭 MC & Host", "💍 Jewellery",
  "🛕 Priest & Pandit", "🐘 Special Experiences",
];

const EVENT_TYPES = [
  { emoji: "💍", label: "Wedding" },
  { emoji: "🎂", label: "Birthday" },
  { emoji: "🎓", label: "Graduation" },
  { emoji: "💼", label: "Corporate" },
  { emoji: "🪔", label: "Mehendi" },
  { emoji: "💑", label: "Engagement" },
  { emoji: "🎶", label: "Arangetram" },
  { emoji: "🍼", label: "Baby Shower" },
  { emoji: "❤️", label: "Anniversary" },
  { emoji: "🏡", label: "House Warming" },
];

const PERKS = [
  { icon: "📱", title: "Plan from anywhere", desc: "Your event dashboard travels with you. Add guests, check tasks, review quotes — from any device." },
  { icon: "🤖", title: "Smart matching", desc: "Our algorithm scores vendors by cuisine, capacity, city, and budget. You only see relevant matches." },
  { icon: "📅", title: "Multi-event support", desc: "Wedding weekend? Manage Mehendi, Sangeet, and Reception as separate sub-events under one plan." },
  { icon: "📊", title: "Compare quotes", desc: "All quotes land in a side-by-side comparison view. Price, menu, inclusions — everything at a glance." },
  { icon: "💌", title: "Guest & RSVP", desc: "Send digital invites, collect RSVPs, track dietary preferences, and manage seating — all in one place." },
  { icon: "✅", title: "Event task tracker", desc: "Built-in checklist for every event type. Mark tasks done, set reminders, never miss a deadline." },
  { icon: "💰", title: "Budget dashboard", desc: "Set a total budget, assign amounts to each vendor, and watch your committed vs. remaining in real time." },
  { icon: "👥", title: "Plan together", desc: "Invite up to 10 collaborators — family, partner, or planner — each with their own access level." },
  { icon: "🍽️", title: "Book a tasting", desc: "For events over 100 guests, request a tasting session directly through the platform before you commit." },
  { icon: "💬", title: "Message vendors", desc: "Chat with vendors directly on platform. Negotiate, clarify, and finalise — no phone tag needed." },
];

const TESTIMONIALS = [
  {
    text: "\"We planned our entire wedding weekend across three sub-events. The quote comparison alone saved us hours of back-and-forth.\"",
    name: "Priya & Arjun M.",
    detail: "Wedding · Houston, TX",
    avatar: "P",
  },
  {
    text: "\"Found our caterer in two days. The matching was so accurate — every vendor they suggested actually fit our budget and guest count.\"",
    name: "Sunita K.",
    detail: "Birthday · Chicago, IL",
    avatar: "S",
  },
  {
    text: "\"The RSVP system is brilliant. We collected 180 responses and dietary preferences without a single spreadsheet.\"",
    name: "Rajan & Deepa T.",
    detail: "Anniversary · New Jersey",
    avatar: "R",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Nav />

      {/* ── HERO ── */}
      <section className="bg-dot-grid" style={{
        background: `
          radial-gradient(ellipse 70% 55% at 12% 30%, rgba(255,220,190,0.45) 0%, transparent 65%),
          radial-gradient(ellipse 45% 40% at 88% 75%, rgba(255,210,175,0.25) 0%, transparent 55%),
          radial-gradient(circle at 1px 1px, rgba(180,120,70,0.12) 1px, transparent 0)
        `,
        backgroundSize: "100% 100%, 100% 100%, 28px 28px",
      }}>
        <div className="max-w-5xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
          {/* Pill */}
          <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-widest uppercase text-text-3 bg-cream border border-brand-border rounded-full px-4 py-1.5">
            Find · Compare · Book
          </div>

          {/* Script line */}
          <p className="font-script text-4xl text-text-3 leading-none -mb-3">
            Your celebration,
          </p>

          {/* Bold headline */}
          <h1 className="text-5xl sm:text-6xl font-black text-text-1 leading-none tracking-tight uppercase">
            Perfectly <em className="not-italic text-brand">Handled.</em>
          </h1>

          <p className="text-base text-text-3 max-w-lg leading-relaxed">
            Smart vendor matching for weddings, birthdays, corporate events and every celebration in between. Free to use.
          </p>

          {/* Search form */}
          <HeroSearch />

          {/* Proof */}
          <div className="flex flex-wrap justify-center gap-5 text-xs font-semibold text-text-3">
            <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> No booking fees</span>
            <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> 100% verified vendors</span>
            <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> Free to get started</span>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-white border-b border-brand-border flex flex-wrap justify-center gap-8 px-6 py-4 text-sm text-text-3">
        <span><strong className="text-text-1 font-black text-base">26+</strong> vendor categories</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">100%</strong> compliance-verified vendors</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">Free</strong> right now</span>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">How it works</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Three steps to your perfect event</h2>
          <p className="text-text-3 text-sm mb-12 max-w-lg mx-auto">No cold calls. No spreadsheets. No chasing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Tell us about your event", desc: "Event type, city, date, guest count, and budget. Takes two minutes." },
              { step: "2", title: "Get matched vendors", desc: "Our algorithm surfaces the best-fit vendors for your specific event — scored by cuisine, capacity, and reviews." },
              { step: "3", title: "Compare quotes & book", desc: "Vendors send detailed quotes. Compare side-by-side, chat directly, and confirm — all on platform." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-8 border border-brand-border text-left">
                <div className="w-10 h-10 rounded-full bg-brand text-white text-sm font-black flex items-center justify-center mb-4">{step}</div>
                <h3 className="font-bold text-text-1 mb-2">{title}</h3>
                <p className="text-sm text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR CATEGORIES ── */}
      <section id="categories" className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">What we cover</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-12">26+ vendor categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bg-cream border border-brand-border rounded-xl px-3 py-3 text-sm font-semibold text-text-2 hover:border-brand hover:text-brand transition-colors cursor-pointer text-left">
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT TYPES ── */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Every celebration</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Not just weddings</h2>
          <p className="text-text-3 text-sm mb-12 max-w-lg mx-auto">OneSeva handles every celebration — from intimate birthdays to grand multi-day events.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {EVENT_TYPES.map(({ emoji, label }) => (
              <div key={label} className="bg-white border border-brand-border rounded-2xl px-5 py-3 flex items-center gap-2 text-sm font-bold text-text-1 hover:border-brand transition-colors cursor-pointer">
                <span className="text-xl">{emoji}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE & SAVE ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Compare & save</span>
            <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Built for every celebration</h2>
            <p className="text-text-3 text-sm max-w-lg mx-auto">See how OneSeva stacks up against hunting vendors on your own.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-cream-2 border border-brand-border rounded-2xl p-6">
              <div className="font-bold text-text-2 mb-4 pb-3 border-b border-brand-border">Without OneSeva</div>
              {["Hours searching Google", "No way to compare prices", "No verification — trust blindly", "Phone tag with vendors", "Spreadsheets for guests"].map((item) => (
                <div key={item} className="flex items-start gap-3 py-2 text-sm text-text-3">
                  <span className="text-red-400 font-bold flex-shrink-0">✗</span> {item}
                </div>
              ))}
            </div>
            <div className="bg-white border-2 border-brand rounded-2xl p-6 shadow-sm">
              <div className="font-bold text-brand mb-4 pb-3 border-b border-brand/20">With OneSeva</div>
              {["Matched vendors in minutes", "Side-by-side quote comparison", "100% compliance-verified vendors", "Message vendors on platform", "Guest list, RSVP & dietary tracking"].map((item) => (
                <div key={item} className="flex items-start gap-3 py-2 text-sm text-text-2 font-medium">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Everything in one place</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-12">Built for the way you plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERKS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-brand-border rounded-2xl p-6 text-left">
                <span className="text-2xl block mb-3">{icon}</span>
                <div className="font-bold text-text-1 mb-1 text-sm">{title}</div>
                <p className="text-xs text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO PATHS ── */}
      <section className="bg-white py-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Customer path */}
          <div className="bg-cream border-r border-brand-border px-12 py-16">
            <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Planning an event?</span>
            <h3 className="text-3xl font-black text-text-1 tracking-tight mb-3">Find the right vendors, fast.</h3>
            <p className="text-sm text-text-3 leading-relaxed mb-6">Tell us what you need. We match you with verified vendors who fit your event, city, and budget. Compare quotes and book — all in one place.</p>
            <ul className="flex flex-col gap-2 mb-8 text-sm text-text-2">
              {["Algorithmic matching", "Side-by-side quote comparison", "Guest list & RSVP", "Event task tracker"].map((item) => (
                <li key={item} className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span>{item}</li>
              ))}
            </ul>
            <Link href="/register/customer" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors">
              Start planning free →
            </Link>
          </div>

          {/* Vendor path */}
          <div className="px-12 py-16" style={{ background: "#1e0f07" }}>
            <span className="text-xs font-bold tracking-widest uppercase block mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Running a business?</span>
            <h3 className="text-3xl font-black tracking-tight mb-3 text-white">Get quality leads delivered.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>List your business free. Our algorithm matches you to events that fit your cuisine, capacity, and city. Quote, negotiate, and close — all on platform.</p>
            <ul className="flex flex-col gap-2 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              {["Matched leads — no cold outreach", "Push & WhatsApp alerts", "Quote builder with menu", "Full profile with reviews"].map((item) => (
                <li key={item} className="flex items-center gap-2"><span className="font-bold text-white">✓</span>{item}</li>
              ))}
            </ul>
            <Link href="/for-vendors" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors">
              List my business →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Trusted by families</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-12">Trusted by families across the US & beyond</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ text, name, detail, avatar }) => (
              <div key={name} className="bg-white border border-brand-border rounded-2xl p-6 text-left">
                <div className="text-brand text-sm mb-3">★★★★★</div>
                <p className="text-sm text-text-2 leading-relaxed italic mb-5">{text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand text-white text-sm font-black flex items-center justify-center flex-shrink-0">{avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-text-1">{name}</div>
                    <div className="text-xs text-text-4">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white py-16 px-6 border-t border-brand-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { n: "26+", label: "Vendor categories" },
            { n: "500+", label: "Events planned" },
            { n: "100%", label: "Compliance-verified vendors" },
            { n: "Free", label: "Right now" },
          ].map(({ n, label }) => (
            <div key={label}>
              <div className="text-4xl font-black text-brand mb-1">{n}</div>
              <div className="text-xs text-text-3 font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-brand py-20 px-6 text-center text-white">
        <p className="font-script text-3xl text-white/70 mb-2">Your celebration,</p>
        <h2 className="text-4xl font-black tracking-tight mb-4">Perfectly handled.</h2>
        <p className="text-white/70 text-sm mb-8 max-w-md mx-auto">Start planning today — it takes two minutes and it's completely free.</p>
        <Link href="/register/customer" className="inline-flex items-center gap-2 bg-white text-brand text-sm font-black px-8 py-4 rounded-xl hover:bg-cream transition-colors">
          Start planning free →
        </Link>
      </section>

      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Check the page loads**

```bash
cd /home/hareesh/projects/bhoj
npm run dev -- --port 3002
# Open http://localhost:3002 in browser
```

Expected: Full landing page renders with all sections, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: implement full customer landing page"
```

---

### Task 7: Vendor marketing page

**Files:**
- Create: `src/app/for-vendors/page.tsx`

- [ ] **Step 1: Create the for-vendors directory and page**

```tsx
// src/app/for-vendors/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import VendorFaq from "@/components/landing/VendorFaq";

export const metadata: Metadata = {
  title: "List Your Business Free — Get Quality Event Leads | OneSeva For Vendors",
  description:
    "Join OneSeva as a vendor. Get matched to weddings, birthdays, corporate events and more. List free, quote on platform, grow your bookings.",
  openGraph: {
    title: "OneSeva For Vendors — Grow Your Event Business",
    description: "Get matched to quality event leads. List free, no commission.",
    url: "https://oneseva.com/for-vendors",
    siteName: "OneSeva",
    type: "website",
  },
};

const HOW_IT_WORKS = [
  {
    step: "1",
    emoji: "📋",
    title: "Build your profile",
    desc: "Add your services, pricing, photos, and compliance documents. Takes about 30 minutes. Done once.",
  },
  {
    step: "2",
    emoji: "✨",
    title: "Get matched automatically",
    desc: "Our algorithm sends you events that match your specialty, city, and capacity. No cold outreach needed.",
  },
  {
    step: "3",
    emoji: "💬",
    title: "Submit your quote",
    desc: "Send detailed quotes with menus, packages, and pricing. Chat with customers directly on platform.",
  },
  {
    step: "4",
    emoji: "🚀",
    title: "Get booked & grow",
    desc: "Customer selects you. Every booking builds your verified review score and pushes you up the rankings.",
  },
];

const BENEFITS = [
  {
    icon: "📥",
    title: "More leads, better quality",
    desc: "Only events matching your cuisine, capacity, and city reach your dashboard. No spam, no time-wasters — every lead is relevant.",
  },
  {
    icon: "🔔",
    title: "Never miss an order",
    desc: "Instant push notifications, email, and WhatsApp alerts the moment a matching event comes in. Be first to quote and you're twice as likely to close.",
  },
  {
    icon: "🎛",
    title: "Orders on your terms",
    desc: "Accept, decline, or counter-quote any lead. You set your calendar, your capacity, and your availability. Full control at all times.",
  },
  {
    icon: "💬",
    title: "Negotiate directly",
    desc: "Chat with customers directly on platform to clarify requirements, refine your offer, and close the deal. No middlemen in the conversation.",
  },
  {
    icon: "⭐",
    title: "Build your reputation",
    desc: "Verified reviews after every event build your profile score automatically. Higher scores mean higher placement and more inbound leads.",
  },
  {
    icon: "📊",
    title: "Analytics dashboard",
    desc: "Track profile views, lead volume, and quote acceptance rate. Know what's working and where to improve your profile to win more business.",
  },
];

const VERIFICATION_ITEMS = [
  "Business licence — valid and current",
  "Public liability insurance — valid policy required",
  "Health inspection certificate (food vendors)",
  "Food safety certification (food vendors)",
];

const TESTIMONIALS = [
  {
    text: "\"I used to miss leads because I wasn't always checking my phone. Now I get a notification the moment a matching event comes in — I've taken 3 new bookings this month I would have missed.\"",
    name: "Kiran Reddy",
    detail: "Caterer · Houston, TX · 200+ events served",
    avatar: "K",
  },
  {
    text: "\"The quote builder is exactly what I needed. I can send a full menu with pricing in minutes, and customers can message me directly with questions. My booking rate doubled in 2 months.\"",
    name: "Preethi Nair",
    detail: "Decorator · New Jersey · 80+ events served",
    avatar: "P",
  },
];

/** Inline SVG verified badge — same design as the mockup */
function VerifiedBadge() {
  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 28px rgba(232,85,16,0.2))" }}
    >
      <defs>
        <path id="ringText" d="M 110,22 A 88,88 0 1,1 109.999,22" />
        <linearGradient id="shieldGrad" x1="82" y1="0" x2="138" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="48%" stopColor="#bae6fd" />
          <stop offset="52%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="shieldShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* outer dark ring */}
      <circle cx="110" cy="110" r="105" fill="#1e0f07" />
      {/* inner white circle */}
      <circle cx="110" cy="110" r="76" fill="white" />
      {/* curved ring text */}
      <text
        fontFamily="Inter,system-ui,sans-serif"
        fontSize="10.5"
        fontWeight="800"
        fill="rgba(255,255,255,0.9)"
        letterSpacing="1.5"
        wordSpacing="10"
      >
        <textPath href="#ringText" startOffset="0%" textLength="552" lengthAdjust="spacingAndGlyphs">
          ONESEVA ✦ VERIFIED ✦ ONESEVA ✦ VERIFIED ✦ ONESEVA ✦ VERIFIED ✦
        </textPath>
      </text>
      {/* sky blue shield */}
      <path d="M110 65 L84 75 L84 99 C84 116 95 129 110 134 C125 129 136 116 136 99 L136 75 Z" fill="url(#shieldGrad)" />
      <path d="M110 65 L84 75 L84 99 C84 116 95 129 110 134 C125 129 136 116 136 99 L136 75 Z" fill="url(#shieldShine)" />
      {/* left highlight / right shadow */}
      <path d="M84 75 L84 99 C84 116 95 129 110 134" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M136 75 L136 99 C136 116 125 129 110 134" stroke="rgba(0,40,80,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* center divider */}
      <line x1="110" y1="65" x2="110" y2="134" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      {/* brand name */}
      <text x="110" y="152" fontFamily="Inter,system-ui,sans-serif" fontSize="10.5" fontWeight="900" fill="#1e0f07" textAnchor="middle" letterSpacing="2.5">
        ONESEVA
      </text>
      {/* orange dot */}
      <circle cx="110" cy="160" r="2.5" fill="#e85510" />
      {/* green verified tick */}
      <circle cx="168" cy="163" r="17" fill="#16a34a" stroke="white" strokeWidth="3" />
      <path d="M161 163 L166 169 L176 156" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ForVendorsPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Nav vendorPage />

      {/* ── HERO ── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 10% 30%, rgba(240,220,200,0.3) 0%, transparent 65%),
            radial-gradient(circle at 1px 1px, rgba(160,130,100,0.1) 1px, transparent 0)
          `,
          backgroundSize: "100% 100%, 28px 28px",
          borderBottom: "1px solid #e8ddd4",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex text-xs font-bold tracking-widest uppercase text-text-3 bg-cream border border-brand-border rounded-full px-4 py-1.5 mb-5">
              For vendors
            </div>
            <p className="font-script text-3xl text-text-3 leading-none -mb-1">Grow your business,</p>
            <h1 className="text-5xl font-black text-text-1 uppercase tracking-tight leading-none mb-5">
              More Leads.<br />
              <em className="not-italic text-brand">Better</em> Clients.
            </h1>
            <p className="text-sm text-text-3 leading-relaxed mb-8 max-w-sm">
              Get matched to events that fit your specialty — cuisine, capacity, city. Quote, negotiate, and close — all on platform. Free to list.
            </p>
            <div className="flex gap-3 flex-wrap mb-7">
              <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors">
                List my business free →
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-text-2 border border-brand-border px-5 py-3 rounded-xl hover:bg-cream transition-colors">
                See how it works ↓
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-text-3">
              <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> No commission</span>
              <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> 100% verified events</span>
              <span className="flex items-center gap-1.5"><span className="text-green-600">✓</span> Push & WhatsApp alerts</span>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="bg-white border border-brand-border rounded-2xl shadow-lg overflow-hidden text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ background: "#1e0f07" }}>
              <div>
                <div className="text-white font-black text-sm">Your leads this week</div>
                <div className="text-white/40 text-xs">3 new matches · Updated just now</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-black">K</div>
            </div>
            {/* Leads */}
            <div className="p-3 flex flex-col gap-2">
              {[
                { badge: true, emoji: "💍", type: "Wedding", meta: "280 guests · New York, NY\nSep 2025 · Full catering", match: "98% match" },
                { badge: false, emoji: "🎂", type: "Birthday", meta: "80 guests · New Jersey\nOct 2025 · Buffet + desserts", match: "91% match" },
                { badge: false, emoji: "💼", type: "Corporate", meta: "50 guests · Chicago, IL\nNov 2025 · Box lunches", match: "87% match" },
              ].map(({ badge, emoji, type, meta, match }) => (
                <div key={type} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${badge ? "border-blue-200 bg-blue-50" : "border-brand-border bg-cream"}`}>
                  <div>
                    {badge && <div className="inline-block bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded mb-1 uppercase tracking-wide">New</div>}
                    <div className="flex items-center gap-1.5 font-black text-text-1 text-xs">{emoji} {type}</div>
                    <div className="text-[11px] text-text-4 mt-0.5 whitespace-pre-line">{meta}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-black text-text-2 bg-cream border border-brand-border px-2 py-0.5 rounded-full">{match}</span>
                    <button className="text-[11px] font-black text-white bg-text-1 px-3 py-1 rounded-lg">Quote →</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer stats */}
            <div className="flex gap-5 px-4 py-3 border-t border-brand-border bg-cream-2 text-center">
              {[["12", "QUOTES SENT"], ["8", "BOOKINGS"], ["4.9★", "RATING"]].map(([n, l]) => (
                <div key={l}><div className="text-base font-black text-text-1">{n}</div><div className="text-[9px] font-semibold text-text-4 uppercase tracking-wide">{l}</div></div>
              ))}
              <div className="ml-auto text-xs text-text-4 self-center">This month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-white border-b border-brand-border flex flex-wrap justify-center gap-8 px-6 py-4 text-sm text-text-3">
        <span><strong className="text-text-1 font-black text-base">500+</strong> vendors listed</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">26+</strong> event categories</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">US-based</strong> & growing</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">Free</strong> to start</span>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-cream py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">How it works for vendors</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Go from listed to booked in 4 steps</h2>
          <p className="text-text-3 text-sm mb-12">No cold outreach. No missed leads. Every match comes to you automatically.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, emoji, title, desc }) => (
              <div key={step} className="bg-white border border-brand-border rounded-2xl p-6 text-left">
                <div className="w-8 h-8 rounded-full bg-cream border border-brand-border text-text-3 text-xs font-black flex items-center justify-center mb-4">{step}</div>
                <span className="text-3xl block mb-2">{emoji}</span>
                <div className="font-bold text-text-1 mb-1 text-sm">{title}</div>
                <p className="text-xs text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Why vendors choose OneSeva</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Everything you need to grow</h2>
          <p className="text-text-3 text-sm mb-12">Built by vendors, for vendors. Every feature is designed to help you close more events, faster.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-cream border border-brand-border rounded-2xl p-6 text-left">
                <span className="text-2xl block mb-3">{icon}</span>
                <div className="font-bold text-text-1 mb-1 text-sm">{title}</div>
                <p className="text-xs text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERIFIED BADGE ── */}
      <section id="verified" className="bg-cream py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Trust & compliance</span>
            <h2 className="text-4xl font-black text-text-1 tracking-tight mb-4">The OneSeva<br />Verified Badge</h2>
            <p className="text-sm text-text-3 leading-relaxed mb-6">
              Customers only see verified vendors. To earn the badge, we check your business licence, insurance, and for food vendors — health inspection and food safety certifications. It takes 2–3 business days.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {VERIFICATION_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-text-2">
                  <div className="w-5 h-5 rounded-md bg-green-100 border border-green-200 flex items-center justify-center text-green-700 text-[10px] font-black flex-shrink-0 mt-0.5">✓</div>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors">
              Apply for verification →
            </Link>
          </div>
          <div className="flex flex-col items-center gap-6">
            <VerifiedBadge />
            <div className="flex gap-3">
              {[["2–3", "Business days"], ["3×", "More lead views"], ["Free", "To apply"]].map(([n, l]) => (
                <div key={l} className="bg-white border border-brand-border rounded-xl px-4 py-3 text-center">
                  <div className="text-xl font-black text-text-1">{n}</div>
                  <div className="text-xs text-text-4">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Vendor stories</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-12">Trusted by vendors across the US</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {TESTIMONIALS.map(({ text, name, detail, avatar }) => (
              <div key={name} className="bg-cream border border-brand-border rounded-2xl p-6 text-left">
                <div className="text-brand text-sm mb-3">★★★★★</div>
                <p className="text-sm text-text-2 italic leading-relaxed mb-5">{text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand text-white text-sm font-black flex items-center justify-center flex-shrink-0">{avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-text-1">{name}</div>
                    <div className="text-xs text-text-4">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-cream py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Questions & answers</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Frequently asked questions</h2>
          <p className="text-text-3 text-sm mb-12">Everything you need to know before listing your business.</p>
          <VendorFaq />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-6 text-center text-white" style={{ background: "#1e0f07" }}>
        <p className="font-script text-3xl text-white/60 mb-2">Ready to grow your business?</p>
        <h2 className="text-4xl font-black tracking-tight mb-4">
          List free. Get matched.<br />
          <em className="not-italic text-brand">Start growing.</em>
        </h2>
        <p className="text-white/50 text-sm mb-8 max-w-sm mx-auto">Join 500+ vendors already growing their business on OneSeva.</p>
        <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-black px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors">
          Create my vendor profile →
        </Link>
      </section>

      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify the vendor page loads**

```bash
# With dev server running on port 3002
# Open http://localhost:3002/for-vendors
```

Expected: Full vendor page renders — hero with dashboard mockup, all sections, FAQ accordion works, badge SVG displays.

- [ ] **Step 3: Commit**

```bash
git add src/app/for-vendors/page.tsx
git commit -m "feat: implement vendor marketing page /for-vendors"
```

---

### Task 8: Render tests

**Files:**
- Create: `src/test/landing.test.tsx`

- [ ] **Step 1: Write render tests**

```tsx
// src/test/landing.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation (used by HeroSearch)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/font/google (not available in test env)
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter", variable: "--font-inter" }),
  Dancing_Script: () => ({ className: "mock-ds", variable: "--font-dancing-script" }),
}));

import HeroSearch from "@/components/landing/HeroSearch";
import VendorFaq from "@/components/landing/VendorFaq";

describe("HeroSearch", () => {
  it("renders the event type select and guests select", () => {
    render(<HeroSearch />);
    expect(screen.getByRole("combobox", { name: /event type/i }) ?? screen.getAllByRole("combobox")[0]).toBeTruthy();
    expect(screen.getByRole("button", { name: /find vendors/i })).toBeTruthy();
  });

  it("renders Birthday as default selection", () => {
    render(<HeroSearch />);
    const selects = screen.getAllByRole("combobox");
    expect((selects[0] as HTMLSelectElement).value).toBe("Birthday");
  });
});

describe("VendorFaq", () => {
  it("renders all FAQ questions", () => {
    render(<VendorFaq />);
    expect(screen.getByText(/Do I need to pay to get leads/i)).toBeTruthy();
    expect(screen.getByText(/How does the matching algorithm work/i)).toBeTruthy();
    expect(screen.getByText(/Is there a commission on bookings/i)).toBeTruthy();
  });

  it("opens answer when question is clicked", async () => {
    const user = userEvent.setup();
    render(<VendorFaq />);
    // First FAQ is open by default (index 0)
    expect(screen.getByText(/Listing your business and receiving matched leads/i)).toBeTruthy();
    // Click the second question to open it
    await user.click(screen.getByText(/How does the matching algorithm work/i));
    expect(screen.getByText(/cuisine, capacity, city, dietary requirements/i)).toBeTruthy();
  });

  it("closes an open answer when clicked again", async () => {
    const user = userEvent.setup();
    render(<VendorFaq />);
    const firstQuestion = screen.getByText(/Do I need to pay to get leads/i);
    // First is already open — click to close
    await user.click(firstQuestion);
    expect(screen.queryByText(/Listing your business and receiving matched leads/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /home/hareesh/projects/bhoj
npm test -- src/test/landing.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/test/landing.test.tsx
git commit -m "test: add render tests for HeroSearch and VendorFaq components"
```

---

## Self-Review

**Spec coverage:**
- ✅ Customer landing page — hero, trust bar, how it works, categories, event types, compare, perks, two paths, testimonials, stats, final CTA, footer
- ✅ Vendor page — hero with dashboard mockup, trust bar, how it works, benefits, verified badge SVG, testimonials, FAQ accordion, final CTA, footer
- ✅ SEO metadata — title, description, OpenGraph on both pages
- ✅ Design tokens — orange, cream palette, dot-grid texture
- ✅ Dancing Script font — added to layout
- ✅ Shared Nav with `vendorPage` prop — correct link highlighting per page
- ✅ HeroSearch — client component, routes to `/register/customer`
- ✅ VendorFaq — client component, accordion state
- ✅ Nav CTA routes to correct registration page per context

**Placeholder scan:** None found. All steps contain complete code.

**Type consistency:** All component imports match file paths. `vendorPage` prop on Nav is consistent between definition and usage.
