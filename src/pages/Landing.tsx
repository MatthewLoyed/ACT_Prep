import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'

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
    <div className="py-16">
      {/* Hero */}
      <div className="container grid place-items-center">
        <div className="max-w-4xl text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            ACT® prep that feels fun
          </motion.h1>
          <motion.p
            className="mt-6 text-xl text-slate-600 dark:text-slate-300 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Skip the stale PDFs. Practice one question at a time with lively feedback, a clean UI, and smooth microanimations.
          </motion.p>
          <motion.div 
            className="mt-10 flex items-center justify-center gap-4" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link to="/import" className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              Import A Test & Start Practicing!
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
          className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent"
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
                <div className="text-3xl p-2 rounded-xl bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-900 dark:to-purple-900">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why better */}
      <div className="container mt-20">
        <motion.div 
          className="card p-8 bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950 dark:to-purple-950 border border-sky-200 dark:border-sky-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              Why This Beats Traditional Test Prep
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <h4 className="font-semibold text-lg">Quick Wins</h4>
                  <p className="text-slate-600 dark:text-slate-300">Chunk your practice into bite-sized sessions instead of exhausting marathons.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-lg">Instant Feedback</h4>
                  <p className="text-slate-600 dark:text-slate-300">Learn from mistakes immediately and stay motivated with real-time results.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <h4 className="font-semibold text-lg">Engaging Experience</h4>
                  <p className="text-slate-600 dark:text-slate-300">Smooth animations and sounds make learning feel rewarding, not stressful.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎨</div>
                <div>
                  <h4 className="font-semibold text-lg">Distraction-Free</h4>
                  <p className="text-slate-600 dark:text-slate-300">Clean design with light/dark themes helps you focus on what matters.</p>
                </div>
              </div>
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
        <div className="container py-6 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-between">
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
        <p className="mt-2 text-slate-600 dark:text-slate-300">{children}</p>
      </motion.div>
    </div>
  )
}


