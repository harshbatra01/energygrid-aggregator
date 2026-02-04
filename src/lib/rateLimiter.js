/**
 * Rate Limiter Module
 * 
 * Implements a queue-based rate limiter to ensure exactly 1 request per second.
 * Uses a promise-based queue for clean async handling.
 */
const config = require('../config');

class RateLimiter {
    constructor(intervalMs = config.RATE_LIMIT_MS) {
        this.intervalMs = intervalMs;
        this.lastRequestTime = 0;
        this.queue = [];
        this.processing = false;
    }

    /**
     * Execute a function with rate limiting
     * @param {Function} fn - The async function to execute
     * @returns {Promise} - Resolves with the function result
     */
    async execute(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process the queue, ensuring proper spacing between requests
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const { fn, resolve, reject } = this.queue.shift();

            // Calculate wait time to maintain rate limit
            const now = Date.now();
            const elapsed = now - this.lastRequestTime;
            const waitTime = Math.max(0, this.intervalMs - elapsed);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }

            try {
                this.lastRequestTime = Date.now();
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current queue length
     * @returns {number} Number of pending requests
     */
    getQueueLength() {
        return this.queue.length;
    }

    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
    }
}

// Singleton instance for global rate limiting
const rateLimiter = new RateLimiter();

module.exports = {
    RateLimiter,
    rateLimiter,
};
