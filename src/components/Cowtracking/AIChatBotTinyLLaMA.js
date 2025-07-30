import React, { useState, useEffect, useRef } from 'react';
import { queryLocalAgroAI } from '../../services/agroAiClient'; // Make sure this is created
import './ChatBot.css';

const AIChatBotTinyLLaMA = ({ role = 'farmer' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); // en = Pidgin
  const messagesEndRef = useRef(null);

  const languageMap = {
    en: 'en-NG',
    ha: 'ha-NG',
    yo: 'yo-NG'
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[language];
    speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const prompt = `You are a helpful assistant for ${role}s. Speak in ${language}. Question: ${input}`;
      const replyText = await queryLocalAgroAI(prompt);
      const reply = { role: 'assistant', content: replyText };
      setMessages([...newMessages, reply]);
      speak(replyText);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: "🤖 No response from AI." }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech recognition not supported in this browser.');

    const recognition = new SpeechRecognition();
    recognition.lang = languageMap[language] || 'en-NG';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (e) => console.error('STT Error:', e.error);
    recognition.start();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatbot-container">
      <h4>{role === 'farmer' ? '👨‍🌾 Farmer' : '🐄 Herder'} AI Chat</h4>

      <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginBottom: 10 }}>
        <option value="en">Pidgin</option>
        <option value="ha">Hausa</option>
        <option value="yo">Yoruba</option>
      </select>

      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <span>{msg.content}</span>
            {msg.role === 'assistant' && (
              <button onClick={() => speak(msg.content)} title="Play" className="play-btn">🔊</button>
            )}
          </div>
        ))}
        {loading && <div>⏳ Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your question..."
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
        <button onClick={startListening}>🎤</button>
      </div>
    </div>
  );
};

export default AIChatBotTinyLLaMA;
