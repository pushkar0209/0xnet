import { useState } from 'react'
import { SocketProvider } from './context/SocketContext'
import Login from './components/Login'
import Chat from './components/Chat'
import VideoSection from './components/VideoSection'


import ErrorBoundary from './components/ErrorBoundary'

function AppContent() {
  const [username, setUsername] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // Default to chat for now

  if (!username) {
    return <Login onJoin={setUsername} />;
  }

  // Icons (Simple placeholders using text for now, could be SVG)
  const Icons = {
    Chat: "💬",
    Video: "🎬"
  };

  return (
    <div className="app-container">

      {/* Sidebar Navigation */}
      <nav className="glass-panel sidebar">
        <div
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          title="Chat"
        >
          {Icons.Chat}
        </div>
        <div
          className={`nav-item ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
          title="Video Stream"
        >
          {Icons.Video}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <h1 className="brand-text">0XNET <span style={{ fontSize: '1rem', color: 'var(--neon-purple)', letterSpacing: '1px' }}>// ZERO_LATENCY</span></h1>
          <div className="user-badge glass-panel" style={{ padding: '5px 15px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>USER:</span> <span style={{ color: 'var(--neon-green)' }}>{username}</span>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'chat' && <Chat username={username} />}
          {activeTab === 'video' && <VideoSection />}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  )
}

const API_BASE_URL = `http://${window.location.hostname}:3000`; // Dynamically determine backend URL

export { API_BASE_URL }; // Export for use in other components

export default App

