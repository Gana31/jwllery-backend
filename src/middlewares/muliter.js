import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const type = file.mimetype.split("/")[0];
  if (type === "image" || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 11 * 1024 * 1024 }, // ~11MB
});

export default upload;
