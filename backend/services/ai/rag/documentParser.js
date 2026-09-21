const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * DocumentParser
 * Parses uploaded documents (PDF, DOCX, TXT, Markdown) into plain text.
 * Follows SOLID principles — this module is solely responsible for parsing.
 */
class DocumentParser {
  constructor() {
    this.maxFileSize = parseInt(process.env.KNOWLEDGE_MAX_FILE_SIZE || '20971520', 10); // 20MB default
    this.supportedTypes = ['pdf', 'docx', 'txt', 'md', 'markdown', 'text'];
  }

  /**
   * Get file type from extension
   * @param {string} fileName - Original file name
   * @returns {string} - Normalized file type
   */
  getFileType(fileName) {
    const ext = path.extname(fileName || '').toLowerCase().replace('.', '');
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    if (ext === 'txt' || ext === 'text') return 'txt';
    return ext;
  }

  /**
   * Validate the file is supported and within size limits
   * @param {Object} file - Multer file object
   * @returns {Object} - { valid, fileType, error }
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file uploaded' };
    }

    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum allowed size is ${Math.round(this.maxFileSize / (1024 * 1024))}MB.`,
      };
    }

    const fileType = this.getFileType(file.originalname || '');
    if (!this.supportedTypes.includes(fileType)) {
      return {
        valid: false,
        error: `Unsupported file type: ${fileType || 'unknown'}. Supported types: PDF, DOCX, TXT, Markdown.`,
      };
    }

    return { valid: true, fileType };
  }

  /**
   * Parse a document and extract plain text content
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} - { success, text, fileType, contentHash }
   */
  async parse(file) {
    try {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, message: validation.error };
      }

      const fileType = validation.fileType;
      let text = '';

      if (fileType === 'pdf') {
        text = await this._parsePdf(file.path);
      } else if (fileType === 'docx') {
        text = await this._parseDocx(file.path);
      } else {
        text = await this._parseText(file.path);
      }

      if (!text || !text.trim()) {
        return { success: false, message: 'No readable text content found in the document' };
      }

      const contentHash = crypto
        .createHash('sha256')
        .update(text)
        .digest('hex');

      return {
        success: true,
        text: text.trim(),
        fileType,
        contentHash,
        length: text.length,
      };
    } catch (error) {
      console.error('Document parser error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Parse PDF using pdf-parse
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} - Extracted text
   */
  async _parsePdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text || '';
  }

  /**
   * Parse DOCX using mammoth
   * @param {string} filePath - Path to the DOCX file
   * @returns {Promise<string>} - Extracted text
   */
  async _parseDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  /**
   * Parse plain text (TXT, Markdown)
   * @param {string} filePath - Path to the text file
   * @returns {Promise<string>} - File content
   */
  async _parseText(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Clean up the uploaded file after processing
   * @param {string} filePath - Path to the file
   */
  cleanup(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Document parser cleanup error:', error.message);
    }
  }
}

// Export singleton
const documentParser = new DocumentParser();

module.exports = documentParser;
module.exports.DocumentParser = DocumentParser;