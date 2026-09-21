import { PageHeader, Card } from '../components/ui';
import { FiCpu, FiDatabase, FiTrendingUp, FiShield, FiFileText, FiMessageSquare } from 'react-icons/fi';

const features = [
  { icon: FiMessageSquare, title: 'AI Assistant', desc: 'Enterprise-grade conversational AI with profiles, tools, and session management.' },
  { icon: FiDatabase, title: 'Knowledge Base & RAG', desc: 'Enterprise RAG with document ingestion, semantic search, and augmented retrieval.' },
  { icon: FiTrendingUp, title: 'Recommendation Engine', desc: 'ML-powered recommendations with personalization and feedback learning.' },
  { icon: FiFileText, title: 'Document Intelligence', desc: 'AI document analysis, classification, extraction, summarization, and comparison.' },
  { icon: FiCpu, title: 'ML & AI Analytics', desc: 'Advanced analytics with trend detection, insights generation, and predictions.' },
  { icon: FiShield, title: 'Enterprise Security', desc: 'JWT auth, role-based access, security audits, and production-grade monitoring.' },
];

const phases = [
  { phase: 'Phase 0', name: 'Security Foundation', desc: 'Authentication, authorization, input sanitization, and rate limiting.' },
  { phase: 'Phase 1', name: 'AI Infrastructure', desc: 'AI providers, orchestration, context management, and memory.' },
  { phase: 'Phase 2', name: 'AI Assistant Engine', desc: 'Conversational AI with profiles, templates, and enterprise tools.' },
  { phase: 'Phase 3A', name: 'Enterprise RAG', desc: 'Knowledge base with document parsing, chunking, and embeddings.' },
  { phase: 'Phase 3B', name: 'Recommendation Engine', desc: 'Similarity, scoring, ranking, and personalization engines.' },
  { phase: 'Phase 3C', name: 'Document Intelligence', desc: 'OCR, classification, extraction, and summarization services.' },
  { phase: 'Phase 4', name: 'ML & AI Analytics', desc: 'Metrics collection, insight generation, and prediction services.' },
  { phase: 'Phase 5', name: 'Production Readiness', desc: 'Health checks, performance metrics, security audits, and error tracking.' },
  { phase: 'Phase 6', name: 'Enterprise Frontend', desc: 'Complete React application with 18 modules and full API integration.' },
];

export default function About() {
  return (
    <div>
      <PageHeader title="About AI Enterprise Hub" subtitle="Next-generation enterprise AI platform" />

      <Card style={{ marginBottom: 24, textAlign: 'center', padding: 48 }}>
        <div className="about-logo">AI</div>
        <h1 style={{ fontSize: 32, margin: '16px 0 8px' }}>AI Enterprise Hub</h1>
        <p style={{ color: 'var(--gray-500)', maxWidth: 600, margin: '0 auto', fontSize: 16 }}>
          A comprehensive enterprise AI platform combining conversational AI, knowledge management,
          recommendations, document intelligence, ML analytics, and production-grade monitoring
          in a single unified application.
        </p>
      </Card>

      <h2 className="section-subtitle">Core Features</h2>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {features.map((f, i) => (
          <Card key={i} className="feature-card">
            <f.icon size={28} color="#2563eb" />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="section-subtitle">Development Phases</h2>
      <Card>
        <div className="phase-list">
          {phases.map((p, i) => (
            <div key={i} className="phase-item">
              <div className="phase-badge">{p.phase}</div>
              <div>
                <strong>{p.name}</strong>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}