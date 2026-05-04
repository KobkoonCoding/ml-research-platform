import React from 'react'
import { motion } from 'framer-motion'
import {
  Mail, FolderGit2, Briefcase, GraduationCap, BookOpen, MapPin,
  Code2, Zap, Layers, Cpu, Database, Globe, ScrollText, Scale, AlertTriangle
} from 'lucide-react'
import SEO from '../components/SEO'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

// Hoist year so test snapshots are not fragile (was inline `new Date().getFullYear()`).
// Single source of truth — bumped once a year.
const COPYRIGHT_YEAR = 2026

// Researcher profile — single source of truth.
// IMPORTANT: replace placeholder ORCID / email / GitHub once verified.
const RESEARCHER = {
  name: 'Dr. Kobkoon Janngam',
  role: 'Lecturer & Researcher',
  affiliation: 'Department of Mathematics, Faculty of Science, Chiang Mai University',
  area: 'Mathematical Optimization · Fixed-Point Theory · Machine Learning',
  email: 'kobkoon.j@cmu.ac.th', // placeholder — confirm before publishing
  links: [
    { icon: Globe,     label: 'CMU Profile', url: 'https://www.science.cmu.ac.th/' },
    { icon: BookOpen,  label: 'ORCID',       url: 'https://orcid.org/' },
    { icon: Briefcase,  label: 'LinkedIn',    url: 'https://www.linkedin.com/' },
    { icon: FolderGit2, label: 'GitHub',      url: 'https://github.com/' },
  ],
}

// Citations + acknowledgements — academic platform must credit datasets/models.
const ACKNOWLEDGEMENTS = [
  { name: 'ImageNet (ILSVRC)',  detail: 'Russakovsky et al., 2015 — used by EfficientNetV2-S backbone' },
  { name: 'COCO 2017',           detail: 'Lin et al., 2014 — bounding-box detection (YOLOv8)' },
  { name: 'torchxrayvision',     detail: 'Cohen et al., 2022 — chest X-ray pathology classifier' },
  { name: 'ISIC 2019',           detail: 'Skin-lesion benchmark — dermoscopy classifier' },
  { name: 'Br35H / BraTS-style', detail: 'Brain tumor MRI classifier (research-only)' },
  { name: 'scikit-learn',        detail: 'Pedregosa et al., 2011 — preprocessing + base classifiers' },
  { name: 'PyTorch + torchvision', detail: 'Paszke et al., 2019 — deep model inference' },
]

// Licensing matrix — what is bundled and under which terms.
const LICENSE_MATRIX = [
  { component: 'Platform code',           license: 'Research / academic showcase', notes: 'Not licensed for commercial use' },
  { component: 'YOLOv8 (Ultralytics)',    license: 'AGPL-3.0',                     notes: 'Strong copyleft — commercial use requires Ultralytics license' },
  { component: 'EfficientNetV2-S',        license: 'Apache-2.0 (torchvision)',     notes: 'Permissive' },
  { component: 'torchxrayvision',         license: 'Apache-2.0',                   notes: 'Permissive — research only for our use' },
  { component: 'scikit-learn',            license: 'BSD-3',                        notes: 'Permissive' },
  { component: 'Plotly.js',               license: 'MIT',                          notes: 'Permissive' },
  { component: 'React / Vite / Tailwind', license: 'MIT',                          notes: 'Permissive' },
]

const TECH_STACK_GROUPED = {
  Frontend: [
    { icon: Code2,  name: 'React 19',     desc: 'UI framework' },
    { icon: Zap,    name: 'Vite 7',       desc: 'Build tool' },
    { icon: Layers, name: 'Tailwind CSS', desc: 'Styling' },
  ],
  Backend: [
    { icon: Cpu,      name: 'FastAPI',  desc: 'API server' },
    { icon: Database, name: 'Pandas',   desc: 'Data ops' },
    { icon: Layers,   name: 'PyTorch',  desc: 'Deep models' },
  ],
}

// BibTeX block (markdown-style — copyable). Update DOI / year before submitting papers.
const BIBTEX = `@misc{nexus_ml_research_platform_${COPYRIGHT_YEAR},
  title  = {NEXUS — ML Research Platform},
  author = {Kobkoon Janngam},
  year   = {${COPYRIGHT_YEAR}},
  note   = {Research showcase, Department of Mathematics, Chiang Mai University},
  url    = {https://example.com/}
}`

export default function AboutPage() {
  const handleCopyBibtex = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX)
    } catch {
      // Clipboard API unavailable; user can still select-and-copy the <pre> block.
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      <SEO
        path="/about"
        title="About — Dr. Kobkoon Janngam"
        description="Researcher profile, BibTeX citation, dataset acknowledgements, and full licensing matrix for the NEXUS ML Research Platform — Department of Mathematics, Chiang Mai University."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          mainEntity: {
            '@type': 'Person',
            name: 'Dr. Kobkoon Janngam',
            jobTitle: 'Researcher',
            affiliation: { '@type': 'EducationalOrganization', name: 'Chiang Mai University' },
            knowsAbout: ['Mathematical Optimization', 'Fixed-Point Theory', 'Machine Learning', 'Extreme Learning Machine'],
          },
        }}
      />
      {/* Page header — clearly distinct from the marketing-style Landing page.
          This page exists to document WHO built the platform, citations, and
          licensing — not to re-pitch the product. */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/15 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <span className="badge-premium mb-4 inline-block">Researcher Profile</span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            About this <span className="text-gradient">research showcase</span>
          </h1>
          <p className="text-text-muted text-base md:text-lg max-w-2xl">
            This page documents the researcher behind NEXUS, the datasets and pre-trained
            models we credit, and the licensing implications of every bundled component —
            so other academics can reproduce, cite, or extend our work responsibly.
          </p>
        </div>
      </motion.div>

      {/* Researcher card */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-text-primary mb-1">{RESEARCHER.name}</h2>
            <div className="text-sm text-text-secondary mb-1 flex items-center gap-2">
              <span>{RESEARCHER.role}</span>
            </div>
            <div className="text-sm text-text-muted flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{RESEARCHER.affiliation}</span>
            </div>
            <div className="text-xs text-text-muted mb-5 italic">{RESEARCHER.area}</div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href={`mailto:${RESEARCHER.email}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {RESEARCHER.email}
              </a>
              {RESEARCHER.links.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface/60 text-text-secondary text-xs font-bold hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Citation — BibTeX block */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" /> Citation
          </h2>
          <button
            onClick={handleCopyBibtex}
            className="px-4 py-2 rounded-xl bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
          >
            Copy BibTeX
          </button>
        </div>
        <p className="text-sm text-text-muted mb-3">
          If this showcase informs your work, please cite it. Replace the URL once a
          permanent landing page is published.
        </p>
        <pre className="text-[12px] leading-relaxed bg-black/30 border border-border rounded-xl p-4 overflow-x-auto text-text-secondary">
          <code>{BIBTEX}</code>
        </pre>
      </motion.div>

      {/* Acknowledgements — datasets & models we credit */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-2">Acknowledgements</h2>
        <p className="text-sm text-text-muted mb-5">
          Pre-trained models and datasets we depend on. Credit goes to the original authors
          and dataset curators.
        </p>
        <ul className="space-y-2.5 text-sm">
          {ACKNOWLEDGEMENTS.map((item) => (
            <li key={item.name} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div>
                <span className="font-bold text-text-primary">{item.name}</span>
                <span className="text-text-muted"> — {item.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Licensing — every bundled component, with implications */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Scale className="w-5 h-5 text-warning" /> Licensing
        </h2>
        <p className="text-sm text-text-muted mb-5">
          Each component bundled into this platform retains its original license.
          Anyone redeploying or extending NEXUS must respect every license below.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-border/30 text-text-muted">
              <tr>
                <th className="text-left font-bold px-4 py-2.5">Component</th>
                <th className="text-left font-bold px-4 py-2.5">License</th>
                <th className="text-left font-bold px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {LICENSE_MATRIX.map((row, i) => (
                <tr key={row.component} className={i % 2 ? 'bg-border/10' : ''}>
                  <td className="px-4 py-2.5 font-bold text-text-primary">{row.component}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      row.license.includes('AGPL')
                        ? 'bg-warning/20 text-warning'
                        : 'bg-success/15 text-success'
                    }`}>
                      {row.license}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-text-secondary">
            <strong className="text-warning">AGPL-3.0 caveat:</strong> YOLOv8 (Ultralytics) is
            strong-copyleft. Bundling it into a publicly-served network application means
            the entire stack — including any modifications — must be released under
            AGPL-3.0 unless a commercial Ultralytics license is purchased. NEXUS is a
            <strong> research showcase only</strong>; production / commercial deployments
            must replace YOLOv8 with a permissively-licensed detector or obtain a license.
          </div>
        </div>
      </motion.div>

      {/* Tech stack — grouped + minimal (Landing already shows pills, this is the engineering view) */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-5">Engineering Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(TECH_STACK_GROUPED).map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-3">
                {group}
              </div>
              <ul className="space-y-2">
                {items.map((tech) => {
                  const Icon = tech.icon
                  return (
                    <li key={tech.name} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-bold text-text-primary">{tech.name}</span>
                        <span className="text-text-muted"> — {tech.desc}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div variants={fadeUp} className="text-center py-8">
        <p className="text-text-muted text-xs">
          &copy; {COPYRIGHT_YEAR} NEXUS — ML Research Platform · Department of Mathematics, Chiang Mai University
        </p>
      </motion.div>
    </motion.div>
  )
}
