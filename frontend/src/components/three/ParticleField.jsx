import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 1500, isDark = true }) {
  const mesh = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20

      const palette = [
        [0.39, 0.40, 0.95],
        [0.55, 0.36, 0.96],
        [0.02, 0.71, 0.83],
        [0.96, 0.45, 0.71],
        [0.23, 0.51, 0.96],
      ]
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }
    return [pos, col]
  }, [count])

  useFrame((state) => {
    if (!mesh.current || document.hidden) return
    const time = state.clock.elapsedTime
    const posArr = mesh.current.geometry.attributes.position.array
    // Update only every 3rd particle per frame for performance
    const offset = Math.floor(time * 60) % 3
    for (let i = offset; i < count; i += 3) {
      const i3 = i * 3
      posArr[i3 + 1] += Math.sin(time * 0.3 + i * 0.01) * 0.002
      posArr[i3] += Math.cos(time * 0.2 + i * 0.015) * 0.001
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
    mesh.current.rotation.y = time * 0.02
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={isDark ? 0.7 : 0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function FloatingOrbs({ isDark = true }) {
  const group = useRef()

  useFrame((state) => {
    if (!group.current || document.hidden) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.05
    group.current.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.5 + i * 2) * 0.5
    })
  })

  return (
    <group ref={group}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[
          Math.cos(i * 1.256) * 4,
          Math.sin(i * 0.8) * 2,
          Math.sin(i * 1.256) * 4
        ]}>
          <sphereGeometry args={[0.3 + i * 0.1, 16, 16]} />
          <meshBasicMaterial
            color={isDark ? '#6366F1' : '#818CF8'}
            transparent
            opacity={isDark ? 0.15 : 0.08}
          />
        </mesh>
      ))}
    </group>
  )
}

function ConnectionLines({ isDark = true }) {
  const linesRef = useRef()

  const linePositions = useMemo(() => {
    const points = []
    const nodeCount = 20
    for (let i = 0; i < nodeCount; i++) {
      points.push(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12
      )
    }
    const linePoints = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = points[i*3] - points[j*3]
        const dy = points[i*3+1] - points[j*3+1]
        const dz = points[i*3+2] - points[j*3+2]
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < 5) {
          linePoints.push(
            points[i*3], points[i*3+1], points[i*3+2],
            points[j*3], points[j*3+1], points[j*3+2]
          )
        }
      }
    }
    return new Float32Array(linePoints)
  }, [])

  useFrame((state) => {
    if (!linesRef.current || document.hidden) return
    linesRef.current.rotation.y = state.clock.elapsedTime * 0.015
  })

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={linePositions.length / 3} array={linePositions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        color={isDark ? '#6366F1' : '#818CF8'}
        transparent
        opacity={isDark ? 0.08 : 0.05}
      />
    </lineSegments>
  )
}

function Scene({ count, isDark }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <Particles count={count} isDark={isDark} />
      <FloatingOrbs isDark={isDark} />
      <ConnectionLines isDark={isDark} />
    </>
  )
}

export default function ParticleField({ intensity = 'normal', isDark = true }) {
  const count = intensity === 'hero' ? 800 : intensity === 'subtle' ? 300 : 600

  // Pause canvas when tab is hidden
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const handler = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return (
    <div className="three-canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={1}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene count={count} isDark={isDark} />
        </Suspense>
      </Canvas>
    </div>
  )
}
