# EnergyGrid Data Aggregator

A robust Node.js client application for fetching real-time telemetry from 500 solar inverters with intelligent rate limiting and security protocols.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Features

- **Intelligent Rate Limiting**: Queue-based rate limiter ensuring exactly 1 request per second
- **Batch Processing**: Optimizes throughput by grouping 10 devices per request
- **Secure Authentication**: MD5 signature generation (MD5(URL + Token + Timestamp))
- **Retry Logic**: Exponential backoff for handling 429 errors and network failures
- **Real-time Dashboard**: Beautiful web UI with live progress visualization
- **Clean Architecture**: Modular code with separation of concerns

## 📊 How It Works

```
500 Devices → 50 Batches (10 each) → Rate Limited (1 req/sec) → ~50 seconds total
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Web Dashboard                          │
│              (Real-time Progress UI)                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Aggregator Service                       │
│    - Generates serial numbers (SN-000 to SN-499)        │
│    - Coordinates batch processing                        │
│    - Aggregates results                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Rate Limiter Queue                      │
│    - Promise-based queue system                          │
│    - Ensures 1050ms gap between requests                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    API Client                            │
│    - Generates MD5 signatures                            │
│    - Handles retries with exponential backoff            │
│    - Error handling                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
           EnergyGrid Mock API
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd energygrid-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 🏃 Running the Application

### Option 1: Web Dashboard (Recommended)

1. **Start the Mock API server** (Terminal 1)
   ```bash
   npm run start:server
   ```

2. **Start the Web Dashboard** (Terminal 2)
   ```bash
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

4. **Click "Start Aggregation"** and watch the real-time progress!

### Option 2: CLI Mode

1. **Start the Mock API server** (Terminal 1)
   ```bash
   npm run start:server
   ```

2. **Run the CLI aggregator** (Terminal 2)
   ```bash
   npm run aggregate
   ```

## 📁 Project Structure

```
energygrid-aggregator/
├── package.json
├── README.md
│
├── server/                    # Mock API Server
│   └── server.js
│
├── src/                       # Client Application
│   ├── index.js              # Web server entry point
│   ├── cli.js                # CLI entry point
│   ├── config.js             # Configuration
│   │
│   ├── lib/                  # Core modules
│   │   ├── signatureGenerator.js  # MD5 signature auth
│   │   ├── rateLimiter.js         # Queue-based limiter
│   │   ├── apiClient.js           # HTTP client + retries
│   │   └── batchProcessor.js      # Batch management
│   │
│   └── services/
│       └── aggregator.js     # Main orchestration
│
└── public/                   # Web Dashboard
    ├── index.html
    └── style.css
```

## 🔧 Configuration

Environment variables can be set to customize behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Web dashboard port |
| `API_BASE_URL` | http://localhost:3001 | Mock API URL |
| `SECRET_TOKEN` | interview_token_123 | API authentication token |

## 📝 Approach Explanation

### Rate Limiting Strategy

I implemented a **queue-based rate limiter** that:
1. Queues all incoming requests
2. Processes them sequentially with guaranteed 1050ms gaps
3. Uses Promise-based async/await for clean flow control

This approach was chosen over simple `setTimeout` delays because:
- It handles concurrent request attempts gracefully
- It provides precise timing control
- It's more robust against timing drift

### Batching Strategy

- Serial numbers are pre-generated (SN-000 to SN-499)
- Split into 50 batches of 10 devices each
- Maximizes throughput while respecting the 10-device limit

### Signature Implementation

```javascript
MD5(url + token + timestamp)
// Example: MD5("/device/real/query" + "interview_token_123" + "1707050690123")
```

### Error Handling

- **429 Too Many Requests**: Exponential backoff (1.5s → 3s → 6s)
- **Network Errors**: Automatic retry up to 3 times
- **Auth Errors**: Immediate failure with descriptive error

## 🧪 Testing

The solution was tested to verify:
- ✅ All 500 devices fetched successfully
- ✅ Zero 429 errors with proper rate limiting
- ✅ Correct MD5 signature generation
- ✅ ~50 second completion time (1 req/sec × 50 batches)

## 📜 License

MIT

---

Built with ❤️ for the EnergyGrid Internship Assignment
