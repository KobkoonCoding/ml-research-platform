import React, { useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { BookMarked, AtSign, Globe } from 'lucide-react'

import { DEVELOPER_PROFILE } from '../../lib/developerData'
import { useDecryptText } from '../../hooks/useDecryptText'
import NeuralGraph from './NeuralGraph'

/**
 * Inline LinkedIn brand glyph. lucide-react dropped brand icons so we
 * render it as a small SVG path component matching lucide's API.
 */
function Linkedin({ className = '', strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

/**
 * Inline Instagram brand glyph. Mirrors the lucide icon API.
 */
function Instagram({ className = '', strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

const ICONS = {
  Linkedin,
  BookMarked,
  Instagram,
  AtSign,
  Globe,
}

/**
 * HUD corner bracket (one of four). Draws an L-shape in the specified corner.
 * @param {{ corner: 'tl'|'tr'|'bl'|'br' }} props
 */
function HudCorner({ corner }) {
  const pos = {
    tl: 'top-3 left-3 rotate-0',
    tr: 'top-3 right-3 rotate-90',
    br: 'bottom-3 right-3 rotate-180',
    bl: 'bottom-3 left-3 -rotate-90',
  }[corner]

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      className={`absolute ${pos} pointer-events-none text-cyan-300/50`}
      aria-hidden="true"
    >
      <path
        d="M 1 8 L 1 1 L 8 1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Holographic tilting ID card that showcases the developer.
 * Self-contained — pulls all content from `DEVELOPER_PROFILE`.
 */
function DeveloperCard() {
  const prefersReducedMotion = useReducedMotion()
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Mouse-driven 3D tilt. Values normalized to [-1, 1].
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotateX = useSpring(useTransform(my, [-1, 1], [8, -8]), {
    stiffness: 150,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), {
    stiffness: 150,
    damping: 20,
  })

  // Holographic sheen rotates inversely to cursor position.
  const sheenRotate = useTransform(mx, [-1, 1], [30, -30])

  const handleMouseMove = (event) => {
    if (!cardRef.current || prefersReducedMotion) return
    const rect = cardRef.current.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
    mx.set(nx)
    my.set(ny)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mx.set(0)
    my.set(0)
  }

  const decryptedName = useDecryptText(DEVELOPER_PROFILE.name, {
    duration: 900,
  })

  // Idle float is only active when the user is NOT hovering (so tilt wins).
  const floatAnimation =
    prefersReducedMotion || isHovered
      ? { y: 0 }
      : { y: [0, -6, 0] }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.94, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, type: 'spring' }}
      animate={floatAnimation}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1200,
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(99,102,241,0.04) 100%)',
      }}
      className="relative p-8 md:p-12 rounded-[2rem] border border-white/10 backdrop-blur-md overflow-hidden"
    >
      {/* Dotted HUD grid background. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Ambient neural graph — pure decoration, ~10% opacity. */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12]"
        aria-hidden="true"
      >
        <NeuralGraph
          width={420}
          height={220}
          accent="#8B9CF8"
          className="w-[85%] max-w-[520px]"
        />
      </div>

      {/* Holographic sheen sweep. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          rotate: sheenRotate,
          background:
            'conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(99,102,241,0.18) 90deg, rgba(34,211,238,0.18) 180deg, transparent 270deg)',
          mixBlendMode: 'screen',
          opacity: 0.55,
        }}
        aria-hidden="true"
      />

      {/* HUD corner brackets. */}
      <HudCorner corner="tl" />
      <HudCorner corner="tr" />
      <HudCorner corner="br" />
      <HudCorner corner="bl" />

      {/* ─── Content ─── */}
      <div
        className="relative flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10"
        style={{ transform: 'translateZ(40px)' }}
      >
        {/* Avatar with holographic ring. */}
        <div className="relative flex-shrink-0">
          {/* Rotating conic ring. */}
          <motion.div
            className="absolute -inset-2 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, #6366F1, #22D3EE, #A855F7, #6366F1)',
              filter: 'blur(4px)',
              opacity: 0.75,
            }}
            animate={
              prefersReducedMotion ? { rotate: 0 } : { rotate: 360 }
            }
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'linear',
            }}
            aria-hidden="true"
          />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white ring-1 ring-white/20"
            style={{ background: DEVELOPER_PROFILE.avatarGradient }}
          >
            {DEVELOPER_PROFILE.initials}
          </div>
        </div>

        {/* Identity text block. */}
        <div className="flex-1 text-center md:text-left">
          <h3
            className="text-2xl md:text-3xl font-black text-white mb-2 font-mono tracking-tight"
            aria-label={DEVELOPER_PROFILE.name}
          >
            {decryptedName || '\u00A0'}
          </h3>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <p className="text-cyan-200/90 text-sm font-semibold tracking-wide uppercase">
              {DEVELOPER_PROFILE.role}
            </p>
          </div>
          <p className="text-white/60 text-xs font-mono tracking-wider uppercase mb-4">
            {DEVELOPER_PROFILE.affiliation}
          </p>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg font-light italic mb-6">
            “{DEVELOPER_PROFILE.bio}”
          </p>

          {/* Social rail. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center md:justify-start gap-3 flex-wrap"
          >
            {DEVELOPER_PROFILE.socialLinks.map((link) => {
              const Icon = ICONS[link.iconName] || Globe
              const isMailto = link.href.startsWith('mailto:')
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={isMailto ? undefined : '_blank'}
                  rel={isMailto ? undefined : 'noopener noreferrer'}
                  aria-label={link.ariaLabel}
                  title={link.label}
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  className="group relative w-11 h-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:border-cyan-300/50 hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  <span
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      boxShadow:
                        '0 0 18px 2px rgba(99,102,241,0.45), 0 0 4px rgba(34,211,238,0.35) inset',
                    }}
                    aria-hidden="true"
                  />
                </motion.a>
              )
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default DeveloperCard
