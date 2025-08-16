import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import './index.css'

const Landing = lazy(() => import('./pages/Landing'))
const SubjectSelect = lazy(() => import('./pages/SubjectSelect'))

const Summary = lazy(() => import('./pages/Summary'))
const FullTestSetup = lazy(() => import('./pages/FullTestSetup'))
const FullTest = lazy(() => import('./pages/FullTest'))
const History = lazy(() => import('./pages/History'))
const ImportTest = lazy(() => import('./pages/ImportTest'))
const Practice = lazy(() => import('./pages/Practice'))
const TestSelection = lazy(() => import('./pages/TestSelection'))
const PdfPractice = lazy(() => import('./pages/PdfPractice'))
const PdfPracticeSetup = lazy(() => import('./pages/PdfPracticeSetup'))
const TestReview = lazy(() => import('./pages/TestReview'))
const Settings = lazy(() => import('./pages/Settings'))
const Tips = lazy(() => import('./pages/Tips'))

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
      <div className="min-h-dvh">
        <motion.header 
          className="sticky top-0 z-10 glass-card shadow-lg"
          initial={{ y: 0 }}
          animate={{ y: isNavVisible ? 0 : -100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-6">
              <img 
                src="/images/yellowBrain.png" 
                alt="Brain Logo" 
                className="w-24 h-24 group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-4xl font-black text-high-contrast-bold text-shadow-lg tracking-tight group-hover:scale-105 transition-transform duration-200 whitespace-nowrap">
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

                <Route path="/pdf-practice/:subject" element={<PageFade>
                  <PdfPractice />
                </PageFade>} />
                <Route path="/pdf-practice-setup" element={<PageFade>
                  <PdfPracticeSetup />
                </PageFade>} />
                <Route path="/test-review/:subject" element={<PageFade>
                  <TestReview />
                </PageFade>} />
                <Route path="/settings" element={<PageFade>
                  <Settings />
                </PageFade>} />
                <Route path="/tips" element={<PageFade>
                  <Tips />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const link = (to: string, label: string, isMobile = false) => {
    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link
        to={to}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={`${isMobile ? 'block' : 'hidden sm:inline-flex'} items-center rounded-xl px-6 py-3 text-lg font-bold transition-all duration-200 ${
          active 
            ? 'accent-gradient text-neutral font-extrabold shadow-lg scale-105' 
            : 'text-white font-extrabold text-shadow-xl hover:bg-white/20 hover:scale-105 hover:shadow-md'
        }`}
      >
        {label}
      </Link>
    )
  }
  
  return (
    <nav className="flex items-center gap-4 ml-auto">
      {/* Desktop Navigation */}
      {link('/', 'Home')}
      {link('/import', 'Import')}
      {link('/practice', 'Practice')}
      {link('/tips', 'Tips')}
      {link('/history', 'History')}
      {link('/settings', 'Settings')}
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/10 backdrop-blur-xl border-b border-white/20 sm:hidden">
          <div className="flex flex-col p-4 space-y-2">
            {link('/', 'Home', true)}
            {link('/import', 'Import', true)}
            {link('/practice', 'Practice', true)}
            {link('/tips', 'Tips', true)}
            {link('/history', 'History', true)}
            {link('/settings', 'Settings', true)}
          </div>
        </div>
      )}
    </nav>
  )
}
