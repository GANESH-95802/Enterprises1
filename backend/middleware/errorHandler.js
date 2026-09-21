const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum allowed size is 10MB.'
      : 'File upload error';
  }

  // Sanitize error message for production
  // Prevents leaking internal paths, DB connection strings, API keys, etc.
  const sanitizeMessage = (msg) => {
    if (process.env.NODE_ENV === 'production') {
      // Generic fallback for 500 errors
      if (statusCode >= 500) {
        return 'Internal server error';
      }
      // For 4xx errors, strip sensitive patterns
      return String(msg)
        .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[database-uri-redacted]')
        .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[api-key-redacted]')
        .replace(/AIza[A-Za-z0-9_-]{20,}/g, '[api-key-redacted]')
        .replace(/[A-Za-z]:\\[^\s]+/g, '[path-redacted]')
        .replace(/\/[a-zA-Z0-9_\/-]+\/[a-zA-Z0-9_\/-]+\.(js|ts|json|env)/g, '[file-path-redacted]')
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip-redacted]');
    }
    return msg;
  };

  // Log full error details for debugging (never sent to client)
  console.error(`[${new Date().toISOString()}] Error ${statusCode}:`, {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    message: sanitizeMessage(message),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;