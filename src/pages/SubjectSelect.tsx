import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const subjects = [
  { id: 'english', title: 'English', color: 'from-rose-400 to-rose-600', blurb: 'Grammar, usage, punctuation, and rhetorical skills.' },
  { id: 'math', title: 'Math', color: 'from-emerald-400 to-emerald-600', blurb: 'Algebra, geometry, functions, and number sense.' },
  { id: 'reading', title: 'Reading', color: 'from-emerald-400 to-emerald-600', blurb: 'Comprehension, inference, and author’s purpose.' },
  { id: 'science', title: 'Science', color: 'from-teal-400 to-teal-600', blurb: 'Data interpretation, experiment design, and reasoning.' },
]

export default function SubjectSelect() {
  return (
    <div className="container">
              <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose a subject</h2>
          <p className="text-secondary text-lg">Pick what you want to practice today</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {subjects.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/timer/${s.id}`} className="block group">
              <div className="card overflow-hidden hover:shadow-xl transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className={`h-28 bg-gradient-to-br ${s.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity brand-gradient" />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{s.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Recent ACT practice</p>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 text-2xl">→</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{s.blurb}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">Timed</span>
                    <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">Instant feedback</span>
                    <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">Mobile</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Full test card */}
      <div className="mt-8">
        <Link to="/full-test-setup" className="block group">
          <div className="card overflow-hidden hover:shadow-lg transition-all">
            <div className="h-24 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200" />
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Full Test</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">All 4 sections in one timed run</p>
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 text-2xl">→</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}


