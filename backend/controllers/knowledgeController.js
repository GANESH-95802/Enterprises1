/**
 * Knowledge Base Controller - HTTP handlers for Phase 3A Enterprise RAG.
 */
const knowledgeBaseManager = require('../services/ai/rag/knowledgeBaseManager');
const retrievalService = require('../services/ai/rag/retrievalService');

// @desc    Upload and ingest a document into the knowledge base
// @route   POST /api/knowledge/documents
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category, tags } = req.body;
    const result = await knowledgeBaseManager.ingestDocument(req.user._id, req.file, {
      title,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Semantic search over the knowledge base
// @route   POST /api/knowledge/search
const searchKnowledge = async (req, res, next) => {
  try {
    const { query, limit, category, minScore, documentId } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const result = await knowledgeBaseManager.searchKnowledge(req.user._id, query.trim(), {
      limit: limit ? parseInt(limit) : undefined,
      category,
      minScore: minScore !== undefined ? parseFloat(minScore) : undefined,
      documentId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    RAG retrieval with augmented context (for direct API consumers)
// @route   POST /api/knowledge/retrieve
const retrieve = async (req, res, next) => {
  try {
    const { query, limit, category, minScore, documentId, includeEnterprise } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const result = await retrievalService.buildAugmentedContext(req.user._id, query.trim(), {
      limit: limit ? parseInt(limit) : undefined,
      category,
      minScore: minScore !== undefined ? parseFloat(minScore) : undefined,
      documentId,
      includeEnterprise,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: {
        query: query.trim(),
        context: result.context,
        hasKnowledge: result.hasKnowledge,
        results: result.results,
        provider: result.provider || null,
        citations: retrievalService.buildCitations(result.results),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List knowledge base documents
// @route   GET /api/knowledge/documents
const listDocuments = async (req, res, next) => {
  try {
    const { status, category, limit, skip, search } = req.query;
    const result = await knowledgeBaseManager.listDocuments(req.user._id, {
      status,
      category,
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

// @desc    Get a single document by ID
// @route   GET /api/knowledge/documents/:documentId
const getDocument = async (req, res, next) => {
  try {
    const result = await knowledgeBaseManager.getDocument(req.user._id, req.params.documentId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get chunks for a document
// @route   GET /api/knowledge/documents/:documentId/chunks
const getDocumentChunks = async (req, res, next) => {
  try {
    const { limit, skip } = req.query;
    const result = await knowledgeBaseManager.getDocumentChunks(req.user._id, req.params.documentId, {
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Update document metadata
// @route   PATCH /api/knowledge/documents/:documentId
const updateDocument = async (req, res, next) => {
  try {
    const { title, category, tags } = req.body;
    const result = await knowledgeBaseManager.updateDocument(req.user._id, req.params.documentId, {
      title,
      category,
      tags,
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a document and its embeddings
// @route   DELETE /api/knowledge/documents/:documentId
const deleteDocument = async (req, res, next) => {
  try {
    const result = await knowledgeBaseManager.deleteDocument(req.user._id, req.params.documentId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get knowledge base statistics
// @route   GET /api/knowledge/stats
const getStats = async (req, res, next) => {
  try {
    const result = await knowledgeBaseManager.getStats(req.user._id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  searchKnowledge,
  retrieve,
  listDocuments,
  getDocument,
  getDocumentChunks,
  updateDocument,
  deleteDocument,
  getStats,
};