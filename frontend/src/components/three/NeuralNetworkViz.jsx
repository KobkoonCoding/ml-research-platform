import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const COLORS = { input: '#60a5fa', hidden: '#f59e0b', output: '#34d399' }

function layerPositions(count, x) {
  return Array.from({ length: count }, (_, i) => {
    const spread = (count - 1) * 0.7
    return [x, i * 0.7 - spread / 2, 0]
  })
}

function Node({ position, color, isTraining, index }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const bob = Math.sin(t * 0.8 + index * 1.2) * 0.08
    ref.current.position.y = position[1] + bob
    if (isTraining) {
      const pulse = 1 + Math.sin(t * 4 + index) * 0.2
      ref.current.scale.setScalar(pulse)
    } else {
      ref.current.scale.setScalar(1)
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.18, 16, 16]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        distort={0.3}
        speed={2}
        roughness={0.2}
      />
    </mesh>
  )
}

function Connections({ from, to, color, isTraining }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      const opacity = isTraining
        ? 0.3 + Math.sin(clock.getElapsedTime() * 5) * 0.2
        : 0.15
      ref.current.material.opacity = opacity
    }
  })
  const points = useMemo(() => {
    const pts = []
    for (const a of from) {
      for (const b of to) {
        pts.push(new THREE.Vector3(...a), new THREE.Vector3(...b))
      }
    }
    return pts
  }, [from, to])
  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          count={points.length}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </lineSegments>
  )
}

function Scene({ inputCount, hiddenCount, outputCount, isTraining }) {
  const inputPos = useMemo(() => layerPositions(inputCount, -3), [inputCount])
  const hiddenPos = useMemo(() => layerPositions(hiddenCount, 0), [hiddenCount])
  const outputPos = useMemo(() => layerPositions(outputCount, 3), [outputCount])
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <Connections from={inputPos} to={hiddenPos} color={COLORS.input} isTraining={isTraining} />
      <Connections from={hiddenPos} to={outputPos} color={COLORS.hidden} isTraining={isTraining} />
      {inputPos.map((pos, i) => (
        <Node key={`i${i}`} position={pos} color={COLORS.input} isTraining={false} index={i} />
      ))}
      {hiddenPos.map((pos, i) => (
        <Node key={`h${i}`} position={pos} color={COLORS.hidden} isTraining={isTraining} index={i + 10} />
      ))}
      {outputPos.map((pos, i) => (
        <Node key={`o${i}`} position={pos} color={COLORS.output} isTraining={false} index={i + 20} />
      ))}
    </>
  )
}

export default function NeuralNetworkViz({
  inputCount = 4,
  hiddenCount = 6,
  outputCount = 1,
  isTraining = false,
  height = 200,
}) {
  return (
    <Canvas
      style={{ height, width: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 50 }}
    >
      <Scene
        inputCount={inputCount}
        hiddenCount={hiddenCount}
        outputCount={outputCount}
        isTraining={isTraining}
      />
    </Canvas>
  )
}
