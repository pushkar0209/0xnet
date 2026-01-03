import React, { useState } from 'react';

export default function Login({ onJoin }) {
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onJoin(username.trim());
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Enter 0Xnet</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">Join Network</button>
                </form>
            </div>
        </div>
    );
}
