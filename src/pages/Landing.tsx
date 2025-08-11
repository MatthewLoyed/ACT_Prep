import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'

const features = [
  { title: 'Instant feedback', desc: 'Hear and see if you’re right, immediately.', icon: '✅' },
  { title: 'Real questions', desc: 'Practice with recent ACT-style questions.', icon: '📝' },
  { title: 'Smart timer', desc: 'Custom countdown with a friendly time’s-up cue.', icon: '⏱️' },
  { title: 'Smooth animations', desc: 'Microinteractions that keep you focused.', icon: '✨' },
]

const faqs = [
  { q: 'Is this free?', a: 'Yes. Your practice data stays in your browser.' },
  { q: 'Where do questions come from?', a: 'Sampled from recent ACT-style practice material (JSON for now, API-ready later).' },
  { q: 'Can I practice on my phone?', a: 'Absolutely. The UI is fully responsive.' },
]

export default function Landing() {
  return (
    <div className="py-10">
      {/* Hero */}
      <div className="container grid place-items-center">
        <div className="max-w-3xl text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            ACT prep that feels fun
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-slate-600 dark:text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Skip the stale PDFs. Practice one question at a time with lively feedback, a clean UI, and smooth microanimations.
          </motion.p>
          <motion.div className="mt-8 flex items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link to="/subjects" className="btn btn-primary text-lg px-6 py-3">Start practicing</Link>
            <a href="#features" className="btn btn-ghost text-lg px-6 py-3">See features</a>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="container mt-16 grid gap-4 md:grid-cols-2">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Why better */}
      <div className="container mt-16 card p-6">
        <h3 className="text-2xl font-semibold">Why this is better than “just taking a test”</h3>
        <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300">
          <li>Chunk your practice into quick wins instead of long, exhausting sessions.</li>
          <li>Instant feedback reinforces learning and keeps motivation high.</li>
          <li>Microanimations and sounds make it feel rewarding, not stressful.</li>
          <li>Light/dark themes and a distraction-free layout help you focus.</li>
        </ul>
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
          <div>© 2025 ACT Prep — All rights reserved.</div>
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


