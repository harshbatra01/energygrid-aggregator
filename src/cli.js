/**
 * CLI Entry Point for standalone aggregation
 */
const { aggregateDeviceData } = require('./services/aggregator');

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         EnergyGrid Data Aggregator - CLI Mode');
    console.log('═══════════════════════════════════════════════════════════');

    try {
        const report = await aggregateDeviceData((progress) => {
            // Simple progress indicator
            process.stdout.write(`\rProgress: ${progress.progress}% (${progress.successCount} devices)`);
        });

        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('                    AGGREGATION REPORT');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(JSON.stringify(report.summary, null, 2));

        if (report.errors && report.errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            report.errors.forEach(err => {
                console.log(`   Batch ${err.batch}: ${err.error}`);
            });
        }

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

main();
