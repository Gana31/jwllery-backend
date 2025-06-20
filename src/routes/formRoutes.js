import express from "express";
import {
  submitAppraisalForm,
  getAllAppraisals,
  getAppraisalById,
  generateAppraisalPdf,
  getAppraisalPdfById,
  generateAppraisalPdfDirect,
  renderSbiTemplateTest,
  renderGoldCertificate,
  renderTestCertificate,
} from "../controllers/formController.js";
import path from 'path';

const router = express.Router();

// Submit appraisal form
router.post("/appraisal", submitAppraisalForm);

// Get all appraisals (optional - for admin)
router.get("/appraisals", getAllAppraisals);

// Get specific appraisal by ID (optional)
router.get("/appraisals/:id", getAppraisalById);

// Generate PDF and save data
router.post("/appraisal/pdf", generateAppraisalPdf);

// Serve PDF for a given appraisal ID
router.get("/appraisal/pdf/:id", getAppraisalPdfById);

// Serve PDF directly for testing (POST with form data, returns PDF file)
router.post("/appraisal/pdf-direct", generateAppraisalPdfDirect);

// Serve a dummy PDF for testing
router.get("/appraisal/dummy-pdf", (req, res) => {
  const filePath = path.join(process.cwd(), 'dummy.pdf');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=dummy.pdf');
  res.sendFile(filePath);
});

router.get("/appraisal/sbi-template-test", renderSbiTemplateTest);
router.get("/appraisal/union-template-test", renderGoldCertificate);

router.get("/appraisal/test-certificate", renderTestCertificate);
export default router; 