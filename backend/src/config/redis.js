const Redis = require('ioredis');

// Create Redis client with retry strategy
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis Connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

redis.on('ready', () => {
  console.log('✅ Redis Ready');
});

// Create separate clients for Pub/Sub (required by Redis)
const redisPub = redis.duplicate();
const redisSub = redis.duplicate();

module.exports = { redis, redisPub, redisSub };
