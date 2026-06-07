// src/lib/privacy.ts
// DPGA Privacy-by-Design: 개인 식별자 구조적 차단
// 저장 O: sessionId, churchCode, regionCode, 점수
// 저장 X: 이름, 나이, 성별, 연락처 일체

import { v4 as uuidv4 } from 'uuid';

// ── Session ID (기기 생성 UUID, 개인 식별 불가) ──────────────────
const SESSION_KEY = 'gracebridge_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = uuidv4();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

// ── Church Code 검증 (6자리 숫자만 허용) ────────────────────────
export function isValidChurchCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function sanitizeChurchCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, 6);
}

// ── 개인식별 필드 차단 (빌드 시 타입 레벨 보호) ─────────────────
// 이 타입을 사용하면 개인식별 필드를 실수로 추가할 수 없음
export interface AnonymousScreeningRecord {
  sessionId: string;       // UUID (기기 생성)
  churchCode: string;      // 6자리 숫자
  regionCode: string;      // 국가 코드 (KR, ID 등)
  phq9Score: number;
  mnaSfScore: number;
  chronicConditions: Record<string, boolean>;
  riskLevel: 'green' | 'yellow' | 'orange' | 'red';
  createdAt: string;       // ISO timestamp
  // ❌ 아래 필드는 절대 추가 금지
  // name?: never
  // age?: never
  // gender?: never
  // phone?: never
  // email?: never
}

export function createAnonymousRecord(
  churchCode: string,
  regionCode: string,
  phq9Score: number,
  mnaSfScore: number,
  chronicConditions: Record<string, boolean>,
  riskLevel: 'green' | 'yellow' | 'orange' | 'red',
): AnonymousScreeningRecord {
  return {
    sessionId: getSessionId(),
    churchCode,
    regionCode,
    phq9Score,
    mnaSfScore,
    chronicConditions,
    riskLevel,
    createdAt: new Date().toISOString(),
  };
}
