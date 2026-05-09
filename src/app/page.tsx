// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import HeroSearch from "@/components/landing/HeroSearch";

export const metadata: Metadata = {
  title: "OneSeva — Plan Your Perfect Celebration",
  description:
    "Find, compare and book trusted caterers, decorators, photographers and more for weddings, birthdays, corporate events and every celebration.",
  openGraph: {
    title: "OneSeva — Plan Your Perfect Celebration",
    description: "Smart vendor matching for every celebration. Free to use.",
    url: "https://oneseva.com",
    siteName: "OneSeva",
    type: "website",
  },
};

const EVENT_TYPES = [
  { emoji: "💍", label: "Wedding" },
  { emoji: "🎂", label: "Birthday" },
  { emoji: "🎓", label: "Graduation" },
  { emoji: "💼", label: "Corporate" },
  { emoji: "🌿", label: "Mehendi" },
  { emoji: "🩰", label: "Arangetram" },
  { emoji: "👶", label: "Baby Shower" },
  { emoji: "💑", label: "Anniversary" },
  { emoji: "🏠", label: "House Warming" },
  { emoji: "🤝", label: "Engagement" },
];

const VENDOR_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=200&fit=crop&auto=format",
    alt: "Indian catering",
    badge: "Top Match",
    category: "Catering",
    name: "Spice Garden New York",
    meta: "New York, NY · Halal · 6 cuisines",
    stars: "★ 4.9 · 86 reviews",
    match: "98% match",
  },
  {
    img: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=200&fit=crop&auto=format",
    alt: "Wedding decor",
    badge: null,
    category: "Décor & Floral",
    name: "Royal Decor Studio",
    meta: "New Jersey · Premium floral",
    stars: "★ 4.8 · 54 reviews",
    match: "94% match",
  },
  {
    img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=200&fit=crop&auto=format",
    alt: "Wedding photography",
    badge: null,
    category: "Photography",
    name: "Candid Moments Photo",
    meta: "Chicago, IL · All events",
    stars: "★ 4.9 · 112 reviews",
    match: "91% match",
  },
  {
    img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=200&fit=crop&auto=format",
    alt: "Music entertainment",
    badge: null,
    category: "Entertainment",
    name: "Bass Brothers Dhol",
    meta: "Houston, TX · All events",
    stars: "★ 5.0 · 41 reviews",
    match: "97% match",
  },
];

const PERKS = [
  { icon: "🌍", title: "Plan from anywhere", desc: "You're in Los Angeles, the celebration's in New York — no problem. Manage vendors, guests and RSVPs from anywhere in the world." },
  { icon: "✨", title: "Smart vendor matching", desc: "Our algorithm scores every vendor against your dietary requirements, budget, city, and event type. Best fits always rise to the top." },
  { icon: "🗓", title: "Multi-event support", desc: "Mehendi, Sangeet, Haldi, Reception — manage all your vendors and guests in one unified dashboard." },
  { icon: "💬", title: "Compare quotes side by side", desc: "Receive detailed quotes with menus and package breakdowns. Message vendors directly, no middlemen." },
  { icon: "👥", title: "Guest & RSVP management", desc: "Invite guests, track responses, and collect dietary requirements — all in the same platform as your vendor management." },
  { icon: "✅", title: "Event task tracker", desc: "Never drop the ball. Track every task for your event — vendor confirmations, payments, invites, décor — see exactly what's done and what's pending." },
  { icon: "💰", title: "Budget dashboard", desc: "Set your total budget and track every penny. See committed spend, remaining balance, and deposit due dates — all in one place." },
  { icon: "👨‍👩‍👧", title: "Plan together", desc: "Invite family members to collaborate on the same event. Everyone sees the same vendors, checklist, and budget — no more WhatsApp chaos." },
  { icon: "🍽", title: "Book a tasting", desc: "For events over 100 guests — request a tasting directly through the platform before you commit to a caterer. Try before you hire." },
];

const TESTIMONIALS = [
  {
    text: "\"Found our caterer, decorator, and DJ in one afternoon. The match scores are genuinely accurate — our top match was exactly right for our Mehendi.\"",
    name: "Priya Sharma",
    detail: "Wedding · New York, NY · 320 guests",
    avatar: "P",
    vendorCard: false,
  },
  {
    text: "\"Planning from Dallas, wedding in New Jersey — it was seamless. Vendors responded quickly, quotes were detailed, and everything went perfectly on the day.\"",
    name: "Rahul Patel",
    detail: "Engagement · New Jersey · 150 guests",
    avatar: "R",
    vendorCard: false,
  },
  {
    text: "\"Sceptical about an algorithm — but it nailed it. The caterer understood all our dietary requirements without us having to explain ourselves twice.\"",
    name: "Anita Mehta",
    detail: "Birthday · Chicago, IL · 80 guests",
    avatar: "A",
    vendorCard: false,
  },
  {
    text: "\"I used to miss leads because I wasn't always checking my phone. Now I get a notification the moment a matching event comes in — I've taken 3 new bookings this month I would have missed.\"",
    name: "Kiran Reddy",
    detail: "Caterer · Houston, TX · 200+ events served",
    avatar: "K",
    vendorCard: true,
  },
];

const SERVICE_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=200&fit=crop&auto=format",
    alt: "Catering",
    name: "Catering",
    count: "240+ vendors · US",
    slug: "catering",
  },
  {
    img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop&auto=format",
    alt: "Décor & Floral",
    name: "Décor & Floral",
    count: "180+ vendors · US",
    slug: "decorator",
  },
  {
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=200&fit=crop&auto=format",
    alt: "Photography",
    name: "Photography",
    count: "320+ vendors · US",
    slug: "photographer",
  },
  {
    img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=200&fit=crop&auto=format",
    alt: "Mehendi",
    name: "Mehendi",
    count: "90+ vendors · US",
    slug: "mehendi-artist",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Nav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 25%, rgba(232,85,16,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 45% at 85% 70%, rgba(232,85,16,0.04) 0%, transparent 50%),
            radial-gradient(circle at 1px 1px, rgba(180,120,70,0.12) 1px, transparent 0)
          `,
          backgroundSize: "100% 100%, 100% 100%, 28px 28px",
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-24 sm:pt-28 sm:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 bg-cream/80 backdrop-blur border border-brand-border rounded-full px-5 py-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Find · Compare · Book
            </div>
            <p className="font-script text-4xl sm:text-5xl text-text-4/60 leading-none mb-1">Your celebration,</p>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-text-1 leading-[0.92] tracking-tight mb-6">
              Perfectly<br /><em className="not-italic text-brand">planned.</em>
            </h1>
            <p className="text-lg text-text-3 leading-relaxed mb-10 max-w-md">
              Every vendor your event needs — matched, compared, and priced side by side. Get competing quotes, pick the best value, never overpay.
            </p>
            <Link href="/for-vendors" className="text-sm font-semibold text-text-3 underline underline-offset-4 decoration-brand-border hover:decoration-brand hover:text-text-2 transition-colors block mb-10">
              Are you a vendor? List free →
            </Link>
            <div className="flex flex-wrap gap-6 text-sm text-text-3">
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> No booking fees</span>
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> 100% verified</span>
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> Plan from anywhere</span>
            </div>
          </div>
          <HeroSearch />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-cream/60 backdrop-blur border-b border-brand-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-12 px-6 py-5 text-sm text-text-3">
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">26+</strong> service categories</span>
          <span className="w-px bg-brand-border hidden sm:block" />
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">100%</strong> compliance-verified</span>
          <span className="w-px bg-brand-border hidden sm:block" />
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">Free</strong> — right now</span>
        </div>
      </div>

      {/* ── EVENT TYPES ── */}
      <section className="bg-white py-20 px-6 border-b border-brand-border">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-4 mb-6 block">Every celebration, every occasion</span>
          <div className="flex flex-wrap justify-center gap-3">
            {EVENT_TYPES.map(({ emoji, label }) => (
              <Link key={label} href="/register/customer" className="group block">
                <div className="flex flex-col items-center gap-2.5 bg-cream border border-brand-border rounded-2xl px-6 py-5 min-w-[120px] group-hover:border-brand/30 group-hover:shadow-lg group-hover:shadow-brand/5 group-hover:-translate-y-1 transition-all duration-200">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                  <span className="text-sm font-bold text-text-2">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">How it works</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Plan in 4 simple steps</h2>
          <p className="text-text-3 text-base mb-16 max-w-lg mx-auto">From anywhere in the world to fully booked — without cold calls or juggling 10 tabs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {[
              { n: "1", emoji: "🌍", title: "Tell us about your event", desc: "City, event type, date, guest count and dietary preferences. Under 2 minutes." },
              { n: "2", emoji: "✨", title: "Get smart-matched", desc: "Our algorithm ranks every vendor in your city against your specific event." },
              { n: "3", emoji: "💬", title: "Compare & negotiate", desc: "Receive detailed quotes with menus. Compare side by side, message vendors, negotiate the best deal." },
              { n: "4", emoji: "🤝", title: "Confirm your team", desc: "Accept quotes, manage guests and RSVPs — track everything in one place." },
            ].map(({ n, emoji, title, desc }) => (
              <div key={n} className="relative bg-cream border border-brand-border rounded-2xl p-7 text-left group hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute -top-3.5 left-6 w-7 h-7 rounded-full bg-brand text-white text-xs font-extrabold tracking-tight flex items-center justify-center shadow-md shadow-brand/20">{n}</div>
                <span className="text-4xl block mb-4 mt-2 group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                <h3 className="font-extrabold tracking-tight text-text-1 mb-2 text-[15px] group-hover:text-brand transition-colors duration-200">{title}</h3>
                <p className="text-sm text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Link href="/register/customer" className="inline-block bg-brand text-white text-sm font-extrabold tracking-tight px-10 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
            Start planning free →
          </Link>
        </div>
      </section>

      {/* ── VENDOR CARDS ── */}
      <section className="bg-cream py-24 px-6 border-t border-brand-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">Featured vendors</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Top-matched vendors this week</h2>
          <p className="text-text-3 text-base mb-12 max-w-lg mx-auto">Ranked by your city, event type, dietary needs and availability.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VENDOR_CARDS.map(({ img, alt, badge, category, name, meta, stars, match }) => (
              <div key={name} className="bg-white border border-brand-border rounded-2xl overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 cursor-pointer text-left">
                <div className="relative h-40 overflow-hidden">
                  <Image src={img} alt={alt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  {badge && (
                    <div className="absolute top-3 left-3 bg-brand text-white text-[9px] font-extrabold tracking-tight px-3 py-1 rounded-full tracking-wider uppercase shadow-md">{badge}</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-extrabold tracking-tight uppercase tracking-[0.15em] text-text-4 mb-1.5">{category}</div>
                  <div className="text-[15px] font-extrabold tracking-tight text-text-1 mb-0.5">{name}</div>
                  <div className="text-xs text-text-4 mb-4">{meta}</div>
                  <div className="flex items-center justify-between pt-3 border-t border-brand-border/60">
                    <span className="text-xs font-bold text-text-2">{stars}</span>
                    <span className="text-[10px] font-extrabold tracking-tight text-brand bg-brand/5 border border-brand/15 px-2.5 py-1 rounded-full">{match}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE & SAVE ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">Compare & Save</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight leading-[1.05] mb-5">Small gathering or big.<br />Always the best value.</h2>
            <p className="text-base text-text-3 leading-relaxed mb-8">20 guests or 500 — send your requirements once and multiple vendors compete for your event. Compare prices, menus and ratings side by side.</p>
            <div className="flex flex-col gap-4 mb-10">
              {[
                ["💬", "Multiple vendors quote on your event simultaneously"],
                ["⚖️", "Compare prices, menus, and ratings side by side"],
                ["🤝", "Message vendors directly — negotiate the best deal"],
                ["✅", "Select your vendor with one click, all confirmed"],
                ["🔒", "No middlemen, no hidden charges — always free to use"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-4 text-[15px] text-text-2">
                  <div className="w-9 h-9 rounded-xl bg-cream border border-brand-border flex items-center justify-center text-base flex-shrink-0">{icon}</div>
                  {text}
                </div>
              ))}
            </div>
            <Link href="/register/customer" className="inline-block bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
              Get quotes for my event →
            </Link>
          </div>

          {/* Quote comparison mockup */}
          <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
            <div className="bg-cream border-b border-brand-border px-6 py-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold tracking-tight text-text-1">Catering quotes for your event</div>
                <div className="text-xs text-text-4 mt-0.5">New York, NY · 80 guests · Vegetarian · 12 Oct 2025</div>
              </div>
              <div className="text-[11px] font-bold text-text-4 bg-white border border-brand-border rounded-full px-3 py-1">3 quotes</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Best value row */}
              <div className="relative bg-white border-2 border-brand rounded-2xl px-5 py-4" style={{ boxShadow: "0 0 0 4px rgba(232,85,16,0.06)" }}>
                <div className="absolute -top-2.5 left-5 bg-brand text-white text-[9px] font-extrabold tracking-tight px-2.5 py-0.5 rounded-full uppercase tracking-wider">Best Value</div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=60&h=60&fit=crop" alt="Spice Garden" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold tracking-tight text-text-1">Spice Garden New York</div>
                      <div className="text-[11px] text-text-4">Halal · 6 cuisines · 98% match</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-text-3">★ 4.9 · 86</div>
                    <div className="text-lg font-extrabold tracking-tight text-text-1">$28<span className="text-xs font-normal text-text-4">/head</span></div>
                  </div>
                  <button className="bg-brand text-white text-xs font-extrabold tracking-tight px-4 py-2 rounded-xl flex-shrink-0 shadow-md shadow-brand/20">Select →</button>
                </div>
              </div>
              {[
                { emoji: "🍛", name: "Royal Feast Caterers", meta: "Halal · 4 cuisines · 91% match", stars: "★ 4.7 · 52", price: "$34" },
                { emoji: "🍽", name: "Tandoori Nights", meta: "Halal · 3 cuisines · 87% match", stars: "★ 4.6 · 38", price: "$31" },
              ].map(({ emoji, name, meta, stars, price }) => (
                <div key={name} className="bg-white border border-brand-border rounded-2xl px-5 py-4 flex items-center justify-between gap-3 hover:border-brand/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cream border border-brand-border flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                    <div>
                      <div className="text-sm font-bold text-text-1">{name}</div>
                      <div className="text-[11px] text-text-4">{meta}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-text-3">{stars}</div>
                    <div className="text-lg font-extrabold tracking-tight text-text-1">{price}<span className="text-xs font-normal text-text-4">/head</span></div>
                  </div>
                  <button className="bg-cream border border-brand-border text-text-2 text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0 hover:bg-cream-2 transition-colors">View</button>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-brand-border bg-cream/60 text-sm text-text-3">
              Choosing <strong className="text-text-1 mx-1">Spice Garden</strong> saves you <span className="font-extrabold tracking-tight text-green-600">$1,680</span> vs. the highest quote for 280 guests
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative bg-cream py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="font-script text-4xl sm:text-5xl text-text-4/50 leading-none mb-1">Built for every celebration.</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight leading-[1.05] mb-5">Smart matching.<br />Real results.</h2>
            <p className="text-base text-text-3 leading-relaxed mb-10">Every vendor verified. Every match scored against your event. Free for customers and vendors to get started — no commissions, no hidden charges.</p>
            <Link href="/#how-it-works" className="inline-block bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
              See how it works →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "26+", label: "Service categories", accent: true },
              { n: "500+", label: "Events planned", accent: false },
              { n: "100%", label: "Verified vendors", accent: false },
              { n: "Free", label: "Right now", accent: false },
            ].map(({ n, label, accent }) => (
              <div key={label} className="bg-white border border-brand-border rounded-2xl p-8 hover:shadow-md hover:-translate-y-0.5 hover:shadow-black/5 transition-all duration-200">
                <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-none mb-2 ${accent ? "text-brand" : "text-text-1"}`}>{n}</div>
                <div className="text-sm text-text-3">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section className="bg-white py-24 px-6 border-t border-brand-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">Why OneSeva</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Everything in one place</h2>
          <p className="text-text-3 text-base mb-16 max-w-lg mx-auto">No more cold calls, no more juggling spreadsheets. One platform for your entire celebration.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-cream border border-brand-border rounded-2xl p-7 text-left group hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-200">{icon}</span>
                <div className="font-extrabold tracking-tight text-text-1 mb-2 text-[15px] group-hover:text-brand transition-colors duration-200">{title}</div>
                <p className="text-sm text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO PATHS ── */}
      <section className="border-t border-brand-border">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Customer */}
          <div className="bg-white border-r border-brand-border px-8 sm:px-14 py-20">
            <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">Planning an event?</span>
            <h3 className="text-3xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Your full celebration platform</h3>
            <p className="text-base text-text-3 leading-relaxed mb-8">From vendor matching to guest RSVPs — manage everything in one place, wherever you are.</p>
            <div className="flex flex-col gap-3.5 mb-10">
              {[
                ["🗓", "Multi-event planning", "Mehendi, Sangeet, Haldi, Reception — all managed in one place"],
                ["✨", "Smart vendor matching", "ranked by dietary needs, budget & city"],
                ["💬", "Compare quotes", "menus and packages side by side"],
                ["👥", "Guest & RSVP management", "track responses and dietary requirements"],
                ["✅", "Event task tracker", "know exactly what's done, what's pending, what's next"],
                ["👨‍👩‍👧", "Collaborate with family", "invite up to 10 people to plan together in real time"],
                ["🎩", "Need a coordinator?", "hand it all over to a OneSeva-certified event coordinator"],
                ["🌍", "Plan from anywhere", "diaspora-first, wherever you celebrate"],
              ].map(([icon, bold, rest]) => (
                <div key={bold} className="flex items-start gap-3.5 text-[15px] text-text-3">
                  <div className="w-6 h-6 rounded-lg bg-cream border border-brand-border flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{icon}</div>
                  <span><strong className="font-bold text-text-2">{bold}</strong> — {rest}</span>
                </div>
              ))}
            </div>
            <Link href="/register/customer" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
              Start planning free →
            </Link>
          </div>

          {/* Vendor */}
          <div className="px-8 sm:px-14 py-20" style={{ background: "linear-gradient(165deg, #1e0f07, #2a1810)" }}>
            <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase block mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Running a business?</span>
            <h3 className="text-3xl font-extrabold tracking-tight text-white tracking-tight mb-4">More leads. Zero missed orders.</h3>
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Events matching your specialty come to you. You decide what to quote, when to respond, and what you take on.</p>
            <div className="flex flex-col gap-3.5 mb-10">
              {[
                ["📥", "More leads, better quality", "customers whose event fits your cuisine, capacity & city"],
                ["🔔", "Never miss an order", "instant push, email & WhatsApp alerts the moment a match comes in"],
                ["🎛", "Orders on your terms", "accept, decline, or counter-quote. You set your calendar and availability"],
                ["💬", "Negotiate directly", "chat with customers, refine your offer, close the deal"],
                ["⭐", "Build your reputation", "verified reviews after every event grow your profile automatically"],
              ].map(([icon, bold, rest]) => (
                <div key={bold} className="flex items-start gap-3.5 text-[15px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>{icon}</div>
                  <span><strong className="font-bold text-white">{bold}</strong> — {rest}</span>
                </div>
              ))}
            </div>
            <Link href="/for-vendors" className="inline-flex items-center gap-2 text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl transition-all duration-200" style={{ background: "#e85510", color: "#fff", boxShadow: "0 4px 20px rgba(232,85,16,0.4)" }}>
              List my business free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-cream py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-text-3 mb-4 block">Real stories</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Trusted by families across the US</h2>
          <p className="text-text-3 text-base mb-14 max-w-lg mx-auto">From first match to a celebration that went perfectly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(({ text, name, detail, avatar, vendorCard }) => (
              <div
                key={name}
                className={`bg-white rounded-2xl p-7 text-left relative transition-all duration-200 hover:shadow-lg hover:shadow-black/5 ${vendorCard ? "border-2 border-brand/20" : "border border-brand-border"}`}
              >
                {vendorCard && (
                  <div className="absolute -top-2.5 left-6 bg-brand text-white px-2.5 py-0.5 text-[9px] font-extrabold tracking-tight uppercase tracking-wider rounded-full">Vendor</div>
                )}
                <div className="text-brand text-sm mb-4 tracking-wider">★★★★★</div>
                <p className="text-sm text-text-2 leading-relaxed mb-6">{text}</p>
                <div className="flex items-center gap-3 pt-5 border-t border-brand-border/60">
                  <div
                    className="w-10 h-10 rounded-full text-sm font-extrabold tracking-tight flex items-center justify-center flex-shrink-0"
                    style={{ background: vendorCard ? "#e85510" : "#f2ebe3", color: vendorCard ? "#fff" : "#3d1f10" }}
                  >{avatar}</div>
                  <div>
                    <div className="text-sm font-extrabold tracking-tight text-text-1">{name}</div>
                    <div className="text-xs text-text-4 mt-0.5">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-white py-24 px-6 border-t border-brand-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <p className="font-script text-4xl sm:text-5xl text-text-4/50 leading-none mb-1">26+ services.</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight leading-[1.05] mb-5">Every vendor.<br />Any city.</h2>
            <p className="text-base text-text-3 leading-relaxed mb-8">Catering, decor, photography, DJ, mehendi, dhol, pandit and 20+ more — all matched to your event in minutes.</p>
            <div className="flex flex-wrap gap-2.5 mb-10">
              {["🍽 Catering","🌸 Decor","📷 Photography","🎵 DJ","🙏 Pandit","🥁 Dhol","💄 Makeup","🌿 Mehendi","🎂 Cake"].map((cat) => (
                <span key={cat} className="bg-cream border border-brand-border text-text-2 text-sm font-medium px-4 py-2 rounded-full hover:border-brand/20 transition-colors cursor-pointer">{cat}</span>
              ))}
              <span className="bg-brand/5 border border-brand/15 text-brand text-sm font-bold px-4 py-2 rounded-full cursor-pointer hover:bg-brand/10 transition-colors">+17 more →</span>
            </div>
            <Link href="/#categories" className="inline-block bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
              Browse all categories →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SERVICE_CARDS.map(({ img, alt, name, count, slug }) => (
              <Link key={name} href={`/vendors/${slug}/new-york`} className="block bg-white border border-brand-border rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
                <div className="relative h-36 overflow-hidden">
                  <Image src={img} alt={alt} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="text-[15px] font-extrabold tracking-tight text-text-1 mb-0.5">{name}</div>
                  <div className="text-xs text-text-4">{count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative bg-white py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream/50 to-transparent" />
        <div className="relative">
          <p className="font-script text-4xl sm:text-5xl text-text-4/50 leading-none mb-1">Your celebration, perfectly handled.</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-5 mt-2">Start planning your<br />celebration today.</h2>
          <p className="text-text-3 text-base mb-10 max-w-md mx-auto">Planning a celebration or running an event business? OneSeva is built for both.</p>
          <div className="flex gap-4 justify-center flex-wrap mb-5">
            <Link href="/register/customer" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-extrabold tracking-tight px-10 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-xl hover:shadow-brand/25" style={{ boxShadow: "0 6px 24px rgba(232,85,16,0.3)" }}>
              Plan my event →
            </Link>
            <Link href="/for-vendors" className="inline-flex items-center gap-2 bg-white text-text-1 text-sm font-extrabold tracking-tight px-10 py-4 rounded-xl border-2 border-brand-border hover:border-brand/30 hover:shadow-lg transition-all duration-200">
              List my business →
            </Link>
          </div>
          <p className="text-sm text-text-4">100% free to get started · No booking fees · No commission</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
