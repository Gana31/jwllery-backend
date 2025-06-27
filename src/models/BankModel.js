import mongoose from 'mongoose';
import { getS3BaseUrl } from '../config/s3BaseUrlCache.js';

const BankSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  logoPath: { type: String, required: true },
  branches: [{ type: String, required: true }],
  extralogoPath: { type: String, required: false },
  ornamentFields: [
    {
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, required: true },
      required: { type: Boolean, default: false },
    }
  ],
  customerFields: [
    {
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, required: true },
      role: { type: String, required: false ,  enum: ["netWeight", "goldRate", "approxValue"], },
      required: { type: Boolean, default: false },
    }
  ],
  bankFields: {
    type: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, required: true },
        role: { type: String, required: false ,  enum: ["netWeight", "goldRate", "approxValue"], },
        required: { type: Boolean, default: false },
      }
    ],
    default: []
  },
  valuation: [{ type: Number }],
  accountNo: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// List all image/pdf fields for S3 URL generation
BankSchema.statics.s3Fields = ['logoPath','extralogoPath'];

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

BankSchema.set('toJSON', { virtuals: true, transform: docTransform });
BankSchema.set('toObject', { virtuals: true, transform: docTransform });

// Pre-save hook to ensure createdAt/updatedAt are in IST
BankSchema.pre('save', function(next) {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  if (!this.createdAt) this.createdAt = nowIST;
  this.updatedAt = nowIST;
  next();
});

export default mongoose.model('Bank', BankSchema); 