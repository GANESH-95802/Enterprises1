/**
 * Enterprise RAG & Knowledge Base (Phase 3A)
 * Registry for the RAG services and engine.
 */
const documentParser = require('./documentParser');
const textChunker = require('./textChunker');
const ragEmbeddingService = require('./embeddingService');
const vectorStore = require('./vectorStore');
const knowledgeBaseManager = require('./knowledgeBaseManager');
const retrievalService = require('./retrievalService');

const getAvailableRagModules = () => [
  { id: 'document-parser', name: 'Document Parser', description: 'Parses PDF, DOCX, TXT, Markdown documents.', available: true },
  { id: 'text-chunker', name: 'Text Chunker', description: 'Splits documents into semantically meaningful chunks.', available: true },
  { id: 'embedding-service', name: 'Embedding Service', description: 'Generates embeddings using the existing Embedding Client.', available: true },
  { id: 'vector-store', name: 'Vector Store', description: 'Semantic similarity search over the AiEmbedding model.', available: true },
  { id: 'knowledge-base', name: 'Knowledge Base Manager', description: 'Manages enterprise knowledge documents and ingestion.', available: true },
  { id: 'retrieval-service', name: 'Retrieval Service', description: 'RAG retrieval with augmented context for assistants.', available: true },
];

const getStats = () => ({
  embeddingService: ragEmbeddingService.getStats(),
  knowledgeBase: {
    totalDocuments: knowledgeBaseManager.stats.totalDocuments,
    totalChunks: knowledgeBaseManager.stats.totalChunks,
    totalFailures: knowledgeBaseManager.stats.totalFailures,
  },
});

module.exports = {
  documentParser,
  textChunker,
  ragEmbeddingService,
  vectorStore,
  knowledgeBaseManager,
  retrievalService,
  getAvailableRagModules,
  getStats,
};