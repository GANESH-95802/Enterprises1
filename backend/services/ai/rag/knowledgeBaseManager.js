const AiKnowledgeDocument = require('../../../models/AiKnowledgeDocument');
const documentParser = require('./documentParser');
const textChunker = require('./textChunker');
const ragEmbeddingService = require('./embeddingService');
const vectorStore = require('./vectorStore');

/**
 * KnowledgeBaseManager
 * Manages the enterprise knowledge base: documents, ingestion, retrieval.
 * Orchestrates the document ingestion pipeline:
 * Upload → Parse → Chunk → Embed → Persist (AiEmbedding).
 * Follows SOLID principles — this module coordinates the pipeline.
 */
class KnowledgeBaseManager {
  constructor() {
    this.stats = {
      totalDocuments: 0,
      totalChunks: 0,
      totalFailures: 0,
    };
  }

  /**
   * Ingest an uploaded document into the knowledge base.
   * @param {string} userId - User ID
   * @param {Object} file - Multer file object
   * @param {Object} options - { title, category, tags }
   * @returns {Promise<Object>} - Ingestion result
   */
  async ingestDocument(userId, file, options = {}) {
    const startTime = Date.now();
    let document = null;

    try {
      // 1. Validate and parse the file
      const parsed = await documentParser.parse(file);
      if (!parsed.success) {
        documentParser.cleanup(file.path);
        return { success: false, message: parsed.message };
      }

      // 2. Create the knowledge document record
      document = await AiKnowledgeDocument.create({
        user: userId,
        title: options.title || file.originalname.replace(/\.[^.]+$/, ''),
        fileName: file.originalname,
        fileType: parsed.fileType,
        mimeType: file.mimetype || '',
        size: file.size || 0,
        status: 'processing',
        category: options.category || 'general',
        tags: options.tags || [],
        storagePath: file.path || '',
        checksum: parsed.contentHash,
        metadata: {
          parsedLength: parsed.length,
          source: options.source || 'upload',
        },
      });

      this.stats.totalDocuments += 1;

      // 3. Chunk the parsed text
      const chunks = textChunker.chunk(parsed.text, {
        chunkSize: options.chunkSize,
        overlap: options.overlap,
      });

      if (chunks.length === 0) {
        throw new Error('Document text could not be chunked');
      }

      // 4. Generate and persist embeddings using the existing Embedding Client
      const embeddingResult = await ragEmbeddingService.persistDocumentEmbeddings(
        userId,
        document._id,
        document.title,
        chunks,
        {
          category: document.category,
          tags: document.tags,
          fileName: document.fileName,
        }
      );

      if (!embeddingResult.success) {
        throw new Error('Failed to persist document embeddings');
      }

      // 5. Update the document status
      document.status = 'indexed';
      document.chunkCount = chunks.length;
      document.embeddingCount = embeddingResult.count;
      document.processingTimeMs = Date.now() - startTime;
      document.summary = this._buildSummary(parsed.text, chunks.length);
      await document.save();

      // Clean up uploaded file
      documentParser.cleanup(file.path);

      this.stats.totalChunks += chunks.length;

      return {
        success: true,
        data: {
          documentId: document._id,
          title: document.title,
          fileType: document.fileType,
          status: 'indexed',
          chunkCount: chunks.length,
          embeddingCount: embeddingResult.count,
          processingTimeMs: document.processingTimeMs,
        },
      };
    } catch (error) {
      console.error('Knowledge base - ingest error:', error.message);
      this.stats.totalFailures += 1;

      // Mark document as failed if it was created
      if (document) {
        document.status = 'failed';
        document.error = error.message;
        document.processingTimeMs = Date.now() - startTime;
        await document.save().catch(() => {});
      }

      // Clean up uploaded file
      documentParser.cleanup(file.path);

      return { success: false, message: error.message };
    }
  }

  /**
   * Semantic search over the user's knowledge base.
   * @param {string} userId - User ID
   * @param {string} query - Query text
   * @param {Object} options - { limit, category, minScore, documentId }
   * @returns {Promise<Object>} - Search result
   */
  async searchKnowledge(userId, query, options = {}) {
    try {
      const result = await vectorStore.search(userId, query, options);

      if (!result.success) {
        return { success: false, message: result.message };
      }

      // Enrich results with document metadata
      const documentIds = [...new Set(result.results.map((r) => String(r.sourceId)).filter(Boolean))];
      const documents = documentIds.length > 0
        ? await AiKnowledgeDocument.find({ _id: { $in: documentIds } }).select('title category tags fileType fileName').lean()
        : [];

      const documentMap = documents.reduce((acc, doc) => {
        acc[String(doc._id)] = doc;
        return acc;
      }, {});

      const enriched = result.results.map((r) => ({
        ...r,
        id: String(r.id),
        sourceId: r.sourceId ? String(r.sourceId) : null,
        document: documentMap[String(r.sourceId)] || null,
        score: parseFloat(r.score.toFixed(4)),
      }));

      return {
        success: true,
        data: {
          results: enriched,
          total: result.total,
          provider: result.provider,
          query: query.substring(0, 200),
        },
      };
    } catch (error) {
      console.error('Knowledge base - search error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * List documents in the knowledge base
   * @param {string} userId - User ID
   * @param {Object} options - { status, category, limit, skip, search }
   * @returns {Promise<Object>} - Document list
   */
  async listDocuments(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.status) query.status = options.status;
      if (options.category) query.category = options.category;
      if (options.search) {
        query.title = { $regex: options.search, $options: 'i' };
      }

      const limit = Math.min(options.limit || 20, 100);
      const skip = options.skip || 0;

      const [documents, total] = await Promise.all([
        AiKnowledgeDocument.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-metadata'),
        AiKnowledgeDocument.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          documents: documents.map((doc) => ({
            id: doc._id,
            title: doc.title,
            fileName: doc.fileName,
            fileType: doc.fileType,
            size: doc.size,
            status: doc.status,
            category: doc.category,
            tags: doc.tags,
            chunkCount: doc.chunkCount,
            embeddingCount: doc.embeddingCount,
            summary: doc.summary,
            error: doc.error,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          })),
          total,
          limit,
          skip,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Knowledge base - list error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get a single document by ID
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Document details
   */
  async getDocument(userId, documentId) {
    try {
      const document = await AiKnowledgeDocument.findOne({ _id: documentId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      return {
        success: true,
        data: {
          id: document._id,
          title: document.title,
          fileName: document.fileName,
          fileType: document.fileType,
          mimeType: document.mimeType,
          size: document.size,
          status: document.status,
          category: document.category,
          tags: document.tags,
          summary: document.summary,
          chunkCount: document.chunkCount,
          embeddingCount: document.embeddingCount,
          error: document.error,
          processingTimeMs: document.processingTimeMs,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      };
    } catch (error) {
      console.error('Knowledge base - get document error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get chunks (stored content) for a document
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {Object} options - { limit, skip }
   * @returns {Promise<Object>} - Chunks list
   */
  async getDocumentChunks(userId, documentId, options = {}) {
    const AiEmbedding = require('../../../models/AiEmbedding');

    try {
      const document = await AiKnowledgeDocument.findOne({ _id: documentId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      const limit = Math.min(options.limit || 20, 50);
      const skip = options.skip || 0;

      const [chunks, total] = await Promise.all([
        AiEmbedding.find({
          user: userId,
          source: 'document',
          sourceId: documentId,
          'metadata.type': 'knowledge-base',
        })
          .select('content metadata provider createdAt')
          .sort({ 'metadata.chunkIndex': 1 })
          .skip(skip)
          .limit(limit),
        AiEmbedding.countDocuments({
          user: userId,
          source: 'document',
          sourceId: documentId,
          'metadata.type': 'knowledge-base',
        }),
      ]);

      return {
        success: true,
        data: {
          documentId: document._id,
          title: document.title,
          chunks: chunks.map((c) => ({
            id: c._id,
            content: c.content,
            chunkIndex: c.metadata?.chunkIndex ?? 0,
            provider: c.provider,
            createdAt: c.createdAt,
          })),
          total,
          limit,
          skip,
        },
      };
    } catch (error) {
      console.error('Knowledge base - get chunks error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a document and its embeddings
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteDocument(userId, documentId) {
    try {
      const document = await AiKnowledgeDocument.findOne({ _id: documentId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      // Remove embeddings first
      const embeddingResult = await ragEmbeddingService.removeDocumentEmbeddings(documentId);

      await AiKnowledgeDocument.deleteOne({ _id: documentId, user: userId });

      return {
        success: true,
        data: {
          documentId: document._id,
          deletedEmbeddings: embeddingResult.deleted || 0,
          message: 'Document and its embeddings deleted',
        },
      };
    } catch (error) {
      console.error('Knowledge base - delete error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update document metadata
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {Object} updates - { title, category, tags }
   * @returns {Promise<Object>} - Updated document
   */
  async updateDocument(userId, documentId, updates = {}) {
    try {
      const document = await AiKnowledgeDocument.findOne({ _id: documentId, user: userId });
      if (!document) return { success: false, message: 'Document not found' };

      if (updates.title !== undefined) document.title = updates.title;
      if (updates.category !== undefined) document.category = updates.category;
      if (updates.tags !== undefined) document.tags = updates.tags;

      await document.save();

      return {
        success: true,
        data: {
          id: document._id,
          title: document.title,
          category: document.category,
          tags: document.tags,
          updatedAt: document.updatedAt,
        },
      };
    } catch (error) {
      console.error('Knowledge base - update error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get knowledge base statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Stats
   */
  async getStats(userId) {
    try {
      const [docs, indexed, failed, vectorStats] = await Promise.all([
        AiKnowledgeDocument.countDocuments({ user: userId }),
        AiKnowledgeDocument.countDocuments({ user: userId, status: 'indexed' }),
        AiKnowledgeDocument.countDocuments({ user: userId, status: 'failed' }),
        vectorStore.getStats(userId),
      ]);

      return {
        success: true,
        data: {
          totalDocuments: docs,
          indexedDocuments: indexed,
          failedDocuments: failed,
          totalEmbeddings: vectorStats.totalEmbeddings,
          embeddingsByProvider: vectorStats.byProvider,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Knowledge base - stats error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Build a brief summary from the document text
   * @param {string} text - Full document text
   * @param {number} chunkCount - Number of chunks
   * @returns {string} - Summary
   */
  _buildSummary(text, chunkCount) {
    const firstPart = text.substring(0, 500).replace(/\s+/g, ' ').trim();
    const words = text.split(/\s+/).length;
    return `${firstPart}${text.length > 500 ? '...' : ''} (${words} words, ${chunkCount} chunks)`;
  }
}

// Export singleton
const knowledgeBaseManager = new KnowledgeBaseManager();

module.exports = knowledgeBaseManager;
module.exports.KnowledgeBaseManager = KnowledgeBaseManager;