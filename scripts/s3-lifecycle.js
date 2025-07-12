import AWS from 'aws-sdk';
const { S3 } = AWS;
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function setupLifecyclePolicy() {
  try {
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
    console.log(`✅ Lifecycle policy configured for bucket: ${BUCKET_NAME}`);
    console.log('📅 Logs will be automatically deleted after 10 days');
  } catch (error) {
    console.error('❌ Failed to configure lifecycle policy:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupLifecyclePolicy(); 