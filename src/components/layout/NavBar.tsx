import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Heart, Activity, MapPin, ClipboardList } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',          icon: Home,          labelKey: 'nav.home'      },
  { path: '/screening', icon: Heart,         labelKey: 'nav.screening' },
  { path: '/nutrition', icon: Activity,      labelKey: 'nav.nutrition' },
  { path: '/referral',  icon: MapPin,        labelKey: 'nav.referral'  },
  { path: '/patients',  icon: ClipboardList, labelKey: 'nav.log'       },
]

export default function NavBar() {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0f1f1a] border-t border-slate-200 dark:border-[#1a2e28] z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#1a6b4a] dark:text-[#4ade80]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
