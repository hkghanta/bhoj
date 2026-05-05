import { MAJOR_METROS } from './metros'

const RADIUS_KM = 160 // ~100 miles

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type MetroResult = { metro_city: string; metro_state: string }

export async function resolveMetro(
  city: string,
  state?: string | null,
  country?: string | null,
): Promise<MetroResult | null> {
  try {
    const q = [city, state, country].filter(Boolean).join(', ')
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&layer=city`,
      { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(4000) },
    )
    if (!res.ok) return null

    const data = await res.json() as { features?: { geometry: { coordinates: [number, number] } }[] }
    const feature = data.features?.[0]
    if (!feature) return null

    const [lng, lat] = feature.geometry.coordinates

    // Prefer metros in the same country
    const candidates = country
      ? MAJOR_METROS.filter(m => m.country === country)
      : MAJOR_METROS

    let nearest: typeof MAJOR_METROS[0] | null = null
    let minDist = Infinity
    for (const metro of candidates) {
      const dist = haversineKm(lat, lng, metro.lat, metro.lng)
      if (dist < RADIUS_KM && dist < minDist) {
        minDist = dist
        nearest = metro
      }
    }

    if (!nearest) return null
    return { metro_city: nearest.city, metro_state: nearest.state }
  } catch {
    return null
  }
}
