import { redis } from '@/lib/redis'

export async function storePushToken(userId: string, userType: 'customer' | 'vendor', token: string): Promise<void> {
  const key = `push_tokens:${userType}:${userId}`
  await redis.sadd(key, token)
  // Keep at most 5 tokens (trim if needed)
  const count = await redis.scard(key)
  if (count > 5) {
    const tokens = await redis.smembers(key)
    if (tokens.length > 5) {
      await redis.srem(key, tokens[0])
    }
  }
  await redis.expire(key, 90 * 86400)  // 90 day TTL
}

export async function getPushTokens(userId: string, userType: 'customer' | 'vendor'): Promise<string[]> {
  const key = `push_tokens:${userType}:${userId}`
  return redis.smembers(key)
}

export async function removePushToken(userId: string, userType: 'customer' | 'vendor', token: string): Promise<void> {
  const key = `push_tokens:${userType}:${userId}`
  await redis.srem(key, token)
}
