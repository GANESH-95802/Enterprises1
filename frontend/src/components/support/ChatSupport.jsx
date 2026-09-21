import { useState, useRef, useEffect } from 'react';
import { assistantService } from '../../services';
import { FiMessageSquare, FiSend, FiX, FiCpu } from 'react-icons/fi';

export function ChatSupport() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await assistantService.chat({ message: userMsg.content, profile: 'general' });
      const data = res.data?.data || res.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.response || data?.message || data?.reply || 'Thank you for your message. Our support team will assist you shortly.' },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="chat-support-fab"
        onClick={() => setOpen(!open)}
        aria-label="Open chat support"
      >
        {open ? <FiX /> : <FiMessageSquare />}
      </button>

      {open && (
        <div className="chat-support-widget" role="dialog" aria-label="Chat support">
          <div className="chat-support-header">
            <FiCpu />
            <strong>AI Support Assistant</strong>
          </div>
          <div className="chat-support-body">
            {messages.length === 0 && (
              <div className="chat-support-empty">
                Hi! I'm your support assistant. How can I help you today?
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`}>
                <div className="chat-bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-bubble typing"><span>●</span><span>●</span><span>●</span></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form className="chat-support-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="Support message"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatSupport;