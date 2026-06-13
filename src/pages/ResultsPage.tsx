// src/pages/ResultsPage.tsx
// Phase 3 — 스크리닝 결과 페이지 + ReferralMap 진입점

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle, AlertTriangle, AlertCircle, XCircle,
  MapPin, RotateCcw, Copy, Check,
} from 'lucide-react'
import ReferralMap from '../components/ReferralMap'
import type { ScoreResult, RiskLevel } from '../lib/scoring'

// ── 결과 데이터 타입 (ScreeningForm에서 navigate로 전달) ──────────
export interface ScreeningResultData {
  phq9:    ScoreResult
  mnasf:   ScoreResult
  chronic: { count: number; hasHighRisk: boolean; riskLevel: RiskLevel }
  combined: RiskLevel
  countryCode?: string
}

// ── 위험도별 스타일 & 아이콘 ──────────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, {
  bg: string; border: string; text: string; icon: React.ReactNode; label: string
}> = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400',
    text: 'text-green-800 dark:text-green-300',
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    label: 'Low Risk',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-400',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    label: 'Mild Risk',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-400',
    text: 'text-orange-800 dark:text-orange-300',
    icon: <AlertCircle className="w-8 h-8 text-orange-500" />,
    label: 'Moderate Risk',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400',
    text: 'text-red-800 dark:text-red-300',
    icon: <XCircle className="w-8 h-8 text-red-500" />,
    label: 'High Risk',
  },
}

// ── 결과 공유 텍스트 생성 ─────────────────────────────────────────
function buildShareText(data: ScreeningResultData): string {
  const date = new Date().toLocaleDateString('ko-KR')
  return [
    `[GraceBridge 스크리닝 결과 - ${date}]`,
    `종합 위험도: ${data.combined.toUpperCase()}`,
    `우울증(PHQ-9): ${data.phq9.score}점 / ${data.phq9.maxScore}점 — ${data.phq9.label}`,
    `영양(MNA-SF): ${data.mnasf.score}점 / ${data.mnasf.maxScore}점 — ${data.mnasf.label}`,
    `만성질환: ${data.chronic.count}개 해당`,
    data.combined === 'red' || data.combined === 'orange'
      ? '→ 가까운 보건소 또는 의료기관 연결을 권고합니다.'
      : '→ 정기적인 모니터링을 권고합니다.',
  ].join('\n')
}

export default function ResultsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [showMap, setShowMap]     = useState(false)
  const [copied, setCopied]       = useState(false)

  // navigate state로 결과 수신
  const data = state as ScreeningResultData | null

  useEffect(() => {
    // 직접 URL 접근 시 홈으로
    if (!data) navigate('/', { replace: true })
  }, [data, navigate])

  if (!data) return null

  const config  = RISK_CONFIG[data.combined]
  const needsReferral = data.combined === 'red' || data.combined === 'orange'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildShareText(data))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── 지도 전체화면 ──────────────────────────────────────────────
  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
        <ReferralMap
          countryCode={data.countryCode ?? 'KR'}
          riskLevel={data.combined}
          onClose={() => setShowMap(false)}
        />
      </div>
    )
  }

  // ── 결과 화면 ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-6 max-w-lg mx-auto">

      {/* 종합 결과 카드 */}
      <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5 mb-4 text-center`}>
        <div className="flex justify-center mb-2">{config.icon}</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
          {t('results.combinedRisk', '종합 위험도')}
        </p>
        <p className={`text-2xl font-bold ${config.text}`}>{config.label}</p>
        <p className={`text-sm mt-1 ${config.text}`}>
          {data.combined === 'green'  && t('results.action.green',  '양호합니다. 지속적인 관심을 가져주세요.')}
          {data.combined === 'yellow' && t('results.action.yellow', '경미한 위험이 있습니다. 모니터링을 권고합니다.')}
          {data.combined === 'orange' && t('results.action.orange', '전문가 상담을 권고합니다.')}
          {data.combined === 'red'    && t('results.action.red',    '즉시 의료기관 연결이 필요합니다.')}
        </p>
      </div>

      {/* 세부 점수 */}
      <div className="space-y-3 mb-4">
        {/* PHQ-9 */}
        <ScoreCard
          title={t('results.phq9Title', '우울증 스크리닝 (PHQ-9)')}
          score={data.phq9.score}
          maxScore={data.phq9.maxScore}
          label={data.phq9.label}
          action={data.phq9.action}
          riskLevel={data.phq9.riskLevel}
        />
        {/* MNA-SF */}
        <ScoreCard
          title={t('results.mnasfTitle', '영양 스크리닝 (MNA-SF)')}
          score={data.mnasf.score}
          maxScore={data.mnasf.maxScore}
          label={data.mnasf.label}
          action={data.mnasf.action}
          riskLevel={data.mnasf.riskLevel}
        />
        {/* 만성질환 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {t('results.chronicTitle', '만성질환 체크')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.chronic.count === 0
              ? t('results.chronicNone', '해당 없음')
              : t('results.chronicCount', '{{count}}개 해당', { count: data.chronic.count })}
            {data.chronic.hasHighRisk && (
              <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                {t('results.chronicHighRisk', '— 고위험 항목 포함')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-3">
        {/* 의료기관 찾기 (Orange/Red일 때 강조) */}
        <button
          onClick={() => setShowMap(true)}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            needsReferral
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {t('results.findFacility', '가까운 의료기관 찾기')}
        </button>

        {/* 결과 복사 */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {copied
            ? <><Check className="w-4 h-4 text-green-500" />{t('results.copied', '복사됨!')}</>
            : <><Copy className="w-4 h-4" />{t('results.copyResult', '결과 텍스트 복사')}</>
          }
        </button>

        {/* 새 스크리닝 */}
        <button
          onClick={() => navigate('/screening')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          {t('results.newScreening', '새 스크리닝 시작')}
        </button>
      </div>
    </div>
  )
}

// ── 세부 점수 카드 컴포넌트 ───────────────────────────────────────
function ScoreCard({
  title, score, maxScore, label, action, riskLevel,
}: {
  title: string; score: number; maxScore: number
  label: string; action: string; riskLevel: RiskLevel
}) {
  const pct = (score / maxScore) * 100
  const barColor: Record<RiskLevel, string> = {
    green: 'bg-green-500', yellow: 'bg-yellow-500',
    orange: 'bg-orange-500', red: 'bg-red-500',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {score}<span className="text-xs text-gray-400 font-normal"> / {maxScore}</span>
        </span>
      </div>
      {/* 진행 바 */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor[riskLevel]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {' — '}{action}
      </p>
    </div>
  )
}
