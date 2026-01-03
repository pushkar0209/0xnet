import { useState } from 'react'
import { SocketProvider } from './context/SocketContext'
import Login from './components/Login'
import Chat from './components/Chat'
import VideoSection from './components/VideoSection'

function AppContent() {
  const [username, setUsername] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // Default to chat for now

  if (!username) {
    return <Login onJoin={setUsername} />;
  }

  return (
    <div className="app-container">
      <header className="main-header">
        <h1 className="brand-text">0Xnet</h1>
        <div className="user-badge">
          {username}
        </div>
      </header>

      <main className="main-content">
        <div className="tabs">
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>Chat</button>
          <button className={activeTab === 'video' ? 'active' : ''} onClick={() => setActiveTab('video')}>Video Stream</button>
        </div>

        <div className="tab-content">
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

export default App
