import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Chat({ username }) {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on('chat:message', handleMessage);

        return () => {
            socket.off('chat:message', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socket) {
            const msg = {
                id: Date.now(),
                user: username,
                text: input,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            socket.emit('chat:message', msg);
            setInput('');
        }
    };

    return (
        <div className="chat-container glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            <div className="messages-area" style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '50px' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>NO TRANSMISSIONS</p>
                        <p style={{ fontSize: '0.9rem' }}>System status: <span style={{ color: 'var(--neon-green)' }}>ONLINE</span></p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user === username;
                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                    marginBottom: '15px',
                                    animation: 'fadeIn 0.3s ease'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                                    {msg.user} <span style={{ opacity: 0.5 }}>• {msg.time}</span>
                                </div>
                                <div style={{
                                    background: isMe ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))' : 'rgba(255,255,255,0.05)',
                                    color: isMe ? 'white' : 'var(--text-main)',
                                    padding: '10px 15px',
                                    borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                    maxWidth: '70%',
                                    boxShadow: isMe ? '0 0 15px rgba(188, 19, 254, 0.3)' : 'none',
                                    border: isMe ? 'none' : '1px solid var(--glass-border)'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1 }}
                />
                <button type="submit" className="btn-neon">
                    Send
                </button>
            </form>
        </div>
    );
}
