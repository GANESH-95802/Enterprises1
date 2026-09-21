/**
 * Document Analyzer (Phase 3C — Document Intelligence)
 * Coordinates the full document analysis pipeline:
 * Parse → OCR (for images) → Classify → Summarize → Extract → Analyze → Persist.
 * Reuses the existing RAG Document Parser and AiEmbedding services.
 * Follows SOLID principles — this module orchestrates the analysis pipeline.
 */
const fs = require('fs');
const crypto = require('crypto');
const documentParser = require('../../rag/documentParser');
const ocrService = require('./ocrService');
const classificationService = require('./classificationService');
const summarizationService = require('./summarizationService');
const extractionService = require('./extractionService');
const metadataExtractor = require('./metadataExtractor');
const DocumentAnalysis = require('../../../../models/DocumentAnalysis');

class DocumentAnalyzer {
  constructor() {
    this.stats = {
      totalAnalyzed: 0,
      totalFailures: 0,
      totalProcessingTimeMs: 0,
    };
  }

  /**
   * Analyze a document file.
   * @param {string} userId - User ID
   * @param {Object} file - Multer file object
   * @param {Object} options - { title, category, tags, language, useAI }
   * @returns {Promise<Object>} - { success, data }
   */
  async analyze(userId, file, options = {}) {
    const startTime = Date.now();
    let analysisRecord = null;

    try {
      // 1. Validate file
      if (!file) {
        return { success: false, message: 'No file provided' };
      }

      const fileType = documentParser.getFileType(file.originalname || '');
      if (!fileType) {
        documentParser.cleanup(file.path);
        return { success: false, message: 'Unsupported file type' };
      }

      // 2. Create the analysis record
      analysisRecord = await DocumentAnalysis.create({
        user: userId,
        fileName: file.originalname,
        fileType,
        mimeType: file.mimetype || '',
        size: file.size || 0,
        status: 'processing',
        category: options.category || 'general',
        tags: options.tags || [],
        storagePath: file.path || '',
        metadata: {
          source: options.source || 'upload',
          language: options.language || '',
          title: options.title || '',
        },
      });

      // 3. Parse text (OCR for images, document parser for text-based)
      let text = '';
      let ocrResult = null;
      let parseResult = null;

      if (ocrService.isImageFile(fileType)) {
        // OCR pipeline for images
        ocrResult = await ocrService.runOCR(file.path, {
          language: options.language || 'en',
        });
        if (!ocrResult.success) {
          throw new Error(ocrResult.message || 'OCR failed');
        }
        text = ocrResult.text || '';
        analysisRecord.ocr = {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          pages: ocrResult.pages || 1,
          language: ocrResult.language || 'en',
          processingTimeMs: ocrResult.processingTimeMs || 0,
          method: ocrResult.method || '',
        };
      } else {
        // Document parser for PDF/DOCX/TXT/Markdown
        parseResult = await documentParser.parse(file);
        if (!parseResult.success) {
          throw new Error(parseResult.message || 'Document parsing failed');
        }
        text = parseResult.text || '';
        analysisRecord.checksum = parseResult.contentHash || analysisRecord.checksum;
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No readable text content extracted from document');
      }

      // 4. Run analysis services (classification first, then use its type for extraction)
      const classificationResult = await classificationService.classify(text, { fileName: file.originalname });
      const classificationType = classificationResult.success ? classificationResult.classification.type : 'general';

      // 5. Run remaining services in parallel
      const [summaryResult, extractionResult, metadataResult] = await Promise.all([
        summarizationService.summarize(text, { useAI: options.useAI, maxSentences: options.maxSentences }),
        extractionService.extract(text, {
          type: classificationType,
          fileName: file.originalname,
          fileType,
        }),
        metadataExtractor.extract(file.path, fileType, file),
      ]);

      // 6. Compute text analysis statistics
      const analysis = this._computeTextAnalysis(text);

      // 7. Update the analysis record
      analysisRecord.status = 'analyzed';
      analysisRecord.processingTimeMs = Date.now() - startTime;
      analysisRecord.classification = classificationResult.success ? classificationResult.classification : {
        type: 'general', confidence: 0, category: 'general', labels: [], method: 'fallback',
      };
      analysisRecord.summary = summaryResult.success ? summaryResult.summary : {
        text: '', keyPoints: [], keywords: [], sentiment: 'neutral', sentimentScore: 0.5, method: 'none',
      };
      analysisRecord.extraction = extractionResult.success ? extractionResult.extraction : {};
      analysisRecord.metadata = {
        ...(metadataResult.metadata || {}),
        ...(analysisRecord.metadata || {}),
      };
      analysisRecord.analysis = analysis;

      // Compute checksum from the text if not already set
      if (!analysisRecord.checksum) {
        analysisRecord.checksum = crypto.createHash('sha256').update(text).digest('hex');
      }

      await analysisRecord.save();

      // Clean up files
      documentParser.cleanup(file.path);
      ocrService.cleanup(file.path);

      this.stats.totalAnalyzed += 1;
      this.stats.totalProcessingTimeMs += analysisRecord.processingTimeMs;

      // 8. Return the enriched result
      return {
        success: true,
        data: this._buildAnalysisResponse(analysisRecord),
      };
    } catch (error) {
      console.error('Document Analyzer - error:', error.message);
      this.stats.totalFailures += 1;

      if (analysisRecord) {
        analysisRecord.status = 'failed';
        analysisRecord.error = error.message;
        analysisRecord.processingTimeMs = Date.now() - startTime;
        await analysisRecord.save().catch(() => {});
      }

      // Clean up files
      if (file) {
        documentParser.cleanup(file.path);
        ocrService.cleanup(file.path);
      }

      return { success: false, message: error.message };
    }
  }

  /**
   * Compute text analysis statistics.
   * @param {string} text - Document text
   * @returns {Object} - Analysis statistics
   */
  _computeTextAnalysis(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
    const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim());

    const averageWordLength = words.length > 0
      ? Math.round((words.reduce((sum, w) => sum + w.length, 0) / words.length) * 10) / 10
      : 0;

    const readingTimeMinutes = words.length / 200;

    // Complexity heuristic
    const longWords = words.filter((w) => w.length > 8).length;
    const complexityRatio = words.length > 0 ? longWords / words.length : 0;
    const complexity = complexityRatio > 0.15 ? 'complex' : complexityRatio > 0.07 ? 'moderate' : 'simple';

    // Readability score (Flesch Reading Ease approximation)
    const totalSyllables = words.reduce((sum, word) => {
      const syllableCount = word.match(/[aeiouy]{1,2}/gi)?.length || 1;
      return sum + Math.max(1, syllableCount);
    }, 0);
    const readabilityScore = words.length > 0 && sentences.length > 0
      ? Math.max(0, Math.min(100, 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (totalSyllables / words.length)))
      : 0;

    return {
      textLength: text.length,
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      sentenceCount: sentences.length,
      averageWordLength,
      readingTimeMinutes: Math.round(readingTimeMinutes * 10) / 10,
      complexity,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
      languageConfidence: 0,
      topics: [],
    };
  }

  /**
   * Build the API response from an analysis record.
   * @param {Object} record - DocumentAnalysis document
   * @returns {Object} - Public response object
   */
  _buildAnalysisResponse(record) {
    return {
      analysisId: record._id,
      fileName: record.fileName,
      fileType: record.fileType,
      mimeType: record.mimeType,
      size: record.size,
      status: record.status,
      category: record.category,
      tags: record.tags,
      classification: record.classification,
      summary: record.summary,
      extraction: record.extraction,
      ocr: record.ocr,
      metadata: record.metadata,
      analysis: record.analysis,
      comparison: record.comparison,
      error: record.error,
      processingTimeMs: record.processingTimeMs,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Get analyzer statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const documentAnalyzer = new DocumentAnalyzer();

module.exports = documentAnalyzer;
module.exports.DocumentAnalyzer = DocumentAnalyzer;