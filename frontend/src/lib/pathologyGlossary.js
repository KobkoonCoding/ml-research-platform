/**
 * Plain-language descriptions of the 18 chest X-ray pathologies
 * detected by the torchxrayvision DenseNet121-all model.
 *
 * Each entry has:
 *   - display: user-friendly title
 *   - short: 1-line plain explanation
 *   - detail: longer clinical context for users who want to learn more
 *   - severity: 'critical' | 'serious' | 'moderate' | 'finding'
 *   - regions: where this pathology typically appears on X-ray
 *   - causes: array of common causes
 *   - urgency: 'routine' | 'moderate' | 'urgent'
 *   - nextSteps: plain-language recommendation if a radiologist confirmed this
 */

export const PATHOLOGY_GLOSSARY = {
  Pneumonia: {
    display: 'Pneumonia',
    short: 'Infection of the lung tissue, usually bacterial or viral.',
    detail: 'Lung infection causing inflammation in the air sacs. On X-ray appears as a white cloudy area ("consolidation") typically in one lung region. Requires medical treatment.',
    severity: 'serious',
    regions: 'Usually appears as a white patch in one lung lobe — lower lobes most common. Can affect any region.',
    causes: ['Bacterial infection (Streptococcus, Haemophilus)', 'Viral infection (influenza, COVID-19, RSV)', 'Fungal infection (immunocompromised patients)', 'Aspiration (stomach contents entering lungs)'],
    urgency: 'urgent',
    nextSteps: 'Clinical evaluation with physical exam, blood tests, and possibly sputum culture. Antibiotics or antivirals if confirmed.',
  },
  Atelectasis: {
    display: 'Atelectasis',
    short: 'Collapsed or partially-collapsed lung area.',
    detail: 'Portion of the lung that has deflated — lung tissue is not fully expanded. Can be caused by blockage, shallow breathing, or pressure from surrounding tissue.',
    severity: 'moderate',
    regions: 'Can appear in any lobe. Often seen as a wedge-shaped opacity or linear streaks. Common at lung bases after surgery.',
    causes: ['Post-surgical (shallow breathing)', 'Mucus plug or tumor blocking airway', 'Pleural effusion compressing lung', 'Pneumothorax', 'Chronic lung disease'],
    urgency: 'moderate',
    nextSteps: 'Identify the underlying cause. Deep breathing exercises, incentive spirometry, or bronchoscopy if obstruction is suspected.',
  },
  Cardiomegaly: {
    display: 'Cardiomegaly',
    short: 'Enlarged heart.',
    detail: 'The heart appears larger than normal on X-ray (cardiothoracic ratio > 0.5). May indicate underlying heart disease such as hypertension, cardiomyopathy, or valve problems.',
    severity: 'serious',
    regions: 'Central chest — the cardiac silhouette occupies more than half the chest width.',
    causes: ['Hypertension (high blood pressure)', 'Cardiomyopathy', 'Valve disease (regurgitation)', 'Congestive heart failure', 'Pericardial effusion'],
    urgency: 'moderate',
    nextSteps: 'Echocardiogram to assess heart function and structure. Blood pressure check. Cardiology referral.',
  },
  Consolidation: {
    display: 'Consolidation',
    short: 'Lung filled with fluid or solid material instead of air.',
    detail: 'White opacity where a lung region has been replaced by fluid, pus, blood, or cells. Common in pneumonia, but also in edema or hemorrhage.',
    severity: 'serious',
    regions: 'Appears as a dense white patch, often in one lobe. "Air bronchograms" (dark branches through the white area) are classic.',
    causes: ['Pneumonia (most common)', 'Pulmonary edema', 'Pulmonary hemorrhage', 'Lung cancer (bronchioloalveolar type)', 'Aspiration'],
    urgency: 'urgent',
    nextSteps: 'Clinical correlation. Blood work, sputum analysis, possibly CT scan. Treat underlying cause.',
  },
  Edema: {
    display: 'Pulmonary Edema',
    short: 'Fluid buildup in the lungs.',
    detail: 'Excess fluid in the air sacs, often caused by heart failure. Appears as fluffy white patterns in both lungs on X-ray. Can be a medical emergency.',
    severity: 'critical',
    regions: 'Usually bilateral (both lungs), central/perihilar "bat wing" or "butterfly" pattern. Kerley B lines at the periphery.',
    causes: ['Congestive heart failure (most common)', 'Kidney failure (fluid overload)', 'ARDS', 'High altitude', 'Drug toxicity'],
    urgency: 'urgent',
    nextSteps: 'Emergency evaluation. Diuretics, oxygen, treatment of underlying cardiac or renal cause.',
  },
  Effusion: {
    display: 'Pleural Effusion',
    short: 'Fluid collection between the lung and chest wall.',
    detail: 'Abnormal fluid in the space around the lungs. Can be caused by heart failure, infection, cancer, or liver/kidney disease. Often visible as a white area at the bottom of the lung.',
    severity: 'serious',
    regions: 'Blunting of the costophrenic angle (bottom corner of the lung on X-ray). Larger effusions fill the lower lung field with a curved upper border ("meniscus").',
    causes: ['Congestive heart failure', 'Pneumonia (parapneumonic effusion)', 'Cancer (malignant effusion)', 'Liver cirrhosis', 'Kidney failure', 'Tuberculosis'],
    urgency: 'moderate',
    nextSteps: 'Ultrasound to characterize fluid. Thoracentesis (fluid drainage and analysis) to identify cause.',
  },
  Emphysema: {
    display: 'Emphysema',
    short: 'Damaged air sacs — chronic lung disease.',
    detail: 'A form of COPD where the lung tissue loses elasticity and air sacs are destroyed. Strongly associated with smoking. Makes breathing progressively harder.',
    severity: 'moderate',
    regions: 'Hyperinflated lungs (appear too dark and too large). Flattened diaphragm. Upper lobes often most affected.',
    causes: ['Cigarette smoking (most common)', 'Long-term air pollution exposure', 'Alpha-1 antitrypsin deficiency (genetic)', 'Occupational dust/fume exposure'],
    urgency: 'routine',
    nextSteps: 'Pulmonary function tests to confirm. Smoking cessation. Bronchodilators, possibly oxygen therapy.',
  },
  Fibrosis: {
    display: 'Pulmonary Fibrosis',
    short: 'Scarring or stiffening of lung tissue.',
    detail: 'Lung tissue becomes thick and scarred over time. Reduces ability to breathe deeply. Can be caused by many conditions including autoimmune disease or environmental exposure.',
    severity: 'moderate',
    regions: 'Reticular (net-like) or honeycomb pattern, often at lung bases. Can be unilateral or bilateral.',
    causes: ['Idiopathic Pulmonary Fibrosis (unknown cause)', 'Autoimmune disease (RA, scleroderma)', 'Asbestos exposure', 'Chronic hypersensitivity pneumonitis', 'Post-infection scarring'],
    urgency: 'moderate',
    nextSteps: 'High-resolution CT scan for better characterization. Pulmonary function tests. Autoimmune workup.',
  },
  Infiltration: {
    display: 'Infiltration',
    short: 'Abnormal substance (fluid, cells, or protein) in the lung.',
    detail: 'A general term for any non-air material filling the lung — fluid, pus, blood, or immune cells. This is a finding, not a specific diagnosis — often points toward infection or inflammation.',
    severity: 'moderate',
    regions: 'Can appear anywhere in the lungs. Often fluffy, patchy white areas that are less dense than consolidation.',
    causes: ['Early pneumonia', 'Interstitial lung disease', 'Pulmonary edema (early)', 'Atypical infections', 'Hypersensitivity reactions'],
    urgency: 'moderate',
    nextSteps: 'Clinical correlation with symptoms. Follow-up imaging to see if it progresses or resolves. Treat underlying cause.',
  },
  Mass: {
    display: 'Lung Mass',
    short: 'Abnormal growth larger than 3 cm.',
    detail: 'A larger abnormal density in the lung. Can be benign or malignant. Requires follow-up imaging (typically CT) and possibly biopsy to determine the cause.',
    severity: 'critical',
    regions: 'Can appear anywhere in the lungs. Usually round or irregular, well-defined edges. Larger than 3 cm.',
    causes: ['Lung cancer (primary)', 'Metastatic cancer (from other organs)', 'Benign tumor (hamartoma)', 'Infection (abscess, fungal)', 'Old scar or granuloma'],
    urgency: 'urgent',
    nextSteps: 'CT scan of chest with contrast. PET scan if cancer suspected. Biopsy (bronchoscopy, CT-guided, or surgical).',
  },
  Nodule: {
    display: 'Lung Nodule',
    short: 'Small round spot in the lung (under 3 cm).',
    detail: 'A small round opacity. Most nodules are benign (e.g., old infection, scar), but some can be early-stage cancer. Usually followed up with CT scan.',
    severity: 'moderate',
    regions: 'Anywhere in the lungs. Small, well-defined round spot less than 3 cm.',
    causes: ['Old healed infection (granuloma)', 'Benign lung tumor', 'Early lung cancer', 'Metastasis (small)', 'Fungal infection'],
    urgency: 'moderate',
    nextSteps: 'CT scan for characterization. Follow-up CT at 3-6 months if indeterminate. Biopsy if suspicious features.',
  },
  Pneumothorax: {
    display: 'Pneumothorax',
    short: 'Collapsed lung — air in the chest cavity.',
    detail: 'Air has leaked into the space between the lung and chest wall, causing the lung to collapse. Can be a medical emergency. Often appears as a dark area with a visible lung edge.',
    severity: 'critical',
    regions: 'Dark area without lung markings, usually at the top of the chest. Visible visceral pleural line separating collapsed lung from air.',
    causes: ['Spontaneous (tall thin young men)', 'Trauma (rib fracture, stab wound)', 'Iatrogenic (after procedures)', 'Underlying lung disease (COPD, asthma)', 'Smoking'],
    urgency: 'urgent',
    nextSteps: 'Small: observation and oxygen. Large/tension: needle decompression or chest tube insertion immediately.',
  },
  Pleural_Thickening: {
    display: 'Pleural Thickening',
    short: 'Scarring or thickening of the lung lining.',
    detail: 'The pleura (lining around the lungs) becomes thicker. Can be caused by old infection, asbestos exposure, or inflammation. Usually a chronic finding.',
    severity: 'finding',
    regions: 'Along the edge of the lung, often at the bases or apices. Usually unilateral if from old infection, bilateral if asbestos-related.',
    causes: ['Old tuberculosis or empyema', 'Asbestos exposure', 'Hemothorax (old)', 'Chronic inflammation', 'Radiation therapy'],
    urgency: 'routine',
    nextSteps: 'Compare to prior imaging if available. Usually stable and benign. CT if concerning features (nodularity, growth).',
  },
  Hernia: {
    display: 'Hiatal Hernia',
    short: 'Upper stomach pushes through the diaphragm.',
    detail: 'Part of the stomach protrudes through the diaphragm muscle into the chest. May cause heartburn and acid reflux. Often an incidental finding.',
    severity: 'finding',
    regions: 'Retrocardiac (behind the heart), often with an air-fluid level indicating stomach content in the chest.',
    causes: ['Age-related weakening of the diaphragm', 'Obesity', 'Chronic coughing/straining', 'Previous abdominal surgery', 'Congenital'],
    urgency: 'routine',
    nextSteps: 'Usually no treatment needed. Lifestyle changes for GERD symptoms. Surgical repair only if large or symptomatic.',
  },
  'Enlarged Cardiomediastinum': {
    display: 'Enlarged Cardiomediastinum',
    short: 'Widened central chest area (heart + surrounding tissue).',
    detail: 'The middle compartment of the chest appears wider than normal. May indicate heart enlargement, mass, aneurysm, or lymph node enlargement.',
    severity: 'serious',
    regions: 'Central chest — the mediastinum (space containing heart, great vessels, trachea, esophagus) appears wider than 8 cm.',
    causes: ['Aortic aneurysm or dissection', 'Lymphadenopathy (infection, cancer)', 'Mediastinal mass (thymoma, lymphoma)', 'Cardiac enlargement', 'Hemorrhage after trauma'],
    urgency: 'urgent',
    nextSteps: 'Immediate CT chest with contrast to evaluate. Can indicate serious conditions requiring urgent intervention.',
  },
  'Lung Lesion': {
    display: 'Lung Lesion',
    short: 'General abnormal area in the lung.',
    detail: 'Any abnormal spot in the lung — broad term that includes nodules, masses, cavities, or other findings. Usually requires further imaging.',
    severity: 'moderate',
    regions: 'Anywhere in the lungs. Non-specific term that covers many abnormalities.',
    causes: ['Infection (active or old)', 'Tumor (benign or malignant)', 'Inflammation', 'Vascular abnormality', 'Artifact on X-ray'],
    urgency: 'moderate',
    nextSteps: 'CT scan to characterize. Compare with prior imaging. Targeted workup based on appearance.',
  },
  'Lung Opacity': {
    display: 'Lung Opacity',
    short: 'White/cloudy area — something filling the lung.',
    detail: 'Any area that appears whiter than normal lung on X-ray. A general finding that could be from many causes including infection, fluid, scarring, or mass. "Opacity" is a descriptive term radiologists use before identifying the exact cause.',
    severity: 'moderate',
    regions: 'Any part of the lungs. Shape and distribution help narrow the cause (lobar vs diffuse, unilateral vs bilateral).',
    causes: ['Pneumonia (infection)', 'Atelectasis (collapse)', 'Fluid (edema, effusion)', 'Mass or tumor', 'Hemorrhage'],
    urgency: 'moderate',
    nextSteps: 'Clinical context is key. If symptomatic (fever, cough), treat as possible infection. CT for characterization if unclear.',
  },
  Fracture: {
    display: 'Fracture',
    short: 'Broken bone (typically rib or clavicle).',
    detail: 'A break in a bone visible on the X-ray. Most commonly a rib fracture from trauma. Important incidental finding.',
    severity: 'moderate',
    regions: 'Ribs (most common), clavicle, scapula, or thoracic spine. Look for cortical breaks or displacement.',
    causes: ['Trauma (fall, accident, assault)', 'Pathologic fracture (cancer weakening bone)', 'Osteoporosis', 'Repetitive stress (stress fractures)'],
    urgency: 'moderate',
    nextSteps: 'Clinical correlation with pain location. Dedicated rib X-ray if more detail needed. Pain control. Watch for complications (pneumothorax, hemothorax).',
  },
}

/**
 * Score interpretation thresholds for torchxrayvision sigmoid outputs.
 * These are NOT probabilities — they are relative ranking scores.
 */
export const SCORE_BANDS = {
  baseline: { min: 0.0, max: 0.55, label: 'Baseline', color: '#10B981', description: 'Within typical normal range — no strong signal' },
  mild: { min: 0.55, max: 0.7, label: 'Mild Attention', color: '#F59E0B', description: 'Slightly elevated — model finds some similarity to this pattern' },
  notable: { min: 0.7, max: 0.85, label: 'Notable Attention', color: '#EF4444', description: 'Elevated — model sees features consistent with this finding' },
  high: { min: 0.85, max: 1.01, label: 'High Attention', color: '#B91C1C', description: 'Strong signal — model is confident about this pattern' },
}

export function getScoreBand(score) {
  if (score >= SCORE_BANDS.high.min) return SCORE_BANDS.high
  if (score >= SCORE_BANDS.notable.min) return SCORE_BANDS.notable
  if (score >= SCORE_BANDS.mild.min) return SCORE_BANDS.mild
  return SCORE_BANDS.baseline
}

export function getPathology(rawLabel) {
  const normalized = String(rawLabel).replace(/_/g, ' ')
  return (
    PATHOLOGY_GLOSSARY[rawLabel] ||
    PATHOLOGY_GLOSSARY[normalized] ||
    PATHOLOGY_GLOSSARY[normalized.replace(/ /g, '_')] ||
    {
      display: normalized,
      short: 'Chest X-ray finding.',
      detail: 'A pattern the model has been trained to recognize.',
      severity: 'finding',
      regions: 'Various locations depending on specific finding.',
      causes: ['Multiple possible causes — clinical correlation needed.'],
      urgency: 'moderate',
      nextSteps: 'Radiologist review recommended.',
    }
  )
}

/**
 * Multi-class medical classifiers — skin lesion (ISIC ViT) and brain tumor MRI.
 * These are softmax distributions where the top class is the prediction.
 * Each entry mirrors the PATHOLOGY_GLOSSARY shape so `ClinicalInterpretation`
 * can render the same breakdown regardless of output mode.
 */

export const SKIN_LESION_GLOSSARY = {
  melanoma: {
    display: 'Melanoma',
    short: 'Malignant skin cancer originating in pigment cells.',
    detail: 'The most dangerous form of skin cancer. Arises from melanocytes and can metastasize rapidly if not caught early. Dermoscopic features include asymmetry, irregular borders, color variation, and a diameter >6mm (the "ABCD" rule).',
    severity: 'critical',
    regions: 'Can appear anywhere on skin — most common on sun-exposed areas.',
    causes: ['UV exposure', 'Fair skin / light hair', 'Family history of melanoma', 'Atypical moles', 'Immunosuppression'],
    urgency: 'urgent',
    nextSteps: 'Excisional biopsy with clear margins. Urgent dermatology referral. Staging if confirmed (sentinel lymph node biopsy for thick lesions).',
    malignant: true,
  },
  basal_cell_carcinoma: {
    display: 'Basal Cell Carcinoma',
    short: 'Most common skin cancer — slow-growing, rarely metastasizes.',
    detail: 'Arises from basal cells in the epidermis. Grows locally but very rarely spreads. Can be destructive to surrounding tissue if neglected. Classic dermoscopic features: arborizing vessels, blue-gray ovoid nests.',
    severity: 'serious',
    regions: 'Sun-exposed skin, especially head and neck.',
    causes: ['Cumulative UV exposure', 'Fair skin', 'Age > 50', 'Immunosuppression', 'Prior radiation exposure'],
    urgency: 'moderate',
    nextSteps: 'Dermatology referral for biopsy. Treatment: surgical excision, Mohs surgery, cryotherapy, or topical agents depending on size and location.',
    malignant: true,
  },
  actinic_keratoses: {
    display: 'Actinic Keratoses',
    short: 'Pre-cancerous sun-damaged skin lesion.',
    detail: 'Rough, scaly patches caused by long-term sun exposure. Considered pre-malignant — a small percentage progress to squamous cell carcinoma. Commonly seen on the face, ears, scalp, and hands.',
    severity: 'moderate',
    regions: 'Sun-exposed areas — face, ears, bald scalp, forearms, dorsum of hands.',
    causes: ['Chronic UV exposure', 'Fair skin', 'Older age', 'Immunosuppression', 'Outdoor occupations'],
    urgency: 'moderate',
    nextSteps: 'Dermatology evaluation. Treatment: cryotherapy, topical 5-FU, imiquimod, or photodynamic therapy. Skin-cancer screening.',
    malignant: false,
  },
  'benign_keratosis-like_lesions': {
    display: 'Benign Keratosis',
    short: 'Non-cancerous skin growth (seborrheic keratosis, solar lentigo).',
    detail: 'A group of benign lesions including seborrheic keratoses ("stuck-on" warty lesions) and solar lentigines ("age spots"). Very common with age and typically require no treatment unless they are symptomatic or cosmetically bothersome.',
    severity: 'finding',
    regions: 'Can appear anywhere — trunk, face, extremities.',
    causes: ['Aging', 'Genetics', 'Cumulative sun exposure (for solar lentigines)'],
    urgency: 'routine',
    nextSteps: 'Usually no treatment needed. Cryotherapy or curettage if symptomatic. Dermatology review if appearance changes.',
    malignant: false,
  },
  melanocytic_Nevi: {
    display: 'Melanocytic Nevus',
    short: 'Common benign mole — pigmented melanocyte cluster.',
    detail: 'A regular mole formed by a cluster of melanocytes. Most people have 10–40. Generally benign, but any mole that changes in color, size, shape, or border should be evaluated for melanoma.',
    severity: 'finding',
    regions: 'Anywhere on skin — trunk and limbs most common.',
    causes: ['Genetic predisposition', 'Sun exposure (especially childhood)', 'Hormonal changes (puberty, pregnancy)'],
    urgency: 'routine',
    nextSteps: 'Self-monitor for ABCDE changes (Asymmetry, Border, Color, Diameter, Evolution). Annual skin check if multiple moles or family history.',
    malignant: false,
  },
  dermatofibroma: {
    display: 'Dermatofibroma',
    short: 'Benign firm nodule — common fibrous skin lesion.',
    detail: 'A benign fibrous nodule that is typically small, firm, and often appears on the legs. Classic "dimple sign" on lateral compression. No malignant potential.',
    severity: 'finding',
    regions: 'Most common on legs, but can appear anywhere.',
    causes: ['Often unknown — may follow minor trauma (e.g., insect bite)', 'More common in women'],
    urgency: 'routine',
    nextSteps: 'No treatment required. Excision if symptomatic or if diagnosis uncertain.',
    malignant: false,
  },
  vascular_lesions: {
    display: 'Vascular Lesion',
    short: 'Benign blood-vessel anomaly (hemangioma, angioma).',
    detail: 'Cherry angiomas, spider angiomas, hemangiomas, or similar lesions that arise from blood vessels in the skin. Generally benign and common with aging.',
    severity: 'finding',
    regions: 'Trunk and extremities most common.',
    causes: ['Aging', 'Genetics', 'Pregnancy (for spider angiomas)', 'Liver disease (sometimes for spider angiomas)'],
    urgency: 'routine',
    nextSteps: 'Typically no treatment needed. Laser or cryotherapy for cosmetic removal if desired.',
    malignant: false,
  },
}

export const BRAIN_TUMOR_GLOSSARY = {
  glioma_tumor: {
    display: 'Glioma',
    short: 'Tumor arising from glial cells — ranges from low- to high-grade.',
    detail: 'Gliomas arise from supportive glial cells of the brain. They range from slow-growing low-grade gliomas to highly aggressive glioblastomas (grade IV). Symptoms depend on location but commonly include headaches, seizures, and focal neurological deficits.',
    severity: 'critical',
    regions: 'Can arise anywhere in the brain or spinal cord. Often in cerebral hemispheres.',
    causes: ['Genetic mutations (IDH, 1p/19q, MGMT)', 'Prior ionizing radiation', 'Rare hereditary syndromes (NF1, Li-Fraumeni)'],
    urgency: 'urgent',
    nextSteps: 'Urgent neurosurgery and neuro-oncology consultation. MRI with contrast, possible biopsy or resection, molecular profiling, radiation/chemotherapy based on grade.',
    malignant: true,
  },
  meningioma_tumor: {
    display: 'Meningioma',
    short: 'Usually benign tumor of the meninges (brain linings).',
    detail: 'The most common primary brain tumor. Arises from the meninges that surround the brain and spinal cord. Most (~80%) are benign (WHO grade I). Slow-growing but can compress adjacent brain tissue causing symptoms.',
    severity: 'serious',
    regions: 'Along dural surfaces — convexity, falx, sphenoid wing, posterior fossa.',
    causes: ['Prior cranial radiation', 'Female sex (2:1 ratio)', 'Neurofibromatosis type 2', 'Unknown in most cases'],
    urgency: 'moderate',
    nextSteps: 'Neurosurgery referral. Small/asymptomatic meningiomas may be observed with serial MRI. Symptomatic or growing lesions: surgical resection, sometimes radiosurgery.',
    malignant: false,
  },
  pituitary_tumor: {
    display: 'Pituitary Tumor',
    short: 'Adenoma of the pituitary gland — often hormone-secreting.',
    detail: 'Almost always benign adenomas. Can cause symptoms through hormone over-secretion (prolactin, GH, ACTH, etc.) or by compressing adjacent structures (optic chiasm → visual field loss). Diagnosed on MRI and hormone panels.',
    severity: 'moderate',
    regions: 'Sella turcica at the base of the brain.',
    causes: ['Sporadic', 'Rarely MEN1 or other hereditary syndromes'],
    urgency: 'moderate',
    nextSteps: 'Endocrinology workup (full pituitary hormone panel). Neurosurgery / ophthalmology if mass effect. Treatment: medical (for prolactinomas) or transsphenoidal surgery.',
    malignant: false,
  },
  no_tumor: {
    display: 'No Tumor Detected',
    short: 'No mass lesion identified by the model.',
    detail: 'The model did not identify features consistent with any of the three tumor classes it was trained on (glioma, meningioma, pituitary). This is NOT a formal "normal" reading — only a radiologist can issue that.',
    severity: 'finding',
    regions: '—',
    causes: [],
    urgency: 'routine',
    nextSteps: 'If clinical symptoms persist or the MRI was ordered for specific concerns, radiologist review is still essential. The model only screens for three tumor classes and may miss other pathology (stroke, demyelination, infection, etc.).',
    malignant: false,
  },
}

export const MEDICAL_GLOSSARY = {
  'xray-pneumonia': PATHOLOGY_GLOSSARY,
  'skin-lesion': SKIN_LESION_GLOSSARY,
  'brain-tumor-mri': BRAIN_TUMOR_GLOSSARY,
}

export const SHARED_DISCLAIMER =
  'Research tool only — not a clinical diagnosis. Always consult a qualified physician.'

/**
 * Look up a class in a specific glossary (skin, brain, etc).
 * Falls back to a generic entry if the label is missing.
 */
export function getMedicalClass(problemId, rawLabel) {
  const glossary = MEDICAL_GLOSSARY[problemId]
  if (!glossary) return null
  const normalized = String(rawLabel).replace(/_/g, ' ')
  const entry =
    glossary[rawLabel] ||
    glossary[normalized] ||
    glossary[normalized.replace(/ /g, '_')]
  if (entry) return entry
  return {
    display: normalized
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    short: 'Model-predicted class.',
    detail: 'The model was trained to recognize this class but plain-language context is not available.',
    severity: 'finding',
    regions: '—',
    causes: [],
    urgency: 'routine',
    nextSteps: 'Clinical review recommended.',
    malignant: false,
  }
}
