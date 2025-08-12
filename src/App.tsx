import { lazy, Suspense, useEffect, useState, useRef } from 'react'
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
const Practice = lazy(() => import('./pages/Practice'))
const TestSelection = lazy(() => import('./pages/TestSelection'))
const EnglishPassageView = lazy(() => import('./pages/EnglishPassageView'))
const PdfPageViewer = lazy(() => import('./pages/PdfPageViewer'))
const PdfPractice = lazy(() => import('./pages/PdfPractice'))
const PdfPracticeSetup = lazy(() => import('./pages/PdfPracticeSetup'))

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const lastScrollY = useRef(0)

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-gradient-to-br from-white via-slate-25 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
        <motion.header 
          className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-lg shadow-lg"
          initial={{ y: 0 }}
          animate={{ y: isNavVisible ? 0 : -100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="max-w-7xl mx-auto px-9 py-5 flex items-center justify-between">
            <Link to="/" className="group">
              <span className="text-5xl font-black bg-gradient-to-r from-sky-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform duration-200">
                TestPrep Pro
              </span>
            </Link>
            <div className="flex items-center flex-1 justify-end">
              <Nav />
              {/* <button className="btn btn-ghost" onClick={() => setDarkMode(v => !v)}>
                {darkMode ? 'Light' : 'Dark'}
              </button> */}
            </div>
          </div>
        </motion.header>

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
                <Route path="/practice" element={<PageFade>
                  <Practice />
                </PageFade>} />
                <Route path="/test-selection/:testId" element={<PageFade>
                  <TestSelection />
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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ 
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1]
      }}
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
        className={`hidden sm:inline-flex items-center rounded-xl px-9 py-4 text-xl font-bold transition-all duration-200 ${
          active 
            ? 'brand-gradient text-white shadow-lg scale-105' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 hover:shadow-md'
        }`}
      >
        {label}
      </Link>
    )
  }
      return (
      <nav className="flex items-center gap-6">
        {link('/', 'Home')}
        {link('/import', 'Import PDF')}
        {link('/practice', 'Practice')}
        {link('/full-test-setup', 'Full Test')}
        {link('/history', 'History')}
      </nav>
    )
}
