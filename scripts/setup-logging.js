#!/usr/bin/env node

import AWS from 'aws-sdk';
const { S3 } = AWS;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function createS3Bucket() {
  try {
    console.log(`🪣 Creating S3 bucket: ${BUCKET_NAME}`);
    
    const params = {
      Bucket: BUCKET_NAME,
    };

    await s3.createBucket(params).promise();
    console.log(`✅ S3 bucket created successfully: ${BUCKET_NAME}`);
  } catch (error) {
    if (error.code === 'BucketAlreadyExists' || error.message.includes('already own it')) {
      console.log(`ℹ️  S3 bucket already exists: ${BUCKET_NAME}`);
    } else {
      console.error(`❌ Failed to create S3 bucket: ${error.message}`);
      throw error;
    }
  }
}

async function setupLifecyclePolicy() {
  try {
    console.log('🔄 Setting up lifecycle policy...');
    
    const lifecycleConfiguration = {
      Rules: [
        {
          ID: 'LogRetentionPolicy',
          Status: 'Enabled',
          Filter: {
            Prefix: 'logs/',
          },
          Expiration: {
            Days: 10, // Delete logs after 10 days
          },
          NoncurrentVersionExpiration: {
            NoncurrentDays: 1, // Delete non-current versions after 1 day
          },
        },
      ],
    };

    const params = {
      Bucket: BUCKET_NAME,
      LifecycleConfiguration: lifecycleConfiguration,
    };

    await s3.putBucketLifecycleConfiguration(params).promise();
    console.log('✅ Lifecycle policy configured successfully');
  } catch (error) {
    console.error(`❌ Failed to configure lifecycle policy: ${error.message}`);
    throw error;
  }
}

function createLogsDirectory() {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created local logs directory');
    } else {
      console.log('ℹ️  Local logs directory already exists');
    }
  } catch (error) {
    console.error(`❌ Failed to create logs directory: ${error.message}`);
    throw error;
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const required = [
    'AWS_ACCESS_KEY',
    'AWS_SECRET_KEY',
    'AWS_BUCKET_REGION',
    'AWS_BUCKET_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.log('📝 Please check your .env file');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

function displayNextSteps() {
  console.log('\n🎉 Logging system setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your server: npm run dev');
  console.log('2. Access the dashboard: http://localhost:3000/logs');
  console.log('3. Use CLI tool: node scripts/log-cli.js list');
  console.log('\n📚 Documentation: LOGGING_README.md');
  console.log('\n🔧 Available commands:');
  console.log('  • node scripts/log-cli.js list          # List log dates');
  console.log('  • node scripts/log-cli.js view 2025-01-15  # View logs');
  console.log('  • node scripts/log-cli.js stats 2025-01-15 # Show statistics');
  console.log('  • node scripts/log-cli.js search "error"   # Search logs');
}

async function main() {
  console.log('🚀 Setting up Jewellery App Logging System\n');
  
  try {
    // Check environment
    if (!checkEnvironmentVariables()) {
      process.exit(1);
    }

    // Create S3 bucket
    await createS3Bucket();

    // Setup lifecycle policy
    await setupLifecyclePolicy();

    // Create local logs directory
    createLogsDirectory();

    // Display next steps
    displayNextSteps();

  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup
main(); 