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

// Helper to generate folder
const getTodayDateFolder = () => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
};

export const deleteFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (err) {
    console.error("S3 Delete Error:", err.message);
    throw new Error("Failed to delete old image from S3");
  }
};
// Upload image
export const uploadImageToS3 = async (customerName, file) => {
  const config = await getAppConfig();
  const ext = path.extname(file.originalname);
  const key = `images/${getTodayDateFolder()}/${customerName}-${uuidv4()}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.upload(uploadParams).promise();
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key, // store this in DB
  };
};

// Upload PDF
export const uploadPdfToS3 = async (customerName, file) => {
  const config = await getAppConfig();
  const key = `pdf/${getTodayDateFolder()}/${customerName}-${uuidv4()}.pdf`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: "application/pdf",
  };

  await s3.upload(uploadParams).promise();
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

  await s3.upload(uploadParams).promise();
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key,
  };
};

// Upload Bank Logo
export const uploadBankLogoToS3 = async (bankName, file) => {
  const config = await getAppConfig();
  const ext = path.extname(file.originalname);
  const key = `banklogos/${bankName}/${uuidv4()}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.upload(uploadParams).promise();
  return {
    fullUrl: `${config.baseS3Url}/${key}`,
    path: key,
  };
};
