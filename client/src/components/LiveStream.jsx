import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // On LAN, STUN might not even be needed if we use mDNS or direct IP, 
        // but good to have for robustness.
    ]
};



export default function LiveStream({ mode, onExit }) {
    const { socket } = useSocket();
    const [status, setStatus] = useState('Initializing...');
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null); // Simple 1-viewer support for now in view mode
    const [localStream, setLocalStream] = useState(null);

    // Refs for state that shouldn't trigger re-renders
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }

    // --- Host Logic: Capture Camera ---
    useEffect(() => {
        if (mode === 'broadcast') {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                    setStatus('Live - Waiting for viewers...');
                    socket.emit('join-stream', 'default-room');
                } catch (err) {
                    console.error("Camera Error:", err);
                    setStatus('Error accessing camera');
                }
            };
            startCamera();
        } else if (mode === 'view') {
            setStatus('Connecting to stream...');
            socket.emit('join-stream', 'default-room');
        }

        return () => {
            // Cleanup on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            // Close all peers
            Object.values(peersRef.current).forEach(p => p.close());
            peersRef.current = {};
        };
    }, [mode, socket]);

    // --- WebRTC Socket Events ---
    useEffect(() => {
        if (!socket) return;

        // When a new user joins, Host instigates a connection
        const handleUserConnected = (userId) => {
            console.log("User connected:", userId);
            if (mode === 'broadcast' && localStream) {
                // Initiator: true
                createPeer(userId, localStream, true);
            }
        };

        const handleUserDisconnected = (userId) => {
            console.log("User disconnected:", userId);
            if (peersRef.current[userId]) {
                peersRef.current[userId].close();
                delete peersRef.current[userId];
            }
            // Optional: If viewer, and host disconnected, update UI
        };

        const handleSignal = async ({ sender, signal }) => {
            // If we don't have a peer yet, create one (Responder)
            if (!peersRef.current[sender]) {
                // If we are viewer, we are receiving an offer from host usually
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

    // --- Peer Helper ---
    function createPeer(targetId, stream, initiator) {
        const peer = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current[targetId] = peer;

        // Add local tracks if available
        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        // ICE Candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', {
                    target: targetId,
                    signal: { candidate: event.candidate }
                });
            }
        };

        // Incoming Stream
        peer.ontrack = (event) => {
            console.log("Received remote track from", targetId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            if (mode === 'view') setStatus('Connected to Stream');
        };

        // Negotiation (Only needed for initiator usually, but good to have logic)
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
        <div className="live-stream-container">
            <div className="stream-header">
                <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', padding: '8px 16px' }}>
                    &larr; Exit
                </button>
                <div className="stream-status">
                    <div className="pulse-dot"></div>
                    {status}
                </div>
            </div>

            <div className="video-area">
                {mode === 'broadcast' && (
                    <video ref={localVideoRef} autoPlay muted playsInline className="main-video" style={{ transform: 'scaleX(-1)' }} />
                )}
                {mode === 'view' && (
                    <video ref={remoteVideoRef} autoPlay playsInline className="main-video" />
                )}
            </div>

            {/* Optional: Overlay for self-view when viewing? No, keeps it simple */}
        </div>
    );
}
