import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Heart, ClipboardList, Activity, MapPin, Sun, Moon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { useDarkModeContext } from '../context/DarkModeContext'

const TOOLS = [
  { path: '/screening', icon: Heart,         color: '#1a6b4a', labelKey: 'home.screening', descKey: 'home.screeningDesc' },
  { path: '/nutrition', icon: Activity,      color: '#2563eb', labelKey: 'home.nutrition', descKey: 'home.nutritionDesc' },
  { path: '/referral',  icon: MapPin,        color: '#d97706', labelKey: 'home.referral',  descKey: 'home.referralDesc'  },
  { path: '/patients',  icon: ClipboardList, color: '#7c3aed', labelKey: 'home.log',       descKey: 'home.logDesc'       },
]

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한' },
  // 'id' (Indonesian) temporarily disabled until clinically validated
  // PHQ-9 / MNA-SF translations are secured post-DPGA (see README.md)
]

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isDark, toggle } = useDarkModeContext()

  const currentLang = i18n.language?.slice(0, 2) ?? 'en'

  function switchLang(code: string) {
    i18n.changeLanguage(code)
    localStorage.setItem('i18nextLng', code)
  }

  return (
    <div className="p-4 pb-10">
      <header className="mb-6 pt-2">

        {/* 타이틀 행 — 언어 버튼 + 다크모드 토글 우측 배치 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              GraceBridge
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('home.subtitle', 'Bridging Faith and Health')}
            </p>
          </div>

          {/* 우측 컨트롤 영역 */}
          <div className="flex items-center gap-2 mt-1">

            {/* 언어 선택 */}
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
                        ? 'bg-white dark:bg-slate-700 text-[#1a6b4a] dark:text-green-400 shadow-sm'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* 다크모드 토글 */}
            <button
              type="button"
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

          </div>
        </div>

        {/* 오프라인 뱃지 */}
        <span className="inline-flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          {t('home.offline', 'Offline ready')}
        </span>
      </header>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        {t('home.tools', 'Screening Tools')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map(({ path, icon: Icon, color, labelKey, descKey }) => (
          <Card
            key={path}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-95"
            onClick={() => navigate(path)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: color + '20' }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {t(labelKey)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(descKey)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
