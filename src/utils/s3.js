import AWS from "aws-sdk";
const { S3 } = AWS;
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { getAppConfig } from "./getAppConfig.js";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});


// Sanitize filename for file system compatibility
const sanitizeFileName = (name) => {
  if (!name) return 'customer';
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim();
};

// Helper to generate folder
const getTodayDateFolder = () => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Exponential backoff helper for S3 operations
async function withExponentialBackoff(fn, maxRetries = 5, baseDelay = 500) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      // Check for S3 SlowDown error
      const isSlowDown = err && err.code === 'SlowDown';
      if (isSlowDown && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((res) => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

export const deleteFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await withExponentialBackoff(() => s3.deleteObject(params).promise());
  } catch (err) {
    console.error("S3 Delete Error:", err.message);
    throw new Error("Failed to delete old image from S3");
  }
};

export const deleteFromS3 = async (key) => {
  const config = await getAppConfig();
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });
  await s3.deleteObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }).promise();
};
// Upload image
export const uploadImageToS3 = async (customerName, file) => {
  const config = await getAppConfig();
  const ext = path.extname(file.originalname);
  const sanitizedCustomerName = sanitizeFileName(customerName);
  const key = `images/${getTodayDateFolder()}/${sanitizedCustomerName}-${uuidv4()}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await withExponentialBackoff(() => s3.upload(uploadParams).promise());
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key, // store this in DB
  };
};

// Upload PDF
export const uploadPdfToS3 = async (customerName, file) => {
  const config = await getAppConfig();
  const sanitizedCustomerName = sanitizeFileName(customerName);
  const key = `pdf/${getTodayDateFolder()}/${sanitizedCustomerName}-${uuidv4()}.pdf`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: "application/pdf",
  };

  await withExponentialBackoff(() => s3.upload(uploadParams).promise());
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key, // store this in DB
  };
};

// Upload App Image
export const uploadAppImageToS3 = async (file) => {
  const config = await getAppConfig();
  const ext = path.extname(file.originalname);
  const key = `appimages/${uuidv4()}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await withExponentialBackoff(() => s3.upload(uploadParams).promise());
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key,
  };
};

// Upload Bank Logo
export const uploadBankLogoToS3 = async (bankName, file) => {
  const config = await getAppConfig();
  const ext = path.extname(file.originalname);
  const sanitizedBankName = sanitizeFileName(bankName);
  const key = `banklogos/${sanitizedBankName}/${uuidv4()}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await withExponentialBackoff(() => s3.upload(uploadParams).promise());
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key,
  };
};
