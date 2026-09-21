import { useState, useEffect, useRef } from 'react';
import { assistantService } from '../services';
import { PageHeader, Card, Loading } from '../components/ui';
import { FiSend, FiCpu, FiUser, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('general');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
    loadProfiles();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await assistantService.listSessions({ limit: 20 });
      setSessions(res.data?.data?.sessions || []);
    } catch {
      // Silent
    }
  };

  const loadProfiles = async () => {
    try {
      const res = await assistantService.getProfiles();
      const profileList = res.data?.data?.profiles || [];
      setProfiles(profileList);
      if (profileList.length > 0) setSelectedProfile(profileList[0].id || 'general');
    } catch {
      // Silent
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await assistantService.chat({
        message: userMessage.content,
        sessionId: currentSession,
        profile: selectedProfile,
      });
      const data = res.data?.data || res.data;
      const assistantReply = data?.response || data?.message || data?.reply || 'No response received';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
      if (data?.sessionId) {
        setCurrentSession(data.sessionId);
        loadSessions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get AI response');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentSession(null);
  };

  const loadSession = async (sessionId) => {
    try {
      const res = await assistantService.getSession(sessionId);
      const session = res.data?.data?.session;
      if (session?.messages) {
        setMessages(session.messages.map((m) => ({ role: m.role, content: m.content })));
      }
      setCurrentSession(sessionId);
    } catch {
      toast.error('Failed to load session');
    }
  };

  return (
    <div className="assistant-page">
      <PageHeader
        title="AI Assistant"
        subtitle="Chat with your enterprise AI assistant"
        actions={
          <button className="btn btn-outline" onClick={newChat}>
            <FiPlus /> New Chat
          </button>
        }
      />

      <div className="assistant-layout">
        <Card className="assistant-sessions">
          <h3 className="card-title">Sessions</h3>
          <div className="session-list">
            {sessions.length === 0 && <div className="table-empty">No sessions yet</div>}
            {sessions.map((s) => (
              <button
                key={s.sessionId}
                className={`session-item ${currentSession === s.sessionId ? 'active' : ''}`}
                onClick={() => loadSession(s.sessionId)}
              >
                <div className="session-title">{s.title || 'Untitled'}</div>
                <div className="session-meta">{s.messageCount} messages</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="assistant-chat">
          <div className="chat-header">
            <div className="chat-profile">
              <FiCpu />
              <select
                className="form-select"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                aria-label="Assistant profile"
              >
                {profiles.map((p) => (
                  <option key={p.id || p.name} value={p.id || p.name}>
                    {p.name || p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <FiCpu size={48} />
                <h3>How can I help you today?</h3>
                <p>Ask me anything about your business, documents, or data</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role} ${msg.error ? 'error' : ''}`}>
                <div className="chat-avatar">
                  {msg.role === 'user' ? <FiUser /> : <FiCpu />}
                </div>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-avatar"><FiCpu /></div>
                <div className="chat-bubble typing">
                  <span>●</span><span>●</span><span>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              className="form-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="Message"
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              <FiSend />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}