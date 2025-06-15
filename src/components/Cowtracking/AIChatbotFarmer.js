import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBot.css';

const AIChatBotFarmer = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); // default Pidgin
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const languageMap = {
    en: 'en-NG', // Pidgin fallback
    ha: 'ha-NG',
    yo: 'yo-NG'
  };

  const fetchAIResponse = async (newMessages, retryCount = 0) => {
    try {
      const response = await axios.post('https://backopen.onrender.com/api/chat', { messages });
      const reply = {
        role: 'assistant',
        content: response.data.choices[0].message.content || "Sorry, I couldn't understand that."
      };
      setMessages([...newMessages, reply]);
      speak(reply.content); // TTS
    } catch (error) {
      if (error.response?.status === 429 && retryCount < 5) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        setTimeout(() => fetchAIResponse(newMessages, retryCount + 1), waitTime);
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: "Sorry, I'm overloaded. Please try again shortly."
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    fetchAIResponse(newMessages);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[language] || 'en-NG';
    speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech recognition not supported in this browser.');

    const recognition = new SpeechRecognition();
    recognition.lang = languageMap[language] || 'en-NG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      width: '360px',
      border: '1px solid #ccc',
      padding: 10,
      borderRadius: 8,
      height: 520,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4>AI Farmer Chatbot</h4>
      <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginBottom: 8 }}>
        <option value="en">Pidgin</option>
        <option value="ha">Hausa</option>
        <option value="yo">Yoruba</option>
      </select>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 10 }}>
        {messages.slice(1).map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: 6 }}>
            <span style={{
              backgroundColor: msg.role === 'user' ? '#dcf8c6' : '#f1f0f0',
              padding: '6px 10px',
              borderRadius: 10,
              display: 'inline-block',
              position: 'relative'
            }}>
              {msg.content}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speak(msg.content)}
                  style={{
                    marginLeft: 5,
                    fontSize: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#555'
                  }}
                  title="Play message"
                >
                  🔊
                </button>
              )}
            </span>
          </div>
        ))}
        {loading && <div>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about farming, pests, market access..."
          style={{ width: '65%', marginRight: 5 }}
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
        <button onClick={startListening} style={{ marginLeft: 5 }}>🎙️</button>
      </div>
    </div>
  );
};

export default AIChatBotFarmer;
