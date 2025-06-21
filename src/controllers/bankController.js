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

// Utility function to format numbers with 2 decimal places
function formatToTwoDecimals(value) {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
}

// Utility function to format weight values with 3 decimal places
function formatToThreeDecimals(value) {
  const num = parseFloat(value) || 0;
  return num.toFixed(3);
}

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
  const slug = generateSlug(req.body.bankName);
  let logoPath = "";
  let extraLogoPath = "";

  // Handle logo upload
  if (req.files?.logo?.[0]) {
    const uploadResult = await uploadBankLogoToS3(slug, req.files.logo[0]);
    logoPath = uploadResult.path;
  }

  // Handle extra logo upload
  if (req.files?.extraLogo?.[0]) {
    const extraUploadResult = await uploadBankLogoToS3(`${slug}-extra`, req.files.extraLogo[0]);
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
    valuation: parseIfJsonString(req.body.valuation) || [],
    membershipNo: req.body.membershipNo || "",
  });

  res.status(201).json({ success: true, data: bank });
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
  if (req.files?.logo?.[0]) {
    const newLogo = req.files.logo[0];

    // Delete old logo if it exists
    if (existingBank.logoPath) {
      await deleteFileFromS3(existingBank.logoPath);
    }

    // Upload new logo
    const uploadResult = await uploadBankLogoToS3(existingBank.slug, newLogo);
    updateData.logoPath = uploadResult.path;
  }

  // Check for extra logo image update
  if (req.files?.extraLogo?.[0]) {
    const newExtraLogo = req.files.extraLogo[0];

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

export const generateSbiPdf = async (req, res) => {
  try {
    const data = req.body;
    const appConfig = await getAppConfig();
    const bankDetails = await BankModel.findOne({ bankName: data.selectedBank });
    // console.log(data);

    // Parse fields that may be sent as JSON strings
    const ornaments = typeof data.ornaments === 'string' ? JSON.parse(data.ornaments) : data.ornaments || [];
    const selectedTests = typeof data.selectedTests === 'string' ? JSON.parse(data.selectedTests) : data.selectedTests || [];
    const selectedValuation = typeof data.selectedValuation === 'string' ? JSON.parse(data.selectedValuation) : data.selectedValuation || [];
    const customerDetails = typeof data.customerDetails === 'string' ? JSON.parse(data.customerDetails) : data.customerDetails || {};

    // 1. Upload jewellery photo to S3
    let jewelleryImageUrl = '';
    let jewelleryImagePath = '';
    // Support both single and multiple file upload field names
    let jewelleryPhotoFile = req.file || (req.files && req.files.jewelleryPhoto && req.files.jewelleryPhoto[0]);
    if (jewelleryPhotoFile) {
      const imageUpload = await uploadImageToS3(
        customerDetails?.customerName || "unknown",
        jewelleryPhotoFile
      );
      jewelleryImageUrl = imageUpload.fullUrl;
      jewelleryImagePath = imageUpload.path;
    }

    // ...prepare goldItems, totals, valuations as before...
    const goldItems = ornaments.map(item => {
      // Use your backend logic to find the correct fields
      const netWeight = parseFloat(item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '0') || 0;
      const goldRate = parseFloat(item['Gold Rate Per Carat 22/20/18'] || item['goldRate'] || '0') || 0;
      const backendApprox = parseFloat((netWeight * goldRate).toFixed(2));

      // Try to get the frontend value (from the correct field)
      const frontendApprox = parseFloat(item['Approx Value In Rupees'] || item['approxValue'] || '0');

      // Compare with a tolerance
      const isClose = Math.abs(backendApprox - frontendApprox) < 0.01;
   
      return {
        description: item['Description of Gold Ornaments'] || item['description'],
        units: formatToTwoDecimals(item['No Of Units'] || item['units'] || '0'),
        purity: formatToTwoDecimals(item['Purity in Carat'] || item['purity'] || '0'),
        grossWeight: formatToThreeDecimals(item['Gross Weight in Grams'] || item['grossWeight'] || '0'),
        netWeight: formatToThreeDecimals(netWeight),
        goldRate: formatToTwoDecimals(goldRate),
        approxValue: formatToTwoDecimals(isClose ? frontendApprox : backendApprox),
        approxValueSource: isClose ? 'frontend' : 'backend', // (optional, for debugging)
      };
    });

    let totalUnits = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalApproxValue = 0;

    goldItems.forEach(item => {
      totalUnits += parseFloat(item.units || '0') || 0;
      totalGrossWeight += parseFloat(item.grossWeight || '0') || 0;
      totalNetWeight += parseFloat(item.netWeight || '0') || 0;
      totalApproxValue += parseFloat(item.approxValue || '0') || 0;
    });

    const valuations = selectedValuation.map(percentage => ({
      percentage: formatToTwoDecimals(percentage),
      amount: formatToTwoDecimals((totalApproxValue * (percentage / 100)))
    }));

    const renderData = {
      branchCode: data.selectedBranch,
      customerName: customerDetails?.customerName || '',
      address: customerDetails?.address || '',
      mobile: customerDetails?.phone || '',
      accountNumber: customerDetails?.accountNumber || '',
      pouchNumber: customerDetails?.pouchNo || '',
      appraisalDate: new Date().toLocaleDateString('en-GB'),
      apprenticeType: data.apprenticeType,
      reApprenticeName: data.reApprenticeName || '',
      purityTestMethod: (selectedTests || []).join(', '),
      place: data.selectedBranch,
      date: new Date().toLocaleString('en-GB'),
      jewelryImage: (`${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath.replace(/^\//, '')}`) || '', // S3 full URL for EJS
      jewellerPhoto: (`${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig?.companyLogo?.replace(/^\//, '')}`) || '',
      jewellerName: appConfig?.companyName || '',
      jewellerSubtitle: 'Goldsmith and Valuer',
      jewellerAddress: appConfig?.companyAddress || '',
      jewellerPhone: `Phone: ${appConfig?.companyPhone || ''}`,
      jewellerEmail: `Email: ${appConfig?.companyEmail || ''}`,
      jewellerAccount: `A/c no: ${bankDetails?.accountNo || '123123123'}`,
      jewellerMembership: `IOV membership No. : ${bankDetails?.membershipNo || "V123-42-313000"}`,
      goldRateDate: '22/20/18',
      goldItems,
      totalUnits: formatToTwoDecimals(totalUnits),
      totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
      totalNetWeight: formatToThreeDecimals(totalNetWeight),
      totalValue: formatToTwoDecimals(totalApproxValue),
      valuations
    };

    // 2. Render EJS and generate PDF
    const html = await ejs.renderFile(
      path.join(process.cwd(), "views", "sbiTemplate.ejs"),
      renderData,
      { async: true }
    );
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // 3. Upload PDF to S3
    const pdfUpload = await uploadPdfToS3(
      customerDetails?.customerName || "unknown",
      { buffer: pdfBuffer }
    );
    const pdfUrl = pdfUpload.fullUrl;
    const pdfPath = pdfUpload.path;

    // 4. Save to DB
    await AppraisalModel.create({
      formData: data,
      pdfPath,
      jewelleryImagePath,
      renderData,
      createdBy: req.user?.username || "unknown",
    });

    // 5. Return PDF as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=sbi_appraisal.pdf`,
    });
    res.end(pdfBuffer, "binary");
  } catch (err) {
    console.error("SBI PDF generation error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

export const generateUnionPdf = async (req, res) => {
  try {
    const data = req.body;
    const appConfig = await getAppConfig();
    const bankDetails = await BankModel.findOne({ bankName: data.selectedBank });

    // Parse incoming JSON strings
    const ornaments = typeof data.ornaments === 'string' ? JSON.parse(data.ornaments) : data.ornaments || [];
    const selectedTests = typeof data.selectedTests === 'string' ? JSON.parse(data.selectedTests) : data.selectedTests || [];
    const selectedValuation = typeof data.selectedValuation === 'string' ? JSON.parse(data.selectedValuation) : data.selectedValuation || [];
    const customerDetails = typeof data.customerDetails === 'string' ? JSON.parse(data.customerDetails) : data.customerDetails || {};

    // Upload jewellery photo if present
    let jewelleryImagePath = "";
    let jewelleryImageUrl = "";
    const jewelleryPhotoFile = req.file || (req.files?.jewelleryPhoto?.[0]);
    if (jewelleryPhotoFile) {
      const uploadResult = await uploadImageToS3(customerDetails?.customerName || "unknown", jewelleryPhotoFile);
      jewelleryImagePath = uploadResult.path;
      jewelleryImageUrl = uploadResult.fullUrl;
    }

    // Gold items mapping and totals
    const goldItems = ornaments.map(item => ({
      description: item.description,
      units: formatToTwoDecimals(item.units || 0),
      grossWeight: formatToThreeDecimals(item.grossWeight || 0),
      netWeight: formatToThreeDecimals(item.netWeight || 0),
      netWeightGrams: formatToTwoDecimals(item.purity || 0),
      purity: formatToTwoDecimals(item.purity || 0),
      equivalentWeight: formatToThreeDecimals(item.equivalentWeight || 0),
      ratePerGram: formatToTwoDecimals(item.ratePerGram || 0),
      value: formatToTwoDecimals(parseFloat(item.value?.replace(/,/g, '') || 0))
    }));

    // Totals
    let totalUnits = 0, totalGrossWeight = 0, totalNetWeight = 0, totalEquivalentWeight = 0, totalValue = 0;
    for (const item of goldItems) {
      totalUnits += parseFloat(item.units || 0);
      totalGrossWeight += parseFloat(item.grossWeight || 0);
      totalNetWeight += parseFloat(item.netWeight || 0);
      totalEquivalentWeight += parseFloat(item.equivalentWeight || 0);
      totalValue += parseFloat(item.value || 0);
    }

    // Final renderData
    const renderData = {
      // Bank
      bankName: data.selectedBank,
      branchName: data.selectedBranch,
      bankLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${bankDetails?.logoPath?.replace(/^\//, '')}`|| "",
      betiBachaoLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${ bankDetails?.extralogoPath?.replace(/^\//, '')}` || "",

      // Jeweller
      jewellerLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig?.companyLogo?.replace(/^\//, '')}`,
      jwellerDetails: {
        jewellerName: appConfig?.companyName || '',
        jewellerSubtitle: appConfig?.typeOfBusiness || '',
        jewellerAddress: appConfig?.companyAddress || '',
        jewellerPhone: appConfig?.companyPhone || '',
        jewellerMobile: appConfig?.companyMobile || '',
        jewellerEmail: appConfig?.companyEmail || '',
        jewellerUbiAc: bankDetails?.accountNo || '000000000',
        membershipNo: bankDetails?.membershipNo || '',
      },

      // Customer
      customerDetails: {
        customerName: customerDetails.customerName,
        customerAddress: customerDetails.address,
        mobileNo: customerDetails.phone,
        accountNo: customerDetails.accountNumber,
        custId: customerDetails.customerId,
        bagNo: customerDetails.begNo,
        fatherName: customerDetails.fatherName,
        age: customerDetails.age,
        address: customerDetails.address
      },

      // Gold items and totals
      ornaments: goldItems,
      ornamentImage:  `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath?.replace(/^\//, '')}`,
      totalUnits: formatToTwoDecimals(totalUnits),
      totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
      totalNetWeight: formatToThreeDecimals(totalNetWeight),
      totalEquivalentWeight: formatToThreeDecimals(totalEquivalentWeight),
      totalValue: formatToTwoDecimals(totalValue),

      // Valuation details
      bankCardRateWeight: formatToThreeDecimals(totalEquivalentWeight),
      bankCardRate: formatToTwoDecimals(customerDetails.goldAsPerMarketRate || 0),
      bankCardValue: formatToTwoDecimals(totalValue),
      eligibleAmount: formatToTwoDecimals(totalValue),
      loanRequested: formatToTwoDecimals(customerDetails.loanRequestedByBorrower || 0),
      lessMargin: formatToTwoDecimals(customerDetails.lessMargin35 || 0),
      minimumOfAboveTwo: formatToTwoDecimals(customerDetails.minimumOfAboveTwo || 0),
      loanAmount: formatToTwoDecimals(customerDetails.loanToBeSanctioned || 0),

      // Verifier
      marketRateValue: formatToTwoDecimals(customerDetails.goldAsPerMarketRate || 0),
      verifierName: req.user?.username || '',
      verifierFatherName: customerDetails.fatherName || '',
      verifierAge: customerDetails.age || '',
      verifierAddress: customerDetails.address || '',

      certifiedWeight: formatToThreeDecimals(totalEquivalentWeight),
      certifiedPurity: '22.00',
      certifiedLoanAmount: formatToTwoDecimals(customerDetails.loanToBeSanctioned || 0),

      // Testing
      selectedTests: selectedTests,
      testDate: new Date().toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      })
    };

    // Render EJS using uniontest.ejs
    const html = await ejs.renderFile(
      path.join(process.cwd(), "views", "uiniontest.ejs"),
      { data: renderData },
      { async: true }
    );

    // Generate PDF
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
      'Content-Disposition': 'attachment; filename=union_appraisal.pdf'
    });
    res.end(pdfBuffer, 'binary');

  } catch (err) {
    console.error("Union PDF generation error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};
