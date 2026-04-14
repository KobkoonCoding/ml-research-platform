import React from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Activity, Eye, Gauge, ListChecks, AlertTriangle,
  Heart, Microscope, Clock, Info
} from 'lucide-react'
import {
  getPathology, getScoreBand, SCORE_BANDS,
  getMedicalClass, SHARED_DISCLAIMER,
} from '../lib/pathologyGlossary'

/**
 * Generates a detailed, plain-language clinical interpretation of
 * a torchxrayvision chest X-ray prediction result.
 *
 * This component takes the raw backend response and produces a multi-section
 * report similar to how a radiologist might walk a patient through findings.
 *
 * Important: NOT a medical diagnosis. All text emphasizes that this is
 * educational research output only.
 */

function classify(result) {
  const entries = Object.entries(result.pathologies || {})
  const sorted = [...entries].sort((a, b) => b[1] - a[1])

  const high = sorted.filter(([, s]) => s >= SCORE_BANDS.high.min)
  const notable = sorted.filter(([, s]) => s >= SCORE_BANDS.notable.min && s < SCORE_BANDS.high.min)
  const mild = sorted.filter(([, s]) => s >= SCORE_BANDS.mild.min && s < SCORE_BANDS.notable.min)
  const baseline = sorted.filter(([, s]) => s < SCORE_BANDS.mild.min)

  const maxScore = sorted[0]?.[1] ?? 0
  let overallLevel = 'clean'
  if (maxScore >= SCORE_BANDS.high.min) overallLevel = 'elevated'
  else if (maxScore >= SCORE_BANDS.notable.min) overallLevel = 'notable'
  else if (maxScore >= SCORE_BANDS.mild.min) overallLevel = 'mild'

  return { sorted, high, notable, mild, baseline, maxScore, overallLevel }
}

function buildOverallAssessment({ high, notable, mild, maxScore, overallLevel }, topName) {
  const topInfo = getPathology(topName)
  const topPct = (maxScore * 100).toFixed(1)

  if (overallLevel === 'elevated') {
    return {
      headline: 'Strong signal detected',
      tone: 'elevated',
      body: `The model detected a strong signal for ${topInfo.display} at ${topPct}%. In a clinical setting, this level of attention would typically prompt urgent review by a radiologist and possibly further imaging (CT scan). ${high.length > 1 ? `The model also flagged ${high.length - 1} additional finding${high.length - 1 !== 1 ? 's' : ''} at high confidence.` : ''} Remember that this is a research tool — only a qualified physician can confirm or rule out any diagnosis.`,
    }
  }

  if (overallLevel === 'notable') {
    return {
      headline: 'Notable attention detected',
      tone: 'notable',
      body: `The model's strongest pattern match is ${topInfo.display} at ${topPct}%. This falls in the "notable" range (70-85%), meaning the model sees image features consistent with this finding. ${notable.length > 1 ? `Additionally, ${notable.length - 1} other finding${notable.length - 1 !== 1 ? 's were' : ' was'} flagged at notable levels.` : ''} This warrants follow-up evaluation but is not conclusive on its own — torchxrayvision has an AUC around 0.82-0.86, meaning false positives are expected.`,
    }
  }

  if (overallLevel === 'mild') {
    return {
      headline: 'Mild signal — likely baseline noise',
      tone: 'mild',
      body: `The model's top attention is on ${topInfo.display} at ${topPct}%, which sits in the "mild attention" range (55-70%). Scores in this range are common even on normal chest X-rays because the model uses sigmoid outputs that rarely reach 0.0. ${mild.length > 1 ? `${mild.length - 1} other pathology scored in this mild range.` : ''} This is usually not concerning by itself — it typically reflects the model's default baseline activation rather than a true finding.`,
    }
  }

  return {
    headline: 'No notable signals detected',
    tone: 'clean',
    body: `All pathology scores are below 55% (the baseline threshold). The model did not find any image features that strongly suggest the presence of the 18 pathologies it can detect. This does NOT mean the X-ray is completely normal — the model only knows what it was trained on, and subtle findings may still be present. Always have any X-ray reviewed by a qualified radiologist.`,
  }
}

function buildHeatmapInterpretation(topName) {
  const info = getPathology(topName)
  return {
    pathology: info.display,
    region: info.regions,
    meaning: `The red and yellow areas on the heatmap show where the model concentrated its attention when assigning the highest score to "${info.display}". For this pathology, these regions are typically where ${info.regions.toLowerCase()}. If the attention does not overlap with anatomically-relevant areas (e.g., it focuses on text labels, edges, or equipment), the finding may be unreliable.`,
  }
}

function buildConfidenceAnalysis(overallLevel, maxScore) {
  const pct = (maxScore * 100).toFixed(1)

  const auc = 'Pneumonia AUC 0.86'
  const aucMeaning = 'meaning it correctly ranks pneumonia cases higher than normal cases 86% of the time'

  if (overallLevel === 'elevated' || overallLevel === 'notable') {
    return `This model has a ${auc}, ${aucMeaning}. At ${pct}%, the top finding is in a range where clinicians would generally take it seriously — but expect roughly 14-18% false positive rate. Additional clinical information (symptoms, physical exam, blood tests) is essential for diagnosis.`
  }

  if (overallLevel === 'mild') {
    return `This model has a ${auc}. At ${pct}%, the signal is weak enough that it likely reflects baseline model behavior rather than a real finding. Multi-label models like torchxrayvision output scores independently for each of 18 pathologies, and many sit around 0.4-0.6 even on normal X-rays.`
  }

  return `This model has a ${auc}. With all scores below 55%, the model is essentially saying "I don't see strong patterns for any of my 18 trained pathologies." Still, AUC 0.82-0.86 means occasional misses — if clinical symptoms are concerning, further evaluation is warranted regardless of model output.`
}

function buildNextSteps(overallLevel, topName, notable, high) {
  const topInfo = getPathology(topName)

  const steps = []

  if (overallLevel === 'elevated') {
    steps.push('Share this image and your symptoms with a physician as soon as possible.')
    steps.push(`If "${topInfo.display}" is confirmed: ${topInfo.nextSteps}`)
    if (high.length > 1) {
      steps.push(`${high.length - 1} other pathology flagged at high confidence — also discuss with physician.`)
    }
  } else if (overallLevel === 'notable') {
    steps.push('Discuss findings with a physician within a reasonable timeframe.')
    steps.push(`For "${topInfo.display}": ${topInfo.nextSteps}`)
    if (notable.length > 1) {
      steps.push('Other notable findings may warrant targeted follow-up.')
    }
  } else if (overallLevel === 'mild') {
    steps.push('No urgent action indicated by the model alone.')
    steps.push('If symptoms are present (cough, shortness of breath, chest pain, fever), seek medical evaluation regardless of this model output.')
    steps.push('Routine chest X-ray follow-up as advised by your physician.')
  } else {
    steps.push('No model-flagged concerns at this time.')
    steps.push('Note that AI can miss subtle findings — if you have symptoms, see a doctor.')
    steps.push('Annual or routine chest X-rays per your physician\'s guidance.')
  }

  steps.push('Always have images formally interpreted by a qualified radiologist.')
  return steps
}

function buildLimitations() {
  return [
    'This model was trained on adult chest X-rays; results on pediatric X-rays, lateral views, or non-chest images are unreliable.',
    'torchxrayvision outputs relative ranking scores, not calibrated probabilities. A score of 0.7 does not mean "70% chance of disease."',
    'The model cannot see soft tissue details, cannot evaluate blood vessels in detail, and cannot detect conditions it was not trained on.',
    'Image quality (exposure, patient positioning, artifacts) can substantially affect predictions.',
    'This is a research tool only — not FDA/CE cleared for clinical diagnostic use.',
    'Multi-label outputs mean several pathologies can score high simultaneously; this does not imply the patient has all of them.',
  ]
}

// ─── UI helpers ───

const TONE_COLORS = {
  elevated: '#B91C1C',
  notable: '#EF4444',
  mild: '#F59E0B',
  clean: '#10B981',
}

function Section({ icon: Icon, title, children, tone = 'neutral' }) {
  const color = tone === 'neutral' ? '#94A3B8' : TONE_COLORS[tone] || '#94A3B8'
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <h4
          className="text-[11px] font-black uppercase tracking-widest"
          style={{ color }}
        >
          {title}
        </h4>
      </div>
      <div className="pl-7 text-[12px] text-text-secondary leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

// ─── Multi-class helpers (skin lesion / brain tumor) ───

const CLASS_TONE_COLORS = {
  malignant: '#B91C1C',
  'pre-malignant': '#EF4444',
  benign: '#10B981',
  indeterminate: '#F59E0B',
}

function classifyMultiClass(result, problemId) {
  const entries = Object.entries(result.classes || {})
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const topEntry = sorted[0]
  if (!topEntry) return null
  const [topLabel, topProb] = topEntry
  const info = getMedicalClass(problemId, topLabel)

  let tone = 'indeterminate'
  if (info.malignant === true) {
    tone = info.severity === 'critical' ? 'malignant' : 'pre-malignant'
  } else if (info.malignant === false) {
    tone = 'benign'
  }
  if (topProb < 0.5) tone = 'indeterminate'

  return { sorted, topLabel, topProb, info, tone }
}

function buildMultiClassAssessment(mc, problemId) {
  const { topLabel, topProb, info, tone } = mc
  const pct = (topProb * 100).toFixed(1)
  const toneCopy = {
    malignant: {
      headline: 'Potentially malignant pattern detected',
      body: `The model's top class is "${info.display}" at ${pct}% confidence, which it associates with malignancy. This is a research-only pattern match — only a dermatopathologist (for skin) or neuroradiologist (for brain) can confirm a malignant diagnosis. Urgent specialist review is warranted if clinical suspicion is present.`,
    },
    'pre-malignant': {
      headline: 'Pre-malignant or intermediate pattern',
      body: `The model's top class is "${info.display}" at ${pct}%. This class sits between benign and malignant and typically warrants dermatology or specialist follow-up to rule out progression. This is not a diagnosis.`,
    },
    benign: {
      headline: 'Benign-appearing pattern',
      body: `The model's top class is "${info.display}" at ${pct}%, which is in its benign category. Benign findings still merit periodic review — any change in size, color, or shape should prompt clinical re-evaluation.`,
    },
    indeterminate: {
      headline: 'Low-confidence result',
      body: `The model's top class is "${info.display}" at ${pct}%, below 50%. The model is essentially unsure. Image quality, framing, or out-of-distribution input may be factors. A clinical review is the appropriate next step — do not rely on this prediction alone.`,
    },
  }
  const copy = toneCopy[tone]
  return {
    headline: copy.headline,
    tone,
    body: copy.body,
  }
}

export default function ClinicalInterpretation({ result, problemId = 'xray-pneumonia', outputType }) {
  const mode = outputType || (result?.output_type ?? (result?.pathologies ? 'multi-label' : 'multi-class'))

  if (mode === 'multi-class') {
    return <MultiClassInterpretation result={result} problemId={problemId} />
  }

  if (!result?.pathologies) return null

  const cls = classify(result)
  const topName = result.prediction
  const assessment = buildOverallAssessment(cls, topName)
  const heatmap = buildHeatmapInterpretation(topName)
  const confidence = buildConfidenceAnalysis(cls.overallLevel, cls.maxScore)
  const nextSteps = buildNextSteps(cls.overallLevel, topName, cls.notable, cls.high)
  const limitations = buildLimitations()

  // Findings to detail: everything above baseline
  const detailedFindings = [...cls.high, ...cls.notable, ...cls.mild].slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-[2rem] border border-border p-6 md:p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 pb-5 border-b border-border">
        <div className="p-3 rounded-2xl bg-primary/10">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-black text-text-primary">Detailed Interpretation</h3>
          <p className="text-[11px] md:text-xs text-text-muted font-medium mt-1">
            Educational analysis of model output — not a medical diagnosis
          </p>
        </div>
      </div>

      {/* 1. Overall Assessment — prominent full-width banner */}
      <Section icon={Activity} title="Overall Assessment" tone={assessment.tone}>
        <div
          className="p-4 md:p-5 rounded-xl border"
          style={{
            background: `${TONE_COLORS[assessment.tone]}10`,
            borderColor: `${TONE_COLORS[assessment.tone]}40`,
          }}
        >
          <div
            className="text-base md:text-lg font-black mb-2"
            style={{ color: TONE_COLORS[assessment.tone] }}
          >
            {assessment.headline}
          </div>
          <p className="text-text-secondary text-[13px] md:text-sm leading-relaxed">{assessment.body}</p>
        </div>
      </Section>

      {/* 2. Detailed Findings — 2-column grid on large screens */}
      {detailedFindings.length > 0 && (
        <Section icon={ListChecks} title="Findings Breakdown">
          <p className="text-text-muted text-[12px] italic mb-3">
            Each finding above baseline (55%) is explained below with clinical context.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {detailedFindings.map(([name, score]) => {
              const info = getPathology(name)
              const band = getScoreBand(score)
              return (
                <div
                  key={name}
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${band.color}30`, background: `${band.color}06` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-black text-text-primary">
                      {info.display}
                    </span>
                    <span
                      className="text-[11px] font-black shrink-0"
                      style={{ color: band.color }}
                    >
                      {(score * 100).toFixed(1)}% · {band.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary mb-3 italic">{info.short}</p>

                  <div className="space-y-2 text-[12px] text-text-muted leading-relaxed">
                    <div>
                      <span className="font-bold text-text-secondary">What it means:</span> {info.detail}
                    </div>
                    <div>
                      <span className="font-bold text-text-secondary">Where it appears:</span> {info.regions}
                    </div>
                    {info.causes?.length > 0 && (
                      <div>
                        <span className="font-bold text-text-secondary">Common causes:</span>{' '}
                        {info.causes.slice(0, 4).join(' · ')}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-text-secondary">If confirmed:</span> {info.nextSteps}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* 3 + 4 side-by-side on large screens: Heatmap + Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Eye} title="What the heatmap shows">
          <p>
            <strong className="text-text-primary">Top pattern:</strong> {heatmap.pathology}
          </p>
          <p>
            <strong className="text-text-primary">Expected region:</strong> {heatmap.region}
          </p>
          <p>{heatmap.meaning}</p>
        </Section>

        <Section icon={Gauge} title="How to judge this result">
          <p>{confidence}</p>
        </Section>
      </div>

      {/* 5 + 6 side-by-side: Next steps + Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Heart} title="Recommended next steps" tone={assessment.tone}>
          <ul className="space-y-2 list-disc pl-4">
            {nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Model limitations">
          <ul className="space-y-2 list-disc pl-4">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Final disclaimer */}
      <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-[12px] text-text-secondary leading-relaxed">
          <strong className="text-warning">Educational use only.</strong> This interpretation was
          generated automatically from the model's raw output. It is not a medical diagnosis, prognosis,
          or treatment recommendation. Always consult a licensed physician or radiologist for
          interpretation of any medical imaging.
        </p>
      </div>
    </motion.div>
  )
}

// ─── Multi-class clinical interpretation (skin lesion / brain tumor) ───

function MultiClassInterpretation({ result, problemId }) {
  const mc = classifyMultiClass(result, problemId)
  if (!mc) return null

  const assessment = buildMultiClassAssessment(mc, problemId)
  const toneColor = CLASS_TONE_COLORS[assessment.tone] || '#94A3B8'

  // Top-5 class rows with glossary detail for each above 3%
  const rows = mc.sorted
    .filter(([, p]) => p >= 0.03)
    .slice(0, 6)
    .map(([label, prob]) => ({
      label,
      prob,
      info: getMedicalClass(problemId, label),
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-[2rem] border border-border p-6 md:p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 pb-5 border-b border-border">
        <div className="p-3 rounded-2xl bg-primary/10">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-black text-text-primary">Detailed Interpretation</h3>
          <p className="text-[11px] md:text-xs text-text-muted font-medium mt-1">
            Educational analysis of model output — not a medical diagnosis
          </p>
        </div>
      </div>

      {/* Overall assessment banner */}
      <Section icon={Activity} title="Overall Assessment" tone="elevated">
        <div
          className="p-4 md:p-5 rounded-xl border"
          style={{ background: `${toneColor}10`, borderColor: `${toneColor}40` }}
        >
          <div className="text-base md:text-lg font-black mb-2" style={{ color: toneColor }}>
            {assessment.headline}
          </div>
          <p className="text-text-secondary text-[13px] md:text-sm leading-relaxed">{assessment.body}</p>
        </div>
      </Section>

      {/* Class breakdown with glossary detail */}
      <Section icon={ListChecks} title="Class Breakdown">
        <p className="text-text-muted text-[12px] italic mb-3">
          Softmax distribution across all model classes. Top-6 classes with ≥3% are detailed below.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rows.map(({ label, prob, info }, idx) => {
            const isTop = idx === 0
            const color = info.malignant
              ? CLASS_TONE_COLORS.malignant
              : info.malignant === false
                ? CLASS_TONE_COLORS.benign
                : CLASS_TONE_COLORS.indeterminate
            return (
              <div
                key={label}
                className="rounded-xl border p-4"
                style={{
                  borderColor: `${color}30`,
                  background: `${color}06`,
                  outline: isTop ? `2px solid ${color}50` : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-black text-text-primary">
                    {isTop && '★ '}
                    {info.display}
                  </span>
                  <span className="text-[11px] font-black shrink-0" style={{ color }}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[12px] text-text-secondary mb-3 italic">{info.short}</p>
                <div className="space-y-2 text-[12px] text-text-muted leading-relaxed">
                  <div>
                    <span className="font-bold text-text-secondary">What it is:</span> {info.detail}
                  </div>
                  {info.causes?.length > 0 && (
                    <div>
                      <span className="font-bold text-text-secondary">Common causes:</span>{' '}
                      {info.causes.slice(0, 4).join(' · ')}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-text-secondary">If the model is right:</span>{' '}
                    {info.nextSteps}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Heatmap + confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Eye} title="What the heatmap shows">
          <p>
            <strong className="text-text-primary">Top class:</strong> {mc.info.display}
          </p>
          <p>
            Red/yellow regions show where the ViT's attention rollout concentrated when the model
            decided on this class. If the attention aligns with the clinically relevant region of the
            image (the lesion / the mass), the result is more credible. If it focuses on background,
            artifacts, or framing, the result is likely unreliable.
          </p>
        </Section>

        <Section icon={Gauge} title="How to judge this result">
          <p>
            Softmax outputs are independent probabilities across exclusive classes — the top class is
            the model's single best guess. Confidence <strong>above ~80%</strong> on a well-framed image
            is typically meaningful; confidence <strong>below 50%</strong> means the model couldn't
            commit to a class and the result should be treated with skepticism.
          </p>
          <p>
            This ViT was trained on a specific dataset (ISIC dermoscopy / Kaggle brain MRI). Inputs
            that don't match that distribution — smartphone snapshots, wrong modality, heavy artifacts —
            will produce unreliable outputs regardless of confidence.
          </p>
        </Section>
      </div>

      {/* Next steps + limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Heart} title="Recommended next steps" tone="elevated">
          <ul className="space-y-2 list-disc pl-4">
            <li>{mc.info.nextSteps}</li>
            {mc.info.malignant && (
              <li>
                Because the top class is flagged as potentially malignant, do not wait for symptoms —
                seek a dermatology / neurology specialist referral.
              </li>
            )}
            {!mc.info.malignant && (
              <li>
                Benign classification does not rule out all disease. Any change in appearance, size,
                or symptoms warrants re-evaluation.
              </li>
            )}
            <li>Always have the original image reviewed by a qualified specialist.</li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Model limitations">
          <ul className="space-y-2 list-disc pl-4">
            <li>Trained on a narrow dataset — out-of-distribution inputs produce unreliable outputs.</li>
            <li>ViT attention rollout is an approximation of what the model "sees" — it highlights regions contributing to the prediction but is not a pathology localizer.</li>
            <li>Multi-class softmax forces the model to pick a class even when none fit — confidence &lt;50% means the model is effectively guessing.</li>
            <li>Image quality (focus, lighting for skin; slice plane for MRI) substantially affects predictions.</li>
            <li>Research tool only — not FDA/CE cleared for clinical use.</li>
          </ul>
        </Section>
      </div>

      {/* Final disclaimer */}
      <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-[12px] text-text-secondary leading-relaxed">
          <strong className="text-warning">{SHARED_DISCLAIMER}</strong>{' '}
          This interpretation was generated from the model's raw softmax output; it is not a medical
          diagnosis, prognosis, or treatment recommendation.
        </p>
      </div>
    </motion.div>
  )
}
