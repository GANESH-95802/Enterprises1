const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Knowledge Upload Middleware
 * Dedicated multer configuration for knowledge base document ingestion.
 * Supports PDF, DOCX, TXT, and Markdown file types.
 */

// Knowledge upload directory
const KNOWLEDGE_UPLOAD_DIR = process.env.KNOWLEDGE_UPLOAD_DIR || 'uploads/knowledge';

// Ensure upload directory exists
if (!fs.existsSync(KNOWLEDGE_UPLOAD_DIR)) {
  fs.mkdirSync(KNOWLEDGE_UPLOAD_DIR, { recursive: true });
}

// Allowed knowledge document MIME types
const ALLOWED_KNOWLEDGE_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

// Allowed extensions (secondary validation)
const ALLOWED_KNOWLEDGE_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.text'];

// Max knowledge file size (default: 20MB)
const MAX_KNOWLEDGE_SIZE = parseInt(process.env.KNOWLEDGE_MAX_FILE_SIZE || '20971520', 10);

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
    cb(null, KNOWLEDGE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

// File filter — validate MIME type and extension against whitelist
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (ALLOWED_KNOWLEDGE_MIME_TYPES.includes(file.mimetype) ||
      ALLOWED_KNOWLEDGE_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Supported types: PDF, DOCX, TXT, Markdown.'), false);
  }
};

// Multer configuration with security constraints
const uploadKnowledge = multer({
  storage,
  limits: {
    fileSize: MAX_KNOWLEDGE_SIZE,
    files: 1, // Max 1 file per request
  },
  fileFilter,
});

// Middleware to handle knowledge upload errors gracefully
const handleKnowledgeUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${Math.round(MAX_KNOWLEDGE_SIZE / (1024 * 1024))}MB.`,
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
  uploadKnowledge,
  handleKnowledgeUploadError,
  ALLOWED_KNOWLEDGE_MIME_TYPES,
  ALLOWED_KNOWLEDGE_EXTENSIONS,
  MAX_KNOWLEDGE_SIZE,
  KNOWLEDGE_UPLOAD_DIR,
};