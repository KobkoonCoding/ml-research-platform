import React from 'react'

/* ═══════════════════════════════════════════════════
   Inline Animated SVG Illustrations
   Lightweight, theme-aware, no external dependencies.
   ═══════════════════════════════════════════════════ */

/** DataFlowSVG — animated bars + flowing lines for EDA page */
export function DataFlowSVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes bar-grow { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        .df-bar { transform-origin: bottom; animation: bar-grow 2.5s ease-in-out infinite; }
      `}</style>
      <rect x="10" y="15" width="10" height="50" rx="3" fill="#6366F1" opacity="0.7" className="df-bar" style={{ animationDelay: '0s' }} />
      <rect x="25" y="15" width="10" height="50" rx="3" fill="#818CF8" opacity="0.6" className="df-bar" style={{ animationDelay: '0.3s' }} />
      <rect x="40" y="15" width="10" height="50" rx="3" fill="#6366F1" opacity="0.7" className="df-bar" style={{ animationDelay: '0.6s' }} />
      <rect x="55" y="15" width="10" height="50" rx="3" fill="#A5B4FC" opacity="0.5" className="df-bar" style={{ animationDelay: '0.9s' }} />
      <rect x="70" y="15" width="10" height="50" rx="3" fill="#818CF8" opacity="0.6" className="df-bar" style={{ animationDelay: '1.2s' }} />
      <line x1="85" y1="25" x2="95" y2="40" stroke="#6366F1" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <line x1="85" y1="40" x2="95" y2="35" stroke="#818CF8" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <line x1="85" y1="55" x2="95" y2="45" stroke="#6366F1" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    </svg>
  )
}

/** CleaningSVG — sparkles + data for Preprocessing page */
export function CleaningSVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes sparkle { 0%,100% { opacity: 0.2; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } }
        .cl-spark { transform-origin: center; animation: sparkle 1.8s ease-in-out infinite; }
      `}</style>
      <rect x="15" y="20" width="50" height="35" rx="6" stroke="#10B981" strokeWidth="2" opacity="0.5" fill="none" />
      <line x1="25" y1="30" x2="55" y2="30" stroke="#10B981" strokeWidth="1.5" opacity="0.3" />
      <line x1="25" y1="38" x2="50" y2="38" stroke="#10B981" strokeWidth="1.5" opacity="0.3" />
      <line x1="25" y1="46" x2="45" y2="46" stroke="#10B981" strokeWidth="1.5" opacity="0.3" />
      <circle cx="72" cy="22" r="4" fill="#34D399" opacity="0.8" className="cl-spark" style={{ animationDelay: '0s' }} />
      <circle cx="82" cy="35" r="3" fill="#10B981" opacity="0.6" className="cl-spark" style={{ animationDelay: '0.5s' }} />
      <circle cx="75" cy="50" r="3.5" fill="#6EE7B7" opacity="0.7" className="cl-spark" style={{ animationDelay: '1s' }} />
      <circle cx="88" cy="18" r="2" fill="#A7F3D0" opacity="0.5" className="cl-spark" style={{ animationDelay: '1.5s' }} />
    </svg>
  )
}

/** VerifySVG — shield + checkmark for Verification page */
export function VerifySVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes check-draw { 0% { stroke-dashoffset: 30; } 100% { stroke-dashoffset: 0; } }
        @keyframes shield-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        .vf-shield { animation: shield-pulse 3s ease-in-out infinite; }
        .vf-check { stroke-dasharray: 30; animation: check-draw 1.5s ease-out forwards; }
      `}</style>
      <path d="M50 8 L75 20 V42 C75 55 62 65 50 70 C38 65 25 55 25 42 V20 Z"
        stroke="#10B981" strokeWidth="2.5" fill="rgba(16,185,129,0.08)" className="vf-shield" />
      <polyline points="37,38 47,48 63,28" stroke="#34D399" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" className="vf-check" />
    </svg>
  )
}

/** SetupSVG — gears/config for Setup page */
export function SetupSVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes gear-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes gear-spin-r { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
        .gs-gear1 { transform-origin: 38px 35px; animation: gear-spin 8s linear infinite; }
        .gs-gear2 { transform-origin: 65px 42px; animation: gear-spin-r 6s linear infinite; }
      `}</style>
      <circle cx="38" cy="35" r="14" stroke="#F59E0B" strokeWidth="2" fill="rgba(245,158,11,0.08)" className="gs-gear1" />
      <circle cx="38" cy="35" r="5" fill="#F59E0B" opacity="0.4" />
      <line x1="38" y1="19" x2="38" y2="24" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" className="gs-gear1" />
      <line x1="38" y1="46" x2="38" y2="51" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" className="gs-gear1" />
      <line x1="22" y1="35" x2="27" y2="35" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" className="gs-gear1" />
      <line x1="49" y1="35" x2="54" y2="35" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" className="gs-gear1" />
      <circle cx="65" cy="42" r="10" stroke="#FBBF24" strokeWidth="2" fill="rgba(251,191,36,0.06)" className="gs-gear2" />
      <circle cx="65" cy="42" r="3.5" fill="#FBBF24" opacity="0.3" />
    </svg>
  )
}

/** NetworkSVG — neural network for Train page */
export function NetworkSVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes node-pulse { 0%,100% { r: 4; opacity: 0.6; } 50% { r: 5.5; opacity: 1; } }
        .nn-node { animation: node-pulse 2s ease-in-out infinite; }
      `}</style>
      {/* Connections */}
      {[20, 37, 55].map(iy => [18, 30, 42, 55].map(hy => (
        <line key={`${iy}-${hy}`} x1="15" y1={iy} x2="48" y2={hy} stroke="#F59E0B" strokeWidth="0.8" opacity="0.15" />
      )))}
      {[18, 30, 42, 55].map(hy => (
        <line key={`o-${hy}`} x1="48" y1={hy} x2="85" y2="37" stroke="#F97316" strokeWidth="0.8" opacity="0.15" />
      ))}
      {/* Input nodes */}
      {[20, 37, 55].map((y, i) => (
        <circle key={`i${i}`} cx="15" cy={y} r="4" fill="#60A5FA" opacity="0.7" className="nn-node" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      {/* Hidden nodes */}
      {[18, 30, 42, 55].map((y, i) => (
        <circle key={`h${i}`} cx="48" cy={y} r="4" fill="#F59E0B" opacity="0.8" className="nn-node" style={{ animationDelay: `${i * 0.2 + 0.5}s` }} />
      ))}
      {/* Output node */}
      <circle cx="85" cy="37" r="5" fill="#34D399" opacity="0.9" className="nn-node" style={{ animationDelay: '1.2s' }} />
    </svg>
  )
}

/** PredictSVG — target/crosshair for Predict page */
export function PredictSVG({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none">
      <style>{`
        @keyframes target-pulse { 0%,100% { r: 22; opacity: 0.15; } 50% { r: 26; opacity: 0.25; } }
        @keyframes scan-line { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .tp-ring { animation: target-pulse 3s ease-in-out infinite; }
        .tp-scan { transform-origin: 50px 37px; animation: scan-line 4s linear infinite; }
      `}</style>
      <circle cx="50" cy="37" r="22" stroke="#F59E0B" strokeWidth="1.5" fill="none" className="tp-ring" />
      <circle cx="50" cy="37" r="14" stroke="#FBBF24" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="50" cy="37" r="4" fill="#F59E0B" opacity="0.6" />
      <line x1="50" y1="37" x2="50" y2="12" stroke="#F97316" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" className="tp-scan" />
      <line x1="28" y1="37" x2="72" y2="37" stroke="#F59E0B" strokeWidth="0.8" opacity="0.2" />
      <line x1="50" y1="15" x2="50" y2="59" stroke="#F59E0B" strokeWidth="0.8" opacity="0.2" />
    </svg>
  )
}
