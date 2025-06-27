import catchAsyncError from "../utils/catchAsyncError.js";
import { getAppConfig } from "../utils/getAppConfig.js";
import BankModel from "../models/BankModel.js";
import path from "path";
import puppeteer from "puppeteer";
import AppraisalModel from "../models/AppraisalModel.js";

// Sanitize filename for file system compatibility
const sanitizeFileName = (name) => {
  if (!name) return 'customer';
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') 
    .trim();
};


export const getAllPdfs = catchAsyncError(async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      date = '',
      startDate = '',
      endDate = '',
      sortBy = 'pdfGeneratedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = {};
    
    // Search by customer name
    if (search) {
      query['formData.customerDetails.customerName'] = { 
        $regex: search, 
        $options: 'i' 
      };
    }
    
    // Filter by single date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.pdfGeneratedAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date
      
      query.pdfGeneratedAt = {
        $gte: start,
        $lt: end
      };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get total count for pagination
    const total = await AppraisalModel.countDocuments(query);
    
    // Get paginated results
    const pdfs = await AppraisalModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get S3 base URL from app config
    const appConfig = await getAppConfig();
    const s3BaseUrl = appConfig?.s3BaseUrl || '';
    
    // Transform data for frontend
    const transformedPdfs = pdfs.map(pdf => {
      // Extract customer name with better fallback logic
      let customerName = 'N/A';
      if (pdf.formData?.customerDetails?.customerName) {
        customerName = pdf.formData.customerDetails.customerName;
      } else if (pdf.formData?.customerName) {
        customerName = pdf.formData.customerName;
      } else if (pdf.formData?.customer?.name) {
        customerName = pdf.formData.customer.name;
      } else if (pdf.formData?.customer?.customerName) {
        customerName = pdf.formData.customer.customerName;
      }

      // Build full PDF URL
      let pdfUrl = null;
      if (pdf.pdfPath) {
        if (s3BaseUrl && !pdf.pdfPath.startsWith('http')) {
          pdfUrl = `${s3BaseUrl}/${pdf.pdfPath}`;
        } else if (pdf.pdfPath.startsWith('http')) {
          pdfUrl = pdf.pdfPath;
        }
      }

      return {
        _id: pdf._id,
        customerName: customerName,
        createdBy: pdf.createdBy || 'Unknown',
        bankName: pdf.formData?.selectedBank || pdf.formData?.bankName || 'N/A',
        pdfGeneratedAt: pdf.pdfGeneratedAt,
        createdAt: pdf.createdAt,
        pdfUrl: pdfUrl, // Full S3 URL for direct access
        pdfPath: pdf.pdfPath // Keep relative path for reference
      };
    });

    const response = {
      success: true,
      message: 'PDFs retrieved successfully',
      data: {
        pdfs: transformedPdfs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        s3BaseUrl,
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllPdfs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Download PDF by ID
export const downloadPdf = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  
  const appraisal = await AppraisalModel.findById(id);
  if (!appraisal) {
    return res.status(404).json({ 
      success: false, 
      message: 'PDF not found' 
    });
  }
  
  // Get S3 base URL from app config
  const appConfig = await getAppConfig();
  const s3BaseUrl = appConfig?.s3BaseUrl || '';
  
  // If PDF is stored in S3, serve it directly
  if (appraisal.pdfPath) {
    
    let fullPdfUrl = appraisal.pdfPath;
    if (s3BaseUrl && !appraisal.pdfPath.startsWith('http')) {
      fullPdfUrl = `${s3BaseUrl}/${appraisal.pdfPath}`;
    }
    
    // Set headers for file download
    const fileName = `appraisal_${sanitizeFileName(appraisal.formData?.customerDetails?.customerName) || 'customer'}_${id}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    // Redirect to S3 URL for direct download
    res.redirect(fullPdfUrl);
    return;
  }
  
  // If PDF is not stored, generate it on the fly
  const formData = appraisal.formData;
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
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to generate PDF', 
          error: err.message 
        });
      }
      
      try {
        // Generate PDF from HTML using Puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ 
          format: 'A4', 
          printBackground: true 
        });
        await browser.close();
   
        // Send PDF as file download
        const fileName = `appraisal_${sanitizeFileName(formData.customerDetails?.customerName) || 'customer'}_${id}.pdf`;
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
      } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to generate PDF', 
          error: error.message 
        });
      }
    }
  );
});

