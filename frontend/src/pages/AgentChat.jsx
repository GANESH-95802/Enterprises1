import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agentService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiSend, FiCpu, FiUser, FiArrowLeft, FiDatabase } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AgentChat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [knowledgeUsed, setKnowledgeUsed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAgent = async () => {
    try {
      const res = await agentService.getAgent(agentId);
      const data = res.data?.data || res.data;
      setAgent(data?.agent || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load agent');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await agentService.runAgent(agentId, {
        message: userMessage.content,
        sessionId: conversationId,
      });
      const data = res.data?.data || res.data;
      const agentReply = data?.response || data?.message || 'No response received';
      setMessages((prev) => [...prev, { role: 'agent', content: agentReply }]);
      if (data?.conversationId) setConversationId(data.conversationId);
      setKnowledgeUsed(data?.knowledgeUsed || false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get agent response');
      setMessages((prev) => [...prev, { role: 'agent', content: 'Sorry, I encountered an error. Please try again.', error: true }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading text="Loading agent..." />;

  return (
    <div className="assistant-page">
      <PageHeader
        title={agent?.name || 'AI Agent'}
        subtitle={agent?.description || 'Chat with AI agent'}
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/agents')}>
            <FiArrowLeft /> Back to Agents
          </button>
        }
      />

      <Card className="assistant-chat">
        <div className="chat-header">
          <div className="chat-profile">
            <FiCpu />
            <span>{agent?.name}</span>
            <Badge variant={agent?.status === 'active' ? 'success' : 'warning'}>{agent?.status}</Badge>
            {knowledgeUsed && (
              <Badge variant="info"><FiDatabase /> Knowledge</Badge>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <FiCpu size={48} />
              <h3>How can I help you?</h3>
              <p>{agent?.description || 'Ask me anything'}</p>
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
          {sending && (
            <div className="chat-message agent">
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
            placeholder={`Message ${agent?.name || 'agent'}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            aria-label="Message"
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
            <FiSend />
          </button>
        </form>
      </Card>
    </div>
  );
}