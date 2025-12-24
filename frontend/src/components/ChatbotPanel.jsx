import { useState } from 'react';
import { askChatbot } from '../services/api.js';

const ChatbotPanel = ({ token, user }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}, I am the INGRES assistant. Ask for TDS, contamination, or call out a region and I will pull the latest readings.`
    }
  ]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Share a quick groundwater overview',
    'How risky is Coastal Delta?',
    'Show me TDS status'
  ]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const outbound = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, outbound]);
    setInput('');
    setIsSending(true);
    setError('');

    try {
      const response = await askChatbot(trimmed, token);
      setMessages((prev) => [...prev, { role: 'assistant', text: response.reply }]);
      if (response.suggestions?.length) {
        setSuggestions(response.suggestions);
      }
    } catch (err) {
      setError(err.message || 'Assistant is unreachable');
      setMessages((prev) => [...prev, { role: 'assistant', text: 'I could not reach the data service right now.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chatbot-card">
      <header>
        <div>
          <h3>INGRES Assistant</h3>
          <p className="muted">Groundwater aware chatbot with synthetic training data</p>
        </div>
      </header>
      <div className="chat-window">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>
      {error && <div className="form-error">{error}</div>}
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Ask about TDS, contamination, recharge..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" disabled={isSending}>
          {isSending ? 'Sending…' : 'Ask'}
        </button>
      </form>
      <div className="chat-suggestions">
        {suggestions.map((tip) => (
          <button key={tip} type="button" onClick={() => setInput(tip)}>
            {tip}
          </button>
        ))}
      </div>
    </section>
  );
};

export default ChatbotPanel;

