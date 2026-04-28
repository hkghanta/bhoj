import { describe, it, expect } from 'vitest'
import { scoreVendor } from '../../lib/matching/scorer'
import { DEFAULT_WEIGHTS } from '../../lib/matching/types'
import type { VendorForScoring, EventRequestForScoring } from '../../lib/matching/types'

const baseVendor: VendorForScoring = {
  id: 'v1',
  city: 'London',
  country: 'GB',
  vendor_type: 'CATERER',
  tier: 'PRO',
  is_verified: true,
  menu_packages: [{ price_per_head: 25, is_vegetarian: true, is_vegan: false, is_jain: false, is_halal: true }],
  metrics: { avg_rating: 4.5, avg_response_hrs: 3, booking_rate: 0.7, quote_rate: 0.85 },
  cuisine_tags: ['north indian', 'punjabi'],
}

const baseRequest: EventRequestForScoring = {
  id: 'er1',
  event_id: 'e1',
  vendor_type: 'CATERER',
  event: {
    city: 'London',
    country: 'GB',
    event_date: new Date('2027-06-15'),
    guest_count: 150,
    total_budget: 6000,
    currency: 'GBP',
  },
  menu_preference: {
    cuisine_preferences: ['north indian'],
    is_vegetarian: true,
    is_vegan: false,
    is_jain: false,
    is_halal: false,
  },
}

describe('scoreVendor', () => {
  it('returns null for wrong vendor type', () => {
    const vendor = { ...baseVendor, vendor_type: 'DECORATOR' as const }
    expect(scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())).toBeNull()
  })

  it('returns null if vendor is unavailable on event date', () => {
    const unavailable = new Set(['2027-06-15'])
    expect(scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, unavailable)).toBeNull()
  })

  it('gives full location score for exact city match', () => {
    const result = scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result).not.toBeNull()
    expect(result!.location).toBe(DEFAULT_WEIGHTS.location)
  })

  it('gives partial location score for same country, different city', () => {
    const vendor = { ...baseVendor, city: 'Manchester' }
    const result = scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result).not.toBeNull()
    expect(result!.location).toBe(Math.round(DEFAULT_WEIGHTS.location * 0.4))
  })

  it('gives zero location score for different country', () => {
    const vendor = { ...baseVendor, city: 'Toronto', country: 'CA' }
    const result = scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result).not.toBeNull()
    expect(result!.location).toBe(0)
  })

  it('gives full dietary score when package satisfies requirements', () => {
    const result = scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.dietary).toBe(DEFAULT_WEIGHTS.dietary)
  })

  it('gives reduced dietary score when package cannot meet requirements', () => {
    const vendor: VendorForScoring = {
      ...baseVendor,
      menu_packages: [{ price_per_head: 25, is_vegetarian: false, is_vegan: false, is_jain: false, is_halal: false }],
    }
    const result = scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.dietary).toBeLessThan(DEFAULT_WEIGHTS.dietary)
  })

  it('gives PRO tier_boost less than PREMIUM', () => {
    const premiumVendor = { ...baseVendor, tier: 'PREMIUM' as const }
    const proResult = scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    const premiumResult = scoreVendor(premiumVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(premiumResult!.tier_boost).toBeGreaterThan(proResult!.tier_boost)
  })

  it('gives full response_rate for avg_response_hrs <= 2', () => {
    const vendor = { ...baseVendor, metrics: { ...baseVendor.metrics!, avg_response_hrs: 1 } }
    const result = scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.response_rate).toBe(DEFAULT_WEIGHTS.response_rate)
  })

  it('gives zero response_rate for avg_response_hrs > 48', () => {
    const vendor = { ...baseVendor, metrics: { ...baseVendor.metrics!, avg_response_hrs: 72 } }
    const result = scoreVendor(vendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.response_rate).toBe(0)
  })

  it('total score is sum of all components', () => {
    const result = scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.total).toBe(
      result!.location + result!.dietary + result!.tier_boost +
      result!.response_rate + result!.rating + result!.budget_fit
    )
  })

  it('total score does not exceed 100', () => {
    const result = scoreVendor(baseVendor, baseRequest, DEFAULT_WEIGHTS, new Set())
    expect(result!.total).toBeLessThanOrEqual(100)
  })
})
