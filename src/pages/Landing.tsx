import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import BlurText from '../components/BlurText'
import TextType from '../components/TextType'
import FunWordAnimation from '../components/FunWordAnimation'


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
  { q: 'Where do questions come from?', a: 'Sampled from recent ACT®-style practice material (JSON for now, API-ready later).' },
  { q: 'Can I practice on my phone?', a: 'Absolutely. The UI is fully responsive.' },
]

export default function Landing() {
  return (
    <div className="py-16 relative overflow-hidden">
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
      <div className="container grid place-items-center relative z-10">
        <div className="max-w-4xl text-center backdrop-blur-md">
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
            className="mt-10 flex items-center justify-center gap-4" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
          >
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
                Click Here To Get Started!
              </motion.div>
            </Link>
            <a href="#features" className="btn btn-ghost text-lg px-6 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
              See features
            </a>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="container mt-20">
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
      <div className="container mt-20">
        <motion.div 
          className="card p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <motion.div 
              className="text-4xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              🚀
            </motion.div>
            <BlurText
              text="Why This Beats Traditional Test Prep"
              className="text-3xl font-bold text-high-contrast-bold text-shadow-lg"
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
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                >
                  ⚡
                </motion.div>
                <div>
                  <h4 className="font-semibold text-lg">Quick Wins</h4>
                  <p className="text-secondary">Chunk your practice into bite-sized sessions instead of exhausting marathons.</p>
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
                  transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                >
                  🎯
                </motion.div>
                <div>
                  <h4 className="font-semibold text-lg">Instant Feedback</h4>
                  <p className="text-secondary">Learn from mistakes immediately and stay motivated with real-time results.</p>
                </div>
              </motion.div>
            </div>
            <div className="space-y-4">
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                >
                  ✨
                </motion.div>
                <div>
                  <h4 className="font-semibold text-lg">Engaging Experience</h4>
                  <p className="text-secondary">Smooth animations and sounds make learning feel rewarding, not stressful.</p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div 
                  className="text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                >
                  🎨
                </motion.div>
                <div>
                  <h4 className="font-semibold text-lg">Distraction-Free</h4>
                  <p className="text-secondary">Clean design with light/dark themes helps you focus on what matters.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQs */}
      <div className="container mt-16">
        <h3 className="text-2xl font-semibold mb-4">FAQs</h3>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.05 }} className="card">
              <Accordion title={f.q}>{f.a}</Accordion>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800">
                  <div className="container py-6 text-sm text-secondary flex items-center justify-between">
          <div>© 2025 TestPrep Pro — All rights reserved.</div>
          <div className="opacity-80">Made with React, Tailwind CSS, and Framer Motion.</div>
        </div>
      </footer>
    </div>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="px-4 py-3">
      <button
        className="w-full text-left py-1 text-lg font-medium flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="mt-2 text-secondary">{children}</p>
      </motion.div>
    </div>
  )
}


