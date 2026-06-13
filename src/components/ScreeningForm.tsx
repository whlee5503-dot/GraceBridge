// src/components/ScreeningForm.tsx
// Phase 1 — PHQ-9 + MNA-SF + 만성질환 3단계 스크리닝 폼
// 중간 저장: IndexedDB (useScreeningDraft)

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  scorePHQ9, scoreMNASF, scoreChronicConditions, combinedRiskLevel,
} from '../lib/scoring'
import type {
  PHQ9Answers, MNASFAnswers, ChronicConditions, ScoreResult, RiskLevel,
} from '../lib/scoring'
import { useAutosaveDraft, loadDraft, clearDraft } from '../hooks/useScreeningDraft'
import { saveScreeningResult } from '../lib/supabase'
import { enqueue } from '../lib/offlineQueue'
import { getSessionId } from '../lib/privacy'
import { getStoredChurchCode } from './ChurchAuth'

// ── 타입 ───────────────────────────────────────────────────────────
type Step = 'consent' | 'phq9' | 'mnasf' | 'chronic' | 'result'

interface ScreeningResult {
  phq9:    ScoreResult
  mnasf:   ScoreResult
  chronic: { count: number; hasHighRisk: boolean; riskLevel: RiskLevel }
  combined: RiskLevel
}

// ── 위험도 스타일 ─────────────────────────────────────────────────
const RISK_STYLE: Record<RiskLevel, { bg: string; border: string; text: string; badge: string }> = {
  green:  { bg: 'bg-green-50',  border: 'border-green-400',  text: 'text-green-800',  badge: 'bg-green-100 text-green-800'  },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
  red:    { bg: 'bg-red-50',    border: 'border-red-400',    text: 'text-red-800',    badge: 'bg-red-100 text-red-800'      },
}

// ── PHQ-9 문항 키 ─────────────────────────────────────────────────
const PHQ9_KEYS = [
  'screening.phq9.q1','screening.phq9.q2','screening.phq9.q3',
  'screening.phq9.q4','screening.phq9.q5','screening.phq9.q6',
  'screening.phq9.q7','screening.phq9.q8','screening.phq9.q9',
] as const

// ── MNA-SF 문항 정의 ──────────────────────────────────────────────
interface MNAQuestion {
  key: keyof MNASFAnswers
  i18nKey: string
  options: { value: number; labelKey: string }[]
}
const MNASF_QUESTIONS: MNAQuestion[] = [
  { key: 'foodIntakeDecline', i18nKey: 'screening.mnasf.q1',
    options: [{ value:0,labelKey:'screening.mnasf.q1_0'},{value:1,labelKey:'screening.mnasf.q1_1'},{value:2,labelKey:'screening.mnasf.q1_2'}] },
  { key: 'weightLoss', i18nKey: 'screening.mnasf.q2',
    options: [{ value:0,labelKey:'screening.mnasf.q2_0'},{value:1,labelKey:'screening.mnasf.q2_1'},{value:2,labelKey:'screening.mnasf.q2_2'},{value:3,labelKey:'screening.mnasf.q2_3'}] },
  { key: 'mobility', i18nKey: 'screening.mnasf.q3',
    options: [{ value:0,labelKey:'screening.mnasf.q3_0'},{value:1,labelKey:'screening.mnasf.q3_1'},{value:2,labelKey:'screening.mnasf.q3_2'}] },
  { key: 'acuteStress', i18nKey: 'screening.mnasf.q4',
    options: [{ value:0,labelKey:'screening.mnasf.q4_0'},{value:2,labelKey:'screening.mnasf.q4_2'}] },
  { key: 'neuropsychological', i18nKey: 'screening.mnasf.q5',
    options: [{ value:0,labelKey:'screening.mnasf.q5_0'},{value:1,labelKey:'screening.mnasf.q5_1'},{value:2,labelKey:'screening.mnasf.q5_2'}] },
  { key: 'bmiOrCalf', i18nKey: 'screening.mnasf.q6',
    options: [{ value:0,labelKey:'screening.mnasf.q6_0'},{value:1,labelKey:'screening.mnasf.q6_1'},{value:2,labelKey:'screening.mnasf.q6_2'},{value:3,labelKey:'screening.mnasf.q6_3'}] },
]

const CHRONIC_KEYS: { key: keyof ChronicConditions; i18nKey: string }[] = [
  { key: 'hypertension',  i18nKey: 'screening.chronic.hypertension'  },
  { key: 'diabetes',      i18nKey: 'screening.chronic.diabetes'       },
  { key: 'heartDisease',  i18nKey: 'screening.chronic.heartDisease'   },
  { key: 'stroke',        i18nKey: 'screening.chronic.stroke'         },
  { key: 'copd',          i18nKey: 'screening.chronic.copd'           },
  { key: 'cancer',        i18nKey: 'screening.chronic.cancer'         },
  { key: 'kidneyDisease', i18nKey: 'screening.chronic.kidneyDisease'  },
  { key: 'other',         i18nKey: 'screening.chronic.other'          },
]

// ── 단계 순서 ─────────────────────────────────────────────────────
const STEP_ORDER: Step[] = ['consent', 'phq9', 'mnasf', 'chronic', 'result']

// ── 진행률 바 ─────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step)
  const pct = Math.round((idx / (STEP_ORDER.length - 1)) * 100)
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: 'var(--brand, #1a6b4a)' }}
      />
    </div>
  )
}

// ── 옵션 버튼 ─────────────────────────────────────────────────────
function OptionBtn({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150',
        selected
          ? 'border-[#1a6b4a] bg-green-50 dark:bg-green-900/20 font-semibold text-[#1a6b4a] dark:text-green-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── 초기 상태 기본값 ──────────────────────────────────────────────
const DEFAULT_CHRONIC: ChronicConditions = {
  hypertension:false, diabetes:false, heartDisease:false,
  stroke:false, copd:false, cancer:false, kidneyDisease:false, other:false,
}

// ══════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════════
export default function ScreeningForm() {
  const { t } = useTranslation()

  const [step,      setStep]      = useState<Step>('consent')
  const [phq9Ans,   setPhq9Ans]   = useState<number[]>(Array(9).fill(-1))
  const [mnaSFAns,  setMnaSFAns]  = useState<Partial<MNASFAnswers>>({})
  const [chronic,   setChronic]   = useState<ChronicConditions>(DEFAULT_CHRONIC)
  const [result,    setResult]    = useState<ScreeningResult | null>(null)
  const [restored,  setRestored]  = useState(false)
  const [hasDraft,  setHasDraft]  = useState(false)

  // ── 앱 시작 시 draft 존재 여부 확인 ──────────────────────────
  useEffect(() => {
    loadDraft().then(draft => {
      if (draft && draft.step && draft.step !== 'consent' && draft.step !== 'result') {
        setHasDraft(true)
      }
    }).catch(() => {})
  }, [])

  // ── draft 복원 ────────────────────────────────────────────────
  function restoreDraft() {
    loadDraft().then(draft => {
      if (!draft) return
      if (Array.isArray(draft.phq9Ans))  setPhq9Ans(draft.phq9Ans as number[])
      if (draft.mnaSFAns)                setMnaSFAns(draft.mnaSFAns as Partial<MNASFAnswers>)
      if (draft.chronic)                 setChronic(draft.chronic as ChronicConditions)
      if (draft.step)                    setStep(draft.step as Step)
      setHasDraft(false)
      setRestored(true)
    }).catch(() => {})
  }

  // ── 자동 저장 (consent/result 제외) ──────────────────────────
  useAutosaveDraft(
    { step, phq9Ans, mnaSFAns, chronic },
    step !== 'consent' && step !== 'result',
  )

  // ── 유효성 ───────────────────────────────────────────────────
  const phq9Complete  = phq9Ans.every(v => v >= 0)
  const mnaSFComplete = MNASF_QUESTIONS.every(q => mnaSFAns[q.key] !== undefined)

  // ── 결과 계산 + Supabase 저장 ───────────────────────────────────
  async function handleCalculate() {
    const phq9Result    = scorePHQ9(phq9Ans as PHQ9Answers)
    const mnaSFResult   = scoreMNASF(mnaSFAns as MNASFAnswers)
    const chronicResult = scoreChronicConditions(chronic)
    const combined      = combinedRiskLevel(phq9Result, mnaSFResult, chronicResult)
    setResult({ phq9: phq9Result, mnasf: mnaSFResult, chronic: chronicResult, combined })
    clearDraft().catch(() => {})
    setStep('result')

    // IndexedDB 오프라인 큐에 저장
    enqueue({
      sessionId:         getSessionId(),
      churchCode:        getStoredChurchCode() ?? 'unknown',
      regionCode:        'KR',
      phq9Score:         phq9Result.score,
      mnaSfScore:        mnaSFResult.score,
      chronicConditions: chronic as unknown as Record<string, boolean>,
      riskLevel:         combined,
    }).catch(console.error)

    // 익명 결과 Supabase 저장 (실패해도 UX 차단 안 함)
    saveScreeningResult({
      session_id:    getSessionId(),
      church_code:   getStoredChurchCode() ?? 'unknown',
      region_code:   'KR',
      phq9_score:    phq9Result.score,
      mnasf_score:   mnaSFResult.score,
      chronic_count: chronicResult.count,
      has_high_risk: chronicResult.hasHighRisk,
      risk_level:    combined,
    }).catch(console.error)
  }

  // ── 리셋 ─────────────────────────────────────────────────────
  function handleReset() {
    setPhq9Ans(Array(9).fill(-1))
    setMnaSFAns({})
    setChronic(DEFAULT_CHRONIC)
    setResult(null)
    setRestored(false)
    setHasDraft(false)
    clearDraft().catch(() => {})
    setStep('consent')
  }

  // ── PHQ-9 답변 진행률 (몇 문항 완료) ─────────────────────────
  const phq9Done = phq9Ans.filter(v => v >= 0).length

  // ══════════════════════════════════════════════════════════════
  // 렌더
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <ProgressBar step={step} />

      {/* ── draft 복원 배너 ────────────────────────────────────── */}
      {hasDraft && step === 'consent' && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
            {t('screening.draft.found', '이전에 진행하던 스크리닝이 있습니다.')}
          </p>
          <button
            type="button"
            onClick={restoreDraft}
            className="ml-3 text-xs font-semibold text-[#1a6b4a] dark:text-green-400 whitespace-nowrap"
          >
            {t('screening.draft.restore', '이어서 하기 →')}
          </button>
        </div>
      )}

      {/* 복원 완료 알림 */}
      {restored && (
        <div className="mb-4 rounded-xl border border-green-300 bg-green-50 dark:bg-green-900/20 px-4 py-2">
          <p className="text-xs text-green-700 dark:text-green-300">
            ✅ {t('screening.draft.restored', '이전 진행 상태를 불러왔습니다.')}
          </p>
        </div>
      )}

      {/* ── 동의 화면 ─────────────────────────────────────────── */}
      {step === 'consent' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--brand, #1a6b4a)' }}>
            {t('screening.consent.title', 'Health Screening')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('screening.consent.body', 'This screening uses validated clinical tools (PHQ-9, MNA-SF) to identify health risks. No personal information is collected.')}
          </p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>✅ {t('screening.consent.point1', 'Anonymous — no name, age, or contact stored')}</p>
            <p>✅ {t('screening.consent.point2', 'Results stay on this device until synced')}</p>
            <p>✅ {t('screening.consent.point3', 'Volunteer use only — not a medical diagnosis')}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep('phq9')}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--brand, #1a6b4a)' }}
          >
            {t('screening.consent.start', 'Begin Screening')}
          </button>
        </div>
      )}

      {/* ── PHQ-9 ────────────────────────────────────────────── */}
      {step === 'phq9' && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('screening.step','Step')} 1 / 3
              </span>
              {/* 문항 진행률 */}
              <span className="text-xs text-gray-400">
                {phq9Done} / 9 {t('screening.phq9.answered','answered')}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--brand, #1a6b4a)' }}>
              {t('screening.phq9.title','Depression Screening (PHQ-9)')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('screening.phq9.instruction','Over the last 2 weeks, how often have you been bothered by the following?')}
            </p>
          </div>

          {PHQ9_KEYS.map((key, i) => (
            <div key={key} className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {i + 1}. {t(key, `Question ${i + 1}`)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v:0, lk:'screening.phq9.opt0' },
                  { v:1, lk:'screening.phq9.opt1' },
                  { v:2, lk:'screening.phq9.opt2' },
                  { v:3, lk:'screening.phq9.opt3' },
                ].map(({ v, lk }) => (
                  <OptionBtn
                    key={v}
                    selected={phq9Ans[i] === v}
                    onClick={() => { const n=[...phq9Ans]; n[i]=v; setPhq9Ans(n) }}
                  >
                    {t(lk, String(v))}
                  </OptionBtn>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep('consent')}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
              {t('common.back','Back')}
            </button>
            <button type="button" disabled={!phq9Complete} onClick={() => setStep('mnasf')}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: 'var(--brand, #1a6b4a)' }}>
              {t('common.next','Next')}
            </button>
          </div>
        </div>
      )}

      {/* ── MNA-SF ───────────────────────────────────────────── */}
      {step === 'mnasf' && (
        <div className="space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('screening.step','Step')} 2 / 3
            </span>
            <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--brand, #1a6b4a)' }}>
              {t('screening.mnasf.title','Nutrition Screening (MNA-SF)')}
            </h2>
          </div>

          {MNASF_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t(q.i18nKey, q.key)}
              </p>
              <div className="space-y-1">
                {q.options.map(opt => (
                  <OptionBtn key={opt.value}
                    selected={mnaSFAns[q.key] === opt.value}
                    onClick={() => setMnaSFAns(prev => ({ ...prev, [q.key]: opt.value }))}>
                    {t(opt.labelKey, String(opt.value))}
                  </OptionBtn>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep('phq9')}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
              {t('common.back','Back')}
            </button>
            <button type="button" disabled={!mnaSFComplete} onClick={() => setStep('chronic')}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: 'var(--brand, #1a6b4a)' }}>
              {t('common.next','Next')}
            </button>
          </div>
        </div>
      )}

      {/* ── 만성질환 ─────────────────────────────────────────── */}
      {step === 'chronic' && (
        <div className="space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('screening.step','Step')} 3 / 3
            </span>
            <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--brand, #1a6b4a)' }}>
              {t('screening.chronic.title','Chronic Conditions')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('screening.chronic.instruction','Select all that apply')}
            </p>
          </div>

          <div className="space-y-2">
            {CHRONIC_KEYS.map(({ key, i18nKey }) => (
              <label key={key} className={[
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                chronic[key]
                  ? 'border-[#1a6b4a] bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50',
              ].join(' ')}>
                <input type="checkbox" checked={chronic[key]}
                  onChange={e => setChronic(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-[#1a6b4a]" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t(i18nKey, key)}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep('mnasf')}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
              {t('common.back','Back')}
            </button>
            <button type="button" onClick={handleCalculate}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: 'var(--brand, #1a6b4a)' }}>
              {t('screening.calculate','Calculate Results')}
            </button>
          </div>
        </div>
      )}

      {/* ── 결과 화면 ─────────────────────────────────────────── */}
      {step === 'result' && result && (() => {
        const st = RISK_STYLE[result.combined]
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--brand, #1a6b4a)' }}>
              {t('screening.result.title','Screening Results')}
            </h2>

            {/* 종합 위험도 */}
            <div className={`rounded-2xl border-2 p-5 ${st.bg} ${st.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${st.text}`}>
                {t('screening.result.combined','Overall Risk Level')}
              </p>
              <p className={`text-2xl font-bold mt-1 uppercase ${st.text}`}>
                {result.combined}
              </p>
            </div>

            {/* PHQ-9 / MNA-SF 요약 */}
            {[
              { label: t('screening.result.phq9','Depression (PHQ-9)'),   res: result.phq9,  max: 27 },
              { label: t('screening.result.mnasf','Nutrition (MNA-SF)'),  res: result.mnasf, max: 14 },
            ].map(({ label, res, max }) => {
              const s = RISK_STYLE[res.riskLevel]
              return (
                <div key={label} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                      {res.score} / {max}
                    </span>
                  </div>
                  <p className={`text-sm font-bold mt-1 ${s.text}`}>{res.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{res.action}</p>
                </div>
              )
            })}

            {/* 만성질환 */}
            {(() => {
              const s = RISK_STYLE[result.chronic.riskLevel]
              return (
                <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('screening.result.chronic','Chronic Conditions')}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                      {result.chronic.count} {t('screening.result.conditions','condition(s)')}
                    </span>
                  </div>
                  {result.chronic.hasHighRisk && (
                    <p className="text-xs text-red-700 font-semibold mt-1">
                      ⚠️ {t('screening.result.highRiskCondition','High-risk condition detected — referral strongly recommended')}
                    </p>
                  )}
                </div>
              )
            })()}

            <button type="button" onClick={handleReset}
              className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t('screening.result.newScreening','New Screening')}
            </button>
          </div>
        )
      })()}
    </div>
  )
}
