import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import LiveStream from './LiveStream';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../App';

export default function VideoSection() {
    const { socket } = useSocket();
    const [mode, setMode] = useState('stored'); // 'stored', 'broadcast', 'view'
    const [videoList, setVideoList] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Initial video options
    const [videoOptions, setVideoOptions] = useState({
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: []
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    // Socket listener for remote source changes
    useEffect(() => {
        if (!socket) return;

        const onChangeSource = (video) => {
            console.log("Received remote source change:", video);
            setSelectedVideo(video);
            setVideoOptions({
                autoplay: true, // Auto play on remote change
                controls: true,
                responsive: true,
                fluid: true,
                sources: [{
                    src: `${API_BASE_URL}${video.url}`,
                    type: 'video/mp4'
                }]
            });
        };

        // SYNC: Get initial state on connection
        socket.emit('video:getState', (state) => {
            if (state && state.url) {
                const videoName = state.url.split('/').pop();
                setSelectedVideo({ name: videoName, url: state.url.replace('/uploads/', '') });

                setVideoOptions({
                    autoplay: state.isPlaying,
                    controls: true,
                    responsive: true,
                    fluid: true,
                    sources: [{
                        src: `${API_BASE_URL}${state.url}`,
                        type: 'video/mp4'
                    }]
                });
            }
        });

        socket.on('video:changeSource', onChangeSource);

        return () => {
            socket.off('video:changeSource', onChangeSource);
        };
    }, [socket]);

    const fetchVideos = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/videos`);
            if (response.ok) {
                const videos = await response.json();
                setVideoList(videos);

                if (videos.length > 0 && !selectedVideo) {
                    const defaultVid = videos.find(v => v.name === 'sample.mp4') || videos[0];
                    handleSelectVideo(defaultVid, false);
                } else if (videos.length === 0) {
                    setVideoOptions(prev => ({
                        ...prev,
                        sources: [{
                            src: `${API_BASE_URL}/sample.mp4`,
                            type: 'video/mp4'
                        }]
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch videos:", error);
            // Fallback
            setVideoOptions(prev => ({
                ...prev,
                sources: [{
                    src: `${API_BASE_URL}/sample.mp4`,
                    type: 'video/mp4'
                }]
            }));
        }
    };

    const handleSelectVideo = (video, emit = true) => {
        setSelectedVideo(video);
        setVideoOptions({
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            sources: [{
                src: `${API_BASE_URL}${video.url}`,
                type: 'video/mp4'
            }]
        });

        if (emit && socket) {
            console.log("Emitting source change:", video);
            socket.emit('video:changeSource', video);
        }
    };

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                await fetchVideos();
                handleSelectVideo({
                    name: data.filename,
                    url: data.path
                });
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const handleExitLive = () => {
        setMode('stored');
    };

    return (
        <div className="video-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Control Bar */}
            <div className="glass-panel" style={{ padding: '15px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', marginRight: '10px' }}>MODE SELECT:</span>
                <button
                    className={`btn-neon ${mode === 'stored' ? 'active' : ''}`}
                    onClick={() => setMode('stored')}
                >
                    Stored Video
                </button>
                <button
                    className={`btn-neon ${mode === 'broadcast' ? 'active' : ''}`}
                    onClick={() => setMode('broadcast')}
                >
                    Broadcast
                </button>
                <button
                    className={`btn-neon ${mode === 'view' ? 'active' : ''}`}
                    onClick={() => setMode('view')}
                >
                    Join Stream
                </button>
            </div>

            <div className="player-container" style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: mode === 'stored' ? 'flex' : 'none', flexDirection: 'column', height: '100%', gap: '20px' }}>

                    {/* Video Player Box */}
                    <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <VideoPlayer options={videoOptions} isActive={mode === 'stored'} />
                        </div>
                    </div>

                    {/* Media Library Panel */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h4 style={{ color: 'var(--text-dim)', marginBottom: '15px', fontFamily: 'var(--font-display)' }}>MEDIA LIBRARY</h4>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px' }}>
                            <div className="upload-btn-wrapper" style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                <button className="btn-neon" style={{ fontSize: '0.8rem' }}>+ UPLOAD VIDEO</button>
                                <input
                                    type="file"
                                    name="myfile"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    accept="video/*"
                                    disabled={uploading}
                                    style={{ fontSize: '100px', position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer' }}
                                />
                            </div>
                            {uploading && <span style={{ color: 'var(--neon-green)', fontSize: '0.9rem' }} className="blink">UPLOADING...</span>}
                        </div>

                        <div className="video-list" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                            {videoList.map((vid, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectVideo(vid)}
                                    style={{
                                        background: selectedVideo === vid ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))' : 'rgba(255,255,255,0.05)',
                                        color: selectedVideo === vid ? 'white' : 'var(--text-dim)',
                                        border: selectedVideo === vid ? 'none' : '1px solid var(--glass-border)',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <span style={{ marginRight: '8px' }}>▶</span>
                                    {vid.name.length > 20 ? vid.name.substring(0, 17) + '...' : vid.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {(mode === 'broadcast' || mode === 'view') && (
                    <div className="glass-panel" style={{ height: '100%', padding: '20px' }}>
                        <LiveStream mode={mode} onExit={handleExitLive} />
                    </div>
                )}
            </div>
        </div>
    );
}
