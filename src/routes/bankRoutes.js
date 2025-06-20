import express from "express";
import {
  createBank,
  getAllBanks,
  updateBank,
  deleteBank,
  addBranch,
  removeBranch,
  generateSbiPdf,
  generateUnionPdf,
} from "../controllers/bankController.js";
import upload from "../middlewares/muliter.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/banks", upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "extraLogo", maxCount: 1 },
]), createBank);
router.get("/banks", getAllBanks);
router.put("/banks/:id",upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "extraLogo", maxCount: 1 }
]), updateBank);
router.delete("/banks/:id", deleteBank);
router.post("/banks/:id/branch", addBranch);
router.delete("/banks/:id/branch", removeBranch);
router.post('/bank/sbi-pdf', auth, upload.single('jewelleryPhoto'), generateSbiPdf);
router.post('/bank/union-pdf', auth, upload.single('jewelleryPhoto'), generateUnionPdf);

export default router; 