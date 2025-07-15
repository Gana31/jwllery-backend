import express from "express";
import {
  createBank,
  getAllBanks,
  updateBank,
  deleteBank,
  addBranch,
  removeBranch,
  generateBankPdf,
} from "../controllers/bankController.js";
import upload from "../middlewares/muliter.js";
import { auth } from "../middlewares/authMiddleware.js";
import { renderUnionTest, renderPnbTest, renderSbiTest } from '../controllers/testController.js';

const router = express.Router();

router.post("/banks", upload.fields([
  { name: "logoPath", maxCount: 1 },
  { name: "extralogoPath", maxCount: 1 },
]), createBank);
router.get("/banks", getAllBanks);
router.put("/banks/:id",upload.fields([
  { name: "logoPath", maxCount: 1 },
  { name: "extralogoPath", maxCount: 1 }
]), updateBank);
router.delete("/banks/:id", deleteBank);
router.post("/banks/:id/branch", addBranch);
router.delete("/banks/:id/branch", removeBranch);
router.post('/bank/generate-pdf', upload.single('jewelleryPhoto'), generateBankPdf);
// router.get('/test/union-ejs', renderUnionTest);
// router.get('/test/pnb-ejs', renderPnbTest);
// router.get('/test/sbi-ejs', renderSbiTest);

export default router; 