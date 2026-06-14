import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';

function ScaleOfJustice({ position = [0, 0, 0], scale = 1 }) {
    const groupRef = useRef();
    const leftPanRef = useRef();
    const rightPanRef = useRef();
    const beamRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.2;
        }
        if (beamRef.current) {
            beamRef.current.rotation.z = Math.sin(t * 0.6) * 0.08;
        }
        if (leftPanRef.current && rightPanRef.current) {
            const swing = Math.sin(t * 0.6) * 0.18;
            leftPanRef.current.position.y = -1.2 + swing;
            rightPanRef.current.position.y = -1.2 - swing;
            // Subtle chain sway
            leftPanRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
            rightPanRef.current.rotation.z = -Math.sin(t * 0.8) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Center pillar */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.1, 2.5, 16]} />
                <meshStandardMaterial color="#c9a84c" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Top ornament - lady justice crown */}
            <mesh position={[0, 1.4, 0]}>
                <octahedronGeometry args={[0.14, 0]} />
                <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.05} emissive="#daa520" emissiveIntensity={0.3} />
            </mesh>

            {/* Top sphere */}
            <mesh position={[0, 1.25, 0]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#daa520" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Horizontal beam */}
            <group ref={beamRef}>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[2.4, 0.05, 0.05]} />
                    <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.15} />
                </mesh>

                {/* Left chains */}
                <group position={[-1.05, 0, 0]}>
                    {[0, -0.25, -0.5, -0.75].map((cy, j) => (
                        <mesh key={`lc-${j}`} position={[0, 1.1 + cy - 0.12, 0]} rotation={[Math.PI / 2, 0, j % 2 === 0 ? 0 : Math.PI / 2]}>
                            <torusGeometry args={[0.035, 0.01, 8, 16]} />
                            <meshStandardMaterial color="#b8860b" metalness={0.85} roughness={0.2} />
                        </mesh>
                    ))}
                </group>

                {/* Right chains */}
                <group position={[1.05, 0, 0]}>
                    {[0, -0.25, -0.5, -0.75].map((cy, j) => (
                        <mesh key={`rc-${j}`} position={[0, 1.1 + cy - 0.12, 0]} rotation={[Math.PI / 2, 0, j % 2 === 0 ? 0 : Math.PI / 2]}>
                            <torusGeometry args={[0.035, 0.01, 8, 16]} />
                            <meshStandardMaterial color="#b8860b" metalness={0.85} roughness={0.2} />
                        </mesh>
                    ))}
                </group>

                {/* Left pan */}
                <group ref={leftPanRef} position={[-1.05, -1.2, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.38, 0.32, 0.06, 32]} />
                        <meshStandardMaterial color="#daa520" metalness={0.9} roughness={0.1} emissive="#b8860b" emissiveIntensity={0.1} />
                    </mesh>
                    {/* Pan rim */}
                    <mesh position={[0, 0.03, 0]}>
                        <torusGeometry args={[0.35, 0.015, 8, 32]} />
                        <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.05} />
                    </mesh>
                </group>

                {/* Right pan */}
                <group ref={rightPanRef} position={[1.05, -1.2, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.38, 0.32, 0.06, 32]} />
                        <meshStandardMaterial color="#daa520" metalness={0.9} roughness={0.1} emissive="#b8860b" emissiveIntensity={0.1} />
                    </mesh>
                    {/* Pan rim */}
                    <mesh position={[0, 0.03, 0]}>
                        <torusGeometry args={[0.35, 0.015, 8, 32]} />
                        <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.05} />
                    </mesh>
                </group>
            </group>

            {/* Base - stepped */}
            <mesh position={[0, -1.25, 0]}>
                <cylinderGeometry args={[0.55, 0.65, 0.08, 32]} />
                <meshStandardMaterial color="#8b7355" metalness={0.75} roughness={0.25} />
            </mesh>
            <mesh position={[0, -1.32, 0]}>
                <cylinderGeometry args={[0.65, 0.75, 0.06, 32]} />
                <meshStandardMaterial color="#6b5740" metalness={0.7} roughness={0.3} />
            </mesh>
        </group>
    );
}

function Gavel({ position = [2.5, -0.5, 0.5], scale = 0.5 }) {
    const groupRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            // Slow floating rotation
            groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.15 - 0.3;
            groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
            groupRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.15;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
            <group ref={groupRef} position={position} scale={scale}>
                {/* Handle */}
                <mesh rotation={[0, 0, -0.5]}>
                    <cylinderGeometry args={[0.06, 0.05, 2.2, 12]} />
                    <meshStandardMaterial color="#5c3a1e" metalness={0.3} roughness={0.7} />
                </mesh>

                {/* Handle grip rings */}
                {[-0.3, 0, 0.3].map((y, i) => (
                    <mesh key={i} position={[0, y - 0.3, 0]} rotation={[0, 0, -0.5]}>
                        <torusGeometry args={[0.065, 0.008, 8, 16]} />
                        <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.15} />
                    </mesh>
                ))}

                {/* Head */}
                <mesh position={[0, 1.1, 0]} rotation={[0, 0, -0.5]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.7, 16]} />
                    <meshStandardMaterial color="#3d2010" metalness={0.3} roughness={0.6} />
                </mesh>

                {/* Head bands */}
                <mesh position={[0, 0.82, 0]} rotation={[0, 0, -0.5]}>
                    <torusGeometry args={[0.185, 0.012, 8, 16]} />
                    <meshStandardMaterial color="#daa520" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, 1.38, 0]} rotation={[0, 0, -0.5]}>
                    <torusGeometry args={[0.185, 0.012, 8, 16]} />
                    <meshStandardMaterial color="#daa520" metalness={0.9} roughness={0.1} />
                </mesh>
            </group>
        </Float>
    );
}

function RotatingTextRing({ radius = 3.5, y = 0 }) {
    const groupRef = useRef();
    const words = ['NyayaVaad', '⚖️', 'Justice', '⚖️', 'न्याय', '⚖️', 'Law', '⚖️', 'अधिकार', '⚖️', 'Rights', '⚖️'];

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
        }
    });

    return (
        <group ref={groupRef} position={[0, y, 0]}>
            {/* Golden ring line */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius, 0.006, 8, 64]} />
                <meshStandardMaterial color="#daa520" metalness={0.9} roughness={0.1} transparent opacity={0.2} />
            </mesh>
            {/* Rotating words */}
            <Suspense fallback={null}>
                {words.map((word, i) => {
                    const angle = (i / words.length) * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    return (
                        <Text
                            key={i}
                            position={[x, 0, z]}
                            rotation={[0, -angle + Math.PI / 2, 0]}
                            fontSize={0.22}
                            color="#daa520"
                            anchorX="center"
                            anchorY="middle"
                            fillOpacity={0.35}
                        >
                            {word}
                        </Text>
                    );
                })}
            </Suspense>
        </group>
    );
}

function FloatingParticles({ count = 50, color = '#fcc419' }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 16;
            const y = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 8;
            const speed = 0.008 + Math.random() * 0.02;
            const scale = 0.015 + Math.random() * 0.04;
            temp.push({ x, y, z, speed, scale, offset: Math.random() * Math.PI * 2 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        particles.forEach((particle, i) => {
            const t = state.clock.elapsedTime;
            dummy.position.set(
                particle.x + Math.sin(t * particle.speed + particle.offset) * 0.8,
                particle.y + Math.cos(t * particle.speed * 0.6 + particle.offset) * 0.6,
                particle.z + Math.sin(t * particle.speed * 0.4) * 0.3
            );
            const pulse = particle.scale * (1 + Math.sin(t * 1.5 + particle.offset) * 0.4);
            dummy.scale.setScalar(pulse);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
        </instancedMesh>
    );
}

function GlowOrb({ position, color, size = 0.5 }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const pulse = size + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.15;
            ref.current.scale.setScalar(pulse);
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.2}>
            <mesh ref={ref} position={position}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial
                    color={color}
                    transparent
                    opacity={0.12}
                    distort={0.5}
                    speed={2.5}
                />
            </mesh>
        </Float>
    );
}

function LegalPillar({ position, height = 2, delay = 0 }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 + delay) * 0.08;
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Pillar body */}
            <mesh>
                <cylinderGeometry args={[0.08, 0.1, height, 8]} />
                <meshStandardMaterial color="#4a4a5a" metalness={0.6} roughness={0.4} transparent opacity={0.3} />
            </mesh>
            {/* Pillar capital */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[0.25, 0.06, 0.25]} />
                <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} transparent opacity={0.3} />
            </mesh>
            {/* Pillar base */}
            <mesh position={[0, -height / 2, 0]}>
                <boxGeometry args={[0.22, 0.05, 0.22]} />
                <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

function CourtroomLighting() {
    return (
        <>
            <ambientLight intensity={0.25} color="#ffeedd" />
            <directionalLight position={[5, 8, 5]} intensity={0.9} color="#fff5e6" castShadow />
            <pointLight position={[-3, 4, -2]} intensity={0.6} color="#fcc419" distance={14} />
            <pointLight position={[3, 4, 2]} intensity={0.4} color="#5c7cfa" distance={12} />
            <pointLight position={[0, -2, 3]} intensity={0.2} color="#daa520" distance={8} />
            <spotLight position={[0, 6, 0]} angle={0.35} penumbra={0.9} intensity={0.7} color="#fff0d0" />
        </>
    );
}

export function LegalScene3D({ variant = 'full' }) {
    return (
        <div className="absolute inset-0 opacity-70 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0.3, 6], fov: 50 }}
                gl={{ alpha: true, antialias: true }}
                style={{ background: 'transparent' }}
            >
                <CourtroomLighting />

                {variant === 'full' && (
                    <>
                        <ScaleOfJustice position={[0, -0.2, 0]} scale={0.85} />
                        <Gavel position={[2.2, 0.5, 0.5]} scale={0.45} />
                        <RotatingTextRing radius={3.8} y={-0.3} />
                        <FloatingParticles count={35} color="#fcc419" />
                        <FloatingParticles count={12} color="#5c7cfa" />
                        <GlowOrb position={[-3.5, 2, -3]} color="#5c7cfa" size={1} />
                        <GlowOrb position={[3.5, -1.5, -3]} color="#fcc419" size={0.7} />
                        {/* Decorative pillars */}
                        <LegalPillar position={[-4, -0.5, -2]} height={2.5} delay={0} />
                        <LegalPillar position={[4, -0.5, -2]} height={2.5} delay={1} />
                    </>
                )}

                {variant === 'minimal' && (
                    <>
                        <FloatingParticles count={25} color="#fcc419" />
                        <GlowOrb position={[-2, 1, -2]} color="#5c7cfa" size={0.5} />
                        <GlowOrb position={[2, -1, -2]} color="#fcc419" size={0.4} />
                    </>
                )}

                {variant === 'sidebar' && (
                    <>
                        <FloatingParticles count={15} color="#fcc419" />
                        <GlowOrb position={[0, 0, -1]} color="#5c7cfa" size={0.3} />
                    </>
                )}
            </Canvas>
        </div>
    );
}

export function BackgroundAnimation() {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.15} />
                <FloatingParticles count={30} color="#fcc419" />
                <FloatingParticles count={20} color="#5c7cfa" />
                <GlowOrb position={[-4, 2, -5]} color="#5c7cfa" size={1.2} />
                <GlowOrb position={[4, -2, -4]} color="#fcc419" size={0.9} />
                <GlowOrb position={[0, 3, -6]} color="#4c6ef5" size={0.7} />
            </Canvas>
        </div>
    );
}
