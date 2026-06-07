// ── MUAC child classification ─────────────────────────────────────────────────

export type ChildMuacCategory = 'edema' | 'sam' | 'mam' | 'normal';
export type PregnantMuacCategory = 'high-risk' | 'moderate-risk' | 'normal';
export type ZScoreIndicator = 'WHZ' | 'HAZ' | 'WAZ';
export type ZCategory = 'severe' | 'moderate' | 'normal';

export interface ChildMuacResult {
  category: ChildMuacCategory;
  color: 'red' | 'yellow' | 'green';
}

export interface PregnantMuacResult {
  category: PregnantMuacCategory;
  color: 'red' | 'yellow' | 'green';
}

export interface ZScoreResult {
  z: number;
  category: ZCategory;
  color: 'red' | 'yellow' | 'green';
  borderline: boolean;
}

export function classifyMUACChild(muacMm: number, hasEdema: boolean): ChildMuacResult {
  if (hasEdema) return { category: 'edema', color: 'red' };
  if (muacMm < 115) return { category: 'sam', color: 'red' };
  if (muacMm < 125) return { category: 'mam', color: 'yellow' };
  return { category: 'normal', color: 'green' };
}

export function classifyMUACPregnant(muacMm: number): PregnantMuacResult {
  if (muacMm < 210) return { category: 'high-risk', color: 'red' };
  if (muacMm < 230) return { category: 'moderate-risk', color: 'yellow' };
  return { category: 'normal', color: 'green' };
}

// ── WHO 2006 Growth Standards reference data ──────────────────────────────────
// Format: [key, [boys: L, M, S], [girls: L, M, S]]
// Key = age in months (WAZ/HAZ) or height in cm (WHZ)
// Z = ((Y/M)^L - 1) / (L × S)  [LMS formula]

type LMS = [number, number, number]; // [L, M, S]
type RefRow = [number, LMS, LMS];    // [key, boys, girls]

const WAZ_REF: RefRow[] = [
  [0,  [-0.352, 3.346, 0.1460], [-0.383, 3.232, 0.1417]],
  [3,  [-0.274, 6.376, 0.1173], [-0.295, 5.893, 0.1161]],
  [6,  [-0.170, 7.934, 0.1096], [-0.184, 7.342, 0.1117]],
  [9,  [-0.154, 8.901, 0.1100], [-0.166, 8.243, 0.1122]],
  [12, [-0.160, 9.648, 0.1123], [-0.180, 8.948, 0.1158]],
  [18, [-0.163, 10.94, 0.1163], [-0.180, 10.20, 0.1193]],
  [24, [-0.160, 12.16, 0.1191], [-0.185, 11.50, 0.1234]],
  [30, [-0.160, 13.30, 0.1221], [-0.180, 12.69, 0.1258]],
  [36, [-0.164, 14.38, 0.1248], [-0.184, 13.89, 0.1277]],
  [42, [-0.164, 15.37, 0.1266], [-0.184, 15.00, 0.1307]],
  [48, [-0.164, 16.33, 0.1282], [-0.184, 16.05, 0.1332]],
  [54, [-0.161, 17.37, 0.1303], [-0.186, 17.09, 0.1362]],
  [60, [-0.160, 18.26, 0.1322], [-0.186, 18.15, 0.1386]],
];

const HAZ_REF: RefRow[] = [
  [0,  [0.3487, 49.88, 0.03795], [0.3809, 49.15, 0.03790]],
  [3,  [0.2286, 61.43, 0.03665], [0.2453, 59.80, 0.03689]],
  [6,  [0.1596, 67.62, 0.03458], [0.1729, 65.73, 0.03577]],
  [9,  [0.1218, 72.00, 0.03620], [0.1387, 70.14, 0.03660]],
  [12, [0.0904, 75.75, 0.03833], [0.1150, 74.00, 0.03878]],
  [18, [0.0375, 82.18, 0.03989], [0.0693, 80.50, 0.04083]],
  [24, [0.0000, 87.76, 0.04071], [0.0322, 86.36, 0.04176]],
  [30, [-0.034, 92.83, 0.04152], [-0.004, 91.56, 0.04249]],
  [36, [-0.062, 97.22, 0.04201], [-0.034, 96.07, 0.04278]],
  [42, [-0.085, 101.2, 0.04248], [-0.060, 100.1, 0.04307]],
  [48, [-0.105, 104.7, 0.04269], [-0.082, 103.7, 0.04331]],
  [54, [-0.122, 108.0, 0.04283], [-0.101, 107.1, 0.04358]],
  [60, [-0.138, 111.0, 0.04298], [-0.118, 110.5, 0.04393]],
];

// WHZ: measurement = weight (kg), key = height (cm)
const WHZ_REF: RefRow[] = [
  [45,  [1.555, 2.441, 0.130], [1.647, 2.461, 0.131]],
  [50,  [1.517, 3.339, 0.124], [1.594, 3.404, 0.124]],
  [55,  [1.476, 4.469, 0.120], [1.559, 4.553, 0.120]],
  [60,  [1.434, 5.793, 0.116], [1.524, 5.940, 0.116]],
  [65,  [1.391, 7.236, 0.113], [1.486, 7.461, 0.112]],
  [70,  [1.346, 8.618, 0.112], [1.446, 8.854, 0.112]],
  [75,  [1.299, 9.808, 0.113], [1.402, 9.944, 0.114]],
  [80,  [1.249, 11.10, 0.115], [1.354, 11.10, 0.117]],
  [85,  [1.197, 12.47, 0.119], [1.303, 12.38, 0.120]],
  [90,  [1.143, 13.73, 0.121], [1.249, 13.58, 0.123]],
  [95,  [1.088, 15.03, 0.123], [1.193, 14.75, 0.125]],
  [100, [1.031, 16.28, 0.124], [1.135, 15.96, 0.128]],
  [105, [0.974, 17.55, 0.126], [1.075, 17.24, 0.130]],
  [110, [0.916, 18.87, 0.128], [1.014, 18.64, 0.133]],
  [115, [0.858, 20.28, 0.130], [0.951, 20.24, 0.136]],
  [120, [0.800, 21.82, 0.133], [0.888, 22.07, 0.140]],
];

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function getRef(table: RefRow[], key: number, sexIdx: 0 | 1): LMS | null {
  if (key < table[0][0] || key > table[table.length - 1][0]) return null;
  for (let i = 0; i < table.length - 1; i++) {
    const [k0, b0, g0] = table[i];
    const [k1, b1, g1] = table[i + 1];
    if (key >= k0 && key <= k1) {
      const t = (key - k0) / (k1 - k0);
      const p0 = sexIdx === 0 ? b0 : g0;
      const p1 = sexIdx === 0 ? b1 : g1;
      return [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t)];
    }
  }
  return null;
}

export function calculateZScore(
  indicator: ZScoreIndicator,
  sex: 'M' | 'F',
  ageMonths: number,
  measurement: number,
  heightCm?: number,
): ZScoreResult | null {
  const si: 0 | 1 = sex === 'M' ? 0 : 1;

  let lms: LMS | null = null;
  if (indicator === 'WAZ') lms = getRef(WAZ_REF, ageMonths, si);
  else if (indicator === 'HAZ') lms = getRef(HAZ_REF, ageMonths, si);
  else if (indicator === 'WHZ') {
    if (heightCm === undefined) return null;
    lms = getRef(WHZ_REF, heightCm, si);
  }

  if (!lms) return null;
  const [L, M, S] = lms;

  // WHO LMS formula
  const z = L === 0
    ? Math.log(measurement / M) / S
    : (Math.pow(measurement / M, L) - 1) / (L * S);

  const rounded = Math.round(z * 10) / 10;

  let category: ZCategory;
  if (rounded < -3) category = 'severe';
  else if (rounded < -2) category = 'moderate';
  else category = 'normal';

  // Borderline flag (±0.3 around cutoffs)
  const borderline = (rounded > -2.3 && rounded < -1.7) || (rounded > -3.3 && rounded < -2.7);

  const color = category === 'severe' ? 'red' : category === 'moderate' ? 'yellow' : 'green';

  return { z: rounded, category, color, borderline };
}

// ── Legacy types kept for backward compatibility ──────────────────────────────

export type NutritionCategory = 'sam' | 'mam' | 'at-risk' | 'normal' | 'edema';
export interface NutritionResult {
  category: NutritionCategory;
  muacCategory: NutritionCategory | null;
  criteriamet: string[];
  recommendation: string;
  color: 'red' | 'amber' | 'yellow' | 'green';
}

export function classifyMUAC(muacMm: number, ageMonths: number): NutritionCategory | null {
  if (ageMonths < 6) return null;
  if (muacMm < 115) return 'sam';
  if (muacMm < 125) return 'mam';
  return 'normal';
}

export function assessNutrition(params: {
  muacMm: number | null;
  weightKg: number | null;
  heightCm: number | null;
  ageMonths: number | null;
  hasEdema: boolean;
}): NutritionResult {
  const { muacMm, ageMonths, hasEdema } = params;

  if (hasEdema) {
    return {
      category: 'edema', muacCategory: null,
      criteriamet: ['Bilateral pitting edema present'],
      recommendation: 'Admit to SAM management programme. Treat for kwashiorkor.',
      color: 'red',
    };
  }

  const age = ageMonths ?? 24;
  const muacCat = muacMm !== null ? classifyMUAC(muacMm, age) : null;
  const criteriaMet: string[] = [];
  let worst: NutritionCategory = 'normal';
  const rank: Record<NutritionCategory, number> = { edema: 4, sam: 3, mam: 2, 'at-risk': 1, normal: 0 };

  if (muacCat && muacCat !== 'normal') {
    criteriaMet.push(`MUAC ${muacMm}mm → ${muacCat.toUpperCase()}`);
    if (rank[muacCat] > rank[worst]) worst = muacCat;
  }
  if (criteriaMet.length === 0) criteriaMet.push('No acute malnutrition criteria met');

  const recommendations: Record<NutritionCategory, string> = {
    edema: 'Admit to SAM management. Treat for kwashiorkor.',
    sam: 'Refer to SAM management (OTP or TFC). Routine antibiotics + Vitamin A.',
    mam: 'Enrol in Supplementary Feeding Programme (SFP). Monitor weekly.',
    'at-risk': 'Preventive feeding support. Reassess in 4 weeks.',
    normal: 'Continue routine growth monitoring. No intervention required.',
  };
  const colors: Record<NutritionCategory, 'red' | 'amber' | 'yellow' | 'green'> = {
    edema: 'red', sam: 'red', mam: 'amber', 'at-risk': 'yellow', normal: 'green',
  };

  return {
    category: worst, muacCategory: muacCat,
    criteriamet: criteriaMet,
    recommendation: recommendations[worst],
    color: colors[worst],
  };
}
