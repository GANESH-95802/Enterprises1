const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file types (whitelist)
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,text/plain')
  .split(',')
  .map((t) => t.trim());

// Max file size (default: 10MB)
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Sanitize filename — remove path traversal attempts and dangerous characters
const sanitizeFilename = (originalName) => {
  // Remove any path components (prevents ../ traversal)
  const baseName = path.basename(originalName);
  // Remove dangerous characters
  const cleaned = baseName
    .replace(/[^\w.\- ]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
  // Add timestamp prefix to prevent collisions
  return `${Date.now()}_${cleaned}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

// File filter — validate MIME type against whitelist
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`), false);
  }
};

// Multer configuration with security constraints
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE,
    files: 1, // Max 1 file per request
  },
  fileFilter,
});

// Middleware to handle upload errors gracefully
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_SIZE / (1024 * 1024)}MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = { upload, handleUploadError, ALLOWED_TYPES, MAX_SIZE };