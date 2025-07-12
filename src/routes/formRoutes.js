import express from "express";
import {
  getAllPdfs,
  downloadPdf,
} from "../controllers/formController.js";
import { renderBarodaTemplateTest } from "../controllers/testController.js";
import { auth, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get("/admin/pdfs", auth, isAdmin, getAllPdfs);
router.get("/admin/pdfs/:id/download", auth, isAdmin, downloadPdf);
router.get("/test/baroda-template", renderBarodaTemplateTest);

export default router; 