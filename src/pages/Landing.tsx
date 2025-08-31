import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BlurText from '../components/BlurText'
import TextType from '../components/TextType'
import FunWordAnimation from '../components/FunWordAnimation'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'
import InteractiveDemo from '../components/InteractiveDemo'
import { listTestsFromSupabase } from '../lib/simpleSupabaseStorage'


const features = [
  { title: 'Instant feedback', desc: 'Hear and see if you’re right, immediately.', icon: '✅' },
  { title: 'Real questions', desc: 'Practice with recent ACT®-style questions.', icon: '📝' },
  { title: 'Smart timer', desc: 'Custom countdown with a friendly time’s-up cue.', icon: '⏱️' },
  { title: 'Smooth animations', desc: 'Microinteractions that keep you focused.', icon: '✨' },
  { title: 'PDF Integration', desc: 'Upload real ACT® tests and practice with authentic questions.', icon: '📄' },
  { title: 'Progress tracking', desc: 'Monitor your improvement across all sections.', icon: '📊' },
]

const faqs = [
  { q: 'Is this free?', a: 'Yes. Your practice data stays in your browser.' },
  { q: 'Where do questions come from?', a: 'Questions are extracted directly from your uploaded ACT® test PDFs. We parse real test content to create authentic practice questions.' },
  { q: 'Can I practice on my phone?', a: 'Absolutely. The UI is fully responsive.' },
  { q: 'Why do I need to upload my own test?', a: 'Due to copyright restrictions, we cannot host official ACT® tests. You upload your own test PDFs to practice with authentic questions.' },
]

export default function Landing() {
  const { user } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [hasTests, setHasTests] = useState(false)
  const [isLoadingTests, setIsLoadingTests] = useState(false)

  // Check if user has tests when they're signed in
  useEffect(() => {
    if (user) {
      setIsLoadingTests(true)
      listTestsFromSupabase()
        .then((tests) => {
          setHasTests(tests.length > 0)
        })
        .catch((error) => {
          console.error('Error loading tests:', error)
          setHasTests(false)
        })
        .finally(() => {
          setIsLoadingTests(false)
        })
    } else {
      setHasTests(false)
    }
  }, [user])
  
  return (
    <div className="py-16 relative overflow-hidden">
      {/* Logo and title for non-authenticated users */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-4 left-4 z-50"
        >
          <Link to="/" className="group flex items-center gap-3">
            <img 
              src="/images/yellowBrain.png" 
              alt="Brain Logo" 
              className="w-12 h-12 group-hover:scale-110 transition-transform duration-200"
              style={{
                filter: 'var(--logo-filter, hue-rotate(0deg) saturate(0.8) brightness(1.1))'
              }}
            />
            <span className="text-2xl font-bold text-white text-shadow-lg tracking-tight group-hover:scale-105 transition-transform duration-200">
              TestPrep Pro
            </span>
          </Link>
        </motion.div>
      )}
      {/* Dynamic Floating Brains */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => {
          // Create random starting positions across the entire screen
          const startX = Math.random() * 100
          const startY = Math.random() * 100
          
          return (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: 0,
                y: 0,
                opacity: 0.4,
                scale: 0.6
              }}
              animate={{
                x: [0, 300, 600, 900, 1200, 900, 600, 300, 0, -300, 0],
                y: [0, 200, 400, 600, 800, 600, 400, 200, 0, -200, 0],
                opacity: [0.4, 0.8, 0.4],
                scale: [0.6, 1, 0.6],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 35 + Math.random() * 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                left: `${startX}%`,
                top: `${startY}%`
              }}
            >
              <img 
                src="/images/yellowBrain.png" 
                alt="Floating Brain" 
                className="w-7 h-7 opacity-30"
              />
            </motion.div>
          )
        })}
      </div>

      {/* Hero */}
      <div className="w-full px-2 relative z-10">
        <div className="w-full text-center backdrop-blur-md">
          <div className="text-5xl md:text-7xl font-extrabold tracking-tight text-high-contrast-bold text-shadow-xl mb-6">
            ACT® Prep that is{' '}
            <FunWordAnimation className="text-5xl md:text-7xl font-extrabold tracking-tight text-high-contrast-bold text-shadow-xl" />
          </div>
          <TextType
            text={[
              "Skip the stale PDFs. Practice with lively feedback and smooth animations.",
              "Master the ACT® with interactive practice sessions that adapt to your learning style.",
              "Transform test prep from boring to engaging with our modern, gamified approach."
            ]}
            className="mt-6 text-xl text-secondary leading-relaxed"
            typingSpeed={50}
            pauseDuration={3000}
            showCursor={true}
            cursorCharacter="|"
            loop={true}
            textColors={["#E2E8F0"]}
          />
          <motion.div 
            className="mt-10 flex items-center justify-center gap-4 flex-wrap" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {user ? (
              // User is signed in - show action buttons
              <>
                <Link to="/import">
                  <motion.div
                    className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)',
                        '0 0 50px rgba(255, 234, 167, 0.9), 0 0 100px rgba(102, 126, 234, 0.8)',
                        '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)'
                      ],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {isLoadingTests ? '🔄 Loading...' : hasTests ? '📄 Import Another Test' : '🚀 Import Your First Test!'}
                  </motion.div>
                </Link>
                <Link to="/practice">
                  <motion.div
                    className="btn btn-ghost text-lg px-6 py-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    📚 View My Tests
                  </motion.div>
                </Link>
              </>
            ) : (
              // User is not signed in - show sign up/sign in buttons
              <>
                <motion.button
                  onClick={() => setIsSignupModalOpen(true)}
                  className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)',
                      '0 0 50px rgba(255, 234, 167, 0.9), 0 0 100px rgba(102, 126, 234, 0.8)',
                      '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)'
                    ],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎯 Start Practicing Free!
                </motion.button>
                <motion.button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn btn-ghost text-lg px-8 py-4 border-2 border-white/30 hover:bg-white/20 transition-all duration-200"
                >
                  🔑 Already have an account?
                </motion.button>
              </>
            )}
            <a href="#features" className="btn btn-ghost text-lg px-6 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
              See features
            </a>
          </motion.div>
          
          {/* Add a small note for non-signed in users */}
          {!user && (
            <motion.p 
              className="mt-4 text-sm text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              ✨ Sign up in 30 seconds • No credit card required • Start practicing immediately
            </motion.p>
          )}
        </div>
      </div>

      {/* Interactive Demo Section */}
      {!user && (
        <div className="w-full px-2 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6 text-high-contrast-bold text-shadow-lg">
              Get Started in 3 Quick Steps
            </h2>
            <p className="text-xl text-secondary max-w-6xl mx-auto">
              See how easy it is to transform your ACT® prep with our interactive demo
            </p>
          </motion.div>
          
          <InteractiveDemo
            onSignupClick={() => setIsSignupModalOpen(true)}
            onLoginClick={() => setIsLoginModalOpen(true)}
          />
        </div>
      )}

      {/* Features */}
      <div id="features" className="w-full px-2 mt-20">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12 text-high-contrast-bold text-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Why Choose Our ACT® Prep?
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div 
              key={f.title} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.3 }} 
              transition={{ delay: i * 0.1, duration: 0.5 }} 
              className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl glass-card">
                  <div className="text-2xl">{f.icon}</div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                  <p className="text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why better */}
      <div className="w-full px-2 mt-20">
        <motion.div 
          className="card p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <BlurText
              text="🚀 Why This Beats Traditional Test Prep"
              className="text-3xl font-bold text-high-contrast-bold text-shadow-lg justify-center"
              delay={50}
              animateBy="words"
              direction="top"
              stepDuration={0.3}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  ⚡
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Instant Feedback</h3>
                  <p className="text-secondary">No more waiting to check answers. Get immediate feedback with sound effects and animations that make learning stick.</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  🎯
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Real ACT® Questions</h3>
                  <p className="text-secondary">Practice with authentic ACT®-style questions that mirror the actual test format and difficulty.</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  📊
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Progress Tracking</h3>
                  <p className="text-secondary">Watch your improvement with detailed analytics and progress tracking across all ACT® sections.</p>
                </div>
              </motion.div>
            </div>
            
            <div className="space-y-4">
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  🎮
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Gamified Learning</h3>
                  <p className="text-secondary">Turn boring test prep into an engaging experience with achievements, animations, and interactive elements.</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  📱
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Mobile Friendly</h3>
                  <p className="text-secondary">Practice anywhere, anytime. Our responsive design works perfectly on phones, tablets, and desktops.</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  🔒
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Your Data, Your Privacy</h3>
                  <p className="text-secondary">Your practice data is private and secure. No sharing, no ads, just focused learning.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="w-full px-0 mt-20">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12 text-high-contrast-bold text-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Frequently Asked Questions
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {faqs.map((faq, i) => (
            <motion.div 
              key={faq.q} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.3 }} 
              transition={{ delay: i * 0.1, duration: 0.5 }} 
              className="card p-6 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="font-bold text-xl mb-3 text-high-contrast-bold">{faq.q}</h3>
              <p className="text-secondary leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      {!user && (
        <div className="w-full px-2 mt-20">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-6 text-high-contrast-bold text-shadow-lg">
              Ready to Ace Your ACT®?
            </h2>
            <p className="text-xl text-secondary mb-8 max-w-6xl mx-auto">
              Join thousands of students who've transformed their test prep experience. 
              Start practicing today and see the difference engaging, interactive learning makes.
            </p>
            <motion.button
              onClick={() => setIsSignupModalOpen(true)}
              className="btn btn-primary text-xl px-10 py-5 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-block"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)',
                  '0 0 50px rgba(255, 234, 167, 0.9), 0 0 100px rgba(102, 126, 234, 0.8)',
                  '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)'
                ],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎯 Start Your Free Practice Now!
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false)
          setIsSignupModalOpen(true)
        }}
      />
      
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false)
          setIsLoginModalOpen(true)
        }}
      />
    </div>
  )
}




