import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist (robust, runs on import)
const logsDir = path.join(__dirname, '../../logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create logs directory:', e);
}

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom filter to only allow info level logs
const infoOnly = winston.format((info) => {
  return info.level === 'info' ? info : false;
});

// Create logger instance
const today = new Date().toISOString().split('T')[0];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'jewellery-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, `${today}-error.log`),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, `${today}-info.log`),
      level: 'info',
      format: winston.format.combine(
        infoOnly(),
        logFormat
      ),
    }),
    // S3Transport removed
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