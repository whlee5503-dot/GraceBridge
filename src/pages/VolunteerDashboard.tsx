// src/pages/VolunteerDashboard.tsx
// Phase 2 — 봉사자 대시보드: 집계 통계 + 위험도 분포 + sync 상태
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, CheckCircle, Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { getAll } from '../lib/offlineQueue'
import type { PendingScreening } from '../lib/offlineQueue'
import { Card } from '../components/ui/Card'

type RiskLevel = 'green' | 'yellow' | 'orange' | 'red'

const RISK_STYLE: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-300',   border: 'border-green-400',  label: 'Low Risk'     },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-400', label: 'Mild Risk'    },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400', label: 'Moderate Risk' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-300',       border: 'border-red-400',    label: 'High Risk'    },
}

const RISK_COLOR: Record<RiskLevel, string> = {
  green: '#16A34A', yellow: '#D97706', orange: '#EA580C', red: '#DC2626',
}

// ── 집계 계산 ─────────────────────────────────────────────────────
function calcStats(screenings: PendingScreening[]) {
  const total   = screenings.length
  const synced  = screenings.filter(s => s.synced).length
  const pending = total - synced

  const dist: Record<RiskLevel, number> = { green: 0, yellow: 0, orange: 0, red: 0 }
  let phq9Sum = 0, mnaSfSum = 0

  for (const s of screenings) {
    dist[s.riskLevel]++
    phq9Sum  += s.phq9Score
    mnaSfSum += s.mnaSfScore
  }

  const highRisk     = dist.red + dist.orange
  const avgPHQ9      = total ? (phq9Sum  / total).toFixed(1) : '—'
  const avgMNASF     = total ? (mnaSfSum / total).toFixed(1) : '—'
  const referralRate = total ? Math.round((highRisk / total) * 100) : 0

  return { total, synced, pending, dist, highRisk, avgPHQ9, avgMNASF, referralRate }
}

// ── 위험도 바 차트 ────────────────────────────────────────────────
function RiskBar({ level, count, total }: { level: RiskLevel; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  const st  = RISK_STYLE[level]
  return (
    <div className="flex items-center gap-3">
      <span className={`w-16 text-xs font-semibold ${st.text}`}>{st.label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: RISK_COLOR[level] }}
        />
      </div>
      <span className="w-8 text-xs text-right text-slate-500 dark:text-slate-400 font-medium">{count}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════════
export default function VolunteerDashboard() {
  const { t } = useTranslation()
  const [screenings, setScreenings] = useState<PendingScreening[]>([])
  const [loading,    setLoading]    = useState(true)

  function load() {
    setLoading(true)
    getAll()
      .then(setScreenings)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const stats = calcStats(screenings)

  return (
    <div className="p-4 pb-10">

      {/* 헤더 */}
      <header className="mb-5 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={20} style={{ color: 'var(--brand, #2D6A4F)' }} />
            {t('dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {t('dashboard.subtitle', 'Screening summary for this device')}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400"
        >
          <RefreshCw size={12} /> {t('log.refresh', 'Refresh')}
        </button>
      </header>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--brand-bg)', borderTopColor: 'var(--brand, #2D6A4F)' }} />
        </div>
      )}

      {!loading && (
        <div className="space-y-4">

          {/* 요약 카드 3개 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users,         value: stats.total,        label: t('dashboard.total',   'Total'),        color: '#2D6A4F' },
              { icon: AlertTriangle, value: stats.highRisk,     label: t('dashboard.highRisk','Needs Referral'), color: '#DC2626' },
              { icon: TrendingUp,    value: `${stats.referralRate}%`, label: t('dashboard.referralRate', 'Referral Rate'), color: '#D97706' },
            ].map(({ icon: Icon, value, label, color }) => (
              <Card key={label} className="p-3 text-center">
                <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          {/* 위험도 분포 */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              {t('dashboard.riskDist', 'Risk Distribution')}
            </h2>
            {stats.total === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {t('log.empty', 'No screenings recorded yet.')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {(['red','orange','yellow','green'] as RiskLevel[]).map(level => (
                  <RiskBar key={level} level={level} count={stats.dist[level]} total={stats.total} />
                ))}
              </div>
            )}
          </Card>

          {/* 평균 점수 */}
          {stats.total > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                {t('dashboard.avgScores', 'Average Scores')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-2xl font-bold" style={{ color: '#2D6A4F' }}>{stats.avgPHQ9}</p>
                  <p className="text-xs text-slate-400 mt-0.5">PHQ-9 / 27</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-2xl font-bold" style={{ color: '#2563EB' }}>{stats.avgMNASF}</p>
                  <p className="text-xs text-slate-400 mt-0.5">MNA-SF / 14</p>
                </div>
              </div>
            </Card>
          )}

          {/* Sync 상태 */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              {t('dashboard.syncStatus', 'Sync Status')}
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('log.synced', 'Synced')}: <strong>{stats.synced}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('log.pending', 'Pending')}: <strong>{stats.pending}</strong>
                </span>
              </div>
            </div>
          </Card>

          {/* 최근 스크리닝 목록 */}
          {screenings.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('dashboard.recent', 'Recent Screenings')}
              </h2>
              <div className="space-y-2">
                {[...screenings].reverse().slice(0, 5).map((s) => {
                  const st   = RISK_STYLE[s.riskLevel]
                  const date = new Date(s.timestamp).toLocaleDateString()
                  const time = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={s.id} className={`rounded-xl p-3 border-l-4 ${st.bg} ${st.border}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase ${st.text}`}>{s.riskLevel}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          {s.synced
                            ? <CheckCircle size={11} className="text-green-400" />
                            : <Clock size={11} className="text-amber-400" />}
                          {s.synced ? t('log.synced','Synced') : t('log.pending','Pending')}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>PHQ-9: <strong>{s.phq9Score}</strong></span>
                        <span>MNA-SF: <strong>{s.mnaSfScore}</strong></span>
                        <span className="ml-auto">{date} {time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
