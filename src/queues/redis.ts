import env from '../env';
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  // Always return a new client in test environment
  if (process.env.NODE_ENV === 'test') {
    return new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });
  }

  // In other environments, reuse
  if (!redis) {
    console.log('Initializing Redis Client...');
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

    redis.on('error', (err) => console.error('Redis Error:', err));
    redis.on('connect', () => console.log('connected to redis'));
  }

  return redis;
}

export async function closeRedisClient() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
