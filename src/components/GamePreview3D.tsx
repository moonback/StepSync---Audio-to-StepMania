import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SMNote } from '../lib/smParser';

interface GamePreview3DProps {
  notes: SMNote[];
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

const COLORS = [
  '#ef4444', // Left: Red
  '#3b82f6', // Down: Blue
  '#3b82f6', // Up: Blue
  '#ef4444', // Right: Red
];

// 0: Left, 1: Down, 2: Up, 3: Right
const ROTATIONS = [
  Math.PI / 2, // Left
  Math.PI,     // Down
  0,           // Up
  -Math.PI / 2 // Right
];

const SCROLL_SPEED = 8; // units per second
const RECEPTOR_Y = 3;

function getArrowGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(0.5, 0);
  shape.lineTo(0.25, 0);
  shape.lineTo(0.25, -0.5);
  shape.lineTo(-0.25, -0.5);
  shape.lineTo(-0.25, 0);
  shape.lineTo(-0.5, 0);
  shape.lineTo(0, 0.5);
  return new THREE.ShapeGeometry(shape);
}

function ArrowMesh({ position, color, rotationZ }: { position: [number, number, number], color: string, rotationZ: number }) {
  const geometry = useMemo(() => getArrowGeometry(), []);
  return (
    <mesh position={position} rotation={[0, 0, rotationZ]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} side={THREE.DoubleSide} />
      <mesh position={[0, 0, 0.01]} scale={0.85}>
        <primitive object={geometry} attach="geometry" />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
}

function MineMesh({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 4;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <circleGeometry args={[0.4, 32]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} side={THREE.DoubleSide} />
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
}

function Receptors() {
  const geometry = useMemo(() => getArrowGeometry(), []);
  return (
    <group position={[0, RECEPTOR_Y, 0]}>
      {[0, 1, 2, 3].map((col) => (
        <mesh key={`rec-${col}`} position={[(col - 1.5) * 1.5, 0, 0]} rotation={[0, 0, ROTATIONS[col]]}>
          <primitive object={geometry} attach="geometry" />
          <meshBasicMaterial color="#475569" opacity={0.6} transparent />
          {/* Outline/Border effect for receptors */}
          <mesh scale={1.1} position={[0, 0, -0.01]}>
            <primitive object={geometry} attach="geometry" />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}

function NotesHighway({ notes, audioRef }: { notes: SMNote[], audioRef: React.MutableRefObject<HTMLAudioElement | null> }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current || !audioRef.current) return;
    const time = audioRef.current.currentTime;
    
    // Move the group UP. Notes start at negative relative Y and move up to hit the receptor at RECEPTOR_Y.
    groupRef.current.position.y = time * SCROLL_SPEED;
  });

  return (
    <group ref={groupRef}>
      {notes.map((note, idx) => {
        const yPos = RECEPTOR_Y - note.time * SCROLL_SPEED;
        const xPos = (note.col - 1.5) * 1.5;
        
        if (note.type === 'mine') {
          return <MineMesh key={`note-${idx}`} position={[xPos, yPos, 0]} />;
        }
        
        return (
          <ArrowMesh 
            key={`note-${idx}`} 
            position={[xPos, yPos, 0]} 
            color={COLORS[note.col]} 
            rotationZ={ROTATIONS[note.col]} 
          />
        );
      })}
    </group>
  );
}

export function GamePreview3D({ notes, audioRef, isPlaying }: GamePreview3DProps) {
  return (
    <div className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative border border-slate-800 shadow-2xl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>
      <div className="absolute inset-0 z-10">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
          <ambientLight intensity={1} />
          <directionalLight position={[0, 10, 5]} intensity={1} />
          
          <Receptors />
          <NotesHighway notes={notes} audioRef={audioRef} />
        </Canvas>
      </div>
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 pointer-events-none">
          <div className="px-4 py-2 bg-slate-900/80 rounded-full border border-slate-700 text-white font-semibold flex items-center space-x-2">
            <span>En pause</span>
          </div>
        </div>
      )}
    </div>
  );
}
