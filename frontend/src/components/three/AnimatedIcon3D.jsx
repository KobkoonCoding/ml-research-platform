import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'

const GEOMETRIES = {
  dodecahedron: (props) => <dodecahedronGeometry args={[0.8, 0]} {...props} />,
  octahedron: (props) => <octahedronGeometry args={[0.8, 0]} {...props} />,
  torus: (props) => <torusGeometry args={[0.6, 0.25, 16, 32]} {...props} />,
  icosahedron: (props) => <icosahedronGeometry args={[0.8, 0]} {...props} />,
}

function GemMesh({ shape, color, speed }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current || document.hidden) return
    const t = state.clock.elapsedTime * speed
    meshRef.current.rotation.y = t * 0.4
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2
  })

  const Geometry = GEOMETRIES[shape] ?? GEOMETRIES.dodecahedron

  return (
    <Float speed={1.5 * speed} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <Geometry />
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={2 * speed}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  )
}

/**
 * Inline 3D floating icon rendered via React Three Fiber.
 *
 * @param {{ shape?: 'dodecahedron'|'octahedron'|'torus'|'icosahedron', color?: string, size?: number, speed?: number }} props
 */
export default function AnimatedIcon3D({
  shape = 'dodecahedron',
  color = '#f59e0b',
  size = 60,
  speed = 1,
}) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const handler = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return (
    <div style={{ width: size, height: size, display: 'inline-block' }}>
      <Canvas
        dpr={1}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: false }}
        style={{ background: 'transparent' }}
        shadows={false}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 5]} intensity={1.2} />
        <GemMesh shape={shape} color={color} speed={speed} />
      </Canvas>
    </div>
  )
}
