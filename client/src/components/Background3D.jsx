import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleNetwork() {
    const count = 200; // Number of nodes
    const sep = 3; // Separation

    // Generate random positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;     // x
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15; // y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        }
        return pos;
    }, [count]);

    const pointsRef = useRef();

    useFrame((state, delta) => {
        if (pointsRef.current) {
            // Slow rotation
            pointsRef.current.rotation.x -= delta / 10;
            pointsRef.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#00f3ff"
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

function Connections() {
    // A simplified visual of connecting lines could be complex to calculate in JS loop frame by frame
    // For performance, we'll keep it to just particles for the "Data Dust" look, 
    // or use a pre-made Drei component like 'Stars' if we want simple checks.
    // Let's stick to the ParticleNetwork for the "Node" look.
    return null;
}

export default function Background3D() {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050510 100%)' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <ParticleNetwork />
                {/* Add some fog for depth */}
                <fog attach="fog" args={['#050510', 3, 10]} />
            </Canvas>

            {/* Cinematic Overlay: Vignette & Scanlines */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%)', // Vignette
                pointerEvents: 'none'
            }} />
            <div className="scanlines" />
        </div>
    );
}
