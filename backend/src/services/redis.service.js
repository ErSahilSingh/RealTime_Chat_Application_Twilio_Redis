const { redis } = require('../config/redis');

/**
 * Redis service for managing OTP, sessions, and presence
 */
class RedisService {
  /**
   * Store OTP with 5-minute expiry
   */
  async storeOTP(mobileNumber, otp) {
    const key = `otp:${mobileNumber}`;
    const data = JSON.stringify({ otp, attempts: 0, createdAt: Date.now() });
    await redis.setex(key, 300, data); // 5 minutes TTL
    console.log(`📝 Stored OTP for ${mobileNumber}`);
  }

  /**
   * Verify OTP and handle attempts
   */
  async verifyOTP(mobileNumber, otp) {
    const key = `otp:${mobileNumber}`;
    const data = await redis.get(key);

    if (!data) {
      return { valid: false, reason: 'expired', message: 'OTP has expired. Please request a new one.' };
    }

    const { otp: storedOTP, attempts } = JSON.parse(data);

    // Check max attempts
    if (attempts >= 3) {
      await redis.del(key);
      return { valid: false, reason: 'max_attempts', message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    // Verify OTP
    if (storedOTP !== otp) {
      // Increment attempts
      const newData = JSON.stringify({ otp: storedOTP, attempts: attempts + 1 });
      await redis.setex(key, 300, newData);
      return { valid: false, reason: 'invalid', message: `Invalid OTP. ${2 - attempts} attempts remaining.` };
    }

    // Success - delete OTP
    await redis.del(key);
    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Map socket ID to user ID
   */
  async mapSocket(userId, socketId) {
    await redis.set(`socket:${userId}`, socketId);
    // Set expiry as safety measure (24 hours)
    await redis.expire(`socket:${userId}`, 86400);
    console.log(`🔌 Mapped socket ${socketId} to user ${userId}`);
  }

  /**
   * Get socket ID for a user
   */
  async getSocket(userId) {
    return await redis.get(`socket:${userId}`);
  }

  /**
   * Remove socket mapping
   */
  async removeSocket(userId) {
    await redis.del(`socket:${userId}`);
    console.log(`🔌 Removed socket for user ${userId}`);
  }

  /**
   * Set user online status (30 seconds TTL, refreshed via heartbeat)
   */
  async setUserOnline(userId) {
    await redis.setex(`user:online:${userId}`, 30, Date.now().toString());
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId) {
    const exists = await redis.exists(`user:online:${userId}`);
    return exists === 1;
  }

  /**
   * Get all online users
   */
  async getOnlineUsers() {
    const keys = await redis.keys('user:online:*');
    return keys.map(key => key.split(':')[2]);
  }

  /**
   * Rate limiting check
   * @param {string} userId - User ID
   * @param {string} action - Action name (e.g., 'send_otp', 'send_message')
   * @param {number} limit - Maximum allowed actions per window
   * @param {number} windowSeconds - Time window in seconds (default: 60)
   */
  async checkRateLimit(userId, action, limit = 10, windowSeconds = 60) {
    const key = `rate:${userId}:${action}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const allowed = count <= limit;
    if (!allowed) {
      console.log(`⚠️ Rate limit exceeded for ${userId} on ${action}`);
    }

    return allowed;
  }

  /**
   * Store unread message count
   */
  async incrementUnread(userId, fromUserId) {
    await redis.hincrby(`unread:${userId}`, fromUserId, 1);
  }

  /**
   * Get unread counts
   */
  async getUnreadCounts(userId) {
    const counts = await redis.hgetall(`unread:${userId}`);
    return counts || {};
  }

  /**
   * Clear unread count for a conversation
   */
  async clearUnread(userId, fromUserId) {
    await redis.hdel(`unread:${userId}`, fromUserId);
  }

  /**
   * Add user to group room (for tracking online members)
   */
  async addToGroupRoom(groupId, userId) {
    await redis.sadd(`group:members:${groupId}`, userId);
  }

  /**
   * Remove user from group room
   */
  async removeFromGroupRoom(groupId, userId) {
    await redis.srem(`group:members:${groupId}`, userId);
  }

  /**
   * Get online members in a group
   */
  async getGroupOnlineMembers(groupId) {
    const members = await redis.smembers(`group:members:${groupId}`);
    return members || [];
  }
}

module.exports = new RedisService();
