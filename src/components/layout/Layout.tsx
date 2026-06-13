import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import { Sun, Moon } from 'lucide-react'
import { useDarkModeContext } from '../../context/DarkModeContext'

export default function Layout() {
  const { isDark, toggle } = useDarkModeContext()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1f1a] flex flex-col">
      {/* 상단 헤더 — 다크모드 토글 */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-end px-4 py-2 bg-slate-50 dark:bg-[#0f1f1a] border-b border-slate-200 dark:border-[#1a2e28]">
        <button
          onClick={toggle}
          className="p-2 rounded-full text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2e28] transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pt-12 pb-20 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      <NavBar />
    </div>
  )
}
