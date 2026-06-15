// src/App.tsx
import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DarkModeProvider } from './context/DarkModeContext'
import Layout from './components/layout/Layout'
import Onboarding, { hasCompletedOnboarding } from './components/Onboarding'
import ChurchAuth, { getStoredChurchCode } from './components/ChurchAuth'

const Home               = lazy(() => import('./pages/Home'))
const DiagnosticCheck    = lazy(() => import('./pages/DiagnosticCheck'))
const NutritionAssess    = lazy(() => import('./pages/NutritionAssess'))
const ScreeningForm      = lazy(() => import('./components/ScreeningForm'))
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard'))
const PatientLog         = lazy(() => import('./pages/PatientLog'))
const ResultsPage        = lazy(() => import('./pages/ResultsPage'))
const ReferralMap        = lazy(() => import('./components/ReferralMap'))
const HelpPage           = lazy(() => import('./pages/HelpPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60svh' }}>
      <div
        className="w-8 h-8 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'var(--brand-bg)', borderTopColor: 'var(--brand)' }}
      />
    </div>
  )
}

// ── 앱 진입 흐름: 온보딩 → Church 인증 → 메인 ────────────────────
type AppState = 'onboarding' | 'auth' | 'main'

function getInitialState(): AppState {
  if (!hasCompletedOnboarding()) return 'onboarding'
  if (!getStoredChurchCode())    return 'auth'
  return 'main'
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(getInitialState)

  function handleOnboardingComplete() {
    setAppState(getStoredChurchCode() ? 'main' : 'auth')
  }

  function handleAuthSuccess() {
    setAppState('main')
  }

  return (
    <DarkModeProvider>
      {appState === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      {appState === 'auth' && (
        <ChurchAuth onSuccess={handleAuthSuccess} />
      )}
      {appState === 'main' && (
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"          element={<Suspense fallback={<PageLoader />}><Home               /></Suspense>} />
              <Route path="/screening" element={<Suspense fallback={<PageLoader />}><ScreeningForm       /></Suspense>} />
              <Route path="/results"   element={<Suspense fallback={<PageLoader />}><ResultsPage         /></Suspense>} />
              <Route path="/referral"  element={<Suspense fallback={<PageLoader />}><ReferralMap          /></Suspense>} />
              <Route path="/diagnose"  element={<Suspense fallback={<PageLoader />}><DiagnosticCheck     /></Suspense>} />
              <Route path="/nutrition" element={<Suspense fallback={<PageLoader />}><NutritionAssess     /></Suspense>} />
              <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><VolunteerDashboard  /></Suspense>} />
              <Route path="/patients"  element={<Suspense fallback={<PageLoader />}><PatientLog          /></Suspense>} />
              <Route path="/help"      element={<Suspense fallback={<PageLoader />}><HelpPage            /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </DarkModeProvider>
  )
}
