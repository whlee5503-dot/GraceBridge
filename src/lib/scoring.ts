// src/lib/scoring.ts
// ⚠️  임상 표준 그대로 구현 — 절대 수정 금지
// PHQ-9: Kroenke & Spitzer (2001)
// MNA-SF: Rubenstein et al. (2001), Guigoz et al. (2006)

// ── 공통 타입 ─────────────────────────────────────────────────────
export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface ScoreResult {
  score: number;
  maxScore: number;
  riskLevel: RiskLevel;
  label: string;
  action: string;
}

// ── PHQ-9 (우울증 스크리닝) ───────────────────────────────────────
// 9문항, 각 0~3점, 총 0~27점
// 출처: Patient Health Questionnaire (PHQ-9)

export type PHQ9Answers = [number, number, number, number, number, number, number, number, number];

export const PHQ9_MAX = 27;

export function scorePHQ9(answers: PHQ9Answers): ScoreResult {
  // 각 문항은 0(전혀 없음), 1(며칠), 2(7일 이상), 3(거의 매일)
  const score = answers.reduce((sum, v) => sum + v, 0);

  let riskLevel: RiskLevel;
  let label: string;
  let action: string;

  if (score <= 4) {
    riskLevel = 'green';
    label = 'Minimal / None';
    action = 'No action required. Continue monitoring.';
  } else if (score <= 9) {
    riskLevel = 'yellow';
    label = 'Mild Depression';
    action = 'Watchful waiting. Recommend follow-up in 2–4 weeks.';
  } else if (score <= 14) {
    riskLevel = 'orange';
    label = 'Moderate Depression';
    action = 'Recommend professional consultation. Connect to local health services.';
  } else if (score <= 19) {
    riskLevel = 'red';
    label = 'Moderately Severe Depression';
    action = 'Referral required. Connect to nearest clinic or health center immediately.';
  } else {
    riskLevel = 'red';
    label = 'Severe Depression';
    action = 'Urgent referral required. Do not leave alone. Connect to emergency health services.';
  }

  return { score, maxScore: PHQ9_MAX, riskLevel, label, action };
}

// ── MNA-SF (영양 상태 스크리닝) ──────────────────────────────────
// 6문항, 총 0~14점
// 출처: Mini Nutritional Assessment Short-Form (MNA-SF)

export interface MNASFAnswers {
  // Q1: 지난 3개월간 식욕 감소, 소화 문제, 씹기/삼키기 어려움으로 음식 섭취량이 줄었습니까?
  // 0=심한 감소, 1=중등도 감소, 2=감소 없음
  foodIntakeDecline: 0 | 1 | 2;
  // Q2: 지난 3개월간 체중 감소가 있었습니까?
  // 0=3kg 이상, 1=모름, 2=1~3kg, 3=체중 감소 없음
  weightLoss: 0 | 1 | 2 | 3;
  // Q3: 이동성
  // 0=침대/의자에서 못 일어남, 1=침대/의자 밖 못나감, 2=외출 가능
  mobility: 0 | 1 | 2;
  // Q4: 지난 3개월간 심리적 스트레스나 급성 질환이 있었습니까?
  // 0=예, 2=아니오
  acuteStress: 0 | 2;
  // Q5: 신경정신과적 문제
  // 0=심한 치매 또는 우울증, 1=경한 치매, 2=문제 없음
  neuropsychological: 0 | 1 | 2;
  // Q6: BMI 또는 종아리 둘레 (BMI 측정 불가시 종아리 둘레 사용)
  // BMI: 0=19미만, 1=19~21, 2=21~23, 3=23이상
  // 종아리: 0=31cm미만, 3=31cm이상
  bmiOrCalf: 0 | 1 | 2 | 3;
}

export const MNASF_MAX = 14;

export function scoreMNASF(answers: MNASFAnswers): ScoreResult {
  const score =
    answers.foodIntakeDecline +
    answers.weightLoss +
    answers.mobility +
    answers.acuteStress +
    answers.neuropsychological +
    answers.bmiOrCalf;

  let riskLevel: RiskLevel;
  let label: string;
  let action: string;

  if (score >= 12) {
    riskLevel = 'green';
    label = 'Normal Nutritional Status';
    action = 'No intervention required. Continue routine monitoring.';
  } else if (score >= 8) {
    riskLevel = 'yellow';
    label = 'At Risk of Malnutrition';
    action = 'Dietary counseling recommended. Reassess in 1 month.';
  } else {
    riskLevel = 'red';
    label = 'Malnourished';
    action = 'Referral required. Connect to nutrition support services.';
  }

  return { score, maxScore: MNASF_MAX, riskLevel, label, action };
}

// ── 만성질환 체크리스트 ──────────────────────────────────────────
export interface ChronicConditions {
  hypertension: boolean;
  diabetes: boolean;
  heartDisease: boolean;
  stroke: boolean;
  copd: boolean;
  cancer: boolean;
  kidneyDisease: boolean;
  other: boolean;
}

export function scoreChronicConditions(conditions: ChronicConditions): {
  count: number;
  hasHighRisk: boolean;
  riskLevel: RiskLevel;
} {
  const highRisk = conditions.heartDisease || conditions.stroke || conditions.cancer || conditions.kidneyDisease;
  const count = Object.values(conditions).filter(Boolean).length;

  let riskLevel: RiskLevel;
  if (highRisk || count >= 3) riskLevel = 'red';
  else if (count >= 2) riskLevel = 'orange';
  else if (count === 1) riskLevel = 'yellow';
  else riskLevel = 'green';

  return { count, hasHighRisk: highRisk, riskLevel };
}

// ── 종합 위험도 산출 ─────────────────────────────────────────────
const RISK_RANK: Record<RiskLevel, number> = {
  green: 0, yellow: 1, orange: 2, red: 3,
};

export function combinedRiskLevel(
  phq9Result: ScoreResult,
  mnaSfResult: ScoreResult,
  chronicResult: { riskLevel: RiskLevel },
): RiskLevel {
  const levels = [phq9Result.riskLevel, mnaSfResult.riskLevel, chronicResult.riskLevel];
  return levels.reduce((worst, current) =>
    RISK_RANK[current] > RISK_RANK[worst] ? current : worst
  );
}
