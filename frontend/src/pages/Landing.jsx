import { Link } from 'react-router-dom';
import { FiArrowRight, FiCpu, FiDatabase, FiTrendingUp, FiFileText, FiShield, FiMessageSquare } from 'react-icons/fi';

const features = [
  { icon: FiMessageSquare, title: 'AI Assistant', desc: 'Conversational AI with enterprise profiles, tools, and context awareness.' },
  { icon: FiDatabase, title: 'Knowledge Base', desc: 'Enterprise RAG with semantic search over your documents.' },
  { icon: FiTrendingUp, title: 'Recommendations', desc: 'ML-powered personalized recommendations that learn from feedback.' },
  { icon: FiFileText, title: 'Document Intelligence', desc: 'AI classification, extraction, and summarization of documents.' },
  { icon: FiCpu, title: 'AI Analytics', desc: 'Insights, trend detection, and predictive analytics across your data.' },
  { icon: FiShield, title: 'Enterprise Security', desc: 'JWT auth, role-based access, and production monitoring.' },
];

const stats = [
  { value: '9', label: 'AI Modules' },
  { value: '18', label: 'App Pages' },
  { value: '40+', label: 'API Endpoints' },
  { value: '24/7', label: 'Availability' },
];

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="sidebar-logo-icon">AI</div>
          <span>Enterprise Hub</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#modules">Modules</a>
          <Link to="/about" className="landing-link">About</Link>
          <Link to="/login" className="btn btn-outline">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1>Enterprise AI, <span className="gradient-text">Unified.</span></h1>
          <p>
            The AI Enterprise Hub brings together conversational AI, knowledge management,
            recommendations, document intelligence, and ML analytics into a single
            production-grade platform.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
          </div>
          <div className="landing-stats">
            {stats.map((s, i) => (
              <div key={i} className="landing-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <h2>Powerful AI Capabilities</h2>
        <p className="landing-subtitle">Everything you need to transform your enterprise with AI</p>
        <div className="landing-features grid grid-3">
          {features.map((f, i) => (
            <div key={i} className="card landing-feature-card">
              <f.icon size={32} color="#2563eb" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="landing-section" id="modules">
        <h2>Complete Module Suite</h2>
        <p className="landing-subtitle">18 integrated modules for the modern enterprise</p>
        <div className="landing-modules">
          {['AI Assistant', 'Knowledge Base', 'Recommendations', 'Document Intelligence', 'Analytics', 'Monitoring', 'Reports', 'Admin', 'Profile', 'Settings', 'Notifications', 'Activity Logs', 'Search', 'Help & Support', 'Dashboard', 'Businesses', 'Products', 'Customers'].map((m) => (
            <span key={m} className="landing-module-badge">{m}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to Transform Your Enterprise?</h2>
        <p>Join the AI Enterprise Hub today</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Free <FiArrowRight />
        </Link>
      </section>
    </div>
  );
}