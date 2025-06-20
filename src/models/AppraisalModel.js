import mongoose from "mongoose";

const AppraisalSchema = new mongoose.Schema(
  {
    formData: { type: Object, required: true }, // Store all form data
    pdfPath: { type: String }, // S3 relative path to PDF
    jewelleryImagePath: { type: String }, // S3 relative path to jewellery image
    createdBy: { type: String }, // Username or user ID
    pdfGeneratedAt: { type: Date, default: Date.now },
    renderData: { type: Object }, // Store rendered data
  },
  { timestamps: true }
);

const AppraisalModel = mongoose.model("Appraisal", AppraisalSchema);
export default AppraisalModel; 