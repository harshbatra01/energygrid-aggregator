/**
 * API Client Module
 * 
 * Handles HTTP requests to the EnergyGrid API with:
 * - Automatic signature generation
 * - Retry logic with exponential backoff
 * - Error handling
 */
const config = require('../config');
const { generateAuthHeaders } = require('./signatureGenerator');

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a POST request to fetch device data
 * @param {string[]} snList - Array of serial numbers
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} API response data
 */
async function fetchDeviceData(snList, retryCount = 0) {
    const url = config.API_ENDPOINT;
    const fullUrl = `${config.API_BASE_URL}${url}`;

    // Generate fresh auth headers for each request
    const authHeaders = generateAuthHeaders(url, config.SECRET_TOKEN);

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'timestamp': authHeaders.timestamp,
            'signature': authHeaders.signature,
        },
        body: JSON.stringify({ sn_list: snList }),
    };

    try {
        const response = await fetch(fullUrl, requestOptions);

        // Handle rate limit exceeded
        if (response.status === 429) {
            if (retryCount < config.MAX_RETRIES) {
                const delay = config.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
                console.log(`[Retry] Rate limited. Waiting ${delay}ms before retry ${retryCount + 1}/${config.MAX_RETRIES}`);
                await sleep(delay);
                return fetchDeviceData(snList, retryCount + 1);
            }
            throw new Error(`Rate limit exceeded after ${config.MAX_RETRIES} retries`);
        }

        // Handle authentication errors
        if (response.status === 401) {
            const errorData = await response.json();
            throw new Error(`Authentication failed: ${errorData.error}`);
        }

        // Handle other errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        // Handle network errors with retry
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            if (retryCount < config.MAX_RETRIES) {
                const delay = config.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
                console.log(`[Retry] Network error. Waiting ${delay}ms before retry ${retryCount + 1}/${config.MAX_RETRIES}`);
                await sleep(delay);
                return fetchDeviceData(snList, retryCount + 1);
            }
        }
        throw error;
    }
}

module.exports = {
    fetchDeviceData,
};
