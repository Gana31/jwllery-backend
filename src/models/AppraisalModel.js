import mongoose from "mongoose";

const AppraisalSchema = new mongoose.Schema(
  {
    formData: { type: Object, required: true }, // Store all form data
    pdfPath: { type: String }, // S3 relative path to PDF
    jewelleryImagePath: { type: String }, // S3 relative path to jewellery image
    createdBy: { type: String }, // Username or user ID
    pdfGeneratedAt: { type: Date, default: () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })) },
    renderData: { type: Object }, // Store rendered data
  },
  { timestamps: true }
);

// Pre-save hook to ensure createdAt/updatedAt are in IST
AppraisalSchema.pre('save', function(next) {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  if (!this.createdAt) this.createdAt = nowIST;
  this.updatedAt = nowIST;
  next();
});

const AppraisalModel = mongoose.model("Appraisal", AppraisalSchema);
export default AppraisalModel; 