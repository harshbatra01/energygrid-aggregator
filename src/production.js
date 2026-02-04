/**
 * Production Entry Point
 * 
 * Runs both the Mock API server and the Web Dashboard on a single port
 * for deployment purposes. Uses path-based routing.
 */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const { aggregateDeviceData } = require('./services/aggregator');
const config = require('./config');

const app = express();

// Configure CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'signature', 'timestamp'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// For the backend instance in production, internal calls should hit itself
const INTERNAL_PORT = process.env.PORT || 3000;
config.API_BASE_URL = `http://localhost:${INTERNAL_PORT}`;

// ==============================================================================
// MOCK API SECTION (mounted at /device/*)
// ==============================================================================
const SECRET_TOKEN = "interview_token_123";
let lastRequestTime = 0;

// Rate Limiter Middleware for /device routes
app.use('/device', (req, res, next) => {
    const now = Date.now();
    if (now - lastRequestTime < 950) {
        console.log(`[429] Request rejected. Time since last: ${now - lastRequestTime}ms`);
        return res.status(429).json({ error: "Too Many Requests. Limit: 1 req/sec." });
    }
    lastRequestTime = now;
    next();
});

// Security Middleware for /device routes
app.use('/device', (req, res, next) => {
    const signature = req.headers["signature"];
    const timestamp = req.headers["timestamp"];
    const url = req.originalUrl;

    if (!timestamp || !signature) {
        return res.status(401).json({ error: "Missing headers: signature or timestamp" });
    }

    const expectedSig = crypto
        .createHash("md5")
        .update(url + SECRET_TOKEN + timestamp)
        .digest("hex");

    if (signature !== expectedSig) {
        console.log(`[401] Bad Signature. Got: ${signature}, Expected: ${expectedSig}`);
        return res.status(401).json({ error: "Invalid Signature" });
    }
    next();
});

// Device Query Endpoint
app.post("/device/real/query", (req, res) => {
    const { sn_list } = req.body;

    if (!sn_list || !Array.isArray(sn_list)) {
        return res.status(400).json({ error: "sn_list array is required" });
    }
    if (sn_list.length > 10) {
        return res.status(400).json({ error: "Batch size limit exceeded (Max 10)" });
    }

    const results = sn_list.map((sn) => ({
        sn: sn,
        power: (Math.random() * 5).toFixed(2) + " kW",
        status: Math.random() > 0.1 ? "Online" : "Offline",
        last_updated: new Date().toISOString(),
    }));

    console.log(`[200] Success. Processed ${sn_list.length} devices.`);
    res.json({ data: results });
});

// ==============================================================================
// CLIENT API SECTION (/api/*)
// ==============================================================================
let aggregationState = {
    isRunning: false,
    progress: 0,
    devices: [],
    summary: null,
    errors: [],
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get status
app.get('/api/status', (req, res) => {
    res.json(aggregationState);
});

// Start aggregation
app.post('/api/aggregate', async (req, res) => {
    if (aggregationState.isRunning) {
        return res.status(409).json({ error: 'Aggregation already in progress' });
    }

    aggregationState = {
        isRunning: true,
        progress: 0,
        devices: [],
        summary: null,
        errors: [],
        startTime: Date.now(),
    };

    res.json({ message: 'Aggregation started', status: 'running' });

    // Update config to use same-origin API
    config.API_BASE_URL = `http://localhost:${config.SERVER_PORT}`;

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

// Reset
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

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ==============================================================================
// START SERVER
// ==============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('     EnergyGrid Data Aggregator - Production Server');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🌐 Application running at: http://localhost:${PORT}`);
    console.log('   - Dashboard: /');
    console.log('   - API: /api/*');
    console.log('   - Mock Device API: /device/*\n');
});
