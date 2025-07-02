import express from "express";
import { getAppConfig, updateAppConfig } from "../controllers/appConfig.js";
import upload from "../middlewares/muliter.js";
const appconfigRouter = express.Router();

appconfigRouter.get("/app-config", getAppConfig);
appconfigRouter.put(
  "/app-config",
  upload.fields([
    { name: 'splashScreenLogo', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  updateAppConfig
);
// appconfigRouter.post("/AddUser",AddUser)

export default appconfigRouter;
