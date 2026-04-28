import { VendorType } from '@prisma/client'

export interface VendorForScoring {
  id: string
  city: string
  country: string
  vendor_type: VendorType
  tier: 'FREE' | 'PRO' | 'PREMIUM'
  is_verified: boolean
  menu_packages: {
    price_per_head: number
    is_vegetarian: boolean
    is_vegan: boolean
    is_jain: boolean
    is_halal: boolean
  }[]
  metrics: {
    avg_rating: number
    avg_response_hrs: number
    booking_rate: number
    quote_rate: number
  } | null
  cuisine_tags: string[]
}

export interface EventRequestForScoring {
  id: string
  event_id: string
  vendor_type: VendorType
  event: {
    city: string
    country: string
    event_date: Date
    guest_count: number
    total_budget: number
    currency: string
  }
  menu_preference: {
    cuisine_preferences: string[]
    is_vegetarian: boolean
    is_vegan: boolean
    is_jain: boolean
    is_halal: boolean
  } | null
}

export interface ScoreBreakdown {
  total: number
  location: number        // 0–25
  dietary: number         // 0–20
  tier_boost: number      // 0–5
  response_rate: number   // 0–15
  rating: number          // 0–20
  budget_fit: number      // 0–15
}

export const DEFAULT_WEIGHTS = {
  location: 25,
  dietary: 20,
  tier_boost: 5,
  response_rate: 15,
  rating: 20,
  budget_fit: 15,
} as const

export type WeightKey = keyof typeof DEFAULT_WEIGHTS
