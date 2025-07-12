# 📊 Centralized Logging System

A complete logging solution for the Jewellery App with S3 storage, daily log files, and real-time monitoring capabilities.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js       │    │   AWS S3        │
│   Frontend      │    │   Backend       │    │   Storage       │
│                 │    │                 │    │                 │
│ • Error Capture │    │ • Winston       │    │ • Daily Files   │
│ • Offline Queue │    │ • S3 Transport  │    │ • Lifecycle     │
│ • Auto Sync     │    │ • API Endpoints │    │ • Auto Cleanup  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your AWS credentials:

```bash
cp env.example .env
```

Edit `.env` with your AWS configuration:

```env
# AWS Configuration for S3 Logging
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=jewellery-app-logs

# Logging Configuration
LOG_LEVEL=info
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create S3 Bucket and Setup Lifecycle

```bash
# Create S3 bucket (if not exists)
aws s3 mb s3://jewellery-app-logs

# Setup lifecycle policy for automatic cleanup
node scripts/s3-lifecycle.js
```

### 4. Start the Server

```bash
npm run dev
```

## 📁 S3 Structure

```
jewellery-app-logs/
└── logs/
    ├── 2025-01-15.log.json
    ├── 2025-01-16.log.json
    ├── 2025-01-17.log.json
    └── ...
```

Each daily file contains an array of log entries:

```json
[
  {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "level": "error",
    "message": "Database connection failed",
    "serviceName": "backend",
    "metadata": {
      "route": "/api/users",
      "userId": "user123",
      "stack": "Error: Connection timeout..."
    }
  }
]
```

## 🔧 Backend Logging

### Winston Configuration

The backend uses Winston with a custom S3 transport that:
- Appends logs to daily files
- Uploads to S3 immediately
- Maintains local backup files
- Provides structured logging

### Usage Examples

```javascript
import logger, { logError, logWithMetadata } from '../utils/logger.js';

// Basic logging
logger.info('User logged in successfully');
logger.error('Database connection failed');

// Logging with metadata
logWithMetadata('info', 'API request processed', {
  route: '/api/users',
  userId: 'user123',
  duration: '150ms'
});

// Error logging with context
try {
  // Some operation
} catch (error) {
  logError(error, {
    route: '/api/users',
    userId: 'user123'
  });
}
```

### Request Logging Middleware

Automatically logs all HTTP requests with:
- Method, URL, status code
- Response time
- User agent and IP
- User ID (if authenticated)

## 📱 Frontend Logging

### React Native Integration

The frontend logger automatically captures:
- JavaScript runtime errors
- Unhandled promise rejections
- React Native red screen errors
- Network errors

### Usage Examples

```typescript
import logger from '../services/logger';

// Basic logging
logger.info('User navigated to profile screen');
logger.error('API call failed', { endpoint: '/api/users' });

// Manual error logging
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', {
    operation: 'userUpdate',
    userId: 'user123',
    error: error.message
  });
}
```

### Offline Support

- Logs are stored locally when offline
- Automatic sync when connection is restored
- Queue management to prevent memory issues
- Configurable sync intervals

## 🌐 Web Dashboard

Access the log dashboard at: `http://your-server/logs`

### Features
- 📅 Date-based log viewing
- 🔍 Filter by level and service
- 📊 Real-time statistics
- 💾 Download log files
- 🔄 Auto-refresh every 30 seconds

### Dashboard Screenshots

The dashboard provides:
- Clean, modern interface
- Color-coded log levels
- Search and filter capabilities
- Export functionality

## 🖥️ CLI Tool

### Installation

```bash
# Make executable
chmod +x scripts/log-cli.js

# Install CLI dependencies
npm install --save-dev commander chalk cli-table3
```

### Usage Examples

```bash
# List available log dates
node scripts/log-cli.js list

# View logs for today
node scripts/log-cli.js view 2025-01-15

# View only errors
node scripts/log-cli.js view 2025-01-15 --level error

# View frontend logs only
node scripts/log-cli.js view 2025-01-15 --service frontend

# Show statistics
node scripts/log-cli.js stats 2025-01-15

# Search across all dates
node scripts/log-cli.js search "database connection"

# Search in specific date
node scripts/log-cli.js search "user login" --date 2025-01-15
```

## 📊 API Endpoints

### Log Management

```
GET  /api/v1/logs/dates           # List available dates
GET  /api/v1/logs/:date           # Get logs for date
GET  /api/v1/logs/stats/:date     # Get statistics
GET  /api/v1/logs/download/:date  # Download log file
POST /api/v1/logs/frontend        # Receive frontend logs
```

### Query Parameters

- `level`: Filter by log level (error, warn, info, debug)
- `service`: Filter by service (frontend, backend)
- `limit`: Limit number of logs (default: 100)
- `offset`: Pagination offset (default: 0)

### Example API Calls

```bash
# Get today's logs
curl "http://localhost:3000/api/v1/logs/2025-01-15"

# Get only errors from frontend
curl "http://localhost:3000/api/v1/logs/2025-01-15?level=error&service=frontend"

# Get statistics
curl "http://localhost:3000/api/v1/logs/stats/2025-01-15"
```

## 🔄 Lifecycle Management

### Automatic Cleanup

S3 lifecycle policy automatically:
- Deletes logs older than 10 days
- Removes non-current versions after 1 day
- Maintains cost efficiency

### Manual Cleanup

```bash
# Setup lifecycle policy
node scripts/s3-lifecycle.js
```

## 💰 Cost Optimization

### S3 Pricing (Free Tier)
- 5GB storage
- 20,000 GET requests/month
- 2,000 PUT requests/month

### Estimated Monthly Cost (Beyond Free Tier)
- Storage: ~$0.023/GB/month
- Requests: ~$0.0004 per 1,000 requests
- Typical app: $1-5/month

### Cost Reduction Tips
- Use lifecycle policies (implemented)
- Compress old logs (future enhancement)
- Use S3 Intelligent Tiering (future enhancement)

## 🔒 Security

### AWS IAM Policy

Create a minimal IAM policy for logging:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::jewellery-app-logs",
        "arn:aws:s3:::jewellery-app-logs/*"
      ]
    }
  ]
}
```

### Best Practices
- Use IAM roles instead of access keys in production
- Enable S3 bucket encryption
- Restrict bucket access to specific IPs if needed
- Monitor access logs

## 🐛 Troubleshooting

### Common Issues

1. **S3 Upload Fails**
   - Check AWS credentials
   - Verify bucket exists
   - Check IAM permissions

2. **Frontend Logs Not Syncing**
   - Check network connectivity
   - Verify API endpoint
   - Check AsyncStorage permissions

3. **Dashboard Not Loading**
   - Check server is running
   - Verify route configuration
   - Check browser console for errors

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Manual Log Sync

```typescript
// Force sync frontend logs
await logger.forceSync();
```

## 🚀 Production Deployment

### Environment Variables

```env
# Production settings
NODE_ENV=production
LOG_LEVEL=warn
AWS_REGION=us-east-1
S3_BUCKET_NAME=jewellery-app-logs-prod
```

### Monitoring

- Set up CloudWatch alarms for S3 errors
- Monitor log volume and costs
- Set up alerts for high error rates

### Scaling Considerations

- S3 automatically scales
- Consider CloudFront for global access
- Use S3 Transfer Acceleration if needed

## 📈 Future Enhancements

### Planned Features
- [ ] Log compression for old files
- [ ] Real-time log streaming
- [ ] Advanced search and analytics
- [ ] Log aggregation across services
- [ ] Custom alerting rules
- [ ] Log retention policies per service

### Integration Possibilities
- [ ] CloudWatch integration
- [ ] Elasticsearch for advanced search
- [ ] Grafana dashboards
- [ ] Slack/Teams notifications

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review AWS CloudTrail logs
3. Check server logs for errors
4. Verify environment configuration

---

**Built with ❤️ for the Jewellery App** 