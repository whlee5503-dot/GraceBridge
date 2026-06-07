import { useScreenings } from '../hooks/usePatients'
import { useTranslation } from 'react-i18next'
import { ClipboardList, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const RISK_STYLES = {
  green:  { wrap: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500',  text: 'text-green-700 dark:text-green-300' },
  yellow: { wrap: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' },
  orange: { wrap: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  red:    { wrap: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500',    text: 'text-red-700 dark:text-red-300' },
}

export default function PatientLog() {
  const { t } = useTranslation()
  const { screenings, loading, refresh } = useScreenings()

  return (
    <div className="p-4 pb-10">
      <header className="mb-4 pt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList size={20} style={{ color: 'var(--brand)' }} />
          {t('log.title', 'Screening Log')}
        </h1>
        <Button variant="secondary" size="sm" onClick={refresh} className="flex items-center gap-1.5">
          <RefreshCw size={13} /> {t('log.refresh', 'Refresh')}
        </Button>
      </header>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--brand-bg)', borderTopColor: 'var(--brand)' }} />
        </div>
      )}

      {!loading && screenings.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {t('log.empty', 'No screenings recorded yet.')}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {screenings.map((s) => {
          const style = RISK_STYLES[s.riskLevel]
          const date = new Date(s.timestamp).toLocaleDateString()
          const time = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={s.id} className={`rounded-xl p-4 ${style.wrap}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>
                  {s.riskLevel}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {s.synced
                    ? <CheckCircle size={12} className="text-green-400" />
                    : <Clock size={12} className="text-amber-400" />}
                  {s.synced ? t('log.synced', 'Synced') : t('log.pending', 'Pending sync')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span>PHQ-9: <strong>{s.phq9Score}</strong>/27</span>
                <span>MNA-SF: <strong>{s.mnaSfScore}</strong>/14</span>
                <span>{t('log.church', 'Church')}: <strong>{s.churchCode}</strong></span>
                <span>{t('log.region', 'Region')}: <strong>{s.regionCode}</strong></span>
                <span className="col-span-2 text-slate-400">{date} {time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
