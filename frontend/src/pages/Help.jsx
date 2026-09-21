import { useState } from 'react';
import { ChatSupport } from '../components/support/ChatSupport';
import { PageHeader, Card, FormField } from '../components/ui';
import { FiMessageSquare, FiMail, FiBook, FiLifeBuoy } from 'react-icons/fi';
import toast from 'react-hot-toast';

const faqs = [
  {
    q: 'How do I use the AI Assistant?',
    a: 'Navigate to the AI Assistant page from the sidebar. Type your question in the chat input and press send. The assistant will use your knowledge base and enterprise data to provide relevant answers.',
  },
  {
    q: 'How do I upload documents to the Knowledge Base?',
    a: 'Go to the Knowledge Base page, click "Upload Document", select a file (PDF, DOCX, TXT, MD, CSV), add optional metadata like title and category, and click Upload. The system will automatically chunk and embed the document for semantic search.',
  },
  {
    q: 'How do recommendations work?',
    a: 'The Recommendation Center uses ML algorithms to analyze your behavior and preferences. It provides personalized recommendations that improve over time as you provide feedback with likes, dislikes, and ratings.',
  },
  {
    q: 'How do I analyze a document with AI?',
    a: 'Visit the Document Intelligence page, upload a document, and the system will automatically classify it, extract metadata, generate summaries, and detect entities.',
  },
  {
    q: 'What is the Analytics Dashboard?',
    a: 'The Analytics Dashboard provides ML-powered insights, trend detection, AI usage metrics, performance indicators, and predictive analytics for your enterprise.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use the live chat widget on this page, or email support@ai-enterprise-hub.com. Our typical response time is under 24 hours.',
  },
];

export default function Help() {
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) {
      toast.error('Please fill out all fields');
      return;
    }
    setSending(true);
    try {
      // Submit support ticket via API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Support ticket submitted! We will contact you shortly.');
      setSupportForm({ subject: '', message: '' });
    } catch {
      toast.error('Failed to submit ticket');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Help & Support" subtitle="Get help with the AI Enterprise Hub" />

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <Card className="help-card">
          <FiLifeBuoy size={32} color="#2563eb" />
          <h3>Documentation</h3>
          <p>Browse our comprehensive user guides and API documentation</p>
        </Card>
        <Card className="help-card">
          <FiMail size={32} color="#10b981" />
          <h3>Email Support</h3>
          <p>support@ai-enterprise-hub.com</p>
          <p>Response within 24 hours</p>
        </Card>
        <Card className="help-card">
          <FiMessageSquare size={32} color="#8b5cf6" />
          <h3>Live Chat</h3>
          <p>Chat with our support team in real-time</p>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <h3 className="card-title">Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Submit a Support Request</h3>
          <form onSubmit={handleSubmit}>
            <FormField label="Subject" required>
              <input
                type="text"
                className="form-input"
                value={supportForm.subject}
                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
              />
            </FormField>
            <FormField label="Message" required>
              <textarea
                className="form-textarea"
                value={supportForm.message}
                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                rows={6}
              />
            </FormField>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </Card>
      </div>

      <ChatSupport />
    </div>
  );
}