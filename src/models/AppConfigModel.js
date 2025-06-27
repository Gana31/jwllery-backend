import mongoose from "mongoose";
import { getS3BaseUrl } from '../config/s3BaseUrlCache.js';

const AppConfigSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      default: "Anand Jewellers",
    },
    companyLogo: {
      type: String, 
      default: "",
    },
    companyAddress: {
      type: String,
      required: true,
      default:
        "Shop No 5, Narsinh Residency, Main Road, New Sangvi, Pune 411061",
    },
    companyPhone: {
      type: String,
      required: true,
      default: "(020)2728 0188",
    },
    companyMobile: {
      type: String,
      required: true,
      default: "9822 880996 / 9422 556662",
    },
    companyEmail: {
      type: String,
      required: true,
      default: "anandsangvi@gmail.com",
    },

    splashScreenLogo: {
      type: String, 
      default: "",
    },
    splashScreenQuote: {
      type: String,
      default: "Purity, Honesty, Trust.",
    },
    s3BaseUrl: {
      type: String,
      required: true,
      default: "https://ganeshtest2.s3.ap-south-1.amazonaws.com",
    },
    typeOfBusiness: {
      type: String,
      default: "Goldsmith and Valuer",
    },
    membershipNo: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// List all image/pdf fields for S3 URL generation
AppConfigSchema.statics.s3Fields = ['splashScreenLogo','companyLogo'];


// Static method to ensure a default AppConfig document exists
AppConfigSchema.statics.ensureDefault = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create({}); // Uses schema defaults
  }
};

// Custom transform function to replace relative paths with full S3 URLs
function docTransform(doc, ret) {
  const baseS3Url = getS3BaseUrl();
  const fields = doc.constructor.s3Fields || [];
  fields.forEach(field => {
    if (ret[field]) {
      ret[field] = `${baseS3Url}/${ret[field]}`;
    }
  });
  return ret;
}

AppConfigSchema.set('toJSON', { virtuals: true, transform: docTransform });
AppConfigSchema.set('toObject', { virtuals: true, transform: docTransform });

// Pre-save hook to ensure createdAt/updatedAt are in IST
AppConfigSchema.pre('save', function(next) {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  if (!this.createdAt) this.createdAt = nowIST;
  this.updatedAt = nowIST;
  next();
});

const AppConfigModel = mongoose.model("AppConfig", AppConfigSchema);
export default AppConfigModel;
