/**
 * Main Web Application Entry Point
 * 
 * Provides a web dashboard for monitoring aggregation progress
 * and displays results in real-time.
 */
const express = require('express');
const path = require('path');
const { aggregateDeviceData } = require('./services/aggregator');
const config = require('./config');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Store for current aggregation state
let aggregationState = {
    isRunning: false,
    progress: 0,
    devices: [],
    summary: null,
    errors: [],
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current state
app.get('/api/status', (req, res) => {
    res.json(aggregationState);
});

// Start aggregation
app.post('/api/aggregate', async (req, res) => {
    if (aggregationState.isRunning) {
        return res.status(409).json({ error: 'Aggregation already in progress' });
    }

    // Reset state
    aggregationState = {
        isRunning: true,
        progress: 0,
        devices: [],
        summary: null,
        errors: [],
        startTime: Date.now(),
    };

    res.json({ message: 'Aggregation started', status: 'running' });

    // Run aggregation in background
    try {
        const report = await aggregateDeviceData((progressData) => {
            aggregationState.progress = parseFloat(progressData.progress);
            aggregationState.devices = [...aggregationState.devices, ...progressData.batchResults];
            aggregationState.onlineCount = progressData.onlineCount;
            aggregationState.offlineCount = progressData.offlineCount;
            aggregationState.successCount = progressData.successCount;
        });

        aggregationState.isRunning = false;
        aggregationState.summary = report.summary;
        aggregationState.errors = report.errors || [];
        aggregationState.progress = 100;

    } catch (error) {
        aggregationState.isRunning = false;
        aggregationState.errors.push({ message: error.message });
    }
});

// Reset state
app.post('/api/reset', (req, res) => {
    if (aggregationState.isRunning) {
        return res.status(409).json({ error: 'Cannot reset while aggregation is running' });
    }

    aggregationState = {
        isRunning: false,
        progress: 0,
        devices: [],
        summary: null,
        errors: [],
    };

    res.json({ message: 'State reset successfully' });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(config.SERVER_PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         EnergyGrid Data Aggregator - Web Dashboard');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🌐 Dashboard: http://localhost:${config.SERVER_PORT}`);
    console.log(`📡 API Endpoint: http://localhost:${config.SERVER_PORT}/api`);
    console.log(`\n⚠️  Make sure Mock API is running on port ${config.MOCK_API_PORT}`);
    console.log('   Start it with: npm run start:server\n');
});
