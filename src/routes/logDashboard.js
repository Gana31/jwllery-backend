import express from 'express';
import AWS from 'aws-sdk';
const { S3 } = AWS;
import logger, { logWithMetadata } from '../utils/logger.js';

const router = express.Router();

// S3 Configuration - Using existing AWS setup
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const LOGS_FOLDER = 'logs';

// Dashboard HTML
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jewellery App Logs Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: #1e40af;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        select, input, button {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        button {
            background: #1e40af;
            color: white;
            border: none;
            cursor: pointer;
            margin-right: 10px;
        }
        
        button:hover {
            background: #1d4ed8;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #1e40af;
        }
        
        .logs-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .log-entry {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .log-entry:last-child {
            border-bottom: none;
        }
        
        .log-entry.error {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
        }
        
        .log-entry.warn {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
        }
        
        .log-entry.info {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
        }
        
        .log-message {
            flex: 1;
            margin-right: 15px;
        }
        
        .log-timestamp {
            color: #666;
            font-size: 0.9em;
            white-space: nowrap;
        }
        
        .log-service {
            background: #e5e7eb;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error-message {
            background: #fef2f2;
            color: #dc2626;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Jewellery App Logs Dashboard</h1>
            <p>Centralized logging system for frontend and backend</p>
        </div>
        
        <div class="controls">
            <div class="form-group">
                <label for="dateSelect">Select Date:</label>
                <select id="dateSelect">
                    <option value="">Loading dates...</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="levelFilter">Filter by Level:</label>
                <select id="levelFilter">
                    <option value="">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="serviceFilter">Filter by Service:</label>
                <select id="serviceFilter">
                    <option value="">All Services</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                </select>
            </div>
            
            <button onclick="loadLogs()">Load Logs</button>
            <button onclick="loadStats()">Load Stats</button>
            <button onclick="downloadLogs()">Download</button>
        </div>
        
        <div id="stats" class="stats" style="display: none;"></div>
        
        <div id="error" class="error-message" style="display: none;"></div>
        
        <div id="logs" class="logs-container">
            <div class="loading">Select a date to view logs</div>
        </div>
    </div>

    <script>
        let currentDate = '';
        
        // Load available dates
        async function loadDates() {
            try {
                const response = await fetch('/api/v1/logs/dates');
                const data = await response.json();
                
                const select = document.getElementById('dateSelect');
                select.innerHTML = '<option value="">Select a date...</option>';
                
                data.dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = date;
                    select.appendChild(option);
                });
                
                // Auto-select today's date
                const today = new Date().toISOString().split('T')[0];
                if (data.dates.includes(today)) {
                    select.value = today;
                    currentDate = today;
                    loadLogs();
                }
            } catch (error) {
                showError('Failed to load dates: ' + error.message);
            }
        }
        
        // Load logs for selected date
        async function loadLogs() {
            const date = document.getElementById('dateSelect').value;
            if (!date) return;
            
            currentDate = date;
            const level = document.getElementById('levelFilter').value;
            const service = document.getElementById('serviceFilter').value;
            
            showLoading();
            
            try {
                let url = \`/api/v1/logs/\${date}?limit=100\`;
                if (level) url += \`&level=\${level}\`;
                if (service) url += \`&service=\${service}\`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                displayLogs(data.logs);
            } catch (error) {
                showError('Failed to load logs: ' + error.message);
            }
        }
        
        // Load statistics
        async function loadStats() {
            if (!currentDate) return;
            
            try {
                const response = await fetch(\`/api/v1/logs/stats/\${currentDate}\`);
                const data = await response.json();
                
                displayStats(data.stats);
            } catch (error) {
                showError('Failed to load stats: ' + error.message);
            }
        }
        
        // Download logs
        async function downloadLogs() {
            if (!currentDate) return;
            
            try {
                const response = await fetch(\`/api/v1/logs/download/\${currentDate}\`);
                const data = await response.json();
                
                window.open(data.downloadUrl, '_blank');
            } catch (error) {
                showError('Failed to generate download link: ' + error.message);
            }
        }
        
        // Display logs
        function displayLogs(logs) {
            const container = document.getElementById('logs');
            
            if (logs.length === 0) {
                container.innerHTML = '<div class="loading">No logs found for this date</div>';
                return;
            }
            
            container.innerHTML = logs.map(log => \`
                <div class="log-entry \${log.level}">
                    <div class="log-message">
                        <strong>\${log.message}</strong>
                        <span class="log-service">\${log.serviceName || 'unknown'}</span>
                        \${log.metadata?.route ? \`<br><small>Route: \${log.metadata.route}</small>\` : ''}
                        \${log.metadata?.userId ? \`<br><small>User: \${log.metadata.userId}</small>\` : ''}
                        \${log.stack ? \`<br><small style="color: #666;">\${log.stack}</small>\` : ''}
                    </div>
                    <div class="log-timestamp">
                        \${new Date(log.timestamp).toLocaleString()}
                    </div>
                </div>
            \`).join('');
        }
        
        // Display statistics
        function displayStats(stats) {
            const container = document.getElementById('stats');
            
            container.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.total}</div>
                    <div>Total Logs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #ef4444;">\${stats.errors}</div>
                    <div>Errors</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #f59e0b;">\${stats.warnings}</div>
                    <div>Warnings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #3b82f6;">\${stats.info}</div>
                    <div>Info</div>
                </div>
            \`;
            
            container.style.display = 'grid';
        }
        
        // Show loading state
        function showLoading() {
            document.getElementById('logs').innerHTML = '<div class="loading">Loading logs...</div>';
            document.getElementById('error').style.display = 'none';
        }
        
        // Show error message
        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            loadDates();
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                if (currentDate) {
                    loadLogs();
                }
            }, 30000);
        });
    </script>
</body>
</html>
`;

// Serve dashboard
router.get('/', (req, res) => {
  res.send(dashboardHTML);
});

export default router; 