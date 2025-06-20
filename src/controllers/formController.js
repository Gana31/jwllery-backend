import catchAsyncError from "../utils/catchAsyncError.js";
import { getAppConfig } from "../utils/getAppConfig.js";
import BankModel from "../models/BankModel.js";
import path from "path";
import puppeteer from "puppeteer";
import AppraisalModel from "../models/AppraisalModel.js";

// Submit appraisal form data (for preview or final save)
export const submitAppraisalForm = catchAsyncError(async (req, res, next) => {
  const formData = req.body;
  console.log(formData);
  const { isPreview = false } = req.body; // Check if this is for preview or final save
  
  if (isPreview) {
  
    const appConfig = await getAppConfig();
    // Fetch bank info/logo
    const bank = await BankModel.findOne({ bankName: formData.selectedBank }).lean();

    // Calculate totals and valuations
    const ornaments = formData.ornaments || [];
    const totalUnits = ornaments.reduce((sum, o) => sum + Number(o.units || 0), 0);
    const totalGrossWeight = ornaments.reduce((sum, o) => sum + Number(o.grossWeight || 0), 0).toFixed(3);
    const totalNetWeight = ornaments.reduce((sum, o) => sum + Number(o.netWeight || 0), 0).toFixed(3);
    const totalValue = ornaments.reduce((sum, o) => sum + Number(o.approxValue || 0), 0).toFixed(2);
    const valuation65 = (totalValue * 0.65).toFixed(2);
    const valuation70 = (totalValue * 0.70).toFixed(2);
    const valuation75 = (totalValue * 0.75).toFixed(2);

    // Render EJS template
    res.render(
      path.join("appraisalTemplate.ejs"),
      {
        bankLogo: bank?.logoPath || '',
        bankName: bank?.bankName || '',
        branchName: formData.selectedBranch || '',
        branchCode: formData.branchDetails?.["Branch Code"] || '',
        customerName: formData.customerDetails?.customerName || '',
        address: formData.customerDetails?.address || '',
        phone: formData.customerDetails?.phone || '',
        accountNumber: formData.customerDetails?.accountNumber || '',
        pouchNo: formData.customerDetails?.pouchNo || '',
        companyLogo: appConfig?.companyLogo || '',
        companyName: appConfig?.companyName || '',
        companyAddress: appConfig?.companyAddress || '',
        companyPhone: appConfig?.companyPhone || '',
        companyEmail: appConfig?.companyEmail || '',
        companyAccount: appConfig?.companyAccount || '',
        ornaments,
        totalUnits,
        totalGrossWeight,
        totalNetWeight,
        totalValue,
        valuation65,
        valuation70,
        valuation75,
        purityMethods: formData.purityMethods || 'TouchStone test, Sound Test, Acid Test',
        date: formData.date || new Date().toLocaleString('en-GB'),
        jewelleryPhoto: formData.jewelleryPhoto || '',
      },
      (err, html) => {
        if (err) {
          console.error('EJS render error:', err);
          return res.status(500).json({ success: false, message: 'Failed to render preview', error: err.message });
        }
        res.status(200).json({
          success: true,
          message: "Appraisal form preview HTML generated",
          data: {
            id: Date.now().toString(),
            previewAt: new Date().toISOString(),
            html,
            formData,
          }
        });
      }
    );
  } else {
    // For final save - save to database (you can implement this later)
    // const appraisal = await AppraisalModel.create(formData);
    
    res.status(200).json({ 
      success: true, 
      message: "Appraisal form completed and saved successfully",
      data: {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        formData: formData
      }
    });
  }
});

// Get all submitted forms (optional - for admin purposes)
export const getAllAppraisals = catchAsyncError(async (req, res, next) => {
  // This would typically fetch from database
  // const appraisals = await AppraisalModel.find().sort({ createdAt: -1 });
  
  res.status(200).json({ 
    success: true, 
    message: "Appraisals retrieved successfully",
    data: [] // Return empty array for now, implement database later
  });
});

// Get a specific appraisal by ID (optional)
export const getAppraisalById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  
  // This would typically fetch from database
  // const appraisal = await AppraisalModel.findById(id);
  // if (!appraisal) return next(new ErrorHandler("Appraisal not found", 404));
  
  res.status(200).json({ 
    success: true, 
    message: "Appraisal retrieved successfully",
    data: { id, message: "Appraisal data would be returned here" }
  });
});

// Generate PDF, save data, and return PDF file or URL
export const generateAppraisalPdf = catchAsyncError(async (req, res, next) => {
  const formData = req.body;
  // Save form data in the database
  const saved = await AppraisalModel.create({ formData, pdfGeneratedAt: new Date() });
  res.status(200).json({
    success: true,
    message: 'Appraisal saved successfully',
    data: { id: saved._id }
  });
});

export const getAppraisalPdfById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const appraisal = await AppraisalModel.findById(id);
  if (!appraisal) {
    return res.status(404).json({ success: false, message: 'Appraisal not found' });
  }
  const formData = appraisal.formData;
  // Fetch company info/logo
  const appConfig = await getAppConfig();
  // Fetch bank info/logo
  const bank = await BankModel.findOne({ bankName: formData.selectedBank }).lean();

  // Calculate totals and valuations
  const ornaments = formData.ornaments || [];
  const totalUnits = ornaments.reduce((sum, o) => sum + Number(o.units || 0), 0);
  const totalGrossWeight = ornaments.reduce((sum, o) => sum + Number(o.grossWeight || 0), 0).toFixed(3);
  const totalNetWeight = ornaments.reduce((sum, o) => sum + Number(o.netWeight || 0), 0).toFixed(3);
  const totalValue = ornaments.reduce((sum, o) => sum + Number(o.approxValue || 0), 0).toFixed(2);
  const valuation65 = (totalValue * 0.65).toFixed(2);
  const valuation70 = (totalValue * 0.70).toFixed(2);
  const valuation75 = (totalValue * 0.75).toFixed(2);

  // Render EJS template to HTML
  res.render(
    path.join("appraisalTemplate.ejs"),
    {
      bankLogo: bank?.logoPath || '',
      bankName: bank?.bankName || '',
      branchName: formData.selectedBranch || '',
      branchCode: formData.branchDetails?.["Branch Code"] || '',
      customerName: formData.customerDetails?.customerName || '',
      address: formData.customerDetails?.address || '',
      phone: formData.customerDetails?.phone || '',
      accountNumber: formData.customerDetails?.accountNumber || '',
      pouchNo: formData.customerDetails?.pouchNo || '',
      companyLogo: appConfig?.companyLogo || '',
      companyName: appConfig?.companyName || '',
      companyAddress: appConfig?.companyAddress || '',
      companyPhone: appConfig?.companyPhone || '',
      companyEmail: appConfig?.companyEmail || '',
      companyAccount: appConfig?.companyAccount || '',
      ornaments,
      totalUnits,
      totalGrossWeight,
      totalNetWeight,
      totalValue,
      valuation65,
      valuation70,
      valuation75,
      purityMethods: formData.purityMethods || 'TouchStone test, Sound Test, Acid Test',
      date: formData.date || new Date().toLocaleString('en-GB'),
      jewelleryPhoto: formData.jewelleryPhoto || '',
    },
    async (err, html) => {
      if (err) {
        console.error('EJS render error:', err);
        return res.status(500).json({ success: false, message: 'Failed to render PDF', error: err.message });
      }
      // Generate PDF from HTML using Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      // Send PDF as file download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=appraisal_${id}.pdf`,
      });
      res.end(pdfBuffer, 'binary');
    }
  );
});

export const generateAppraisalPdfDirect = catchAsyncError(async (req, res, next) => {
  const formData = req.body;
  // Fetch company info/logo
  console.log(formData);
  const appConfig = await getAppConfig();
  // Fetch bank info/logo
  const bank = await BankModel.findOne({ bankName: formData.selectedBank }).lean();

  // Calculate totals and valuations
  const ornaments = formData.ornaments || [];
  const totalUnits = ornaments.reduce((sum, o) => sum + Number(o.units || 0), 0);
  const totalGrossWeight = ornaments.reduce((sum, o) => sum + Number(o.grossWeight || 0), 0).toFixed(3);
  const totalNetWeight = ornaments.reduce((sum, o) => sum + Number(o.netWeight || 0), 0).toFixed(3);
  const totalValue = ornaments.reduce((sum, o) => sum + Number(o.approxValue || 0), 0).toFixed(2);
  const valuation65 = (totalValue * 0.65).toFixed(2);
  const valuation70 = (totalValue * 0.70).toFixed(2);
  const valuation75 = (totalValue * 0.75).toFixed(2);

  // Render EJS template to HTML
  res.render(
    path.join("appraisalTemplate.ejs"),
    {
      bankLogo: bank?.logoPath || '',
      bankName: bank?.bankName || '',
      branchName: formData.selectedBranch || '',
      branchCode: formData.branchDetails?.["Branch Code"] || '',
      customerName: formData.customerDetails?.customerName || '',
      address: formData.customerDetails?.address || '',
      phone: formData.customerDetails?.phone || '',
      accountNumber: formData.customerDetails?.accountNumber || '',
      pouchNo: formData.customerDetails?.pouchNo || '',
      companyLogo: appConfig?.companyLogo || '',
      companyName: appConfig?.companyName || '',
      companyAddress: appConfig?.companyAddress || '',
      companyPhone: appConfig?.companyPhone || '',
      companyEmail: appConfig?.companyEmail || '',
      companyAccount: appConfig?.companyAccount || '',
      ornaments,
      totalUnits,
      totalGrossWeight,
      totalNetWeight,
      totalValue,
      valuation65,
      valuation70,
      valuation75,
      purityMethods: formData.purityMethods || 'TouchStone test, Sound Test, Acid Test',
      date: formData.date || new Date().toLocaleString('en-GB'),
      jewelleryPhoto: formData.jewelleryPhoto || '',
    },
    async (err, html) => {
      if (err) {
        console.error('EJS render error:', err);
        return res.status(500).json({ success: false, message: 'Failed to render PDF', error: err.message });
      }
      // Generate PDF from HTML using Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      // Send PDF as file download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=appraisal_direct.pdf`,
      });
      res.end(pdfBuffer, 'binary');
    }
  );
});

export const renderSbiTemplateTest = (req, res) => {
  const receiptData = {
    branchCode: "Aundh (8784)",
    customerName: "Aishwaraya Sanket Bhokre",
    address: "Pimple Saudagar",
    mobile: "7499835012",
    accountNumber: "35788912455",
    pouchNumber: "1414313",
    jewellerName: "Anand Jewellers",
    jewellerSubtitle: "Goldsmith and Valuer",
    jewellerAddress: "Shop No 5,Narsnh Residency ,Main Road, New Sangvi, Pune 411061",
    jewellerPhone: "Land Line (020)2728 0188 Mobile 9822 880996,9422 556602",
    jewellerEmail: "Email : anandsangvi@gmail.com",
    jewellerAccount: "SBI A/c no. :- 40898027227",
    jewellerMembership: "IOV membership No. :V123-42-31308",
    receiptNumber: "7637",
    appraisalDate: "08/02/2025",
    goldRateDate: "22/20/18",
    iovMembership: "V123-42-31308",
    goldItems: [
      { description: "Bangles", units: "2", purity: "22", grossWeight: "35.000", netWeight: "34.000", goldRate: "7001", approxValue: "238034.00" },
      { description: "Finger Ring", units: "3", purity: "22", grossWeight: "14.850", netWeight: "14.500", goldRate: "7001", approxValue: "101514.50" },
      { description: "Chain with Penden", units: "1", purity: "22", grossWeight: "17.350", netWeight: "16.500", goldRate: "7001", approxValue: "115516.50" },
      { description: "Ranihar", units: "1", purity: "22", grossWeight: "36.400", netWeight: "32.000", goldRate: "7001", approxValue: "224032.00" },
      { description: "Earring", units: "2", purity: "22", grossWeight: "3.000", netWeight: "2.750", goldRate: "7001", approxValue: "19252.75" },
      { description: "Coin", units: "1", purity: "22", grossWeight: "5.000", netWeight: "5.000", goldRate: "7001", approxValue: "35005.00" }
    ],
    totalUnits: "10",
    totalGrossWeight: "111.600",
    totalNetWeight: "104.750",
    totalValue: "7,33,354.75",
    valuation65: "4,76,680.59",
    valuation70: "5,13,348.33",
    valuation75: "5,50,016.06",
    purityTestMethod: "TouchStone test, Sound Test, Acid Test",
    place: "Aundh (8784)",
    date: "08/02/2025 11:27 AM"
  };
  res.render("sbitemplate.ejs", receiptData);
};

export const renderGoldCertificate = (req, res) => {
  const ITEMS_PER_PAGE = 15;

  const certificateData = {
    jewellerInfo: {
      name: "Anand Jewellers",
      address: "Shop No 5, Narsnh Residency ,Main Road, New Sangvi, Pune 411061",
      phone: "(020)27280188",
      mobile: "9822880996",
      email: "anandsangvi@gmail.com"
    },
    customerInfo: {
      name: "Aishwarya Sanket Bhokre",
      custId: "CUST001",
      address: "Pimple Saudagar",
      bagNo: "BAG123",
      mobileNo: "7499835012",
      acNo: "35788912455",
      ubiAcNo: "40898027227",
      iovMembershipNo: "V123-42-31308"
    },
    certifierName: "Ganesh Ronghe",
    certifierFatherName: "Ramesh Ronghe",
    certifierAge: 38,
    certifierAddress: "Sangvi, Pune",
    bankCardRate: 7001,
    testDate: "08/02/2025",
    testTime: "11:27 AM"
  };

  // Dummy ornament items (more than 10 to test pagination)
  const ornaments = [
    { srNo: 1, description: "Bangles", noOfUnits: 2, grossWeightGrams: 35.0, netWeightGrams: 34.0, purityCarat: 22, equivalentWeight22Carat: 34.0, ratePerGram: 7001 },
    { srNo: 2, description: "Ring", noOfUnits: 1, grossWeightGrams: 7.5, netWeightGrams: 7.0, purityCarat: 22, equivalentWeight22Carat: 7.0, ratePerGram: 7001 },
    { srNo: 3, description: "Chain", noOfUnits: 1, grossWeightGrams: 15.3, netWeightGrams: 14.8, purityCarat: 22, equivalentWeight22Carat: 14.8, ratePerGram: 7001 },
    { srNo: 4, description: "Earring", noOfUnits: 2, grossWeightGrams: 6.0, netWeightGrams: 5.6, purityCarat: 22, equivalentWeight22Carat: 5.6, ratePerGram: 7001 },
    { srNo: 5, description: "Coin", noOfUnits: 1, grossWeightGrams: 5.0, netWeightGrams: 5.0, purityCarat: 22, equivalentWeight22Carat: 5.0, ratePerGram: 7001 },
    { srNo: 6, description: "Pendant", noOfUnits: 1, grossWeightGrams: 8.0, netWeightGrams: 7.6, purityCarat: 22, equivalentWeight22Carat: 7.6, ratePerGram: 7001 },
    { srNo: 7, description: "Bracelet", noOfUnits: 1, grossWeightGrams: 10.0, netWeightGrams: 9.5, purityCarat: 22, equivalentWeight22Carat: 9.5, ratePerGram: 7001 },
    { srNo: 8, description: "Necklace", noOfUnits: 1, grossWeightGrams: 20.0, netWeightGrams: 19.0, purityCarat: 22, equivalentWeight22Carat: 19.0, ratePerGram: 7001 },
    { srNo: 9, description: "Ring (2)", noOfUnits: 2, grossWeightGrams: 5.0, netWeightGrams: 4.7, purityCarat: 22, equivalentWeight22Carat: 4.7, ratePerGram: 7001 },
    { srNo: 10, description: "Chain (2)", noOfUnits: 1, grossWeightGrams: 18.5, netWeightGrams: 17.8, purityCarat: 22, equivalentWeight22Carat: 17.8, ratePerGram: 7001 },
    { srNo: 11, description: "Extra Ring", noOfUnits: 1, grossWeightGrams: 4.0, netWeightGrams: 3.8, purityCarat: 22, equivalentWeight22Carat: 3.8, ratePerGram: 7001 }
  ];

  // Group ornaments into pages
  const ornamentPages = [];
  for (let i = 0; i < ornaments.length; i += ITEMS_PER_PAGE) {
    ornamentPages.push(ornaments.slice(i, i + ITEMS_PER_PAGE));
  }

  const totals = ornaments.reduce(
    (acc, item) => {
      acc.totalUnits += item.noOfUnits;
      acc.totalGrossWeight += item.grossWeightGrams;
      acc.totalNetWeight += item.netWeightGrams;
      acc.totalEquivalentWeight += item.equivalentWeight22Carat;
      acc.totalValue += item.equivalentWeight22Carat * item.ratePerGram;
      return acc;
    },
    {
      totalUnits: 0,
      totalGrossWeight: 0,
      totalNetWeight: 0,
      totalEquivalentWeight: 0,
      totalValue: 0
    }
  );

  res.render("unionTemplate.ejs", {
    certificateData,
    goldItems : ornaments,
    customerName : certificateData.customerInfo.name,
    address : certificateData.customerInfo.address,
    mobile : certificateData.customerInfo.mobileNo,
    accountNumber : certificateData.customerInfo.acNo,
    pouchNumber : certificateData.customerInfo.bagNo,
    date: new Date().toLocaleDateString('en-GB'),
    customerDetails : certificateData.customerInfo,
    jewellerName : certificateData.jewellerInfo.name,
    jewellerAddress : certificateData.jewellerInfo.address,
    jewellerPhone : certificateData.jewellerInfo.phone,
    jewellerMobile : certificateData.jewellerInfo.mobile,
    jewellerEmail : certificateData.jewellerInfo.email,
    jewellerAccount : certificateData.jewellerInfo.account,
    jewellerMembership : certificateData.jewellerInfo.membership,
    jewelryImage : 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    selectedBranch : 'kothroud',
    ornamentPages,
    totalUnits : totals.totalUnits,
    totalGrossWeight : totals.totalGrossWeight,
    totalNetWeight : totals.totalNetWeight,
    totalEquivalentWeight : totals.totalEquivalentWeight,
    totalValue : totals.totalValue,
    ITEMS_PER_PAGE
  });
};



export const renderTestCertificate = (req, res) => {
  const ITEMS_PER_PAGE = 15;
  const testDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
  });
  const data = {
    // Bank Information
    bankName: "Union Bank Of India",
    branchName: "New sangvi",
    bankLogoUrl:"https://ganeshtest2.s3.ap-south-1.amazonaws.com/banklogos/unionbank/96fec7f8-8ab2-4492-a277-ef301c91a9fb.avif",
    jewellerLogoUrl:"https://ganeshtest2.s3.ap-south-1.amazonaws.com/appimages/4b538a0c-17ad-46ae-8a77-47dc4119c86e.png",
    betiBachaoLogoUrl:"https://ganeshtest2.s3.ap-south-1.amazonaws.com/banklogos/unionbank/5cb64865-baf2-4108-98eb-b84097bf51a3.png",
    // Customer Details
    customerDetails : {
    customerName: "asdfasfasfasdfaf",
    customerAddress: "sadfaasdfasf",
    mobileNo: "sdfasfasadfadsfas",
    accountNo: "safdasasdfsa",
    custId: "dsfadsfasadfadsf",
    bagNo: "asdfdsfdfasdfadfa",
    fatherName: "asdfasfasfasdfaf",
    age: "42",
    address: "asdfasfasfasdfaf",
    },
    ornamentImage : "https://ganeshtest2.s3.ap-south-1.amazonaws.com/banklogos/unionbank/5cb64865-baf2-4108-98eb-b84097bf51a3.png",
    
    // Jeweller Information
    jwellerDetails : {
      jewellerName: "Anand Jewellers",
    jewellerSubtitle: "Goldsmith a adsfasfand Valuer",
    jewellerAddress: "Shop No 5,Narsinh Residency ,Main Road, New Sangvi, Pune 411061",
    jewellerPhone: "(020)2728 0188",
    jewellerMobile: "9822 880996 / 9422 556662",
    jewellerEmail: "anandsangvi@gmail.com",
    jewellerUbiAc: "321802010120900",
    membershipNo: "-V/23-24/A-31308",
    
    },
    // Gold Items Array
    ornaments: [
        {
            description: "Finger Ring",
            units: "1",
            grossWeight: "3.110",
            netWeight: "2.750",
            netWeightGrams: "19",
            purity: "19",
            equivalentWeight: "2.38",
            ratePerGram: "7230.00",
            value: "17,171.25"
        },
        {
            description: "Mani Mala",
            units: "1",
            grossWeight: "13.080",
            netWeight: "7.000",
            netWeightGrams: "19",
            purity: "19",
            equivalentWeight: "6.05",
            ratePerGram: "",
            value: "43,708.64"
        }

    ],
    
    // Totals
    totalUnits: "2",
    totalGrossWeight: "16.190",
    totalNetWeight: "9.750",
    totalEquivalentWeight: "8.42",
    totalValue: "60,879.89",
    
    // Valuation Details
    bankCardRateWeight: "8.420",
    bankCardRate: "7230.00",
    bankCardValue: "60,879.89",
    eligibleAmount: "60,879.89",
    loanRequested: "60,879.89",
    lessMargin: "60,879.89",
    minimumOfAboveTwo: "60,879.89",
    loanAmount: "894689",
    
    // Verification Details
    marketRateValue: "000",
    verifierName: "Narendra Prakash Dhoka",
    verifierFatherName: "Prakash Dhoka",
    verifierAge: "41",
    verifierAddress: "Aundh",
    certifiedWeight: "8.420",
    certifiedPurity: "22",
    certifiedLoanAmount: "54545/454",
    selectedTests: ['touchstone', 'sound', 'magnet'],
    // Test Details
    testDate: testDate,
  };


  

  res.render("uiniontest.ejs", {data}
    );
};

// Sample data structure to pass to the EJS template

