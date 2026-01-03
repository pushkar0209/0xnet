import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import LiveStream from './LiveStream';
import { useSocket } from '../context/SocketContext';

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
                autoplay: false,
                controls: true,
                responsive: true,
                fluid: true,
                sources: [{
                    src: `http://localhost:3000${video.url}`,
                    type: 'video/mp4'
                }]
            });
        };

        socket.on('video:changeSource', onChangeSource);

        return () => {
            socket.off('video:changeSource', onChangeSource);
        };
    }, [socket]);

    const fetchVideos = async () => {
        try {
            const response = await fetch('http://localhost:3000/videos');
            if (response.ok) {
                const videos = await response.json();
                setVideoList(videos);

                // Set default video if available and none selected
                if (videos.length > 0 && !selectedVideo) {
                    // Prefer sample.mp4 if it exists for backward compat looks, or just first one
                    const defaultVid = videos.find(v => v.name === 'sample.mp4') || videos[0];
                    // Don't emit for initial load, just set local
                    handleSelectVideo(defaultVid, false);
                } else if (videos.length === 0) {
                    // Fallback to hardcoded sample if list empty (e.g. fresh install)
                    setVideoOptions(prev => ({
                        ...prev,
                        sources: [{
                            src: 'http://localhost:3000/sample.mp4',
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
                    src: 'http://localhost:3000/sample.mp4',
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
                src: `http://localhost:3000${video.url}`,
                type: 'video/mp4' // Assuming mp4 for simplicity, or we could detect extension
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
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Refresh list
                await fetchVideos();
                // Select the new video and emit change
                handleSelectVideo({
                    name: data.filename,
                    url: data.path
                });
                // Clear input
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
        <div className="video-section">
            <div className="video-controls">
                <button
                    className={mode === 'stored' ? 'active' : ''}
                    onClick={() => setMode('stored')}
                >
                    Stored Video
                </button>
                <button
                    className={mode === 'broadcast' ? 'active' : ''}
                    onClick={() => setMode('broadcast')}
                >
                    Broadcast Camera
                </button>
                <button
                    className={mode === 'view' ? 'active' : ''}
                    onClick={() => setMode('view')}
                >
                    Join Stream
                </button>
            </div>

            <div className="player-container">
                <div style={{ display: mode === 'stored' ? 'block' : 'none', height: '100%' }}>

                    {/* Upload and List UI */}
                    <div className="stored-video-ui" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleUpload}
                                ref={fileInputRef}
                                disabled={uploading}
                                style={{ color: 'white' }}
                            />
                            {uploading && <span style={{ color: '#00ff88' }}>Uploading...</span>}
                        </div>

                        <div className="video-list" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {videoList.map((vid, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectVideo(vid)}
                                    style={{
                                        background: selectedVideo === vid ? '#7000ff' : '#333',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {vid.name.length > 20 ? vid.name.substring(0, 17) + '...' : vid.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <VideoPlayer options={videoOptions} isActive={mode === 'stored'} />
                </div>

                {(mode === 'broadcast' || mode === 'view') && (
                    <LiveStream mode={mode} onExit={handleExitLive} />
                )}
            </div>
        </div>
    );
}
