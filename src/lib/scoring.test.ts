// src/lib/scoring.test.ts
// ── PHQ-9, MNA-SF, ChronicConditions, combinedRiskLevel 단위 테스트 ──
// 실행: npx vitest run  (또는 npx vitest)

import { describe, it, expect } from 'vitest';
import {
  scorePHQ9,
  scoreMNASF,
  scoreChronicConditions,
  combinedRiskLevel,
  PHQ9_MAX,
  MNASF_MAX,
} from './scoring';
import type { PHQ9Answers, MNASFAnswers, ChronicConditions } from './scoring';

// ─────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────
const phq9 = (total: number): PHQ9Answers => {
  // total을 9문항에 최대한 균등 분배 (각 문항 0~3)
  const ans: PHQ9Answers = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let rem = total;
  for (let i = 0; i < 9 && rem > 0; i++) {
    const v = Math.min(3, rem) as 0 | 1 | 2 | 3;
    ans[i] = v;
    rem -= v;
  }
  return ans;
};

const mnasf = (
  fi: 0 | 1 | 2,
  wl: 0 | 1 | 2 | 3,
  mo: 0 | 1 | 2,
  as: 0 | 2,
  np: 0 | 1 | 2,
  bc: 0 | 1 | 2 | 3,
): MNASFAnswers => ({
  foodIntakeDecline: fi,
  weightLoss: wl,
  mobility: mo,
  acuteStress: as,
  neuropsychological: np,
  bmiOrCalf: bc,
});

const allFalse: ChronicConditions = {
  hypertension: false, diabetes: false, heartDisease: false,
  stroke: false, copd: false, cancer: false, kidneyDisease: false, other: false,
};

// ─────────────────────────────────────────────────────────────────────
// PHQ-9
// ─────────────────────────────────────────────────────────────────────
describe('scorePHQ9', () => {

  // 경계값 — Green (0-4)
  it('score 0 → green / Minimal', () => {
    const r = scorePHQ9(phq9(0));
    expect(r.score).toBe(0);
    expect(r.riskLevel).toBe('green');
    expect(r.maxScore).toBe(PHQ9_MAX);
  });
  it('score 4 → green (upper boundary)', () => {
    expect(scorePHQ9(phq9(4)).riskLevel).toBe('green');
  });

  // Yellow (5-9)
  it('score 5 → yellow (lower boundary)', () => {
    expect(scorePHQ9(phq9(5)).riskLevel).toBe('yellow');
  });
  it('score 9 → yellow (upper boundary)', () => {
    expect(scorePHQ9(phq9(9)).riskLevel).toBe('yellow');
  });

  // Orange (10-14)
  it('score 10 → orange (lower boundary)', () => {
    expect(scorePHQ9(phq9(10)).riskLevel).toBe('orange');
  });
  it('score 14 → orange (upper boundary)', () => {
    expect(scorePHQ9(phq9(14)).riskLevel).toBe('orange');
  });

  // Red (15-19)
  it('score 15 → red (lower boundary)', () => {
    expect(scorePHQ9(phq9(15)).riskLevel).toBe('red');
  });
  it('score 19 → red (upper boundary)', () => {
    expect(scorePHQ9(phq9(19)).riskLevel).toBe('red');
  });

  // Red (20-27)
  it('score 20 → red (severe lower boundary)', () => {
    expect(scorePHQ9(phq9(20)).riskLevel).toBe('red');
  });
  it('score 27 → red (max)', () => {
    expect(scorePHQ9(phq9(27)).riskLevel).toBe('red');
  });

  // label 검증
  it('score 0 label is Minimal / None', () => {
    expect(scorePHQ9(phq9(0)).label).toBe('Minimal / None');
  });
  it('score 15 label is Moderately Severe Depression', () => {
    expect(scorePHQ9(phq9(15)).label).toBe('Moderately Severe Depression');
  });
  it('score 20 label is Severe Depression', () => {
    expect(scorePHQ9(phq9(20)).label).toBe('Severe Depression');
  });

  // action 에 referral 키워드 포함 여부
  it('score >= 15 action mentions Referral', () => {
    expect(scorePHQ9(phq9(15)).action).toMatch(/[Rr]eferral/);
    expect(scorePHQ9(phq9(27)).action).toMatch(/[Uu]rgent/);
  });

  // 총합 계산 정확성
  it('sums all 9 answers correctly', () => {
    const ans: PHQ9Answers = [3, 3, 3, 3, 3, 3, 3, 3, 3]; // 27
    expect(scorePHQ9(ans).score).toBe(27);
  });
  it('each answer contributes independently', () => {
    const ans: PHQ9Answers = [1, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(scorePHQ9(ans).score).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// MNA-SF
// ─────────────────────────────────────────────────────────────────────
describe('scoreMNASF', () => {

  // Green (12-14)
  it('max score 14 → green', () => {
    const r = scoreMNASF(mnasf(2, 3, 2, 2, 2, 3)); // 2+3+2+2+2+3 = 14
    expect(r.score).toBe(14);
    expect(r.riskLevel).toBe('green');
    expect(r.maxScore).toBe(MNASF_MAX);
  });
  it('score 12 → green (lower boundary)', () => {
    const r = scoreMNASF(mnasf(2, 3, 2, 2, 2, 1)); // 12
    expect(r.score).toBe(12);
    expect(r.riskLevel).toBe('green');
  });

  // Yellow (8-11)
  it('score 11 → yellow (upper boundary)', () => {
    const r = scoreMNASF(mnasf(2, 3, 2, 2, 2, 0)); // 11
    expect(r.riskLevel).toBe('yellow');
  });
  it('score 8 → yellow (lower boundary)', () => {
    const r = scoreMNASF(mnasf(2, 2, 2, 2, 0, 0)); // 8
    expect(r.riskLevel).toBe('yellow');
  });

  // Red (0-7)
  it('score 7 → red (upper boundary)', () => {
    const r = scoreMNASF(mnasf(2, 2, 2, 0, 1, 0)); // 7
    expect(r.riskLevel).toBe('red');
  });
  it('score 0 → red (min)', () => {
    const r = scoreMNASF(mnasf(0, 0, 0, 0, 0, 0));
    expect(r.score).toBe(0);
    expect(r.riskLevel).toBe('red');
  });

  // label 검증
  it('green label is Normal Nutritional Status', () => {
    expect(scoreMNASF(mnasf(2, 3, 2, 2, 2, 3)).label).toBe('Normal Nutritional Status');
  });
  it('yellow label is At Risk of Malnutrition', () => {
    expect(scoreMNASF(mnasf(2, 3, 2, 2, 2, 0)).label).toBe('At Risk of Malnutrition');
  });
  it('red label is Malnourished', () => {
    expect(scoreMNASF(mnasf(0, 0, 0, 0, 0, 0)).label).toBe('Malnourished');
  });

  // acuteStress 가중치 확인 (0 or 2 — 다른 값 없음)
  it('acuteStress=0 reduces score by 2 vs acuteStress=2', () => {
    const with2 = scoreMNASF(mnasf(0, 0, 0, 2, 0, 0)).score; // 2
    const with0 = scoreMNASF(mnasf(0, 0, 0, 0, 0, 0)).score; // 0
    expect(with2 - with0).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// ChronicConditions
// ─────────────────────────────────────────────────────────────────────
describe('scoreChronicConditions', () => {

  it('no conditions → green', () => {
    const r = scoreChronicConditions(allFalse);
    expect(r.riskLevel).toBe('green');
    expect(r.count).toBe(0);
    expect(r.hasHighRisk).toBe(false);
  });

  it('1 low-risk condition → yellow', () => {
    const r = scoreChronicConditions({ ...allFalse, hypertension: true });
    expect(r.riskLevel).toBe('yellow');
    expect(r.count).toBe(1);
  });

  it('2 low-risk conditions → orange', () => {
    const r = scoreChronicConditions({ ...allFalse, hypertension: true, diabetes: true });
    expect(r.riskLevel).toBe('orange');
    expect(r.count).toBe(2);
  });

  it('3 low-risk conditions → red', () => {
    const r = scoreChronicConditions({ ...allFalse, hypertension: true, diabetes: true, copd: true });
    expect(r.riskLevel).toBe('red');
    expect(r.count).toBe(3);
  });

  // 고위험 질환 단독 → 즉시 red
  it('heartDisease alone → red + hasHighRisk', () => {
    const r = scoreChronicConditions({ ...allFalse, heartDisease: true });
    expect(r.riskLevel).toBe('red');
    expect(r.hasHighRisk).toBe(true);
  });
  it('stroke alone → red + hasHighRisk', () => {
    const r = scoreChronicConditions({ ...allFalse, stroke: true });
    expect(r.riskLevel).toBe('red');
    expect(r.hasHighRisk).toBe(true);
  });
  it('cancer alone → red + hasHighRisk', () => {
    const r = scoreChronicConditions({ ...allFalse, cancer: true });
    expect(r.riskLevel).toBe('red');
    expect(r.hasHighRisk).toBe(true);
  });
  it('kidneyDisease alone → red + hasHighRisk', () => {
    const r = scoreChronicConditions({ ...allFalse, kidneyDisease: true });
    expect(r.riskLevel).toBe('red');
    expect(r.hasHighRisk).toBe(true);
  });

  it('all conditions → red, count=8', () => {
    const all: ChronicConditions = {
      hypertension: true, diabetes: true, heartDisease: true,
      stroke: true, copd: true, cancer: true, kidneyDisease: true, other: true,
    };
    const r = scoreChronicConditions(all);
    expect(r.count).toBe(8);
    expect(r.riskLevel).toBe('red');
  });
});

// ─────────────────────────────────────────────────────────────────────
// combinedRiskLevel
// ─────────────────────────────────────────────────────────────────────
describe('combinedRiskLevel', () => {

  const makeScore = (risk: 'green' | 'yellow' | 'orange' | 'red') =>
    ({ score: 0, maxScore: 27, riskLevel: risk, label: '', action: '' });

  it('all green → green', () => {
    expect(combinedRiskLevel(
      makeScore('green'), makeScore('green'), { riskLevel: 'green' }
    )).toBe('green');
  });

  it('picks the worst: red wins over green and yellow', () => {
    expect(combinedRiskLevel(
      makeScore('red'), makeScore('green'), { riskLevel: 'yellow' }
    )).toBe('red');
  });

  it('orange beats yellow and green', () => {
    expect(combinedRiskLevel(
      makeScore('yellow'), makeScore('orange'), { riskLevel: 'green' }
    )).toBe('orange');
  });

  it('yellow beats green only', () => {
    expect(combinedRiskLevel(
      makeScore('green'), makeScore('green'), { riskLevel: 'yellow' }
    )).toBe('yellow');
  });

  it('chronic red overrides PHQ/MNA green', () => {
    expect(combinedRiskLevel(
      makeScore('green'), makeScore('green'), { riskLevel: 'red' }
    )).toBe('red');
  });

  it('all red → red', () => {
    expect(combinedRiskLevel(
      makeScore('red'), makeScore('red'), { riskLevel: 'red' }
    )).toBe('red');
  });
});
