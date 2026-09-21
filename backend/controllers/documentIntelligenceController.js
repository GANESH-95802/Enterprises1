/**
 * Document Intelligence Controller - HTTP handlers for Phase 3C Document Intelligence.
 */
const { documentIntelligenceEngine } = require('../services/ai/engines');

// @desc    Upload and analyze a document
// @route   POST /api/document-intelligence/upload
const uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category, tags, language, useAI, maxSentences } = req.body;

    const result = await documentIntelligenceEngine.uploadAndAnalyze(req.user._id, req.file, {
      title,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean)) : undefined,
      language,
      useAI: useAI !== undefined ? useAI === true || useAI === 'true' : undefined,
      maxSentences: maxSentences ? parseInt(maxSentences) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze an existing document
// @route   POST /api/document-intelligence/documents/:analysisId/analyze
const analyzeDocument = async (req, res, next) => {
  try {
    const result = await documentIntelligenceEngine.analyzeDocument(req.user._id, req.params.analysisId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Extract structured information from a document
// @route   POST /api/document-intelligence/documents/:analysisId/extract
const extractInformation = async (req, res, next) => {
  try {
    const { fields } = req.body;

    const result = await documentIntelligenceEngine.extractInformation(req.user._id, req.params.analysisId, {
      fields,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Summarize a document
// @route   POST /api/document-intelligence/documents/:analysisId/summarize
const summarizeDocument = async (req, res, next) => {
  try {
    const { regenerate, maxSentences, useAI } = req.body;

    const result = await documentIntelligenceEngine.summarizeDocument(req.user._id, req.params.analysisId, {
      regenerate,
      maxSentences: maxSentences ? parseInt(maxSentences) : undefined,
      useAI,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Compare two documents
// @route   POST /api/document-intelligence/compare
const compareDocuments = async (req, res, next) => {
  try {
    const { sourceId, targetId } = req.body;

    const result = await documentIntelligenceEngine.compareDocuments(req.user._id, sourceId, targetId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Find similar documents
// @route   GET /api/document-intelligence/documents/:analysisId/similar
const findSimilarDocuments = async (req, res, next) => {
  try {
    const { limit, minScore } = req.query;

    const result = await documentIntelligenceEngine.findSimilarDocuments(req.user._id, req.params.analysisId, {
      limit: limit ? parseInt(limit) : undefined,
      minScore: minScore !== undefined ? parseFloat(minScore) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get document intelligence results
// @route   GET /api/document-intelligence/documents/:analysisId
const getDocumentIntelligence = async (req, res, next) => {
  try {
    const result = await documentIntelligenceEngine.getDocumentIntelligence(req.user._id, req.params.analysisId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    List analyzed documents
// @route   GET /api/document-intelligence/documents
const listDocuments = async (req, res, next) => {
  try {
    const { status, category, fileType, limit, skip, search } = req.query;

    const result = await documentIntelligenceEngine.listDocuments(req.user._id, {
      status,
      category,
      fileType,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      search,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a document analysis
// @route   DELETE /api/document-intelligence/documents/:analysisId
const deleteDocument = async (req, res, next) => {
  try {
    const result = await documentIntelligenceEngine.deleteDocument(req.user._id, req.params.analysisId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get document intelligence engine statistics
// @route   GET /api/document-intelligence/stats
const getStats = (req, res, next) => {
  try {
    res.json(documentIntelligenceEngine.getStats());
  } catch (error) {
    next(error);
  }
};

// @desc    Get document intelligence capabilities
// @route   GET /api/document-intelligence/capabilities
const getCapabilities = (req, res, next) => {
  try {
    res.json(documentIntelligenceEngine.getCapabilities());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAndAnalyze,
  analyzeDocument,
  extractInformation,
  summarizeDocument,
  compareDocuments,
  findSimilarDocuments,
  getDocumentIntelligence,
  listDocuments,
  deleteDocument,
  getStats,
  getCapabilities,
};