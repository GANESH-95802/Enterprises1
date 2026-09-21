/**
 * Document Intelligence Engine (Phase 3C — Document Intelligence)
 * Enterprise document intelligence layer that integrates with the AI Enterprise Hub.
 * Reuses the existing RAG pipeline, Embedding Client, and AI services.
 *
 * Modules:
 * - Document Analyzer: Full analysis pipeline (parse, OCR, classify, summarize, extract, analyze)
 * - OCR Service: Image optical character recognition
 * - Classification Service: Document type classification
 * - Summarization Service: Document summarization
 * - Extraction Service: Structured data extraction
 * - Metadata Extractor: Document metadata extraction
 * - Document Comparison Service: Similarity comparison between documents
 */
const documentAnalyzer = require('./documentAnalyzer');
const ocrService = require('./ocrService');
const classificationService = require('./classificationService');
const summarizationService = require('./summarizationService');
const extractionService = require('./extractionService');
const metadataExtractor = require('./metadataExtractor');
const documentComparisonService = require('./documentComparisonService');
const DocumentAnalysis = require('../../../../models/DocumentAnalysis');

class DocumentIntelligenceEngine {
  constructor() {
    this.initialized = false;
    this.stats = {
      totalDocuments: 0,
      totalComparisons: 0,
      totalFailures: 0,
    };
  }

  /**
   * Initialize the document intelligence engine
   */
  initialize() {
    this.initialized = true;
    console.log('Document Intelligence Engine initialized');
    return true;
  }

  /**
   * Upload and analyze a document.
   * @param {string} userId - User ID
   * @param {Object} file - Multer file object
   * @param {Object} options - { title, category, tags, language, useAI }
   * @returns {Promise<Object>} - { success, data }
   */
  async uploadAndAnalyze(userId, file, options = {}) {
    this.stats.totalDocuments += 1;

    try {
      if (!this.initialized) this.initialize();

      const result = await documentAnalyzer.analyze(userId, file, options);
      if (!result.success) {
        this.stats.totalFailures += 1;
      }
      return result;
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Document Intelligence - upload error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Analyze an existing document by its storage content.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - { success, data }
   */
  async analyzeDocument(userId, analysisId, options = {}) {
    try {
      const document = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      // Check if already analyzed
      if (document.status === 'analyzed') {
        return { success: true, data: this._buildDocumentResponse(document) };
      }

      return { success: false, message: 'Document is not ready for analysis' };
    } catch (error) {
      console.error('Document Intelligence - analyze error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract structured information from an analyzed document.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @param {Object} options - { fields }
   * @returns {Promise<Object>} - { success, data }
   */
  async extractInformation(userId, analysisId, options = {}) {
    try {
      const document = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      if (document.status !== 'analyzed') {
        return { success: false, message: 'Document not yet analyzed' };
      }

      const extraction = document.extraction || {};

      // Filter by requested fields if provided
      let result = {
        entities: extraction.entities || {},
        structuredData: extraction.structuredData || {},
        tables: extraction.tables || [],
        fields: extraction.fields || {},
        formData: extraction.formData || {},
        confidence: extraction.confidence || 0,
      };

      if (options.fields && Array.isArray(options.fields)) {
        const filtered = {};
        for (const field of options.fields) {
          if (result[field] !== undefined) {
            filtered[field] = result[field];
          }
        }
        result = filtered;
      }

      return {
        success: true,
        data: {
          analysisId: document._id,
          fileName: document.fileName,
          extraction: result,
        },
      };
    } catch (error) {
      console.error('Document Intelligence - extract error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Summarize an analyzed document.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @param {Object} options - { maxSentences, useAI }
   * @returns {Promise<Object>} - { success, data }
   */
  async summarizeDocument(userId, analysisId, options = {}) {
    try {
      const document = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      if (document.status !== 'analyzed') {
        return { success: false, message: 'Document not yet analyzed' };
      }

      // Return stored summary or regenerate
      if (document.summary?.text && !options.regenerate) {
        return {
          success: true,
          data: {
            analysisId: document._id,
            fileName: document.fileName,
            summary: document.summary,
          },
        };
      }

      // Rebuild summary from stored extraction data
      const text = this._reconstructText(document);
      if (!text) {
        return { success: false, message: 'No text content available for summarization' };
      }

      const summaryResult = await summarizationService.summarize(text, {
        maxSentences: options.maxSentences,
        useAI: options.useAI,
      });

      if (!summaryResult.success) {
        return { success: false, message: summaryResult.message };
      }

      // Update the stored summary
      document.summary = summaryResult.summary;
      await document.save().catch(() => {});

      return {
        success: true,
        data: {
          analysisId: document._id,
          fileName: document.fileName,
          summary: summaryResult.summary,
        },
      };
    } catch (error) {
      console.error('Document Intelligence - summarize error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Compare two analyzed documents.
   * @param {string} userId - User ID
   * @param {string} sourceId - First document ID
   * @param {string} targetId - Second document ID
   * @returns {Promise<Object>} - { success, data }
   */
  async compareDocuments(userId, sourceId, targetId) {
    this.stats.totalComparisons += 1;

    try {
      const result = await documentComparisonService.compare(userId, sourceId, targetId);
      if (!result.success) {
        this.stats.totalFailures += 1;
      }
      return result;
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Document Intelligence - compare error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Find documents similar to a given analysis.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @param {Object} options - { limit, minScore }
   * @returns {Promise<Object>} - { success, data }
   */
  async findSimilarDocuments(userId, analysisId, options = {}) {
    this.stats.totalComparisons += 1;

    try {
      return await documentComparisonService.findSimilar(userId, analysisId, options);
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Document Intelligence - findSimilar error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get document analysis results.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @returns {Promise<Object>} - { success, data }
   */
  async getDocumentIntelligence(userId, analysisId) {
    try {
      const document = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!document) return { success: false, message: 'Document analysis not found' };

      return { success: true, data: this._buildDocumentResponse(document) };
    } catch (error) {
      console.error('Document Intelligence - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * List analyzed documents for a user.
   * @param {string} userId - User ID
   * @param {Object} options - { status, category, fileType, limit, skip, search }
   * @returns {Promise<Object>} - { success, data }
   */
  async listDocuments(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.status) query.status = options.status;
      if (options.category) query.category = options.category;
      if (options.fileType) query.fileType = options.fileType;
      if (options.search) {
        query.fileName = { $regex: options.search, $options: 'i' };
      }

      const limit = Math.min(options.limit || 20, 100);
      const skip = options.skip || 0;

      const [documents, total] = await Promise.all([
        DocumentAnalysis.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('fileName fileType size status category tags classification summary extraction analysis ocr comparison checksum error processingTimeMs createdAt updatedAt'),
        DocumentAnalysis.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          documents: documents.map((doc) => this._buildListResponse(doc)),
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Document Intelligence - list error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete an analysis record.
   * @param {string} userId - User ID
   * @param {string} analysisId - DocumentAnalysis ID
   * @returns {Promise<Object>} - { success, data }
   */
  async deleteDocument(userId, analysisId) {
    try {
      const document = await DocumentAnalysis.findOne({ _id: analysisId, user: userId });
      if (!document) return { success: false, message: 'Document analysis not found' };

      await DocumentAnalysis.deleteOne({ _id: analysisId, user: userId });

      return {
        success: true,
        data: {
          analysisId: document._id,
          fileName: document.fileName,
          message: 'Document analysis deleted',
        },
      };
    } catch (error) {
      console.error('Document Intelligence - delete error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get document intelligence engine statistics.
   * @returns {Object} - { success, data }
   */
  getStats() {
    return {
      success: true,
      data: {
        engine: { ...this.stats },
        analyzer: documentAnalyzer.getStats(),
        ocr: ocrService.getStats(),
        classification: classificationService.getStats(),
        summarization: summarizationService.getStats(),
        extraction: extractionService.getStats(),
        metadata: metadataExtractor.getStats(),
        comparison: documentComparisonService.getStats(),
      },
    };
  }

  /**
   * Get available document intelligence capabilities.
   * @returns {Object} - { success, data }
   */
  getCapabilities() {
    return {
      success: true,
      data: {
        id: 'document-intelligence',
        name: 'Document Intelligence Engine',
        description: 'Enterprise document intelligence with OCR, classification, summarization, extraction, and comparison.',
        features: [
          { id: 'ocr', name: 'OCR Pipeline', description: 'Optical character recognition for images' },
          { id: 'classification', name: 'Document Classification', description: 'Classifies documents into types with confidence scores' },
          { id: 'summarization', name: 'Document Summarization', description: 'AI-powered and extractive summarization with key points' },
          { id: 'extraction', name: 'Structured Extraction', description: 'Entity, table, field, and form data extraction' },
          { id: 'comparison', name: 'Document Comparison', description: 'Similarity analysis and difference detection' },
          { id: 'metadata', name: 'Metadata Extraction', description: 'Author, title, page count, language extraction' },
        ],
        supportedTypes: ['pdf', 'docx', 'txt', 'markdown', 'md', 'text', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'],
      },
    };
  }

  /**
   * Reconstruct text from stored analysis data for re-processing.
   * @param {Object} document - DocumentAnalysis record
   * @returns {string} - Reconstructed text
   * @private
   */
  _reconstructText(document) {
    const parts = [];

    if (document.summary?.text) parts.push(document.summary.text);
    if (document.summary?.keyPoints) parts.push(...document.summary.keyPoints);
    if (document.summary?.keywords) parts.push(...document.summary.keywords);
    if (document.extraction?.entities?.names) parts.push(...document.extraction.entities.names);
    if (document.extraction?.entities?.organizations) parts.push(...document.extraction.entities.organizations);
    if (document.extraction?.structuredData?.sections) parts.push(...document.extraction.structuredData.sections);
    if (document.extraction?.formData) {
      parts.push(Object.entries(document.extraction.formData).map(([k, v]) => `${k}: ${v}`).join(' '));
    }
    if (document.ocr?.text) parts.push(document.ocr.text);

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Build a full document response.
   * @param {Object} doc - DocumentAnalysis document
   * @returns {Object} - Public response
   * @private
   */
  _buildDocumentResponse(doc) {
    return {
      analysisId: doc._id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      mimeType: doc.mimeType,
      size: doc.size,
      status: doc.status,
      category: doc.category,
      tags: doc.tags,
      classification: doc.classification,
      summary: doc.summary,
      extraction: doc.extraction,
      ocr: doc.ocr,
      metadata: doc.metadata,
      analysis: doc.analysis,
      comparison: doc.comparison,
      error: doc.error,
      processingTimeMs: doc.processingTimeMs,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Build a list item response.
   * @param {Object} doc - DocumentAnalysis document
   * @returns {Object} - Public list item
   * @private
   */
  _buildListResponse(doc) {
    return {
      analysisId: doc._id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      size: doc.size,
      status: doc.status,
      category: doc.category,
      tags: doc.tags,
      classificationType: doc.classification?.type || 'general',
      classificationConfidence: doc.classification?.confidence || 0,
      summaryPreview: (doc.summary?.text || '').substring(0, 200),
      keywords: doc.summary?.keywords || [],
      entityCount: Object.keys(doc.extraction?.entities || {}).reduce(
        (sum, key) => sum + (doc.extraction.entities[key]?.length || 0), 0
      ),
      tableCount: doc.extraction?.tables?.length || 0,
      comparable: (doc.comparison?.similarDocuments?.length || 0) > 0,
      checksum: doc.checksum,
      error: doc.error,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

// Export singleton
const documentIntelligenceEngine = new DocumentIntelligenceEngine();

module.exports = documentIntelligenceEngine;
module.exports.DocumentIntelligenceEngine = DocumentIntelligenceEngine;