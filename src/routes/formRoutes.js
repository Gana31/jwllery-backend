import express from "express";
import {
  getAllPdfs,
  downloadPdf,
  deletePdf,
} from "../controllers/formController.js";
import { renderBarodaTemplateTest, renderBankOfMaharastraTest, renderShivkrupaTest } from "../controllers/testController.js";
import { auth,  roleCheck } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get("/admin/pdfs", auth, roleCheck(['admin','manager']), getAllPdfs);
router.get("/admin/pdfs/:id/download", auth, roleCheck(['admin','manager']), downloadPdf);
router.delete('/pdf/:id', auth, roleCheck(['manager']), deletePdf);
router.get("/test/baroda-template", renderBarodaTemplateTest);
router.get("/test/bank-of-maharastra", renderBankOfMaharastraTest);
router.get("/test/shivkrupa-appraisal", renderShivkrupaTest);

export default router; 