import express from "express";
import {
  getAllPdfs,
  downloadPdf,
} from "../controllers/formController.js";
import { renderBarodaTemplateTest, renderBankOfMaharastraTest, renderShivkrupaTest } from "../controllers/testController.js";
import { auth, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get("/admin/pdfs", auth, isAdmin, getAllPdfs);
router.get("/admin/pdfs/:id/download", auth, isAdmin, downloadPdf);
router.get("/test/baroda-template", renderBarodaTemplateTest);
router.get("/test/bank-of-maharastra", renderBankOfMaharastraTest);
router.get("/test/shivkrupa-appraisal", renderShivkrupaTest);

export default router; 