// Pure utility — takes vendor list + event requirements, returns sorted list.
// No database access. Called from the service page API handler.

export type VendorForRanking = {
  id: string
  business_name: string
  city: string
  vendor_type: string
  avg_rating: number | null
  is_verified: boolean
  menu_packages: Array<{
    is_halal: boolean
    is_jain: boolean
    cuisine_type: string | null
  }>
}

export type RankingRequirements = {
  city?: string
  is_halal?: boolean
  is_jain?: boolean
  cuisines?: string[]
}

export type RankedVendor = VendorForRanking & { score: number }

export function rankVendors(
  vendors: VendorForRanking[],
  requirements: RankingRequirements,
): RankedVendor[] {
  return vendors
    .map(v => {
      let score = 0

      // Location: 40 points if same city (case-insensitive)
      if (requirements.city && v.city.toLowerCase() === requirements.city.toLowerCase()) {
        score += 40
      }

      // Requirements fit: 35 points total
      let reqScore = 0
      const pkg = v.menu_packages
      if (requirements.is_halal && pkg.some(p => p.is_halal)) reqScore += 15
      if (requirements.is_jain && pkg.some(p => p.is_jain)) reqScore += 15
      if (requirements.cuisines && requirements.cuisines.length > 0) {
        const overlap = requirements.cuisines.filter(c =>
          pkg.some(p => p.cuisine_type?.toLowerCase() === c.toLowerCase())
        ).length
        reqScore += Math.round((overlap / requirements.cuisines.length) * 15)
      }
      score += Math.min(35, reqScore)

      // Rating: 15 points (prorated 0–5 stars)
      if (v.avg_rating !== null) {
        score += Math.round((v.avg_rating / 5) * 15)
      }

      // Verified: 10 points
      if (v.is_verified) score += 10

      return { ...v, score }
    })
    .sort((a, b) => b.score - a.score)
}
