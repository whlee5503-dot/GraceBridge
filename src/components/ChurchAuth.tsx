// src/components/ChurchAuth.tsx
// Church 코드 6자리 입력 + 검증
// privacy.ts 기반 — 이메일/비밀번호 없음

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isValidChurchCode, sanitizeChurchCode } from '../lib/privacy'

interface ChurchAuthProps {
  onSuccess: (churchCode: string) => void
}

const STORAGE_KEY = 'gracebridge_church_code'

export function getStoredChurchCode(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export default function ChurchAuth({ onSuccess }: ChurchAuthProps) {
  const { t } = useTranslation()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState(false)
  const [shaking, setShaking] = useState(false)

  function handleInput(raw: string) {
    const clean = sanitizeChurchCode(raw)
    setCode(clean)
    setError(false)
  }

  function handleSubmit() {
    if (isValidChurchCode(code)) {
      localStorage.setItem(STORAGE_KEY, code)
      onSuccess(code)
    } else {
      setError(true)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  // 6칸 박스 렌더
  const digits = code.split('').concat(Array(6 - code.length).fill(''))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-[#0f1f1a]">

      {/* 로고 */}
      <div className="mb-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#2D6A4F20' }}
        >
          <span className="text-3xl">��</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          GraceBridge
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('auth.subtitle', 'Bridging Faith and Health')}
        </p>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-sm bg-white dark:bg-[#1a2e28] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {t('auth.title', 'Enter Church Code')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          {t('auth.desc', 'Enter the 6-digit code provided by your church coordinator.')}
        </p>

        {/* 6칸 입력 박스 */}
        <div
          className={[
            'flex gap-2 justify-center mb-4',
            shaking ? 'animate-[shake_0.4s_ease-in-out]' : '',
          ].join(' ')}
          style={shaking ? { animation: 'shake 0.4s ease-in-out' } : {}}
        >
          {digits.map((d, i) => (
            <div
              key={i}
              className={[
                'w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all',
                d
                  ? 'border-[#2D6A4F] bg-green-50 dark:bg-green-900/20 text-[#2D6A4F] dark:text-green-400'
                  : error
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-300',
              ].join(' ')}
            >
              {d || (i === code.length ? '|' : '')}
            </div>
          ))}
        </div>

        {/* 숨겨진 실제 입력 */}
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-xl font-bold tracking-[0.5em] py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2D6A4F] transition-all mb-1"
          placeholder="000000"
          autoFocus
        />

        {/* 에러 메시지 */}
        <div className="h-5 mb-3">
          {error && (
            <p className="text-xs text-red-500 text-center">
              {t('auth.error', 'Please enter a valid 6-digit code.')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={code.length !== 6}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-all"
          style={{ backgroundColor: '#2D6A4F' }}
        >
          {t('auth.confirm', 'Confirm')}
        </button>
      </div>

      {/* 안내 */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 text-center max-w-xs leading-relaxed">
        {t('auth.privacy', 'No personal information is collected. Only anonymous screening data is stored.')}
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
