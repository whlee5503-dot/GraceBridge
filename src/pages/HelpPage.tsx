// src/pages/HelpPage.tsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react'

export default function HelpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const flowSteps: string[] = t('help.flowSteps', { returnObjects: true }) as string[]
  const toolList: string[]  = t('help.toolList',  { returnObjects: true }) as string[]
  const termList: { term: string; desc: string }[] = t('help.termList', { returnObjects: true }) as { term: string; desc: string }[]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1f1a] pb-16">

      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#1a2e28] border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {t('help.pageTitle')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('help.pageSubtitle')}
          </p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">

        {/* 앱 흐름 */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-3">
            {t('help.flow')}
          </h2>
          <div className="bg-white dark:bg-[#1a2e28] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
            {flowSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#106C5A] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 스크리닝 도구 */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-3">
            {t('help.tools')}
          </h2>
          <div className="bg-white dark:bg-[#1a2e28] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-2.5">
            {toolList.map((tool, i) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight size={14} className="text-[#106C5A] dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-300">{tool}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 위험도 색상 안내 */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-3">
            {t('help.riskLevels', 'Risk Levels')}
          </h2>
          <div className="bg-white dark:bg-[#1a2e28] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-2">
            {[
              { color: '#22c55e', label: t('help.riskGreen', 'Green'), desc: t('help.riskGreenDesc', 'Normal — no immediate action needed') },
              { color: '#eab308', label: t('help.riskYellow', 'Yellow'), desc: t('help.riskYellowDesc', 'Monitor — follow up recommended') },
              { color: '#f97316', label: t('help.riskOrange', 'Orange'), desc: t('help.riskOrangeDesc', 'Refer — connect to a professional') },
              { color: '#ef4444', label: t('help.riskRed', 'Red'), desc: t('help.riskRedDesc', 'Urgent — immediate referral required') },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-14">{label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 주요 용어 */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-3">
            {t('help.terms')}
          </h2>
          <div className="space-y-2">
            {termList.map(({ term, desc }, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1a2e28] rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-3"
              >
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{term}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 개인정보 + 오프라인 */}
        <section className="space-y-3">
          <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 flex items-start gap-3">
            <Shield size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">{t('help.privacy')}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 leading-relaxed">{t('help.privacyDesc')}</p>
            </div>
          </div>

        </section>

        {/* 버전 */}
        <p className="text-center text-xs text-slate-300 dark:text-slate-600 pt-2">
          GraceBridge · MIT License · DPGA-First
        </p>

      </div>
    </div>
  )
}
