/**
 * Batch Processor Module
 * 
 * Handles splitting serial numbers into batches of maximum size.
 */
const config = require('../config');

/**
 * Generate serial numbers from SN-000 to SN-{count-1}
 * @param {number} count - Number of serial numbers to generate
 * @returns {string[]} Array of serial numbers
 */
function generateSerialNumbers(count = config.TOTAL_DEVICES) {
    const serialNumbers = [];
    for (let i = 0; i < count; i++) {
        // Format: SN-000, SN-001, ..., SN-499
        serialNumbers.push(`SN-${i.toString().padStart(3, '0')}`);
    }
    return serialNumbers;
}

/**
 * Split an array into batches
 * @param {Array} items - Array to split
 * @param {number} batchSize - Maximum items per batch
 * @returns {Array[]} Array of batches
 */
function createBatches(items, batchSize = config.BATCH_SIZE) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    return batches;
}

/**
 * Create batches of serial numbers for processing
 * @param {number} totalDevices - Total number of devices
 * @param {number} batchSize - Size of each batch
 * @returns {Object} Batch information
 */
function prepareBatches(totalDevices = config.TOTAL_DEVICES, batchSize = config.BATCH_SIZE) {
    const serialNumbers = generateSerialNumbers(totalDevices);
    const batches = createBatches(serialNumbers, batchSize);

    return {
        serialNumbers,
        batches,
        totalDevices,
        batchSize,
        totalBatches: batches.length,
    };
}

module.exports = {
    generateSerialNumbers,
    createBatches,
    prepareBatches,
};
