import { Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { getWeights, saveWeights, normaliseWeights } from '@/lib/matching/weights'
import { DEFAULT_WEIGHTS, WeightKey } from '@/lib/matching/types'

const LOOKBACK_DAYS = 30
const LEARNING_RATE = 0.05

export async function runRetuneJob(): Promise<void> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000)

  const feedback = await prisma.hiddenFeedback.findMany({
    where: { created_at: { gte: since } },
    select: {
      overall_experience: true,
      communication_score: true,
      professionalism_score: true,
      quote_accuracy: true,
      would_recommend: true,
    },
  })

  if (feedback.length < 10) {
    console.log('[retune] Not enough feedback to re-tune (need ≥ 10, got %d)', feedback.length)
    return
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const avgOverall       = avg(feedback.map(f => f.overall_experience))
  const avgComms         = avg(feedback.map(f => f.communication_score))
  const avgQuoteAccuracy = avg(feedback.map(f => f.quote_accuracy))
  const recommendRate    = feedback.filter(f => f.would_recommend).length / feedback.length

  const weights = await getWeights()
  const delta: Partial<Record<WeightKey, number>> = {}

  const commsSignal    = (avgComms - 3) / 2
  delta.response_rate  = weights.response_rate * (1 + commsSignal * LEARNING_RATE)

  const quoteSignal    = (avgQuoteAccuracy - 3) / 2
  delta.budget_fit     = weights.budget_fit * (1 + quoteSignal * LEARNING_RATE)

  const overallSignal  = (avgOverall - 3) / 2
  delta.rating         = weights.rating * (1 + overallSignal * LEARNING_RATE)

  const recommendSignal = (recommendRate - 0.5) * 2
  delta.tier_boost      = weights.tier_boost * (1 + recommendSignal * LEARNING_RATE)

  const newWeights = normaliseWeights({
    ...weights,
    ...delta,
  } as Record<WeightKey, number>)

  await saveWeights(newWeights)

  console.log('[retune] Weights updated from %d feedback records:', feedback.length)
  console.log('[retune] Old:', weights)
  console.log('[retune] New:', newWeights)
}

export function startRetuneWorker() {
  return new Worker(
    'retune',
    async (_job: Job) => runRetuneJob(),
    { connection: redis, concurrency: 1 }
  )
}
