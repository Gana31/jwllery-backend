#!/usr/bin/env node

import AWS from 'aws-sdk';
const { S3 } = AWS;
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const LOGS_FOLDER = 'logs';

// Helper function to get logs for a specific date
async function getLogs(date, options = {}) {
  try {
    const logFileName = `${date}.log.json`;
    const s3Key = `${LOGS_FOLDER}/${logFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const response = await s3.getObject(params).promise();
    let logs = JSON.parse(response.Body.toString());

    // Apply filters
    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }

    if (options.service) {
      logs = logs.filter(log => log.serviceName === options.service);
    }

    if (options.limit) {
      logs = logs.slice(-parseInt(options.limit));
    }

    return logs;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      throw new Error(`No logs found for date: ${date}`);
    }
    throw error;
  }
}

// Helper function to get available dates
async function getAvailableDates() {
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

    return dates;
  } catch (error) {
    throw new Error(`Failed to get available dates: ${error.message}`);
  }
}

// Helper function to display logs in table format
function displayLogsTable(logs) {
  const table = new Table({
    head: [
      chalk.cyan('Time'),
      chalk.cyan('Level'),
      chalk.cyan('Service'),
      chalk.cyan('Message'),
      chalk.cyan('User'),
    ],
    colWidths: [20, 8, 12, 40, 15],
  });

  logs.forEach(log => {
    const levelColor = log.level === 'error' ? chalk.red : 
                      log.level === 'warn' ? chalk.yellow : 
                      log.level === 'info' ? chalk.blue : chalk.gray;
    
    table.push([
      new Date(log.timestamp).toLocaleString(),
      levelColor(log.level.toUpperCase()),
      log.serviceName || 'unknown',
      log.message.substring(0, 37) + (log.message.length > 37 ? '...' : ''),
      log.metadata?.userId || 'anonymous',
    ]);
  });

  console.log(table.toString());
}

// Helper function to display statistics
function displayStats(logs) {
  const stats = {
    total: logs.length,
    byLevel: {},
    byService: {},
    errors: logs.filter(log => log.level === 'error').length,
    warnings: logs.filter(log => log.level === 'warn').length,
    info: logs.filter(log => log.level === 'info').length,
  };

  logs.forEach(log => {
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    const service = log.serviceName || 'unknown';
    stats.byService[service] = (stats.byService[service] || 0) + 1;
  });

  console.log(chalk.bold('\n📊 Log Statistics:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Total Logs: ${chalk.cyan(stats.total)}`);
  console.log(`Errors: ${chalk.red(stats.errors)}`);
  console.log(`Warnings: ${chalk.yellow(stats.warnings)}`);
  console.log(`Info: ${chalk.blue(stats.info)}`);

  console.log(chalk.bold('\n📈 By Level:'));
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    const color = level === 'error' ? chalk.red : 
                  level === 'warn' ? chalk.yellow : 
                  level === 'info' ? chalk.blue : chalk.gray;
    console.log(`  ${color(level)}: ${count}`);
  });

  console.log(chalk.bold('\n🏢 By Service:'));
  Object.entries(stats.byService).forEach(([service, count]) => {
    console.log(`  ${chalk.cyan(service)}: ${count}`);
  });
}

// CLI Commands
program
  .name('log-cli')
  .description('CLI tool for managing Jewellery App logs')
  .version('1.0.0');

program
  .command('list')
  .description('List available log dates')
  .action(async () => {
    try {
      const dates = await getAvailableDates();
      console.log(chalk.bold('\n📅 Available Log Dates:'));
      console.log(chalk.gray('─'.repeat(30)));
      
      if (dates.length === 0) {
        console.log(chalk.yellow('No log files found'));
        return;
      }

      dates.forEach(date => {
        console.log(`  ${chalk.cyan(date)}`);
      });
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('view <date>')
  .description('View logs for a specific date (YYYY-MM-DD)')
  .option('-l, --level <level>', 'Filter by log level (error, warn, info, debug)')
  .option('-s, --service <service>', 'Filter by service (frontend, backend)')
  .option('--limit <number>', 'Limit number of logs to display', '50')
  .option('--stats', 'Show statistics instead of logs')
  .action(async (date, options) => {
    try {
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error(chalk.red('❌ Invalid date format. Use YYYY-MM-DD'));
        process.exit(1);
      }

      const logs = await getLogs(date, options);

      if (options.stats) {
        displayStats(logs);
      } else {
        console.log(chalk.bold(`\n📋 Logs for ${chalk.cyan(date)}:`));
        console.log(chalk.gray('─'.repeat(80)));
        
        if (logs.length === 0) {
          console.log(chalk.yellow('No logs found for this date'));
          return;
        }

        displayLogsTable(logs);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search logs across all dates')
  .option('-d, --date <date>', 'Search in specific date (YYYY-MM-DD)')
  .option('-l, --level <level>', 'Filter by log level')
  .option('-s, --service <service>', 'Filter by service')
  .action(async (query, options) => {
    try {
      let dates = [];
      
      if (options.date) {
        if (!options.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.error(chalk.red('❌ Invalid date format. Use YYYY-MM-DD'));
          process.exit(1);
        }
        dates = [options.date];
      } else {
        dates = await getAvailableDates();
      }

      console.log(chalk.bold(`\n🔍 Searching for "${chalk.cyan(query)}"`));
      console.log(chalk.gray('─'.repeat(80)));

      let foundLogs = [];

      for (const date of dates) {
        try {
          const logs = await getLogs(date, options);
          const matchingLogs = logs.filter(log => 
            log.message.toLowerCase().includes(query.toLowerCase()) ||
            (log.metadata?.userId && log.metadata.userId.toLowerCase().includes(query.toLowerCase()))
          );

          if (matchingLogs.length > 0) {
            console.log(chalk.bold(`\n📅 ${date}:`));
            displayLogsTable(matchingLogs);
            foundLogs.push(...matchingLogs);
          }
        } catch (error) {
          // Skip dates with no logs
        }
      }

      if (foundLogs.length === 0) {
        console.log(chalk.yellow('No matching logs found'));
      } else {
        console.log(chalk.bold(`\n✅ Found ${chalk.cyan(foundLogs.length)} matching logs`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('stats <date>')
  .description('Show statistics for a specific date')
  .action(async (date) => {
    try {
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error(chalk.red('❌ Invalid date format. Use YYYY-MM-DD'));
        process.exit(1);
      }

      const logs = await getLogs(date);
      displayStats(logs);
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(); 