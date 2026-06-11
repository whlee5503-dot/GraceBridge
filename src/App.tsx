import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DarkModeProvider } from './context/DarkModeContext'
import Layout from './components/layout/Layout'

const Home            = lazy(() => import('./pages/Home'))
const DiagnosticCheck = lazy(() => import('./pages/DiagnosticCheck'))
const NutritionAssess = lazy(() => import('./pages/NutritionAssess'))
const ScreeningForm = lazy(() => import('./components/ScreeningForm'))
const PatientLog      = lazy(() => import('./pages/PatientLog'))

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

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"         element={<Suspense fallback={<PageLoader />}><Home            /></Suspense>} />
            <Route path="/diagnose" element={<Suspense fallback={<PageLoader />}><DiagnosticCheck /></Suspense>} />
            <Route path="/nutrition"element={<Suspense fallback={<PageLoader />}><NutritionAssess /></Suspense>} />
            <Route path="/screening" element={<Suspense fallback={<PageLoader />}><ScreeningForm /></Suspense>} />
            <Route path="/patients" element={<Suspense fallback={<PageLoader />}><PatientLog      /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  )
}
