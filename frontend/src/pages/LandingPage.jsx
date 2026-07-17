import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import SEO from '../components/SEO'
import useLandingEngine from '../components/landing/v2/useLandingEngine'
import ModuleModal from '../components/landing/v2/ModuleModal'
import { DEVELOPER_PROFILE } from '../lib/developerData'
import '../components/landing/v2/landing-v2.css'

/* ═══════════════════════════════════════════════════════════════
   SEO / JSON-LD (unchanged from v1 — content identity is the same)
   ══════════════════════════════════════════════════════════════ */

const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://ml-research-platform.vercel.app/#website',
      url: 'https://ml-research-platform.vercel.app/',
      name: 'NEXUS — ML Research Platform',
      inLanguage: 'en',
      publisher: { '@id': 'https://ml-research-platform.vercel.app/#person' },
    },
    {
      '@type': 'Person',
      '@id': 'https://ml-research-platform.vercel.app/#person',
      name: 'Dr. Kobkoon Janngam',
      affiliation: { '@type': 'EducationalOrganization', name: 'Chiang Mai University' },
      jobTitle: 'Researcher',
    },
    {
      '@type': 'ItemList',
      name: 'Platform modules',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Data Forensic & Cleaning',
          url: 'https://ml-research-platform.vercel.app/forensic',
          description: 'Automated EDA + leakage-safe preprocessing pipeline.' },
        { '@type': 'ListItem', position: 2, name: 'ELM Studio',
          url: 'https://ml-research-platform.vercel.app/elm-studio',
          description: 'Train Extreme Learning Machine models with cross-validation.' },
        { '@type': 'ListItem', position: 3, name: 'AI Model Hub',
          url: 'https://ml-research-platform.vercel.app/deep-learning',
          description: 'Pretrained image classification, medical imaging, and object detection.' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is NEXUS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'NEXUS is a no-code research platform fusing mathematical optimization with machine learning. It covers data cleaning, ELM training, and pretrained AI inference.',
          },
        },
        {
          '@type': 'Question',
          name: 'Who built it?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Dr. Kobkoon Janngam at the Department of Mathematics, Chiang Mai University. The platform is a research showcase, not a commercial product.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Extreme Learning Machine (ELM)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ELM is a single-hidden-layer feedforward network whose input weights are fixed randomly while the output weights are computed in closed form via the Moore-Penrose pseudo-inverse. Training is orders of magnitude faster than backpropagation.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use the medical imaging models for diagnosis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. The medical-imaging models are research-only pattern-matching tools and are not FDA-cleared. Only qualified specialists can diagnose medical images.',
          },
        },
      ],
    },
  ],
}

/* ═══════════════════════════════════════════════════════════════
   CONTENT
   ══════════════════════════════════════════════════════════════ */

const SECTION_IDS = ['hero', 'clean', 'train', 'try', 'gallery', 'cta', 'developer']

const DOTS = [
  { target: 'hero', title: 'Intro' },
  { target: 'clean', title: 'Clean' },
  { target: 'train', title: 'Train' },
  { target: 'try', title: 'Try' },
  { target: 'gallery', title: 'Showcase' },
  { target: 'cta', title: 'Start' },
  { target: 'developer', title: 'Developer' },
]

const TICKER_WORDS = ['Clean', 'Train', 'Try', 'Descend', 'Converge', 'Predict']

const GALLERY_CARDS = [
  {
    img: '/samples/xray-pneumonia.jpg', tag: 'xray.img',
    title: 'Chest X-ray screening', desc: 'DenseNet-121 with Grad-CAM attention.',
  },
  {
    img: '/samples/brain-glioma.jpg', tag: 'mri.img',
    title: 'Brain tumor MRI', desc: 'Vision Transformer with attention rollout.',
  },
  {
    img: '/samples/pose-group.jpg', tag: 'detect.img',
    title: 'Object detection', desc: 'YOLOv8 across 80 everyday classes.',
  },
  {
    img: '/samples/cat.jpg', tag: 'imagenet.img',
    title: 'General image classification', desc: 'ImageNet-1k, EfficientNetV2 backbone.',
  },
  {
    img: '/samples/pizza.jpg', tag: 'food.img',
    title: 'Food-101 recognition', desc: '101 dishes, fine-tuned EfficientNet.',
  },
  {
    img: '/samples/peacock.jpg', tag: 'birds.img',
    title: 'Birds-525 classification', desc: '525 species at fine-grained detail.',
  },
  {
    img: '/samples/zebra.jpg', tag: 'animals.img',
    title: 'Animal detection', desc: 'YOLOv8 tuned for wildlife scenes.',
  },
  {
    img: '/samples/pose-dance.jpg', tag: 'pose.img',
    title: 'Pose estimation', desc: '17-keypoint skeletons in real time.',
  },
]

/* ═══════════════════════════════════════════════════════════════
   SHARED STYLE FRAGMENTS (prototype-exact values)
   ══════════════════════════════════════════════════════════════ */

const heroCardStyle = (side) => ({
  position: 'absolute',
  ...(side === 'right'
    ? { right: 'clamp(20px,7vw,110px)', textAlign: 'right', transformOrigin: 'right center' }
    : { left: 'clamp(20px,7vw,110px)', textAlign: 'left', transformOrigin: 'left center' }),
  maxWidth: 'min(560px,52vw)',
  willChange: 'transform,opacity,filter',
  textShadow: '0 0 36px rgba(4,5,9,0.94),0 2px 12px rgba(4,5,9,0.92)',
  opacity: 0,
  padding: 'clamp(26px,3vw,42px)',
  borderRadius: 28,
  background: 'rgba(7,9,15,0.38)',
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.55)',
})

const heroH2Style = {
  fontWeight: 200,
  lineHeight: 1.02,
  letterSpacing: '-0.025em',
  fontSize: 'clamp(1.8rem,4.2vw,3.9rem)',
}

const moduleSectionStyle = {
  position: 'relative',
  zIndex: 2,
  padding: 'clamp(70px,12vh,150px) clamp(20px,7vw,120px)',
}

const moduleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
  gap: 'clamp(36px,5vw,90px)',
  alignItems: 'center',
  maxWidth: 1300,
  margin: '0 auto',
}

const ghostNumStyle = {
  fontWeight: 300,
  fontSize: 'clamp(3rem,7vw,6rem)',
  color: 'rgba(255,255,255,0.14)',
  lineHeight: 1,
  letterSpacing: '-0.02em',
}

const moduleH3Style = {
  fontWeight: 300,
  fontSize: 'clamp(2rem,4vw,3.4rem)',
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
  marginTop: 12,
}

const moduleParaStyle = {
  color: '#c6cddc',
  fontSize: 'clamp(15.5px,1.25vw,17.5px)',
  lineHeight: 1.65,
  maxWidth: '44ch',
  marginTop: 22,
}

const featureListStyle = {
  listStyle: 'none',
  marginTop: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  fontSize: 15.5,
  padding: 0,
}

// Glass panel behind each module's text column — body copy floats over
// the 3D scene otherwise and gets hard to read on bright terrain areas.
const moduleTextPanelStyle = {
  padding: 'clamp(22px,2.6vw,36px)',
  borderRadius: 24,
  background: 'rgba(7,9,15,0.5)',
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(14px) saturate(1.15)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.15)',
  boxShadow: '0 24px 60px -30px rgba(0,0,0,0.55)',
}

function Feature({ children }) {
  return (
    <li style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span style={{ color: '#6da8ff' }}>—</span>
      {children}
    </li>
  )
}

function TickerGroup() {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        gap: 'clamp(30px,4vw,60px)', paddingRight: 'clamp(30px,4vw,60px)',
      }}
    >
      {TICKER_WORDS.map((w) => (
        <React.Fragment key={w}>
          <span
            className="lv2-serif"
            style={{
              fontWeight: 200, fontStyle: 'italic',
              fontSize: 'clamp(1.5rem,2.4vw,2.2rem)', letterSpacing: '-0.01em',
              color: '#dfe9ff', whiteSpace: 'nowrap',
            }}
          >
            {w}
          </span>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(109,168,255,0.7)', flex: '0 0 auto',
            }}
          />
        </React.Fragment>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHOWCASE INDEX — model list, with two small always-visible sample
   images (X-ray + MRI) beside the heading.
   ══════════════════════════════════════════════════════════════ */

function ShowcaseIndex() {
  return (
    <section
      id="gallery"
      style={{ position: 'relative', zIndex: 2, padding: 'clamp(90px,14vh,170px) clamp(20px,7vw,120px)' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          data-reveal
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 'clamp(28px,4vw,64px)', flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <div className="lv2-label" style={{ marginBottom: 22 }}>07 — Showcase</div>
            <h2
              className="lv2-serif"
              style={{ fontWeight: 200, fontSize: 'clamp(2.2rem,4.6vw,4.2rem)', lineHeight: 1, letterSpacing: '-0.025em' }}
            >
              Optimized in the <span style={{ fontStyle: 'italic' }}>wild.</span>
            </h2>
            <p style={{ color: '#aab3c5', marginTop: 18, fontSize: 15, lineHeight: 1.6, maxWidth: '52ch' }}>
              Eight live models across vision, medical imaging, and detection —
              pick one and try it with your own image.
            </p>
          </div>
          {/* sample inputs — always visible */}
          <div className="lv2-samples" aria-hidden>
            <figure className="lv2-sample" style={{ transform: 'rotate(-4deg)' }}>
              <img src="/samples/xray-pneumonia.jpg" alt="" loading="lazy" />
              <figcaption>xray.img</figcaption>
            </figure>
            <figure className="lv2-sample" style={{ transform: 'rotate(4.5deg) translateY(14px)' }}>
              <img src="/samples/brain-glioma.jpg" alt="" loading="lazy" />
              <figcaption>mri.img</figcaption>
            </figure>
          </div>
        </div>
        <div data-reveal className="lv2-index" style={{ marginTop: 46 }}>
          {GALLERY_CARDS.map((card, i) => (
            <Link key={card.tag} to="/deep-learning" className="lv2-row">
              <span className="lv2-row-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="lv2-row-title lv2-serif">{card.title}</span>
              <span className="lv2-row-meta">{card.desc}</span>
              <span className="lv2-row-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { theme } = useTheme()
  const { refs, toggleSound, scrollToId } = useLandingEngine({ sectionIds: SECTION_IDS })
  const [soundOn, setSoundOn] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Esc closes the mobile drawer (the modal handles its own Esc)
  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  let initialLoaderVisible = true
  try {
    initialLoaderVisible = sessionStorage.getItem('nexus:intro-seen') !== '1'
  } catch { /* private mode: show it */ }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) initialLoaderVisible = false

  // Landing always renders dark (WebGL scene has baked dark palette).
  // Restore the user's chosen theme on unmount — same strategy as v1.
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', 'dark')
    root.classList.remove('light')
    root.classList.add('dark')
    return () => {
      const restore = themeRef.current || 'dark'
      root.setAttribute('data-theme', restore)
      root.classList.remove('light', 'dark')
      root.classList.add(restore)
    }
  }, [])

  const handleAnchor = (e, id) => {
    e.preventDefault()
    scrollToId(id)
  }

  // "Skip intro" pill — visible while the pinned hero story is playing
  const [showSkip, setShowSkip] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('hero')
      if (!hero) return
      const r = hero.getBoundingClientRect()
      setShowSkip(window.scrollY > 60 && r.bottom > window.innerHeight * 1.3)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={refs.root} className="landing-v2" style={{ position: 'relative', width: '100%', background: '#06070c' }}>
      <SEO
        path="/"
        title="NEXUS — ML Research Platform · Mathematical Optimization for Machine Learning"
        description="No-code ML research platform fusing mathematical optimization with machine learning — data cleaning, Extreme Learning Machine training, and pretrained AI inference (image, medical, object detection). Built by Dr. Kobkoon Janngam, Chiang Mai University."
        jsonLd={LANDING_JSON_LD}
      />

      {/* WebGL background + vignette + grain */}
      <canvas ref={refs.bgCanvas} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 44%, transparent 34%, rgba(6,7,12,0.74) 100%)',
        }}
      />
      <div
        data-grain
        style={{
          position: 'fixed', inset: 0, zIndex: 140, pointerEvents: 'none',
          opacity: 0.055, mixBlendMode: 'overlay',
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')",
        }}
      />

      {/* Custom cursor */}
      <div
        data-cursor
        ref={refs.cursor}
        style={{
          position: 'fixed', top: 0, left: 0, width: 26, height: 26,
          border: '1px solid rgba(180,205,255,0.7)', borderRadius: '50%',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 150,
          mixBlendMode: 'difference', willChange: 'left,top',
        }}
      />

      {/* Loader */}
      {initialLoaderVisible && (
        <div
          ref={refs.loader}
          style={{
            position: 'fixed', inset: 0, zIndex: 200, background: '#06070c',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 1s cubic-bezier(.76,0,.24,1)',
          }}
        >
          <div className="lv2-label" style={{ marginBottom: 28 }}>Nexus</div>
          <div
            ref={refs.counter}
            className="lv2-serif"
            style={{ fontWeight: 200, fontSize: 'clamp(4rem,16vw,13rem)', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            000
          </div>
          <div
            style={{
              fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
              color: '#5a6273', marginTop: 26,
            }}
          >
            Where Mathematics Meets Machine Learning
          </div>
        </div>
      )}

      {/* Skip intro — quick escape from the pinned hero story */}
      {showSkip && (
        <button className="lv2-skip" onClick={() => scrollToId('clean')}>
          Skip intro ↓
        </button>
      )}

      {/* Scroll progress bar */}
      <div
        ref={refs.progress}
        style={{
          position: 'fixed', top: 0, left: 0, height: 2, width: '0%',
          background: 'linear-gradient(90deg,#6da8ff,#b79dff)', zIndex: 130,
        }}
      />

      {/* Section dots */}
      <div
        data-dots
        style={{
          position: 'fixed', right: 22, top: '50%', transform: 'translateY(-50%)',
          zIndex: 115, display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        {DOTS.map((d) => (
          <a
            key={d.target}
            href={`#${d.target}`}
            aria-label={d.title}
            onClick={(e) => handleAnchor(e, d.target)}
            className="lv2-dot"
          >
            <span
              data-dot
              style={{
                width: 8, height: 8, borderRadius: '50%',
                border: '1px solid rgba(180,205,255,0.4)', background: 'transparent',
                display: 'block', transition: 'all .35s',
              }}
            />
            <span className="lv2-dot-label">{d.title}</span>
          </a>
        ))}
      </div>

      {/* Nav */}
      <nav
        ref={refs.nav}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px clamp(20px,5vw,64px)',
          transition: 'background .5s, backdrop-filter .5s, border-color .5s',
          borderBottom: '1px solid transparent',
        }}
      >
        <a
          href="#hero"
          onClick={(e) => handleAnchor(e, 'hero')}
          className="lv2-serif"
          style={{ fontSize: 22, letterSpacing: '-0.01em', fontWeight: 400 }}
        >
          Nexus<span style={{ color: '#6da8ff' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: 'clamp(10px,1.4vw,18px)', alignItems: 'center' }}>
          <div className="lv2-nav-links" data-nav-desktop>
            <a className="lv2-nav-link" data-nav-link data-target="clean" href="#clean" onClick={(e) => handleAnchor(e, 'clean')}>Clean</a>
            <a className="lv2-nav-link" data-nav-link data-target="train" href="#train" onClick={(e) => handleAnchor(e, 'train')}>Train</a>
            <a className="lv2-nav-link" data-nav-link data-target="try" href="#try" onClick={(e) => handleAnchor(e, 'try')}>Try</a>
            <a className="lv2-nav-link" data-nav-link data-target="gallery" href="#gallery" onClick={(e) => handleAnchor(e, 'gallery')}>Showcase</a>
            <Link className="lv2-nav-link" to="/docs">Docs</Link>
            <span className="lv2-nav-sep" />
            <button
              className="lv2-nav-link"
              onClick={() => setSoundOn(toggleSound())}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span
                style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  marginRight: 7, verticalAlign: 'middle',
                  background: soundOn ? '#8fb6ff' : 'rgba(255,255,255,0.25)',
                  boxShadow: soundOn ? '0 0 8px #6da8ff' : 'none',
                  transition: 'all .3s',
                }}
              />
              Sound
            </button>
          </div>
          <button
            data-magnet
            data-nav-desktop
            onClick={() => setModalOpen(true)}
            className="lv2-pill-solid"
            style={{ padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', border: 'none' }}
          >
            Get Started
          </button>
          <button
            className="lv2-burger"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer — top-down curtain reveal, staggered items */}
      {drawerOpen && (
        <div className="lv2-drawer">
          {[
            { id: 'clean', label: 'Clean' },
            { id: 'train', label: 'Train' },
            { id: 'try', label: 'Try' },
            { id: 'gallery', label: 'Showcase' },
          ].map((l, i) => (
            <button
              key={l.id}
              className="lv2-drawer-item"
              style={{ animationDelay: `${0.18 + i * 0.07}s` }}
              onClick={() => {
                setDrawerOpen(false)
                scrollToId(l.id)
              }}
            >
              <span className="lv2-drawer-num">0{i + 1}</span>
              {l.label}
              <span className="lv2-drawer-arrow">→</span>
            </button>
          ))}
          <Link
            className="lv2-drawer-item"
            style={{ animationDelay: '0.46s' }}
            to="/docs"
            onClick={() => setDrawerOpen(false)}
          >
            <span className="lv2-drawer-num">05</span>
            Docs
            <span className="lv2-drawer-arrow">→</span>
          </Link>
          <button
            className="lv2-drawer-item"
            style={{ animationDelay: '0.53s', color: '#8fb6ff', fontSize: '1.15rem' }}
            onClick={() => setSoundOn(toggleSound())}
          >
            Sound · {soundOn ? 'on' : 'off'}
          </button>
          <button
            onClick={() => {
              setDrawerOpen(false)
              setModalOpen(true)
            }}
            className="lv2-drawer-item lv2-pill-solid"
            style={{
              animationDelay: '0.6s', fontSize: '1.05rem', padding: '14px 36px',
              fontFamily: "'Manrope',sans-serif", border: 'none', cursor: 'pointer', marginTop: 10,
            }}
          >
            Get Started
          </button>
          <div className="lv2-drawer-foot" style={{ animationDelay: '0.7s' }}>
            Where Mathematics Meets Machine Learning
          </div>
        </div>
      )}

      {/* ═══ HERO — 520vh pinned scroll story ═══ */}
      <section id="hero" ref={refs.heroWrap} style={{ position: 'relative', height: '400vh', zIndex: 2 }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: 1200 }}>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: '48%', pointerEvents: 'none', background: 'linear-gradient(90deg,rgba(6,7,12,0.76),rgba(6,7,12,0.34) 44%,transparent)' }} />
          <div style={{ position: 'absolute', inset: '0 0 0 auto', width: '48%', pointerEvents: 'none', background: 'linear-gradient(270deg,rgba(6,7,12,0.76),rgba(6,7,12,0.34) 44%,transparent)' }} />

          {/* Step 0 — intro. Title pinned near the top, subtitle + CTAs at
              the bottom, so the mid-screen band stays clear for the 3D net. */}
          <div
            data-hero-step
            style={{
              position: 'absolute', inset: 0,
              textAlign: 'center', transformOrigin: 'center center',
              willChange: 'transform,opacity,filter',
              textShadow: '0 0 44px rgba(4,5,9,0.96),0 2px 14px rgba(4,5,9,0.92)',
            }}
          >
            <div className="lv2-label" style={{ marginTop: '19vh', marginBottom: 18 }}>Where Mathematics Meets Machine Learning</div>
            <h1
              className="lv2-serif"
              style={{ fontWeight: 200, lineHeight: 0.96, letterSpacing: '-0.025em', fontSize: 'clamp(2.2rem,4.8vw,4.6rem)' }}
            >
              Optimize. <span className="lv2-serif lv2-gradient-text" style={{ fontWeight: 300 }}>Learn.</span>
            </h1>
            <p
              style={{
                margin: '16px auto 0', maxWidth: 640, padding: '0 20px',
                fontSize: 'clamp(14px,1.2vw,17px)', lineHeight: 1.6, color: '#ccd3e2',
              }}
            >
              A no-code research platform where mathematical optimization powers machine
              learning — from data cleaning to model training to real-time inference.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
              <a
                href="#manifesto"
                data-magnet
                onClick={(e) => handleAnchor(e, 'manifesto')}
                className="lv2-pill-solid"
                style={{ padding: '12px 28px', fontSize: 14.5 }}
              >
                Explore Platform
              </a>
              <Link to="/deep-learning" data-magnet className="lv2-pill" style={{ padding: '12px 28px', fontSize: 14.5 }}>
                Try AI Models — No Setup
              </Link>
            </div>
          </div>

          {/* Step 1 — raw data */}
          <div data-hero-step style={{ ...heroCardStyle('right'), bottom: '18%' }}>
            <div className="lv2-label" style={{ marginBottom: 22 }}>01 — Raw data</div>
            <h2 className="lv2-serif" style={heroH2Style}>
              Every dataset begins
              <br />
              as a <span style={{ fontStyle: 'italic' }}>cloud of points.</span>
            </h2>
          </div>

          {/* Step 2 — optimization */}
          <div data-hero-step style={{ ...heroCardStyle('left'), top: '22%' }}>
            <div className="lv2-label" style={{ marginBottom: 22 }}>02 — Optimization</div>
            <h2 className="lv2-serif" style={heroH2Style}>
              Optimization folds
              <br />
              it into <span style={{ fontStyle: 'italic' }}>structure.</span>
            </h2>
          </div>

          {/* Step 3 — inference */}
          <div data-hero-step style={{ ...heroCardStyle('right'), bottom: '20%' }}>
            <div className="lv2-label" style={{ marginBottom: 22 }}>03 — Inference</div>
            <h2 className="lv2-serif" style={heroH2Style}>
              The model wakes up —
              <br />
              <span style={{ fontStyle: 'italic' }}>ready to answer.</span>
            </h2>
          </div>

          {/* Scroll hint */}
          <div
            ref={refs.scrollHint}
            style={{
              position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#5a6273',
            }}
          >
            <span>Scroll</span>
            <div style={{ width: 1, height: 34, background: 'linear-gradient(#5a6273,transparent)', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 8, background: '#6da8ff', animation: 'lv2-scrolldot 1.8s infinite' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTO / ABOUT ═══ */}
      <section
        id="manifesto"
        style={{
          position: 'relative', zIndex: 2,
          padding: 'clamp(90px,14vh,170px) clamp(20px,7vw,120px)',
          maxWidth: 1300, margin: '0 auto', textAlign: 'center',
        }}
      >
        <div className="lv2-label" style={{ color: '#5a6273', marginBottom: 46 }}>The thesis</div>
        <p
          className="lv2-serif"
          style={{
            fontWeight: 200, lineHeight: 1.14, letterSpacing: '-0.02em',
            fontSize: 'clamp(2rem,5.4vw,4.8rem)', maxWidth: '16ch', margin: '0 auto',
            textShadow: '0 0 40px rgba(4,5,9,0.85),0 2px 14px rgba(4,5,9,0.8)',
          }}
        >
          <span data-word style={{ display: 'inline-block' }}>Optimization</span>{' '}
          <span data-word style={{ display: 'inline-block' }}>is</span>{' '}
          <span data-word style={{ display: 'inline-block' }}>how</span>{' '}
          <span data-word style={{ display: 'inline-block' }}>machines</span>{' '}
          <span data-word className="lv2-gradient-text" style={{ display: 'inline-block' }}>learn</span>{' '}
          <span data-word style={{ display: 'inline-block' }}>to</span>{' '}
          <span data-word style={{ display: 'inline-block' }}>decide.</span>
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 80 }}>
          {[
            { big: '9', small: 'live AI models across vision & medical' },
            { big: '3', small: 'integrated modules — clean · train · try' },
            { big: '0', small: 'lines of code required' },
          ].map((s) => (
            <div
              key={s.small}
              data-reveal
              style={{
                padding: '22px 30px', borderRadius: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)', minWidth: 180,
              }}
            >
              <div className="lv2-serif" style={{ fontWeight: 300, fontSize: '2.4rem', letterSpacing: '-0.02em' }}>{s.big}</div>
              <div style={{ color: '#aab3c5', fontSize: 13.5, lineHeight: 1.5, marginTop: 6, maxWidth: '22ch' }}>{s.small}</div>
            </div>
          ))}
        </div>
        <Link
          to="/about"
          style={{ display: 'inline-block', marginTop: 42, fontSize: 14, color: '#8fb6ff', letterSpacing: '0.04em' }}
        >
          Read the full story →
        </Link>
      </section>

      {/* ═══ TICKER ═══ */}
      <div
        style={{
          position: 'relative', zIndex: 2, overflow: 'hidden',
          padding: 'clamp(18px,3vh,30px) 0',
          borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(6,7,12,0.35)', backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ display: 'flex', width: 'max-content', animation: 'lv2-marquee 34s linear infinite', willChange: 'transform' }}>
          <TickerGroup />
          <TickerGroup />
        </div>
      </div>

      {/* ═══ MODULE 04 — DATA FORENSIC & CLEANING ═══ */}
      <section id="clean" style={moduleSectionStyle}>
        <div style={moduleGridStyle}>
          <div data-reveal style={moduleTextPanelStyle}>
            <div data-plx="0.1" className="lv2-serif" style={ghostNumStyle}>04</div>
            <h3 className="lv2-serif" style={moduleH3Style}>Data Forensic &amp; Cleaning</h3>
            <p style={moduleParaStyle}>
              A dedicated laboratory for automated dataset cleansing, anomaly detection, and
              missing-value treatment — the essential first step before any ML pipeline.
            </p>
            <ul style={featureListStyle}>
              <Feature>Auto-detect data quality issues</Feature>
              <Feature>Handle missing values &amp; outliers</Feature>
              <Feature>Encode categories &amp; scale features</Feature>
              <Feature>Visual EDA with interactive charts</Feature>
            </ul>
            <Link to="/forensic" data-magnet className="lv2-pill" style={{ marginTop: 34, padding: '12px 26px', fontSize: 14.5 }}>
              Clean Your Data →
            </Link>
          </div>
          <div
            data-reveal
            style={{
              position: 'relative', aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden',
              background: 'rgba(9,11,18,0.55)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: '#8890a3', marginLeft: 8 }}>dataset_preview.csv</span>
            </div>
            <div style={{ flex: 1, padding: 'clamp(10px,1.6vw,20px)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'ui-monospace,monospace', fontSize: 'clamp(10px,1vw,12.5px)', color: '#b6bdcc' }}>
                <thead>
                  <tr style={{ color: '#6da8ff', textAlign: 'left' }}>
                    {['id', 'age', 'income', 'city', 'target'].map((h) => (
                      <th key={h} style={{ padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.12)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '7px 8px' }}>0041</td><td style={{ padding: '7px 8px' }}>34</td>
                    <td style={{ padding: '7px 8px' }}>52,000</td><td style={{ padding: '7px 8px' }}>Chiang Mai</td>
                    <td style={{ padding: '7px 8px' }}>1</td>
                  </tr>
                  <tr style={{ background: 'rgba(109,168,255,0.06)' }}>
                    <td style={{ padding: '7px 8px' }}>0042</td>
                    <td style={{ padding: '7px 8px', color: '#ffd9a8' }}>
                      <s style={{ opacity: 0.55 }}>NaN</s> → 31
                    </td>
                    <td style={{ padding: '7px 8px' }}>48,500</td><td style={{ padding: '7px 8px' }}>Bangkok</td>
                    <td style={{ padding: '7px 8px' }}>0</td>
                  </tr>
                  <tr style={{ background: 'rgba(109,168,255,0.06)' }}>
                    <td style={{ padding: '7px 8px' }}>0043</td><td style={{ padding: '7px 8px' }}>29</td>
                    <td style={{ padding: '7px 8px', color: '#ffd9a8' }}>
                      <s style={{ opacity: 0.55 }}>9,999,999</s> → capped
                    </td>
                    <td style={{ padding: '7px 8px' }}>Phuket</td><td style={{ padding: '7px 8px' }}>1</td>
                  </tr>
                  <tr style={{ opacity: 0.35, textDecoration: 'line-through' }}>
                    <td style={{ padding: '7px 8px' }}>0044</td><td style={{ padding: '7px 8px' }}>34</td>
                    <td style={{ padding: '7px 8px' }}>52,000</td><td style={{ padding: '7px 8px' }}>Chiang Mai</td>
                    <td style={{ padding: '7px 8px' }}>1</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '7px 8px' }}>0045</td><td style={{ padding: '7px 8px' }}>41</td>
                    <td style={{ padding: '7px 8px' }}>61,200</td><td style={{ padding: '7px 8px' }}>Khon Kaen</td>
                    <td style={{ padding: '7px 8px' }}>0</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: '#8890a3',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6da8ff' }} />
              3 issues detected · auto-fixed — 1 imputed · 1 capped · 1 duplicate removed
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MODULE 05 — ELM STUDIO ═══ */}
      <section id="train" style={moduleSectionStyle}>
        <div style={moduleGridStyle}>
          <div
            data-reveal
            ref={refs.lossWrap}
            style={{
              order: 2, aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
              background: 'rgba(9,11,18,0.55)', backdropFilter: 'blur(10px)',
            }}
          >
            <canvas ref={refs.lossCanvas} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            <span
              style={{
                position: 'absolute', bottom: 16, left: 16,
                fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: '#8890a3',
              }}
            >
              gradient_descent · scrub ↓
            </span>
          </div>
          <div data-reveal style={moduleTextPanelStyle}>
            <div data-plx="0.1" className="lv2-serif" style={ghostNumStyle}>05</div>
            <h3 className="lv2-serif" style={moduleH3Style}>ELM Studio</h3>
            <p style={moduleParaStyle}>
              Extreme Learning Machine training powered by a proven optimization algorithm with
              theoretical convergence guarantees. Train classification models in milliseconds —
              no backpropagation needed.
            </p>
            <ul style={featureListStyle}>
              <Feature>Optimization-based ELM with convergence guarantees</Feature>
              <Feature>Configurable hidden nodes &amp; activation</Feature>
              <Feature>Real-time prediction with probability</Feature>
            </ul>
            <Link to="/elm-studio" data-magnet className="lv2-pill" style={{ marginTop: 34, padding: '12px 26px', fontSize: 14.5 }}>
              Train Your Model →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MODULE 06 — AI MODEL HUB ═══ */}
      <section id="try" style={moduleSectionStyle}>
        <div style={moduleGridStyle}>
          <div data-reveal style={moduleTextPanelStyle}>
            <div data-plx="0.1" className="lv2-serif" style={ghostNumStyle}>06</div>
            <h3 className="lv2-serif" style={moduleH3Style}>AI Model Hub</h3>
            <p style={moduleParaStyle}>
              A curated collection of pre-trained models — image classification, medical imaging,
              and object detection. Upload an image and get instant predictions with attention
              heatmaps, bounding boxes, and pose skeletons.
            </p>
            <Link to="/deep-learning" data-magnet className="lv2-pill" style={{ marginTop: 34, padding: '12px 26px', fontSize: 14.5 }}>
              Try Our Models →
            </Link>
          </div>
          <div
            data-reveal
            style={{
              borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(11,13,20,0.62)', backdropFilter: 'blur(14px)',
              overflow: 'hidden', boxShadow: '0 40px 80px -40px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: '#8890a3', marginLeft: 8 }}>model-hub · prediction</span>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div data-reveal style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
                <img
                  src="/samples/cat.jpg"
                  alt="Sample input for image classification"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) brightness(0.92)' }}
                />
                <span
                  style={{
                    position: 'absolute', bottom: 10, left: 10, fontFamily: 'ui-monospace,monospace',
                    fontSize: 11, color: '#b6bdcc', background: 'rgba(6,7,12,0.7)', padding: '4px 8px', borderRadius: 6,
                  }}
                >
                  input.jpg · 224×224
                </span>
              </div>
              {[
                { label: 'tabby cat', conf: 0.93 },
                { label: 'tiger cat', conf: 0.04 },
                { label: 'Egyptian cat', conf: 0.02 },
              ].map((r) => (
                <div key={r.label} data-reveal style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: '#c6cddc', width: 110, flexShrink: 0 }}>
                    {r.label}
                  </span>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${r.conf * 100}%`, height: '100%', borderRadius: 4,
                        background: 'linear-gradient(90deg,#6da8ff,#b79dff)',
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: '#8fb6ff', width: 42, textAlign: 'right' }}>
                    {r.conf.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE — model index with cursor preview ═══ */}
      <ShowcaseIndex />

      {/* ═══ CTA ═══ */}
      <section id="cta" style={{ position: 'relative', zIndex: 2, padding: 'clamp(100px,16vh,190px) clamp(20px,7vw,120px)', textAlign: 'center' }}>
        <div data-reveal style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="lv2-label" style={{ marginBottom: 32 }}>08 — Converge · Research platform</div>
          <h2
            className="lv2-serif"
            style={{ fontWeight: 200, fontSize: 'clamp(2.8rem,9vw,7.5rem)', lineHeight: 0.94, letterSpacing: '-0.03em' }}
          >
            Ready to <span className="lv2-gradient-text">compile?</span>
          </h2>
          <p
            style={{
              color: '#c6cddc', maxWidth: '44ch', margin: '30px auto 0',
              fontSize: 'clamp(15px,1.3vw,18px)', lineHeight: 1.65,
            }}
          >
            From raw data to trained models to live predictions — no code required.
            Pick a module and start your research workflow.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 46, flexWrap: 'wrap' }}>
            <button
              data-magnet
              onClick={() => setModalOpen(true)}
              className="lv2-pill-solid"
              style={{ padding: '15px 34px', fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Initialize System
            </button>
            <Link to="/deep-learning" data-magnet className="lv2-pill" style={{ padding: '15px 34px', fontSize: 15 }}>
              Try AI Models
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MEET THE DEVELOPER — the particles' final form ═══ */}
      <section
        id="developer"
        style={{
          position: 'relative', zIndex: 2, minHeight: '105vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(70px,10vh,130px) clamp(20px,7vw,120px) 0',
        }}
      >
        <div style={{ ...moduleGridStyle, width: '100%', alignItems: 'center' }}>
          <div data-reveal style={{ ...moduleTextPanelStyle, maxWidth: 560 }}>
            <div data-plx="0.1" className="lv2-serif" style={ghostNumStyle}>09</div>
            <div className="lv2-label" style={{ marginTop: 16 }}>The researcher</div>
            <h3 className="lv2-serif" style={{ ...moduleH3Style, marginTop: 14 }}>{DEVELOPER_PROFILE.name}</h3>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: '#8fb6ff', fontSize: 13.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {DEVELOPER_PROFILE.role}
              </span>
              <span style={{ color: '#5a6273' }}>·</span>
              <span style={{ color: '#aab3c5', fontSize: 13.5 }}>{DEVELOPER_PROFILE.affiliation}</span>
            </div>
            <p style={{ ...moduleParaStyle, fontStyle: 'italic' }}>“{DEVELOPER_PROFILE.bio}”</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
              {DEVELOPER_PROFILE.socialLinks.map((link) => {
                const isMailto = link.href.startsWith('mailto:')
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={isMailto ? undefined : '_blank'}
                    rel={isMailto ? undefined : 'noopener noreferrer'}
                    aria-label={link.ariaLabel}
                    className="lv2-pill"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                  >
                    {link.label}
                  </a>
                )
              })}
            </div>
          </div>
          {/* Right half stays empty — the WebGL particles assemble into the
              developer's 3D portrait here (morph stage 3). On small screens
              this spacer keeps the portrait visible below the panel. */}
          <div aria-hidden style={{ minHeight: '46vh' }} />
        </div>
        <footer
          style={{
            maxWidth: 1300, margin: 'clamp(80px,12vh,140px) auto 0', paddingTop: 36,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 20, color: '#5a6273', fontSize: 13,
          }}
        >
          <div className="lv2-serif" style={{ fontSize: 20, color: '#eef1f8' }}>
            Nexus<span style={{ color: '#6da8ff' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: 26 }}>
            <a href="#clean" onClick={(e) => handleAnchor(e, 'clean')}>Modules</a>
            <a href="#gallery" onClick={(e) => handleAnchor(e, 'gallery')}>Showcase</a>
            <Link to="/about">About</Link>
            <Link to="/docs">Docs</Link>
          </div>
          <div>© 2026 ML Research Platform · Dr. Kobkoon Janngam · Chiang Mai University</div>
        </footer>
      </section>

      <ModuleModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
