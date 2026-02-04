/**
 * Signature Generator Module
 * 
 * Generates MD5 signatures for API authentication.
 * Signature format: MD5(URL + Token + Timestamp)
 */
const crypto = require('crypto');

/**
 * Generate an MD5 signature for API authentication
 * @param {string} url - The API endpoint URL (e.g., '/device/real/query')
 * @param {string} token - The secret token
 * @param {string|number} timestamp - Current timestamp in milliseconds
 * @returns {string} The MD5 hash signature
 */
function generateSignature(url, token, timestamp) {
    const payload = url + token + timestamp;
    return crypto.createHash('md5').update(payload).digest('hex');
}

/**
 * Generate authentication headers for an API request
 * @param {string} url - The API endpoint URL
 * @param {string} token - The secret token
 * @returns {Object} Headers object with timestamp and signature
 */
function generateAuthHeaders(url, token) {
    const timestamp = Date.now().toString();
    const signature = generateSignature(url, token, timestamp);

    return {
        timestamp,
        signature,
    };
}

module.exports = {
    generateSignature,
    generateAuthHeaders,
};
