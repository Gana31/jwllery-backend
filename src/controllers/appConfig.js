import AppConfigModel from "../models/AppConfigModel.js";
import { setS3BaseUrl } from "../config/s3BaseUrlCache.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { uploadAppImageToS3 } from "../utils/s3.js";

export const getAppConfig = catchAsyncError(async (req, res, next) => {
  try {
    const config = await AppConfigModel.findOne();

    if (!config) return next(new ErrorHandler("AppConfig not found", 404));

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(new ErrorHandler("Server error", 500));
  }
});

export const updateAppConfig = catchAsyncError(async (req, res, next) => {
  try {
    let updateData = { ...req.body };
    // console.log(req.files);

    // Handle splashScreenLogo upload
    if (req.files && req.files.splashScreenLogo && req.files.splashScreenLogo[0]) {
      const uploadResult = await uploadAppImageToS3(req.files.splashScreenLogo[0]);
      // console.log(uploadResult);
      updateData.splashScreenLogo = uploadResult.path;
    }
    // Handle companyLogo upload
    if (req.files && req.files.companyLogo && req.files.companyLogo[0]) {
      const uploadResult = await uploadAppImageToS3(req.files.companyLogo[0]);
      updateData.companyLogo = uploadResult.path;
    }
    if (req.files && req.files.signature && req.files.signature[0]) {
      const uploadResult = await uploadAppImageToS3(req.files.signature[0]);
      updateData.signature = uploadResult.path;
    }

    // Update the AppConfig document
    const updatedConfig = await AppConfigModel.findOneAndUpdate(
      {}, // filter (assuming only one AppConfig)
      updateData,
      { new: true }
    );

    if (!updatedConfig) return next(new ErrorHandler("AppConfig not found", 404));

    // Update the S3 base URL cache if changed
    if (updatedConfig.s3BaseUrl) {
      setS3BaseUrl(updatedConfig.s3BaseUrl);
    }

    // Emit configUpdated event to all connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('configUpdated', { updatedAt: updatedConfig.updatedAt });
    }

    res.status(200).json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler("Server error", 500));
  }
});

