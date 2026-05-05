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
