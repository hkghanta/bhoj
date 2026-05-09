// src/components/landing/HeroSearch.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CityInput } from "@/components/ui/CityInput";

const EVENT_TYPES = [
  "Wedding", "Birthday", "Graduation", "Corporate", "Mehendi",
  "Engagement", "Arangetram", "Baby Shower", "Anniversary", "House Warming",
];

const DIETARY = [
  "No preference", "Halal", "Vegetarian", "Vegan",
  "Halal · Vegetarian", "Jain", "Gluten-free",
];

export default function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [eventType, setEventType] = useState("Birthday");
  const [guests, setGuests] = useState("60");
  const [dietary, setDietary] = useState("No preference");
  const [eventDate, setEventDate] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      event: eventType,
      guests,
      dietary: dietary === "No preference" ? "" : dietary,
      city,
      date: eventDate,
    });
    router.push(`/register/customer?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="bg-cream border border-brand-border rounded-2xl p-7 shadow-md flex flex-col gap-3"
    >
      <div className="text-base font-extrabold tracking-tight text-text-1 mb-1">Tell us about your event</div>

      {/* City */}
      <CityInput
        value={city}
        onChange={setCity}
        placeholder="City — e.g. New York, NY"
        className="bg-white dark:bg-cream-2 border border-brand-border rounded-xl px-4 py-3"
      />

      {/* Event type + guests */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-lg">🎉</span>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="text-sm font-medium text-text-2 bg-transparent outline-none cursor-pointer"
        >
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-brand-border mx-1">·</span>
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="text-sm font-medium text-text-2 bg-transparent outline-none cursor-pointer"
        >
          {["10","25","50","60","100","150","200","300","500"].map((n) => (
            <option key={n} value={n}>{n} guests</option>
          ))}
        </select>
      </div>

      {/* Dietary */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-lg">🥗</span>
        <select
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          className="flex-1 text-sm font-medium text-text-2 bg-transparent outline-none cursor-pointer"
        >
          {DIETARY.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Date */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-lg">📅</span>
        <input
          type="month"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          placeholder="Event month"
          className="flex-1 text-sm font-medium text-text-2 bg-transparent outline-none placeholder:text-text-4"
        />
      </div>

      {/* CTA */}
      <button
        type="submit"
        className="mt-1 w-full bg-brand text-white text-sm font-extrabold tracking-tight py-4 rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
        style={{ boxShadow: "0 4px 16px rgba(232,85,16,0.28)" }}
      >
        Find vendors for my event →
      </button>

      <Link href="/for-vendors" className="text-center text-xs text-text-4 underline underline-offset-2 hover:text-text-3 transition-colors">
        Are you a vendor? List your business free →
      </Link>
    </form>
  );
}
