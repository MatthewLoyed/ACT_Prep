import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import './index.css'

const Landing = lazy(() => import('./pages/Landing'))
const SubjectSelect = lazy(() => import('./pages/SubjectSelect'))
const TimerSetup = lazy(() => import('./pages/TimerSetup'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Summary = lazy(() => import('./pages/Summary'))
const FullTestSetup = lazy(() => import('./pages/FullTestSetup'))
const FullTest = lazy(() => import('./pages/FullTest'))
const History = lazy(() => import('./pages/History'))
const ImportTest = lazy(() => import('./pages/ImportTest'))
const ChooseTest = lazy(() => import('./pages/ChooseTest'))
const EnglishPassageView = lazy(() => import('./pages/EnglishPassageView'))
const PdfPageViewer = lazy(() => import('./pages/PdfPageViewer'))
const PdfPractice = lazy(() => import('./pages/PdfPractice'))
const PdfPracticeSetup = lazy(() => import('./pages/PdfPracticeSetup'))

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      setDarkMode(stored === 'true')
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900 transition-colors">
        <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl brand-gradient" />
              <span className="font-semibold">ACT Prep</span>
            </Link>
            <div className="flex items-center gap-2">
              <Nav />
              <a className="btn btn-ghost" href="/pdf?url=/practice_tests/Preparing-for-the-ACT.pdf">PDF view</a>
              <a className="btn btn-ghost" href="/pdf-practice-setup">PDF practice</a>
              <button className="btn btn-ghost" onClick={() => setDarkMode(v => !v)}>
                {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="text-center py-20">Loading…</div>}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageFade>
                  <Landing />
                </PageFade>} />
                <Route path="/subjects" element={<PageFade>
                  <SubjectSelect />
                </PageFade>} />
                <Route path="/timer/:subject" element={<PageFade>
                  <TimerSetup />
                </PageFade>} />
                <Route path="/quiz/:subject" element={<PageFade>
                  <Quiz />
                </PageFade>} />
                <Route path="/full-test-setup" element={<PageFade>
                  <FullTestSetup />
                </PageFade>} />
                <Route path="/full-test" element={<PageFade>
                  <FullTest />
                </PageFade>} />
                <Route path="/summary" element={<PageFade>
                  <Summary />
                </PageFade>} />
                <Route path="/history" element={<PageFade>
                  <History />
                </PageFade>} />
                <Route path="/import" element={<PageFade>
                  <ImportTest />
                </PageFade>} />
                <Route path="/choose-test" element={<PageFade>
                  <ChooseTest />
                </PageFade>} />
                <Route path="/english-passages" element={<PageFade>
                  <EnglishPassageView />
                </PageFade>} />
                <Route path="/pdf" element={<PageFade>
                  <PdfPageViewer />
                </PageFade>} />
                <Route path="/pdf-practice/:subject" element={<PageFade>
                  <PdfPractice />
                </PageFade>} />
                <Route path="/pdf-practice-setup" element={<PageFade>
                  <PdfPracticeSetup />
                </PageFade>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}

function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export default App

function Nav() {
  const location = useLocation()
  const link = (to: string, label: string) => {
    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link
        to={to}
        className={`hidden sm:inline-flex items-center rounded-xl px-3 py-1.5 text-sm transition-colors ${active ? 'brand-gradient text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        {label}
      </Link>
    )
  }
  return (
    <nav className="flex items-center gap-1.5">
      {link('/', 'Home')}
      {link('/subjects', 'Subjects')}
      {link('/full-test-setup', 'Full Test')}
      {link('/history', 'History')}
      {link('/choose-test', 'Choose Test')}
      {link('/import', 'Import')}
    </nav>
  )
}
