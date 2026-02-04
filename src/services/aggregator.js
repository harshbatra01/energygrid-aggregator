/**
 * Aggregator Service
 * 
 * Main orchestration service that coordinates:
 * - Serial number generation
 * - Batch processing
 * - Rate-limited API calls
 * - Result aggregation
 */
const { rateLimiter } = require('../lib/rateLimiter');
const { fetchDeviceData } = require('../lib/apiClient');
const { prepareBatches } = require('../lib/batchProcessor');
const config = require('../config');

/**
 * Aggregate telemetry data from all devices
 * @param {Function} onProgress - Progress callback (batchIndex, totalBatches, batchResults)
 * @returns {Promise<Object>} Aggregated results
 */
async function aggregateDeviceData(onProgress = null) {
    const startTime = Date.now();
    const { batches, totalDevices, totalBatches } = prepareBatches();

    console.log(`\n🚀 Starting aggregation of ${totalDevices} devices in ${totalBatches} batches`);
    console.log(`   Rate limit: 1 request per ${config.RATE_LIMIT_MS}ms`);
    console.log(`   Estimated time: ~${totalBatches} seconds\n`);

    const allResults = [];
    const errors = [];
    let successCount = 0;
    let onlineCount = 0;
    let offlineCount = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;

        try {
            // Use rate limiter to ensure proper spacing
            const response = await rateLimiter.execute(async () => {
                console.log(`[${batchNumber}/${totalBatches}] Fetching batch: ${batch[0]} - ${batch[batch.length - 1]}`);
                return fetchDeviceData(batch);
            });

            if (response.data && Array.isArray(response.data)) {
                allResults.push(...response.data);
                successCount += response.data.length;

                // Count online/offline
                response.data.forEach(device => {
                    if (device.status === 'Online') {
                        onlineCount++;
                    } else {
                        offlineCount++;
                    }
                });

                // Progress callback
                if (onProgress) {
                    onProgress({
                        batchIndex: i,
                        totalBatches,
                        batchResults: response.data,
                        progress: ((i + 1) / totalBatches * 100).toFixed(1),
                        successCount,
                        onlineCount,
                        offlineCount,
                    });
                }
            }
        } catch (error) {
            console.error(`[${batchNumber}/${totalBatches}] Error: ${error.message}`);
            errors.push({
                batch: batchNumber,
                serialNumbers: batch,
                error: error.message,
            });
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Generate summary report
    const report = {
        summary: {
            totalDevices,
            successfulFetches: successCount,
            failedFetches: totalDevices - successCount,
            onlineDevices: onlineCount,
            offlineDevices: offlineCount,
            totalBatches,
            errorsCount: errors.length,
            durationSeconds: parseFloat(duration),
            averageRequestTime: (duration / totalBatches).toFixed(3),
            timestamp: new Date().toISOString(),
        },
        devices: allResults,
        errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`\n✅ Aggregation complete!`);
    console.log(`   Total devices: ${successCount}/${totalDevices}`);
    console.log(`   Online: ${onlineCount} | Offline: ${offlineCount}`);
    console.log(`   Duration: ${duration}s\n`);

    return report;
}

module.exports = {
    aggregateDeviceData,
};
