/**
 * AI Engines
 * Registry for all AI engines (Assistant, Recommendation, Chatbot, Document Intelligence, Analytics).
 * Phase 2 implements the Assistant Engine.
 * Phase 3A implements the Enterprise RAG & Knowledge Base engine.
 * Phase 3B implements the Enterprise Recommendation Engine.
 * Phase 3C implements the Enterprise Document Intelligence Engine.
 * Phase 4 implements the ML & AI Analytics Engine.
 */
const assistantEngine = require('./assistant');
const rag = require('../rag');
const recommendationEngine = require('./recommendation');
const documentIntelligenceEngine = require('./documentIntelligence');
const analyticsEngine = require('./analytics');

const getAvailableEngines = () => {
  return [
    {
      id: 'assistant',
      name: 'Assistant Engine',
      description: 'Enterprise AI Assistant Engine with profiles, sessions, and tools.',
      available: true,
    },
    {
      id: 'rag',
      name: 'RAG & Knowledge Base Engine',
      description: 'Enterprise RAG with document ingestion, semantic search, and knowledge retrieval.',
      available: true,
      modules: rag.getAvailableRagModules(),
    },
    {
      id: 'recommendation',
      name: 'Recommendation Engine',
      description: 'Enterprise Recommendation Engine with ranking, personalization, and feedback.',
      available: true,
      modules: recommendationEngine.getTypes().data.types,
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence Engine',
      description: 'Enterprise Document Intelligence with OCR, classification, summarization, extraction, and comparison.',
      available: true,
      modules: documentIntelligenceEngine.getCapabilities().data.features,
    },
    {
      id: 'analytics',
      name: 'Analytics Engine',
      description: 'Enterprise ML & AI Analytics with user behavior, insights, predictions, and ML services.',
      available: true,
      modules: analyticsEngine.getCapabilities().data.features,
    },
  ];
};

const isEngineAvailable = (engineId) =>
  engineId === 'assistant' || engineId === 'rag' || engineId === 'recommendation' ||
  engineId === 'document-intelligence' || engineId === 'analytics';

module.exports = {
  assistantEngine,
  rag,
  recommendationEngine,
  documentIntelligenceEngine,
  analyticsEngine,
  getAvailableEngines,
  isEngineAvailable,
};