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

/** Inline SVG verified badge */
function VerifiedBadge() {
  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 32px rgba(232,85,16,0.15))" }}
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
      <circle cx="110" cy="110" r="105" fill="#1e0f07" />
      <circle cx="110" cy="110" r="76" fill="white" />
      <text fontFamily="Inter,system-ui,sans-serif" fontSize="10.5" fontWeight="800" fill="rgba(255,255,255,0.9)" letterSpacing="1.5" wordSpacing="10">
        <textPath href="#ringText" startOffset="0%" textLength="552" lengthAdjust="spacingAndGlyphs">
          ONESEVA ✦ VERIFIED ✦ ONESEVA ✦ VERIFIED ✦ ONESEVA ✦ VERIFIED ✦
        </textPath>
      </text>
      <path d="M110 65 L84 75 L84 99 C84 116 95 129 110 134 C125 129 136 116 136 99 L136 75 Z" fill="url(#shieldGrad)" />
      <path d="M110 65 L84 75 L84 99 C84 116 95 129 110 134 C125 129 136 116 136 99 L136 75 Z" fill="url(#shieldShine)" />
      <path d="M84 75 L84 99 C84 116 95 129 110 134" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M136 75 L136 99 C136 116 125 129 110 134" stroke="rgba(0,40,80,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="110" y1="65" x2="110" y2="134" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <text x="110" y="152" fontFamily="Inter,system-ui,sans-serif" fontSize="10.5" fontWeight="900" fill="#1e0f07" textAnchor="middle" letterSpacing="2.5">ONESEVA</text>
      <circle cx="110" cy="160" r="2.5" fill="#e85510" />
      <circle cx="168" cy="163" r="17" fill="#16a34a" stroke="white" strokeWidth="3" />
      <path d="M161 163 L166 169 L176 156" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ForVendorsPage() {
  return (
    <main className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Nav vendorPage />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 60% 50% at 10% 30%, rgba(232,85,16,0.04) 0%, transparent 60%),
            radial-gradient(circle at 1px 1px, rgba(160,130,100,0.08) 1px, transparent 0)
          `,
          backgroundSize: "100% 100%, 28px 28px",
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-24 sm:pt-28 sm:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 bg-cream/80 backdrop-blur border border-brand-border rounded-full px-5 py-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              For vendors
            </div>
            <p className="font-script text-3xl sm:text-4xl text-text-4/50 leading-none mb-1">Grow your business,</p>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-text-1 leading-[0.92] tracking-tight mb-6">
              More Leads.<br /><em className="not-italic text-brand">Better</em> Clients.
            </h1>
            <p className="text-lg text-text-3 leading-relaxed mb-10 max-w-md">
              Get matched to events that fit your specialty — cuisine, capacity, city. Quote, negotiate, and close — all on platform. Free to list.
            </p>
            <div className="flex gap-4 flex-wrap mb-10">
              <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
                List my business free →
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 text-sm font-bold text-text-2 border-2 border-brand-border px-6 py-4 rounded-xl hover:border-brand/20 hover:bg-cream transition-all duration-200">
                See how it works ↓
              </a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-text-3">
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> No commission</span>
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> 100% verified events</span>
              <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 text-[10px] font-extrabold tracking-tight flex items-center justify-center">✓</span> Push & WhatsApp alerts</span>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-white border border-brand-border rounded-3xl shadow-2xl shadow-black/8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5" style={{ background: "linear-gradient(165deg, #1e0f07, #2a1810)" }}>
              <div>
                <div className="text-white font-extrabold tracking-tight text-sm">Your leads this week</div>
                <div className="text-white/40 text-xs mt-0.5">3 new matches · Updated just now</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-extrabold tracking-tight shadow-md shadow-brand/30">K</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { badge: true, emoji: "💍", type: "Wedding", meta: "280 guests · New York, NY\nSep 2025 · Full catering", match: "98% match" },
                { badge: false, emoji: "🎂", type: "Birthday", meta: "80 guests · New Jersey\nOct 2025 · Buffet + desserts", match: "91% match" },
                { badge: false, emoji: "💼", type: "Corporate", meta: "50 guests · Chicago, IL\nNov 2025 · Box lunches", match: "87% match" },
              ].map(({ badge, emoji, type, meta, match }) => (
                <div key={type} className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 border transition-all duration-200 hover:shadow-md ${badge ? "border-blue-200 bg-blue-50/50" : "border-brand-border bg-cream/50"}`}>
                  <div>
                    {badge && <div className="inline-block bg-blue-600 text-white text-[9px] font-extrabold tracking-tight px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider">New</div>}
                    <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-text-1 text-sm">{emoji} {type}</div>
                    <div className="text-[11px] text-text-4 mt-0.5 whitespace-pre-line">{meta}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] font-extrabold tracking-tight text-brand bg-brand/5 border border-brand/15 px-2.5 py-0.5 rounded-full">{match}</span>
                    <button className="text-[11px] font-extrabold tracking-tight text-white bg-text-1 px-4 py-1.5 rounded-xl shadow-sm">Quote →</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 px-6 py-4 border-t border-brand-border bg-cream/50">
              {[["12", "QUOTES SENT"], ["8", "BOOKINGS"], ["4.9★", "RATING"]].map(([n, l]) => (
                <div key={l}><div className="text-lg font-extrabold tracking-tight text-text-1">{n}</div><div className="text-[9px] font-extrabold tracking-tight text-text-4 uppercase tracking-wider">{l}</div></div>
              ))}
              <div className="ml-auto text-xs text-text-4 self-center">This month</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-cream/60 backdrop-blur border-b border-brand-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-12 px-6 py-5 text-sm text-text-3">
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">500+</strong> vendors listed</span>
          <span className="w-px bg-brand-border hidden sm:block" />
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">26+</strong> event categories</span>
          <span className="w-px bg-brand-border hidden sm:block" />
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">US-based</strong> & growing</span>
          <span className="w-px bg-brand-border hidden sm:block" />
          <span><strong className="text-text-1 font-extrabold tracking-tight text-lg">Free</strong> to start</span>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-cream py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 mb-4 block">How it works for vendors</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Go from listed to booked in 4 steps</h2>
          <p className="text-text-3 text-base mb-16">No cold outreach. No missed leads. Every match comes to you automatically.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, emoji, title, desc }) => (
              <div key={step} className="relative bg-white border border-brand-border rounded-2xl p-7 text-left group hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all duration-200">
                <div className="absolute -top-3.5 left-6 w-7 h-7 rounded-full bg-brand text-white text-xs font-extrabold tracking-tight flex items-center justify-center shadow-md shadow-brand/20">{step}</div>
                <span className="text-3xl block mb-3 mt-2">{emoji}</span>
                <div className="font-extrabold tracking-tight text-text-1 mb-1.5 text-[15px]">{title}</div>
                <p className="text-sm text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 mb-4 block">Why vendors choose OneSeva</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Everything you need to grow</h2>
          <p className="text-text-3 text-base mb-16">Built by vendors, for vendors. Every feature is designed to help you close more events, faster.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-cream border border-brand-border rounded-2xl p-7 text-left group hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all duration-200">
                <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-200">{icon}</span>
                <div className="font-extrabold tracking-tight text-text-1 mb-2 text-[15px]">{title}</div>
                <p className="text-sm text-text-3 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERIFIED BADGE ── */}
      <section id="verified" className="bg-cream py-24 px-6 border-t border-brand-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 mb-4 block">Trust & compliance</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-5">The OneSeva<br />Verified Badge</h2>
            <p className="text-base text-text-3 leading-relaxed mb-8">
              Customers only see verified vendors. To earn the badge, we check your business licence, insurance, and for food vendors — health inspection and food safety certifications. It takes 2–3 business days.
            </p>
            <div className="flex flex-col gap-3.5 mb-10">
              {VERIFICATION_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3.5 text-[15px] text-text-2">
                  <div className="w-6 h-6 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center text-green-700 text-[10px] font-extrabold tracking-tight flex-shrink-0 mt-0.5">✓</div>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-extrabold tracking-tight px-8 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200 hover:shadow-lg hover:shadow-brand/25" style={{ boxShadow: "0 4px 20px rgba(232,85,16,0.25)" }}>
              Apply for verification →
            </Link>
          </div>
          <div className="flex flex-col items-center gap-8">
            <VerifiedBadge />
            <div className="flex gap-4">
              {[["2–3", "Business days"], ["3×", "More lead views"], ["Free", "To apply"]].map(([n, l]) => (
                <div key={l} className="bg-white border border-brand-border rounded-2xl px-6 py-4 text-center hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
                  <div className="text-2xl font-extrabold tracking-tight text-text-1">{n}</div>
                  <div className="text-xs text-text-4 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 mb-4 block">Vendor stories</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-14">Trusted by vendors across the US</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {TESTIMONIALS.map(({ text, name, detail, avatar }) => (
              <div key={name} className="bg-cream border border-brand-border rounded-2xl p-7 text-left hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
                <div className="text-brand text-sm mb-4 tracking-wider">★★★★★</div>
                <p className="text-sm text-text-2 leading-relaxed mb-6">{text}</p>
                <div className="flex items-center gap-3 pt-5 border-t border-brand-border/60">
                  <div className="w-10 h-10 rounded-full bg-brand text-white text-sm font-extrabold tracking-tight flex items-center justify-center flex-shrink-0 shadow-md shadow-brand/20">{avatar}</div>
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

      {/* ── FAQ ── */}
      <section className="bg-cream py-24 px-6 border-t border-brand-border">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-extrabold tracking-tight tracking-[0.2em] uppercase text-text-3 mb-4 block">Questions & answers</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-1 tracking-tight mb-4">Frequently asked questions</h2>
          <p className="text-text-3 text-base mb-14">Everything you need to know before listing your business.</p>
          <VendorFaq />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 text-center text-white" style={{ background: "linear-gradient(165deg, #1e0f07, #2a1810)" }}>
        <p className="font-script text-3xl sm:text-4xl text-white/40 mb-2">Ready to grow your business?</p>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight tracking-tight mb-5">
          List free. Get matched.<br />
          <em className="not-italic text-brand">Start growing.</em>
        </h2>
        <p className="text-white/45 text-base mb-10 max-w-sm mx-auto">Join 500+ vendors already growing their business on OneSeva.</p>
        <Link href="/register/vendor" className="inline-flex items-center gap-2 bg-brand text-white text-sm font-extrabold tracking-tight px-10 py-4 rounded-xl hover:bg-brand-hover transition-all duration-200" style={{ boxShadow: "0 4px 24px rgba(232,85,16,0.4)" }}>
          Create my vendor profile →
        </Link>
      </section>

      <Footer />
    </main>
  );
}
