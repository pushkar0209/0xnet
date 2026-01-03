import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ]
};

export default function LiveStream({ mode, onExit }) {
    const { socket } = useSocket();
    const [status, setStatus] = useState('Initializing...');
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const peersRef = useRef({});

    useEffect(() => {
        if (mode === 'broadcast') {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                    setStatus('LIVE BROADCAST ACTIVE');
                    socket.emit('join-stream', 'default-room');
                } catch (err) {
                    console.error("Camera Error:", err);
                    setStatus('CAMERA ACCESS DENIED');
                }
            };
            startCamera();
        } else if (mode === 'view') {
            setStatus('ESTABLISHING UPLINK...');
            socket.emit('join-stream', 'default-room');
        }

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            Object.values(peersRef.current).forEach(p => p.close());
            peersRef.current = {};
        };
    }, [mode, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleUserConnected = (userId) => {
            console.log("User connected:", userId);
            if (mode === 'broadcast' && localStream) {
                createPeer(userId, localStream, true);
            }
        };

        const handleUserDisconnected = (userId) => {
            console.log("User disconnected:", userId);
            if (peersRef.current[userId]) {
                peersRef.current[userId].close();
                delete peersRef.current[userId];
            }
        };

        const handleSignal = async ({ sender, signal }) => {
            if (!peersRef.current[sender]) {
                createPeer(sender, localStream, false);
            }
            const peer = peersRef.current[sender];

            try {
                if (signal.type === 'offer') {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('signal', { target: sender, signal: peer.localDescription });
                } else if (signal.type === 'answer') {
                    await peer.setRemoteDescription(new RTCSessionDescription(signal));
                } else if (signal.candidate) {
                    await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (e) {
                console.error("Signaling Error", e);
            }
        };

        socket.on('user-connected', handleUserConnected);
        socket.on('user-disconnected', handleUserDisconnected);
        socket.on('signal', handleSignal);

        return () => {
            socket.off('user-connected', handleUserConnected);
            socket.off('user-disconnected', handleUserDisconnected);
            socket.off('signal', handleSignal);
        };
    }, [socket, mode, localStream]);

    function createPeer(targetId, stream, initiator) {
        const peer = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current[targetId] = peer;

        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', {
                    target: targetId,
                    signal: { candidate: event.candidate }
                });
            }
        };

        peer.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            if (mode === 'view') setStatus('SIGNAL LOCKED');
        };

        if (initiator) {
            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('signal', {
                        target: targetId,
                        signal: peer.localDescription
                    });
                } catch (err) {
                    console.error("Negotiation error:", err);
                }
            };
        }

        return peer;
    }

    return (
        <div className="live-stream-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="stream-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <button onClick={onExit} className="btn-neon" style={{ minWidth: '80px' }}>
                    &larr; BACK
                </button>
                <div className="stream-status" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)' }}></div>
                    <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '2px', color: 'var(--neon-cyan)' }}>{status}</span>
                </div>
            </div>

            <div className="video-area" style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--neon-cyan)' }}>
                {mode === 'broadcast' && (
                    <video ref={localVideoRef} autoPlay muted playsInline className="main-video" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                )}
                {mode === 'view' && (
                    <video ref={remoteVideoRef} autoPlay playsInline className="main-video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}

                {/* HUD Elements */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                    REC • [ {new Date().toLocaleTimeString()} ]
                </div>

                <div style={{ position: 'absolute', top: '20px', right: '20px', border: '1px solid rgba(255,255,255,0.3)', padding: '5px 10px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)' }}>
                    <span style={{ color: 'var(--neon-green)' }}>HD</span> 1080p
                </div>
            </div>
        </div>
    );
}
