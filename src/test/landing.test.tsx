// src/test/landing.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);
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
    expect(screen.getAllByRole("combobox")[0]).toBeTruthy();
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
