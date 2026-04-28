import { redis } from '@/lib/redis'
import { DEFAULT_WEIGHTS, WeightKey } from './types'

const WEIGHTS_KEY = 'matching:weights'

export async function getWeights(): Promise<typeof DEFAULT_WEIGHTS> {
  try {
    const raw = await redis.get(WEIGHTS_KEY)
    if (!raw) return { ...DEFAULT_WEIGHTS }
    const parsed = JSON.parse(raw)
    const weights: Record<WeightKey, number> = { ...DEFAULT_WEIGHTS }
    for (const key of Object.keys(DEFAULT_WEIGHTS) as WeightKey[]) {
      if (typeof parsed[key] === 'number' && parsed[key] >= 0) {
        weights[key] = parsed[key]
      }
    }
    return weights as typeof DEFAULT_WEIGHTS
  } catch {
    return { ...DEFAULT_WEIGHTS }
  }
}

export async function saveWeights(weights: typeof DEFAULT_WEIGHTS): Promise<void> {
  await redis.set(WEIGHTS_KEY, JSON.stringify(weights))
}

export function normaliseWeights(weights: Record<WeightKey, number>): typeof DEFAULT_WEIGHTS {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (total === 0) return { ...DEFAULT_WEIGHTS }
  const factor = 100 / total
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, Math.round(v * factor)])
  ) as unknown as typeof DEFAULT_WEIGHTS
}
