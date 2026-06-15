// src/components/HelpModal.tsx
import { useTranslation } from 'react-i18next'
import { X, ArrowRight, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const flowSteps: string[] = t('help.flowSteps', { returnObjects: true }) as string[]
  const toolList: string[]  = t('help.toolList',  { returnObjects: true }) as string[]
  const termList: { term: string; desc: string }[] = t('help.termList', { returnObjects: true }) as { term: string; desc: string }[]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('help.modalTitle')}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[85svh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1a2e28] shadow-xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1a2e28] z-10">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#106C5A"/>
              <rect x="16.2" y="6" width="3.6" height="16" rx="1.2" fill="white"/>
              <rect x="9" y="12" width="18" height="3.6" rx="1.2" fill="white"/>
              <path d="M6 29 A12 8 0 0 1 30 29" fill="none" stroke="#86EFA8" stroke-width="2.5" stroke-linecap="round"/>
              <rect x="5" y="25" width="2.5" height="4" rx="0.5" fill="#86EFA8"/>
              <rect x="28.5" y="25" width="2.5" height="4" rx="0.5" fill="#86EFA8"/>
            </svg>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t('help.modalTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            aria-label={t('help.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">

          {/* 앱 흐름 */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-2">
              {t('help.flow')}
            </h3>
            <ol className="space-y-2">
              {flowSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#106C5A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* 스크리닝 도구 */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-2">
              {t('help.tools')}
            </h3>
            <ul className="space-y-1.5">
              {toolList.map((tool, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <ArrowRight size={14} className="text-[#106C5A] dark:text-green-400 mt-0.5 flex-shrink-0" />
                  {tool}
                </li>
              ))}
            </ul>
          </section>

          {/* 주요 용어 */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#106C5A] dark:text-green-400 mb-2">
              {t('help.terms')}
            </h3>
            <div className="space-y-2">
              {termList.map(({ term, desc }, i) => (
                <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{term}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 개인정보 */}
          <section className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-3">
            <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">
              🔐 {t('help.privacy')}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('help.privacyDesc')}
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1a2e28] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {t('help.close')}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/help') }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
            style={{ background: '#106C5A' }}
          >
            <ExternalLink size={14} />
            {t('help.openGuide')}
          </button>
        </div>
      </div>
    </div>
  )
}
