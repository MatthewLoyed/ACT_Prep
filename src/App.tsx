import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthCallback from './components/AuthCallback'
import { Analytics } from '@vercel/analytics/react'
import './index.css'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
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
const Dashboard = lazy(() => import('./pages/Dashboard'))

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
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-dvh">
          <ConditionalHeader isNavVisible={isNavVisible} />

        {/* 
          MAIN CONTAINER WIDTH - EASY TO MODIFY
          Controls the maximum width of all page content across the entire app.
          Current: 1900px (nearly full 1920px screen width for professional edge-to-edge layout)
          To change: Modify the max-w-[1900px] value below
          Options: max-w-[1800px], max-w-[1850px], max-w-[1900px], max-w-[1920px], etc.
        */}
        <main className="max-w-[1600px] mx-auto px-4 py-6">
          <Suspense fallback={<div className="text-center py-20">Loading…</div>}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageFade>
                  <Landing />
                </PageFade>} />
                <Route path="/login" element={<PageFade>
                  <Login />
                </PageFade>} />
                <Route path="/signup" element={<PageFade>
                  <Signup />
                </PageFade>} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/subjects" element={<PageFade>
                  <SubjectSelect />
                </PageFade>} />

                <Route path="/dashboard" element={<PageFade>
                  <Dashboard />
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
        <Analytics />
      </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

function ConditionalHeader({ isNavVisible }: { isNavVisible: boolean }) {
  const { user } = useAuth()
  
  // Only show header for authenticated users
  if (!user) {
    return null
  }
  
  return (
    <motion.header 
      className="sticky top-0 z-50 glass-card shadow-lg backdrop-blur-xl"
      initial={{ y: 0 }}
      animate={{ y: isNavVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
                    <div className="w-full px-6 py-0.5 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-6">
                            <motion.img
                    src="/images/yellowBrain.png"
                    alt="Brain Logo"
                    className="w-24 h-24 group-hover:scale-110 transition-transform duration-200"
                    style={{
                      filter: 'var(--logo-filter, hue-rotate(0deg) saturate(0.8) brightness(1.1))'
                    }}
                    animate={{
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatDelay: 2.4,
                      ease: "easeInOut"
                    }}
                  />
          <span className="text-4xl font-black text-high-contrast-bold text-shadow-lg tracking-tight group-hover:scale-105 transition-transform duration-200 whitespace-nowrap">
            TestPrep Pro
          </span>
        </Link>
        <div className="flex items-center flex-1 justify-end">
          <Nav />
        </div>
      </div>
    </motion.header>
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
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/') // Redirect to homepage after sign out
    } catch (error) {
      console.error('Sign out failed:', error)
      // Even if sign out fails, redirect to homepage to clear the UI
      navigate('/')
    }
  }
  
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
      {!user && link('/', 'Home')}
      {user ? (
        <>
          <button
            className="hidden sm:inline-flex items-center rounded-xl px-6 py-3 text-lg font-bold text-white/60 font-extrabold text-shadow-xl cursor-not-allowed transition-all duration-200"
            disabled
          >
            Dashboard (Coming Soon)
          </button>
          {link('/import', 'Import')}
          {link('/practice', 'Practice')}
          {link('/tips', 'Tips')}
          {link('/settings', 'Settings')}
          <button
            onClick={handleSignOut}
            className="hidden sm:inline-flex items-center rounded-xl px-6 py-3 text-lg font-bold text-white font-extrabold text-shadow-xl hover:bg-white/20 hover:scale-105 hover:shadow-md transition-all duration-200"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          {link('/login', 'Sign In')}
          {link('/signup', 'Sign Up')}
        </>
      )}
      
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
            {!user && link('/', 'Home', true)}
            {user ? (
              <>
                <button
                  className="block w-full text-left px-4 py-2 text-white/60 cursor-not-allowed transition-colors"
                  disabled
                >
                  Dashboard (Coming Soon)
                </button>
                {link('/import', 'Import', true)}
                {link('/practice', 'Practice', true)}
                {link('/tips', 'Tips', true)}
                {link('/settings', 'Settings', true)}
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {link('/login', 'Sign In', true)}
                {link('/signup', 'Sign Up', true)}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
