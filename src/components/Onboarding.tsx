// src/components/Onboarding.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const ONBOARDING_KEY = 'gracebridge_onboarded'

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

interface OnboardingProps {
  onComplete: () => void
}

function IconWelcome() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="72" height="72" rx="16" fill="#106C5A"/>
      <rect x="32.4" y="12" width="7.2" height="28.8" rx="2" fill="white"/>
      <rect x="18" y="24.5" width="36" height="7.2" rx="2" fill="white"/>
      <path d="M14 58 A22 14 0 0 1 58 58" fill="none" stroke="#86EFA8" stroke-width="4" stroke-linecap="round"/>
      <rect x="12" y="50" width="4" height="8" fill="#86EFA8"/>
      <rect x="56" y="50" width="4" height="8" fill="#86EFA8"/>
    </svg>
  )
}

function IconTools() {
  return <span style={{ fontSize: '40px', lineHeight: 1 }}>{'📋'}</span>
}

function IconPrivacy() {
  return <span style={{ fontSize: '40px', lineHeight: 1 }}>{'🔐'}</span>
}

const SLIDES = [
  { Icon: IconWelcome, titleKey: 'onboarding.s1.title', descKey: 'onboarding.s1.desc' },
  { Icon: IconTools,   titleKey: 'onboarding.s2.title', descKey: 'onboarding.s2.desc' },
  { Icon: IconPrivacy, titleKey: 'onboarding.s3.title', descKey: 'onboarding.s3.desc' },
]

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한' },
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t, i18n } = useTranslation()
  const [slide,  setSlide]  = useState(0)
  const [agreed, setAgreed] = useState(false)
  const isLast  = slide === SLIDES.length - 1
  const isFirst = slide === 0
  const { Icon } = SLIDES[slide]
  const currentLang = i18n.language?.slice(0, 2) ?? 'en'

  function switchLang(code: string) {
    i18n.changeLanguage(code)
    localStorage.setItem('i18nextLng', code)
  }

  function handleNext() {
    if (isLast) {
      if (!agreed) return
      localStorage.setItem(ONBOARDING_KEY, 'true')
      onComplete()
    } else {
      setSlide(s => s + 1)
    }
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onComplete()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-10 bg-white dark:bg-[#0f1f1a]">
      <div className="w-full max-w-sm flex justify-end">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {LANGS.map(({ code, label }) => {
            const active = currentLang === code
            return (
              <button
                key={code}
                type="button"
                onClick={() => switchLang(code)}
                className={[
                  'px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                  active
                    ? 'bg-white dark:bg-slate-700 text-[#2D6A4F] dark:text-green-400 shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: '#2D6A4F15' }}
        >
          <Icon />
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          {t(SLIDES[slide].titleKey)}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t(SLIDES[slide].descKey)}
        </p>

        {isLast && (
          <label className="flex items-start gap-3 mt-6 text-left cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#2D6A4F]"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('onboarding.consent')}
            </span>
          </label>
        )}
      </div>

      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? '24px' : '8px',
                backgroundColor: i === slide ? '#2D6A4F' : '#D1D5DB',
              }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={() => setSlide(s => s - 1)}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-400 transition-all"
            >
              {t('common.back', 'Back')}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isLast && !agreed}
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-all"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isLast ? t('onboarding.agree', 'I Agree & Continue') : t('onboarding.next', 'Next')}
          </button>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2 mt-2 text-xs text-slate-400 dark:text-slate-500"
          >
            {t('onboarding.skip', 'Skip')}
          </button>
        )}
      </div>
    </div>
  )
}
