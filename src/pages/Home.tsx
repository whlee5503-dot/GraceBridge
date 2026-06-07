import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Heart, ClipboardList, Activity, MapPin } from 'lucide-react'
import { Card } from '../components/ui/Card'

const TOOLS = [
  { path: '/screening', icon: Heart,          color: '#1a6b4a', labelKey: 'home.screening',  descKey: 'home.screeningDesc'  },
  { path: '/nutrition', icon: Activity,       color: '#2563eb', labelKey: 'home.nutrition',  descKey: 'home.nutritionDesc'  },
  { path: '/referral',  icon: MapPin,         color: '#d97706', labelKey: 'home.referral',   descKey: 'home.referralDesc'   },
  { path: '/patients',  icon: ClipboardList,  color: '#7c3aed', labelKey: 'home.log',        descKey: 'home.logDesc'        },
]

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="p-4 pb-10">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          GraceBridge
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('home.subtitle', 'Bridging Faith and Health')}
        </p>
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
