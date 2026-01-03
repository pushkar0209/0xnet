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
            {/* Animated Background Mesh */}
            <div className="login-bg-mesh"></div>

            <div className="login-card glass-panel" style={{ border: '1px solid rgba(0, 243, 255, 0.2)' }}>
                <h1 className="login-title glitch-text" data-text="0XNET">0XNET</h1>
                <p style={{ color: 'var(--text-dim)', marginBottom: '30px', letterSpacing: '1px' }}>SECURE OFFLINE TERMINAL</p>

                <form onSubmit={handleSubmit}>
                    <input
                        className="login-input"
                        type="text"
                        placeholder="IDENTITY_STRING"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        spellCheck="false"
                    />
                    <button type="submit" className="login-btn">
                        INITIALIZE UPLINK
                    </button>
                </form>

                <div style={{ marginTop: '30px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    SYSTEM STATUS: <span style={{ color: 'var(--neon-green)' }}>OPERATIONAL</span>
                </div>
            </div>

            {/* Scanlines Overlay for Login specifically if global one isn't enough */}
            <div className="scanlines"></div>
        </div>
    );
}
