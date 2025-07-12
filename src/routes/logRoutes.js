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

// Get list of available log dates
router.get('/dates', async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: `${LOGS_FOLDER}/`,
      Delimiter: '/',
    };

    const response = await s3.listObjectsV2(params).promise();
    const dates = response.Contents
      ?.map(obj => {
        const fileName = obj.Key.split('/').pop();
        return fileName?.replace('.log.json', '');
      })
      .filter(date => date && date.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort((a, b) => new Date(b) - new Date(a)) || [];

    logWithMetadata('info', 'Log dates retrieved', { count: dates.length });
    res.json({ dates });
  } catch (error) {
    logWithMetadata('error', 'Failed to get log dates', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve log dates' });
  }
});

// Get logs for a specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { level, service, limit = 100, offset = 0 } = req.query;

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const logFileName = `${date}.log.json`;
    const s3Key = `${LOGS_FOLDER}/${logFileName}`;

    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
      };

      const response = await s3.getObject(params).promise();
      let logs = JSON.parse(response.Body.toString());

      // Apply filters
      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      if (service) {
        logs = logs.filter(log => log.serviceName === service);
      }

      // Apply pagination
      const totalCount = logs.length;
      logs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      logWithMetadata('info', 'Logs retrieved for date', { 
        date, 
        totalCount, 
        returnedCount: logs.length,
        filters: { level, service }
      });

      res.json({
        date,
        logs,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < totalCount
        }
      });
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return res.status(404).json({ error: 'No logs found for this date' });
      }
      throw error;
    }
  } catch (error) {
    logWithMetadata('error', 'Failed to get logs for date', { 
      date: req.params.date, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Get log statistics
router.get('/stats/:date', async (req, res) => {
  try {
    const { date } = req.params;

    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const logFileName = `${date}.log.json`;
    const s3Key = `${LOGS_FOLDER}/${logFileName}`;

    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
      };

      const response = await s3.getObject(params).promise();
      const logs = JSON.parse(response.Body.toString());

      // Calculate statistics
      const stats = {
        total: logs.length,
        byLevel: {},
        byService: {},
        byHour: {},
        errors: logs.filter(log => log.level === 'error').length,
        warnings: logs.filter(log => log.level === 'warn').length,
        info: logs.filter(log => log.level === 'info').length,
      };

      logs.forEach(log => {
        // Count by level
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        
        // Count by service
        const service = log.serviceName || 'unknown';
        stats.byService[service] = (stats.byService[service] || 0) + 1;
        
        // Count by hour
        if (log.timestamp) {
          const hour = new Date(log.timestamp).getHours();
          stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        }
      });

      logWithMetadata('info', 'Log statistics retrieved', { date, totalLogs: logs.length });
      res.json({ date, stats });
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return res.status(404).json({ error: 'No logs found for this date' });
      }
      throw error;
    }
  } catch (error) {
    logWithMetadata('error', 'Failed to get log statistics', { 
      date: req.params.date, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to retrieve log statistics' });
  }
});

// Download log file
router.get('/download/:date', async (req, res) => {
  try {
    const { date } = req.params;

    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const logFileName = `${date}.log.json`;
    const s3Key = `${LOGS_FOLDER}/${logFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: 3600, // 1 hour
    };

    // Generate signed URL for download
    const signedUrl = s3.getSignedUrl('getObject', params);

    logWithMetadata('info', 'Log download URL generated', { date });
    res.json({ downloadUrl: signedUrl });
  } catch (error) {
    logWithMetadata('error', 'Failed to generate download URL', { 
      date: req.params.date, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Frontend log endpoint
router.post('/frontend', async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'Logs must be an array' });
    }

    // Process each log entry
    for (const logEntry of logs) {
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
      }

      // Add frontend log entry
      const processedLogEntry = {
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        message: logEntry.message,
        serviceName: 'frontend',
        ...logEntry.metadata,
      };

      existingLogs.push(processedLogEntry);

      // Upload updated logs to S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify(existingLogs, null, 2),
        ContentType: 'application/json',
      };

      await s3.putObject(uploadParams).promise();
    }

    logWithMetadata('info', 'Frontend logs received and processed', { 
      count: logs.length 
    });
    res.json({ success: true, processed: logs.length });
  } catch (error) {
    logWithMetadata('error', 'Failed to process frontend logs', { 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to process logs' });
  }
});

export default router; 