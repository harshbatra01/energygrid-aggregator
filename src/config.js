/**
 * Configuration for EnergyGrid Data Aggregator
 */
module.exports = {
    // API Configuration
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    API_ENDPOINT: '/device/real/query',
    SECRET_TOKEN: process.env.SECRET_TOKEN || 'interview_token_123',

    // Rate Limiting
    RATE_LIMIT_MS: 1100, // 1100ms to ensure we stay under 1 req/sec with buffer for single-server

    // Batch Configuration
    BATCH_SIZE: 10,      // Max devices per request
    TOTAL_DEVICES: 500,  // Total devices to fetch

    // Retry Configuration
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY_MS: 1500, // Start with 1.5s for 429 errors

    // Server Configuration
    SERVER_PORT: process.env.PORT || 3000,
    MOCK_API_PORT: 3001,
};
