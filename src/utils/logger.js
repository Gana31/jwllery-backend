import winston from 'winston';
import AWS from 'aws-sdk';
const { S3 } = AWS;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S3 Configuration - Using existing AWS setup
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const LOGS_FOLDER = 'logs';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom transport for S3 upload
class S3Transport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.name = 's3';
  }

  async log(info, callback) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFileName = `${today}.log.json`;
      const s3Key = `${LOGS_FOLDER}/${logFileName}`;

      // Read existing logs from S3 or create new array
      let existingLogs = [];
      try {
        const params = {
          Bucket: BUCKET_NAME,
          Key: s3Key,
        };
        const response = await s3.getObject(params).promise();
        existingLogs = JSON.parse(response.Body.toString());
      } catch (error) {
        // File doesn't exist or other error, start with empty array
        console.log('No existing log file found, creating new one');
      }

      // Add new log entry
      const logEntry = {
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        serviceName: 'backend',
        ...info.metadata,
      };

      if (info.stack) {
        logEntry.stack = info.stack;
      }

      existingLogs.push(logEntry);

      // Upload updated logs to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify(existingLogs, null, 2),
        ContentType: 'application/json',
      };

      await s3.putObject(uploadParams).promise();
      
      if (callback) callback();
    } catch (error) {
      console.error('S3 upload error:', error);
      if (callback) callback(error);
    }
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'jewellery-backend' },
  transports: [
    // Console transport for development (disabled to avoid terminal output)
    // new winston.transports.Console({
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     winston.format.simple()
    //   ),
    // }),
    // File transport for local backup
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
    // S3 transport for centralized logging
    new S3Transport(),
  ],
});

// Helper function to add metadata to logs
export const logWithMetadata = (level, message, metadata = {}) => {
  logger.log(level, message, { metadata });
};

// Helper function for error logging with context
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...context,
  };
  
  logger.error('Application Error', { metadata: errorInfo });
};

// Helper function for request logging
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
    };
    
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', { metadata: logData });
    } else {
      logger.info('HTTP Request', { metadata: logData });
    }
  });
  
  next();
};

// Export the logger instance
export default logger; 