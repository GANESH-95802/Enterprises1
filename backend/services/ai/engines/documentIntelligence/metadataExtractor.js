/**
 * Metadata Extractor (Phase 3C — Document Intelligence)
 * Extracts structured metadata from documents including author, title,
 * page count, word count, language detection, and document statistics.
 * Follows SOLID principles — this module is solely responsible for metadata extraction.
 */
const path = require('path');
const pdfParse = require('pdf-parse');

class MetadataExtractor {
  constructor() {
    this.stats = {
      totalExtracted: 0,
      totalFailures: 0,
    };
  }

  /**
   * Extract metadata from a document file.
   * @param {string} filePath - Path to the document
   * @param {string} fileType - File type (pdf, docx, txt, markdown)
   * @param {Object} file - Multer file object (optional)
   * @returns {Promise<Object>} - { success, metadata }
   */
  async extract(filePath, fileType, file = null) {
    try {
      let metadata = {
        author: '',
        title: '',
        subject: '',
        keywords: [],
        creator: '',
        producer: '',
        pageCount: 0,
        wordCount: 0,
        characterCount: 0,
        language: '',
        createdAt: null,
        modifiedAt: null,
        extra: {},
      };

      const type = String(fileType || '').toLowerCase();

      // Extract from PDF
      if (type === 'pdf') {
        const pdfMetadata = await this._extractPdfMetadata(filePath);
        metadata = { ...metadata, ...pdfMetadata };
      }

      // Extract from DOCX (mammoth doesn't expose metadata, use file fallback)
      if (type === 'docx') {
        metadata = { ...metadata, ...this._extractDocxMetadata(filePath) };
      }

      // Extract from text/markdown files
      if (['txt', 'markdown', 'md', 'text'].includes(type)) {
        metadata = { ...metadata, ...this._extractTextMetadata(filePath) };
      }

      // Use file object for size and name info when available
      if (file) {
        metadata.extra.fileName = file.originalname || '';
        metadata.extra.size = file.size || 0;
        metadata.extra.mimeType = file.mimetype || '';
      }

      // Count words/characters from the file content
      const textStats = await this._countTextStats(filePath, type);

      this.stats.totalExtracted += 1;

      return {
        success: true,
        metadata: {
          ...metadata,
          wordCount: textStats.wordCount,
          characterCount: textStats.characterCount,
          language: metadata.language || await this._detectLanguage(filePath, type),
          extra: {
            ...metadata.extra,
            ...textStats.extra,
          },
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Metadata Extractor - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract PDF metadata using pdf-parse
   * @param {string} filePath - PDF file path
   * @returns {Promise<Object>} - PDF metadata
   */
  async _extractPdfMetadata(filePath) {
    const fs = require('fs');
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await pdfParse(dataBuffer);

      const info = result.info || {};
      const metadata = {
        author: info.Author || '',
        title: info.Title || '',
        subject: info.Subject || '',
        creator: info.Creator || '',
        producer: info.Producer || '',
        pageCount: result.numpages || 0,
        language: this._detectLanguageFromText(result.text || ''),
        createdAt: info.CreationDate ? new Date(info.CreationDate) : null,
        modifiedAt: info.ModDate ? new Date(info.ModDate) : null,
      };

      // Extract keywords from XMP metadata if available
      if (info.Keywords) {
        metadata.keywords = String(info.Keywords).split(',').map((k) => k.trim()).filter(Boolean);
      }

      return metadata;
    } catch (error) {
      console.warn('PDF metadata extraction warning:', error.message);
      return {};
    }
  }

  /**
   * Extract DOCX metadata from file name and properties
   * @param {string} filePath - DOCX file path
   * @returns {Object} - DOCX metadata
   */
  _extractDocxMetadata(filePath) {
    const fs = require('fs');
    try {
      const stat = fs.statSync(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));
      const cleanedName = baseName.replace(/^\d+_/, '').replace(/_/g, ' ').trim();

      return {
        title: cleanedName || '',
        author: '',
        creator: '',
        producer: 'Microsoft Word',
        pageCount: 0,
        createdAt: stat.birthtime || null,
        modifiedAt: stat.mtime || null,
      };
    } catch {
      return {};
    }
  }

  /**
   * Extract metadata from text files
   * @param {string} filePath - Text file path
   * @returns {Object} - Text metadata
   */
  _extractTextMetadata(filePath) {
    const fs = require('fs');
    try {
      const stat = fs.statSync(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));
      const cleanedName = baseName.replace(/^\d+_/, '').replace(/_/g, ' ').trim();

      return {
        title: cleanedName || '',
        pageCount: 1,
        createdAt: stat.birthtime || null,
        modifiedAt: stat.mtime || null,
      };
    } catch {
      return {};
    }
  }

  /**
   * Count words and characters in a document
   * @param {string} filePath - File path
   * @param {string} fileType - File type
   * @returns {Promise<Object>} - Word/character counts
   */
  async _countTextStats(filePath, fileType) {
    const fs = require('fs');
    try {
      let text = '';

      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await pdfParse(dataBuffer);
        text = result.text || '';
      } else if (fileType === 'docx') {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value || '';
      } else {
        text = fs.readFileSync(filePath, 'utf-8') || '';
      }

      const words = text.split(/\s+/).filter(Boolean);
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

      return {
        wordCount: words.length,
        characterCount: text.length,
        extra: {
          paragraphCount: paragraphs.length,
          lineCount: text.split('\n').length,
        },
      };
    } catch (error) {
      console.warn('Text stats extraction warning:', error.message);
      return { wordCount: 0, characterCount: 0, extra: {} };
    }
  }

  /**
   * Detect language from file content
   * @param {string} filePath - File path
   * @param {string} fileType - File type
   * @returns {Promise<string>} - Detected language code
   */
  async _detectLanguage(filePath, fileType) {
    const fs = require('fs');
    try {
      let text = '';

      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await pdfParse(dataBuffer);
        text = result.text || '';
      } else if (fileType === 'docx') {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value || '';
      } else {
        text = fs.readFileSync(filePath, 'utf-8').substring(0, 50000) || '';
      }

      return this._detectLanguageFromText(text);
    } catch {
      return '';
    }
  }

  /**
   * Simple language detection based on character patterns
   * @param {string} text - Text sample
   * @returns {string} - Detected language code (en, fr, de, es, etc.)
   */
  _detectLanguageFromText(text) {
    if (!text || text.length < 20) return '';

    // Character frequency based detection
    const lower = text.toLowerCase();
    const commonEnglish = ['the', 'and', 'for', 'are', 'with', 'this', 'that', 'have'];
    const commonFrench = ['le', 'la', 'les', 'des', 'une', 'dans', 'pour', 'avec'];
    const commonGerman = ['der', 'die', 'das', 'und', 'für', 'von', 'mit', 'den'];
    const commonSpanish = ['el', 'la', 'los', 'las', 'para', 'con', 'por', 'una'];

    let en = 0, fr = 0, de = 0, es = 0;
    const words = lower.split(/\s+/).slice(0, 500);

    for (const word of words) {
      if (commonEnglish.includes(word)) en++;
      if (commonFrench.includes(word)) fr++;
      if (commonGerman.includes(word)) de++;
      if (commonSpanish.includes(word)) es++;
    }

    const scores = { en, fr, de, es };
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    if (best && best[1] > 0) {
      return best[0];
    }

    // Check character patterns for non-Latin scripts
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';

    return 'en';
  }

  /**
   * Get metadata extractor statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const metadataExtractor = new MetadataExtractor();

module.exports = metadataExtractor;
module.exports.MetadataExtractor = MetadataExtractor;