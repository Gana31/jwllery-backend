import BankModel from "../models/BankModel.js";
import { deleteFileFromS3, uploadBankLogoToS3 } from "../utils/s3.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import path from "path";
import puppeteer from "puppeteer";
import { getAppConfig } from "../utils/getAppConfig.js";
import ejs from "ejs";
import AppraisalModel from "../models/AppraisalModel.js";
import { uploadImageToS3, uploadPdfToS3 } from "../utils/s3.js";
import { sbiRenderData } from '../utils/pdfMappers/sbiMapper.js';
import { unionRenderData } from '../utils/pdfMappers/unionMapper.js';
import { pnbRenderData } from '../utils/pdfMappers/pnbMapper.js';


function parseIfJsonString(val) {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

function generateSlug(name) {
  return name ? name.toLowerCase().replace(/\s+/g, '') : '';
}

// Create a new bank
export const createBank = catchAsyncError(async (req, res, next) => {
 try {
   const slug = generateSlug(req.body.bankName);
   let logoPath = "";
   let extraLogoPath = "";
 
   // Handle logo upload
   if (req.files?.logoPath?.[0]) {
     const uploadResult = await uploadBankLogoToS3(slug, req.files.logoPath[0]);
     logoPath = uploadResult.path;
   }
 
   // Handle extra logo upload
   if (req.files?.extralogoPath?.[0]) {
     const extraUploadResult = await uploadBankLogoToS3(`${slug}-extra`, req.files.extralogoPath[0]);
     extraLogoPath = extraUploadResult.path;
   }
 
   const bank = await BankModel.create({
     bankName: req.body.bankName,
     slug,
     logoPath,
     extralogoPath : extraLogoPath,
     branches: parseIfJsonString(req.body.branches) || [],
     ornamentFields: parseIfJsonString(req.body.ornamentFields) || [],
     customerFields: parseIfJsonString(req.body.customerFields) || [],
     bankFields: parseIfJsonString(req.body.bankFields) || [],
     valuation: parseIfJsonString(req.body.valuation) || [],
     accountNo: req.body.accountNo || "",
   });
 
   res.status(201).json({ success: true, data: bank });
 } catch (error) {
  throw new ErrorHandler(error.message, 500);
 }
});

// Get all banks with branches
export const getAllBanks = catchAsyncError(async (req, res, next) => {
  const banks = await BankModel.find();
  res.status(200).json({ success: true, data: banks });
});

// Update bank info or logo
export const updateBank = catchAsyncError(async (req, res, next) => {
  const updateData = { ...req.body };

  const existingBank = await BankModel.findById(req.params.id);
  if (!existingBank) return next(new ErrorHandler("Bank not found", 404));

  // Check for logo image update
  if (req.files?.logoPath?.[0]) {
    const newLogo = req.files.logoPath[0];

    // Delete old logo if it exists
    if (existingBank.logoPath) {
      await deleteFileFromS3(existingBank.logoPath);
    }

    // Upload new logo
    const uploadResult = await uploadBankLogoToS3(existingBank.slug, newLogo);
    updateData.logoPath = uploadResult.path;
  }

  // Check for extra logo image update
  if (req.files?.extralogoPath?.[0]) {
    const newExtraLogo = req.files.extralogoPath[0];

    // Delete old extra logo if it exists
    if (existingBank.extralogoPath) {
      await deleteFileFromS3(existingBank.extralogoPath);
    }

    // Upload new extra logo
    const extraUploadResult = await uploadBankLogoToS3(existingBank.slug, newExtraLogo);
    updateData.extralogoPath = extraUploadResult.path;
  }

  // Slugify bank name if changed
  if (req.body.bankName) {
    updateData.slug = generateSlug(req.body.bankName);
  }

  // Parse optional JSON fields
  if (typeof req.body.ornamentFields !== 'undefined') {
    updateData.ornamentFields = parseIfJsonString(req.body.ornamentFields);
  }
  if (typeof req.body.customerFields !== 'undefined') {
    updateData.customerFields = parseIfJsonString(req.body.customerFields);
  }
  if (typeof req.body.valuation !== 'undefined') {
    updateData.valuation = parseIfJsonString(req.body.valuation);
  }
  if (typeof req.body.branches !== 'undefined') {
    updateData.branches = parseIfJsonString(req.body.branches);
  }
  if (typeof req.body.bankFields !== 'undefined') {
    updateData.bankFields = parseIfJsonString(req.body.bankFields);
  } else {
    updateData.bankFields = [];
  }

  // Update bank
  const updatedBank = await BankModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json({ success: true, data: updatedBank });
});

// Delete a bank
export const deleteBank = catchAsyncError(async (req, res, next) => {
  const bank = await BankModel.findByIdAndDelete(req.params.id);
  if (!bank) return next(new ErrorHandler("Bank not found", 404));
  res.status(200).json({ success: true, message: "Bank deleted" });
});

// Add a branch to a bank
export const addBranch = catchAsyncError(async (req, res, next) => {
  const bank = await BankModel.findById(req.params.id);
  if (!bank) return next(new ErrorHandler("Bank not found", 404));
  if (!req.body.branchName) return next(new ErrorHandler("Branch name required", 400));
  if (bank.branches.includes(req.body.branchName)) {
    return next(new ErrorHandler("Branch already exists", 400));
  }
  bank.branches.push(req.body.branchName);
  await bank.save();
  res.status(200).json({ success: true, data: bank });
});

// Remove a branch from a bank
export const removeBranch = catchAsyncError(async (req, res, next) => {
  const bank = await BankModel.findById(req.params.id);
  if (!bank) return next(new ErrorHandler("Bank not found", 404));
  bank.branches = bank.branches.filter(b => b !== req.body.branchName);
  await bank.save();
  res.status(200).json({ success: true, data: bank });
});


export const generateBankPdf = async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);
    const bankType = (data.bankType || data.selectedBank || '').toLowerCase();
    const appConfig = await getAppConfig();
    const bankDetails = await BankModel.findOne({ bankName: data.selectedBank });

    // Parse incoming JSON strings
    const ornaments = typeof data.ornaments === 'string' ? JSON.parse(data.ornaments) : data.ornaments || [];
    const selectedTests = typeof data.selectedTests === 'string' ? JSON.parse(data.selectedTests) : data.selectedTests || [];
    const selectedValuation = typeof data.selectedValuation === 'string' ? JSON.parse(data.selectedValuation) : data.selectedValuation || [];
    const customerDetails = typeof data.customerDetails === 'string' ? JSON.parse(data.customerDetails) : data.customerDetails || {};
    const bankFields = typeof data.bankFields === 'string' ? JSON.parse(data.bankFields) : data.bankFields || [];

    // Upload jewellery photo if present
    let jewelleryImagePath = "";
    let jewelleryImageUrl = "";
    const jewelleryPhotoFile = req.file || (req.files?.jewelleryPhoto?.[0]);
    if (jewelleryPhotoFile) {
      const uploadResult = await uploadImageToS3(customerDetails?.customerName || "unknown", jewelleryPhotoFile);
      jewelleryImagePath = uploadResult.path;
      jewelleryImageUrl = uploadResult.fullUrl;
    }

    let renderData = {};
    let templateFile = '';

    if (bankType === 'sbi' || bankType === 'state bank of india') {
      renderData = sbiRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments,bankFields });
      templateFile = 'sbiTemplate.ejs';
    } else if (bankType === 'union' || bankType === 'union bank' || bankType === 'union bank of india') {
      renderData = unionRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, bankFields, ornaments, reqUser: req.user });
      templateFile = 'uiniontest.ejs';
    } else if (bankType === 'pnb' || bankType === 'punjab national bank.') {
      renderData = pnbRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments, bankFields });
      templateFile = 'pnbTemplate.ejs';
    } else {
      return res.status(400).json({ success: false, message: "Unsupported bank type" });
    }

    // Render EJS and generate PDF
    let html;
    if (bankType === 'sbi' || bankType === 'state bank of india') {
      html = await ejs.renderFile(
        path.join(process.cwd(), "views", templateFile),
        { ...renderData },
        { async: true }
      );
    } else {
      html = await ejs.renderFile(
        path.join(process.cwd(), "views", templateFile),
        { data: renderData },
        { async: true }
      );
    }
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Upload to S3
    const pdfUpload = await uploadPdfToS3(customerDetails.customerName || 'unknown', { buffer: pdfBuffer });
    const pdfPath = pdfUpload.path;

    // Save to DB
    await AppraisalModel.create({
      formData: data,
      renderData,
      pdfPath,
      jewelleryImagePath,
      createdBy: req.user?.username || 'unknown'
    });

    // Send as PDF response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${bankType}_appraisal.pdf`
    });
    res.end(pdfBuffer, 'binary');
  } catch (err) {
    console.error("Bank PDF generation error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};
