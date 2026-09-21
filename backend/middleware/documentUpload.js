const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Document Intelligence Upload Middleware (Phase 3C)
 * Dedicated multer configuration for document intelligence analysis uploads.
 * Supports PDF, DOCX, TXT, Markdown, and image files for OCR.
 */

// Document intelligence upload directory
const DOCUMENT_UPLOAD_DIR = process.env.DOCUMENT_UPLOAD_DIR || 'uploads/documents';

// Ensure upload directory exists
if (!fs.existsSync(DOCUMENT_UPLOAD_DIR)) {
  fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
}

// Allowed document intelligence MIME types
const ALLOWED_DOCUMENT_MIME_TYPES = [
  // Text documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  // Images (for OCR)
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
];

// Allowed extensions (secondary validation)
const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf', '.docx', '.txt', '.md', '.markdown', '.text',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff',
];

// Max document intelligence file size (default: 20MB)
const MAX_DOCUMENT_SIZE = parseInt(process.env.DOCUMENT_MAX_FILE_SIZE || '20971520', 10);

// Sanitize filename — remove path traversal attempts and dangerous characters
const sanitizeFilename = (originalName) => {
  const baseName = path.basename(originalName);
  const cleaned = baseName
    .replace(/[^\w.\- ]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
  return `${Date.now()}_${cleaned}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

// File filter — validate MIME type and extension against whitelist
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype) ||
      ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Supported types: PDF, DOCX, TXT, Markdown, and images (PNG, JPG, GIF, BMP, WEBP, TIFF).'), false);
  }
};

// Multer configuration with security constraints
const uploadDocument = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1, // Max 1 file per request
  },
  fileFilter,
});

// Middleware to handle document upload errors gracefully
const handleDocumentUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${Math.round(MAX_DOCUMENT_SIZE / (1024 * 1024))}MB.`,
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

module.exports = {
  uploadDocument,
  handleDocumentUploadError,
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE,
  DOCUMENT_UPLOAD_DIR,
};