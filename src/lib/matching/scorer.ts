import type { VendorForScoring, EventRequestForScoring, ScoreBreakdown, DEFAULT_WEIGHTS } from './types'

/**
 * Score a vendor against an event request.
 * Returns null if the vendor should be hard-excluded (availability, wrong type).
 * Otherwise returns a ScoreBreakdown with a total 0–100.
 *
 * This function is PURE — no DB, no Redis. Pass loaded weights in.
 */
export function scoreVendor(
  vendor: VendorForScoring,
  request: EventRequestForScoring,
  weights: typeof DEFAULT_WEIGHTS,
  unavailableDates: Set<string>   // ISO date strings the vendor has blocked
): ScoreBreakdown | null {

  // ─── Hard gates ──────────────────────────────────────────────────────────
  if (vendor.vendor_type !== request.vendor_type) return null

  // Availability hard gate: event date must not be blocked
  const eventDateStr = request.event.event_date.toISOString().split('T')[0]
  if (unavailableDates.has(eventDateStr)) return null

  // ─── Location score (0–weights.location) ─────────────────────────────────
  let location = 0
  const vendorCity = vendor.city.toLowerCase().trim()
  const eventCity = request.event.city.toLowerCase().trim()
  if (vendorCity === eventCity) {
    location = weights.location  // exact city match
  } else if (vendor.country === request.event.country) {
    location = Math.round(weights.location * 0.4)  // same country
  }

  // ─── Dietary / cuisine match (0–weights.dietary) ─────────────────────────
  let dietary = 0
  const pref = request.menu_preference
  if (pref) {
    const flags = ['is_vegetarian', 'is_vegan', 'is_jain', 'is_halal'] as const
    const requiredFlags = flags.filter(f => pref[f] === true)

    const packageMatch = vendor.menu_packages.some(pkg =>
      requiredFlags.every(f => pkg[f] === true)
    )

    if (packageMatch || requiredFlags.length === 0) {
      dietary = weights.dietary
    } else if (vendor.menu_packages.length > 0) {
      dietary = Math.round(weights.dietary * 0.5)
    }

    if (pref.cuisine_preferences.length > 0 && vendor.cuisine_tags.length > 0) {
      const overlap = pref.cuisine_preferences.filter(c =>
        vendor.cuisine_tags.map(t => t.toLowerCase()).includes(c.toLowerCase())
      ).length
      if (overlap > 0 && dietary === 0) {
        dietary = Math.round(weights.dietary * 0.5)
      }
    }
  } else {
    dietary = weights.dietary
  }

  // ─── Tier boost (0–weights.tier_boost) ───────────────────────────────────
  const tier_boost =
    vendor.tier === 'PREMIUM' ? weights.tier_boost :
    vendor.tier === 'PRO'     ? Math.round(weights.tier_boost * 0.6) : 0

  // ─── Response rate (0–weights.response_rate) ─────────────────────────────
  let response_rate = 0
  if (vendor.metrics) {
    const hrs = vendor.metrics.avg_response_hrs
    if (hrs <= 2)        response_rate = weights.response_rate
    else if (hrs <= 6)   response_rate = Math.round(weights.response_rate * 0.8)
    else if (hrs <= 24)  response_rate = Math.round(weights.response_rate * 0.5)
    else if (hrs <= 48)  response_rate = Math.round(weights.response_rate * 0.2)
    // >48h: 0
  }

  // ─── Rating (0–weights.rating) ────────────────────────────────────────────
  let rating = 0
  if (vendor.metrics && vendor.metrics.avg_rating > 0) {
    const r = vendor.metrics.avg_rating
    if (r >= 4.5)       rating = weights.rating
    else if (r >= 4.0)  rating = Math.round(weights.rating * 0.8)
    else if (r >= 3.5)  rating = Math.round(weights.rating * 0.6)
    else if (r >= 3.0)  rating = Math.round(weights.rating * 0.4)
    // <3.0: 0
  } else {
    rating = Math.round(weights.rating * 0.5)
  }

  // ─── Budget fit (0–weights.budget_fit) ───────────────────────────────────
  let budget_fit = 0
  if (vendor.menu_packages.length > 0) {
    const budgetPerHead = request.event.total_budget / request.event.guest_count
    const cheapestPkg = Math.min(...vendor.menu_packages.map(p => p.price_per_head))
    const mostExpensivePkg = Math.max(...vendor.menu_packages.map(p => p.price_per_head))

    if (cheapestPkg <= budgetPerHead && budgetPerHead <= mostExpensivePkg * 1.1) {
      budget_fit = weights.budget_fit  // within or just over range
    } else if (cheapestPkg <= budgetPerHead * 1.3) {
      budget_fit = Math.round(weights.budget_fit * 0.5)  // slightly over budget
    }
    // More than 30% over budget: 0
  } else {
    budget_fit = Math.round(weights.budget_fit * 0.3)
  }

  const total = location + dietary + tier_boost + response_rate + rating + budget_fit

  return { total, location, dietary, tier_boost, response_rate, rating, budget_fit }
}
