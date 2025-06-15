import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import "./ChatBox.css";

const ChatBox = ({ userId, role }) => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "chatMessages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map((doc) => doc.data()));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    await addDoc(collection(db, "chatMessages"), {
      userId,
      role,
      message,
      timestamp: serverTimestamp(),
    });

    setMessage("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">💬 Community Chat</div>
      <div className="chat-messages">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.userId === userId ? "own" : "other"}`}
          >
            <strong>{msg.role}</strong>: {msg.message}
          </div>
        ))}
        <div ref={chatRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
