import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useSocket } from '../context/SocketContext';

export default function VideoPlayer({ options, isActive }) {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const { socket } = useSocket();
    const isRemoteUpdate = useRef(false); // Flag to prevent infinite loops

    // Handles active state changes to pause video when hidden
    useEffect(() => {
        if (!isActive && playerRef.current && !playerRef.current.isDisposed()) {
            playerRef.current.pause();
        }
    }, [isActive]);

    useEffect(() => {
        let player = playerRef.current;

        // Make sure Video.js player is only initialized once
        if (!player) {
            const videoElement = videoRef.current;
            if (!videoElement) return;

            // Extra safety: check if element is actually in the document
            if (!document.body.contains(videoElement)) return;

            player = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                if (!playerRef.current) playerRef.current = player;

                // --- Event Listeners setup inside init callback to ensure player exists ---
                player.on('play', () => {
                    // Check ref validity to prevent errors if unmounted shortly after
                    if (isRemoteUpdate.current) return;
                    if (socket && !player.isDisposed()) {
                        console.log('Sending play', player.currentTime());
                        socket.emit('video:play', player.currentTime());
                    }
                    isRemoteUpdate.current = false;
                });

                player.on('pause', () => {
                    if (isRemoteUpdate.current) return;
                    if (socket && !player.isDisposed()) {
                        console.log('Sending pause');
                        socket.emit('video:pause');
                    }
                    isRemoteUpdate.current = false;
                });

                player.on('seeked', () => {
                    if (isRemoteUpdate.current) return;
                    if (socket && !player.isDisposed()) {
                        console.log('Sending seek', player.currentTime());
                        socket.emit('video:seek', player.currentTime());
                    }
                    isRemoteUpdate.current = false;
                });
            });
            playerRef.current = player;
        } else {
            // Update player if options change
            // Check if disposed
            if (!player.isDisposed()) {
                player.autoplay(options.autoplay);
                player.src(options.sources);
                if (options.autoplay) {
                    // Force play attempt for UX response
                    player.play().catch(e => console.log('Autoplay prevented:', e));
                }
            }
        }
    }, [options, videoRef, socket]); // socket triggers this, but we handle logic carefully

    // Handle incoming sync events
    useEffect(() => {
        // We need to access the player instance. 
        // Since playerRef is a Ref, changes don't trigger this effect.
        // We'll trust that if the socket is ready, we might have a player.
        // But if player isn't ready, we might miss early events. That's acceptable for now.

        if (!socket) return;

        const onPlay = (time) => {
            const player = playerRef.current;
            if (!player || player.isDisposed()) return;

            console.log('Received active play', time);
            isRemoteUpdate.current = true;
            if (Math.abs(player.currentTime() - time) > 0.5) {
                player.currentTime(time);
            }
            player.play();
        };

        const onPause = () => {
            const player = playerRef.current;
            if (!player || player.isDisposed()) return;

            console.log('Received active pause');
            isRemoteUpdate.current = true;
            player.pause();
        };

        const onSeek = (time) => {
            const player = playerRef.current;
            if (!player || player.isDisposed()) return;

            console.log('Received active seek', time);
            isRemoteUpdate.current = true;
            player.currentTime(time);
        };

        socket.on('video:play', onPlay);
        socket.on('video:pause', onPause);
        socket.on('video:seek', onSeek);

        return () => {
            socket.off('video:play', onPlay);
            socket.off('video:pause', onPause);
            socket.off('video:seek', onSeek);
        };
    }, [socket]);


    useEffect(() => {
        // Cleanup Effect
        return () => {
            const player = playerRef.current;
            if (player && !player.isDisposed()) {
                try {
                    player.dispose();
                } catch (e) {
                    console.error("Error disposing video player:", e);
                }
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div data-vjs-player style={{ width: '100%', height: '100%' }}>
            <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
