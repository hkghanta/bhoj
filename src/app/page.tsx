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
  { icon: "🗓", title: "Multi-event support", desc: "Mehendi, Sangeet, Haldi, Reception — manage all your sub-events, vendors and guests in one unified dashboard." },
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

const PRESS_LOGOS = ["WedMeGood", "Bloomberg", "Business Insider", "Forbes India", "Inc. Magazine", "TechCrunch", "The Times", "Economic Times"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Nav />

      {/* ── HERO ── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 12% 30%, rgba(255,220,190,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 45% 40% at 88% 75%, rgba(255,210,175,0.35) 0%, transparent 55%),
            radial-gradient(circle at 1px 1px, rgba(180,120,70,0.18) 1px, transparent 0)
          `,
          backgroundSize: "100% 100%, 100% 100%, 28px 28px",
          borderBottom: "1px solid #e8ddd4",
        }}
      >
        <div className="max-w-6xl mx-auto px-12 py-24 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-widest uppercase text-text-3 bg-cream border border-brand-border rounded-full px-4 py-1.5 mb-6">
              Find · Compare · Book
            </div>
            <p className="font-script text-5xl text-text-4 leading-none mb-[-6px]">Your celebration,</p>
            <h1 className="text-6xl font-black text-text-1 leading-none tracking-tight uppercase mb-5">
              Perfectly <em className="not-italic text-brand">planned.</em>
            </h1>
            <p className="text-base text-text-3 leading-relaxed mb-8 max-w-sm">
              Every vendor your event needs — matched, compared, and priced side by side. Get competing quotes, pick the best value, never overpay.
            </p>
            <Link href="/for-vendors" className="text-sm font-semibold text-text-3 underline underline-offset-2 block mb-8">
              Are you a vendor? List free →
            </Link>
            <div className="flex flex-wrap gap-5 text-xs font-semibold text-text-3">
              <span className="flex items-center gap-1.5"><span className="font-black">✓</span> No booking fees</span>
              <span className="flex items-center gap-1.5"><span className="font-black">✓</span> 100% verified vendors</span>
              <span className="flex items-center gap-1.5"><span className="font-black">✓</span> Plan from anywhere</span>
            </div>
          </div>
          <HeroSearch />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-white border-b border-brand-border flex flex-wrap justify-center gap-8 px-6 py-4 text-sm text-text-3">
        <span><strong className="text-text-1 font-black text-base">26+</strong> service categories</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">100%</strong> compliance-verified vendors</span>
        <span className="w-px bg-brand-border hidden sm:block" />
        <span><strong className="text-text-1 font-black text-base">Free</strong> — right now</span>
      </div>

      {/* ── PRESS TICKER ── */}
      <div className="bg-cream border-b border-brand-border py-4 overflow-hidden">
        <div
          className="flex items-center gap-14 whitespace-nowrap"
          style={{
            animation: "scroll 34s linear infinite",
            width: "max-content",
          }}
        >
          {[...PRESS_LOGOS, ...PRESS_LOGOS].map((logo, i) => (
            <span key={i} className="text-sm font-black tracking-tight text-text-4">{logo}</span>
          ))}
        </div>
        <style>{`@keyframes scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* ── EVENT TYPES ── */}
      <section className="bg-white py-16 px-6 border-b border-brand-border text-center">
        <span className="text-xs font-bold tracking-widest uppercase text-text-4 mb-5 block">Every celebration, every occasion</span>
        <div className="flex flex-wrap justify-center gap-3">
          {EVENT_TYPES.map(({ emoji, label }) => (
            <Link key={label} href="/register/customer" className="block">
              <div className="flex flex-col items-center gap-2 bg-cream border border-brand-border rounded-2xl px-5 py-5 min-w-[110px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm font-semibold text-text-2">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">How it works</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Plan in 4 simple steps</h2>
          <p className="text-text-3 text-sm mb-12 max-w-lg mx-auto">From anywhere in the world to fully booked — without cold calls or juggling 10 tabs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { n: "1", emoji: "🌍", title: "Tell us about your event", desc: "City, event type, date, guest count and dietary preferences. Under 2 minutes." },
              { n: "2", emoji: "✨", title: "Get smart-matched", desc: "Our algorithm ranks every vendor in your city against your specific event." },
              { n: "3", emoji: "💬", title: "Compare & negotiate", desc: "Receive detailed quotes with menus. Compare side by side, message vendors, negotiate the best deal." },
              { n: "4", emoji: "🤝", title: "Confirm your team", desc: "Accept quotes, manage guests and RSVPs — track everything in one place." },
            ].map(({ n, emoji, title, desc }) => (
              <div key={n} className="bg-cream border border-brand-border rounded-2xl p-6 text-left">
                <div className="w-8 h-8 rounded-full bg-cream-2 border border-brand-border text-text-2 text-xs font-black flex items-center justify-center mb-4">{n}</div>
                <span className="text-4xl block mb-3">{emoji}</span>
                <h3 className="font-black text-text-1 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Link href="/register/customer" className="inline-block bg-brand text-white text-sm font-black px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 16px rgba(232,85,16,0.25)" }}>
            Start planning free →
          </Link>
        </div>
      </section>

      {/* ── VENDOR CARDS ── */}
      <section className="bg-white py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Featured vendors</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Top-matched vendors this week</h2>
          <p className="text-text-3 text-sm mb-10 max-w-lg mx-auto">Ranked by your city, event type, dietary needs and availability.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VENDOR_CARDS.map(({ img, alt, badge, category, name, meta, stars, match }) => (
              <div key={name} className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer text-left">
                <div className="relative h-36 overflow-hidden">
                  <Image src={img} alt={alt} fill className="object-cover" unoptimized />
                  {badge && (
                    <div className="absolute top-2.5 left-2.5 bg-text-1 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wide uppercase">{badge}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-3 mb-1">{category}</div>
                  <div className="text-sm font-black text-text-1 mb-0.5">{name}</div>
                  <div className="text-xs text-text-4 mb-3">{meta}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-2">{stars}</span>
                    <span className="text-[10px] font-black text-brand bg-cream border border-brand-border px-2 py-0.5 rounded-full">{match}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE & SAVE ── */}
      <section className="bg-cream py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Compare & Save</span>
            <h2 className="text-4xl font-black text-text-1 tracking-tight leading-tight mb-4">Small gathering or big.<br />Always get the best value.</h2>
            <p className="text-sm text-text-3 leading-relaxed mb-7">20 guests or 500 — send your requirements once and multiple vendors compete for your event. Compare prices, menus and ratings side by side. Pick the best fit, never overpay.</p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                ["💬", "Multiple vendors quote on your event simultaneously"],
                ["⚖️", "Compare prices, menus, and ratings side by side"],
                ["🤝", "Message vendors directly — negotiate the best deal"],
                ["✅", "Select your vendor with one click, all confirmed"],
                ["🔒", "No middlemen, no hidden charges — always free to use"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 text-sm text-text-2">
                  <div className="w-7 h-7 rounded-lg bg-cream-2 border border-brand-border flex items-center justify-center text-sm flex-shrink-0">{icon}</div>
                  {text}
                </div>
              ))}
            </div>
            <Link href="/register/customer" className="inline-block bg-brand text-white text-sm font-black px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 16px rgba(232,85,16,0.25)" }}>
              Get quotes for my event →
            </Link>
          </div>

          {/* Right — quote comparison UI */}
          <div className="bg-cream border border-brand-border rounded-2xl overflow-hidden">
            <div className="bg-white border-b border-brand-border px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-text-1">Catering quotes for your event</div>
                <div className="text-xs text-text-4">New York, NY · 80 guests · Vegetarian · 12 Oct 2025</div>
              </div>
              <div className="text-xs text-text-4">3 quotes received</div>
            </div>
            <div className="p-3 flex flex-col gap-2.5">
              {/* Best value row */}
              <div className="relative bg-white border-2 border-brand rounded-2xl px-4 py-3" style={{ boxShadow: "0 0 0 3px rgba(232,85,16,0.08)" }}>
                <div className="absolute -top-2.5 left-4 bg-brand text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Best Value</div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=60&h=60&fit=crop" alt="Spice Garden" width={36} height={36} className="object-cover w-full h-full" unoptimized />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-1">Spice Garden New York</div>
                      <div className="text-[10px] text-text-4">Halal · 6 cuisines · 98% match</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-text-2">★ 4.9 · 86</div>
                    <div className="text-base font-black text-text-1">$28<span className="text-[10px] font-normal text-text-4">/head</span></div>
                  </div>
                  <button className="bg-brand text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0">Select →</button>
                </div>
              </div>
              {/* Other rows */}
              {[
                { emoji: "🍛", name: "Royal Feast Caterers", meta: "Halal · 4 cuisines · 91% match", stars: "★ 4.7 · 52", price: "$34" },
                { emoji: "🍽", name: "Tandoori Nights", meta: "Halal · 3 cuisines · 87% match", stars: "★ 4.6 · 38", price: "$31" },
              ].map(({ emoji, name, meta, stars, price }) => (
                <div key={name} className="bg-white border border-brand-border rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-cream-2 border border-brand-border flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                    <div>
                      <div className="text-xs font-bold text-text-1">{name}</div>
                      <div className="text-[10px] text-text-4">{meta}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-text-2">{stars}</div>
                    <div className="text-base font-black text-text-1">{price}<span className="text-[10px] font-normal text-text-4">/head</span></div>
                  </div>
                  <button className="bg-cream border border-brand-border text-text-2 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">View</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-brand-border bg-cream-2 text-xs text-text-3">
              💡 Choosing <strong className="text-text-1 mx-1">Spice Garden</strong> saves you <span className="font-black text-green-600">$1,680</span> vs. the highest quote for 280 guests
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white py-20 px-6 border-t border-b border-brand-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-script text-4xl text-text-4 leading-none mb-[-4px]">Built for every celebration.</p>
            <h2 className="text-4xl font-black text-text-1 tracking-tight leading-tight mb-4">Smart matching.<br />Real results.</h2>
            <p className="text-sm text-text-3 leading-relaxed mb-8">Every vendor verified. Every match scored against your event. Free for customers and vendors to get started — no commissions, no hidden charges.</p>
            <Link href="/#how-it-works" className="inline-block bg-brand text-white text-sm font-black px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 16px rgba(232,85,16,0.25)" }}>
              See how it works →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {[
              { n: "26+", label: "Service categories", accent: true },
              { n: "500+", label: "Events planned", accent: false },
              { n: "100%", label: "Verified vendors", accent: false },
              { n: "Free", label: "Right now", accent: false },
            ].map(({ n, label, accent }) => (
              <div key={label} className="bg-cream border border-brand-border rounded-2xl p-6">
                <div className={`text-4xl font-black tracking-tight leading-none mb-1.5 ${accent ? "text-brand" : "text-text-1"}`}>{n}</div>
                <div className="text-xs text-text-3 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section className="bg-cream py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Why OneSeva</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Everything in one place</h2>
          <p className="text-text-3 text-sm mb-12 max-w-lg mx-auto">No more cold calls, no more juggling spreadsheets. One platform for your entire celebration.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERKS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-brand-border rounded-2xl p-6 text-left">
                <span className="text-3xl block mb-4">{icon}</span>
                <div className="font-black text-text-1 mb-2 text-sm">{title}</div>
                <p className="text-xs text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO PATHS ── */}
      <section className="border-t border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Customer */}
          <div className="bg-white border-r border-brand-border px-12 py-16">
            <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Planning an event?</span>
            <h3 className="text-2xl font-black text-text-1 tracking-tight mb-3">Your full celebration platform</h3>
            <p className="text-sm text-text-3 leading-relaxed mb-6">From vendor matching to guest RSVPs — manage everything in one place, wherever you are.</p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                ["🗓", "Multi-event planning", "Mehendi, Sangeet, Haldi, Reception together"],
                ["✨", "Smart vendor matching", "ranked by dietary needs, budget & city"],
                ["💬", "Compare quotes", "menus and packages side by side"],
                ["👥", "Guest & RSVP management", "track responses and dietary requirements"],
                ["✅", "Event task tracker", "know exactly what's done, what's pending, what's next"],
                ["👨‍👩‍👧", "Collaborate with family", "invite up to 10 people to plan together in real time"],
                ["🎩", "Need a coordinator?", "hand it all over to a OneSeva-certified event coordinator"],
                ["🌍", "Plan from anywhere", "diaspora-first, wherever you celebrate"],
              ].map(([icon, bold, rest]) => (
                <div key={bold} className="flex items-start gap-3 text-sm text-text-3">
                  <div className="w-5 h-5 rounded-md bg-cream border border-brand-border flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{icon}</div>
                  <span><strong className="font-bold text-text-2">{bold}</strong> — {rest}</span>
                </div>
              ))}
            </div>
            <Link href="/register/customer" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-black px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 14px rgba(232,85,16,0.25)" }}>
              Start planning free →
            </Link>
          </div>

          {/* Vendor */}
          <div className="px-12 py-16" style={{ background: "#1e0f07" }}>
            <span className="text-xs font-bold tracking-widest uppercase block mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Running a business?</span>
            <h3 className="text-2xl font-black text-white tracking-tight mb-3">More leads. Zero missed orders. You&apos;re always in control.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Events matching your specialty come to you. You decide what to quote, when to respond, and what you take on.</p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                ["📥", "More leads, better quality", "customers whose event fits your cuisine, capacity & city"],
                ["🔔", "Never miss an order", "instant push, email & WhatsApp alerts the moment a match comes in"],
                ["🎛", "Orders on your terms", "accept, decline, or counter-quote. You set your calendar and availability"],
                ["💬", "Negotiate directly", "chat with customers, refine your offer, close the deal"],
                ["⭐", "Build your reputation", "verified reviews after every event grow your profile automatically"],
              ].map(([icon, bold, rest]) => (
                <div key={bold} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>{icon}</div>
                  <span><strong className="font-bold text-white">{bold}</strong> — {rest}</span>
                </div>
              ))}
            </div>
            <Link href="/for-vendors" className="inline-flex items-center gap-2 text-sm font-black px-6 py-3 rounded-xl transition-colors" style={{ background: "#e85510", color: "#fff", border: "2px solid #e85510" }}>
              List my business free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-text-3 mb-3 block">Real stories</span>
          <h2 className="text-4xl font-black text-text-1 tracking-tight mb-3">Trusted by families across the US & beyond</h2>
          <p className="text-text-3 text-sm mb-12 max-w-lg mx-auto">From first match to a celebration that went perfectly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map(({ text, name, detail, avatar, vendorCard }) => (
              <div
                key={name}
                className={`bg-cream border rounded-2xl p-6 text-left relative ${vendorCard ? "border-t-2" : "border-brand-border"}`}
                style={vendorCard ? { borderColor: "#e85510", borderTopWidth: "2px" } : undefined}
              >
                {vendorCard && (
                  <div className="absolute -top-2.5 left-5 bg-white px-1.5 text-[10px] font-bold uppercase tracking-wider text-brand">Vendor</div>
                )}
                <div className="text-text-2 text-sm mb-3">★★★★★</div>
                <p className="text-sm text-text-2 italic leading-relaxed mb-5">{text}</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full text-sm font-black flex items-center justify-center flex-shrink-0"
                    style={{ background: vendorCard ? "#e85510" : "#f2ebe3", color: vendorCard ? "#fff" : "#3d1f10", border: "1.5px solid #e8ddd4" }}
                  >{avatar}</div>
                  <div>
                    <div className="text-sm font-black text-text-1">{name}</div>
                    <div className="text-xs text-text-4 mt-0.5">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-cream py-20 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="font-script text-4xl text-text-4 leading-none mb-[-4px]">26+ services.</p>
            <h2 className="text-4xl font-black text-text-1 tracking-tight leading-tight mb-4">Every vendor.<br />Any city.</h2>
            <p className="text-sm text-text-3 leading-relaxed mb-6">Catering, décor, photography, DJ, mehendi, dhol, pandit and 20+ more — all matched to your event in minutes.</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {["🍽 Catering","🌸 Décor","📷 Photography","🎵 DJ","🙏 Pandit","🥁 Dhol","💄 Makeup","🌿 Mehendi","🎂 Cake"].map((cat) => (
                <span key={cat} className="bg-white border border-brand-border text-text-2 text-xs font-semibold px-3.5 py-1.5 rounded-full cursor-pointer">{cat}</span>
              ))}
              <span className="bg-white border border-brand-border text-brand text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer">+17 more →</span>
            </div>
            <Link href="/#categories" className="inline-block bg-brand text-white text-sm font-black px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 16px rgba(232,85,16,0.25)" }}>
              Browse all categories →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_CARDS.map(({ img, alt, name, count, slug }) => (
              <Link key={name} href={`/vendors/${slug}/london`} className="block bg-white border border-brand-border rounded-2xl overflow-hidden group cursor-pointer">
                <div className="relative h-32 overflow-hidden">
                  <Image src={img} alt={alt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                </div>
                <div className="p-4">
                  <div className="text-sm font-black text-text-1 mb-0.5">{name}</div>
                  <div className="text-xs text-text-4">{count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-white py-20 px-6 text-center border-t border-brand-border">
        <p className="font-script text-4xl text-text-4 leading-none mb-[-4px]">Your celebration, perfectly handled.</p>
        <h2 className="text-4xl font-black text-text-1 tracking-tight mb-4 mt-2">Start planning your<br />celebration today.</h2>
        <p className="text-text-3 text-sm mb-8 max-w-sm mx-auto">Planning a celebration or running an event business? OneSeva is built for both.</p>
        <div className="flex gap-3 justify-center flex-wrap mb-4">
          <Link href="/register/customer" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-black px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors" style={{ boxShadow: "0 4px 18px rgba(232,85,16,0.28)" }}>
            🎊 Plan my event →
          </Link>
          <Link href="/for-vendors" className="inline-flex items-center gap-2 bg-cream text-text-1 text-sm font-bold px-8 py-4 rounded-xl border border-brand-border hover:bg-cream-2 transition-colors">
            🍽 List my business →
          </Link>
        </div>
        <p className="text-xs text-text-4">100% free to get started · No booking fees · No commission</p>
      </section>

      <Footer />
    </main>
  );
}
