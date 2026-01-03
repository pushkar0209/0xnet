import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Chat({ username }) {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for incoming messages
        const handleMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on('chat:message', handleMessage);

        return () => {
            socket.off('chat:message', handleMessage);
        };
    }, [socket]);

    // Auto-scroll to bottom using ref
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socket) {
            const msgData = {
                id: Date.now(),
                user: username,
                text: input.trim(),
                timestamp: new Date().toLocaleTimeString() // Simple time for now
            };

            // Emit to server
            socket.emit('chat:message', msgData);

            // Optimistically add to local UI? 
            // Usually better to wait for broadcast or just add it if server echoes excluding sender
            // For this simple app, we'll assume server broadcasts to everyone including sender
            // setMessages((prev) => [...prev, msgData]);

            setInput('');
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>LAN Chat</h3>
                <span className="online-badge">Online</span>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message ${msg.user === username ? 'own-message' : 'other-message'}`}
                    >
                        <div className="message-meta">
                            <span className="message-user">{msg.user}</span>
                            <span className="message-time">{msg.timestamp}</span>
                        </div>
                        <div className="message-bubble">
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
