import { motion } from 'framer-motion'

interface StatsOverviewSectionProps {
  currentActScore: number | null
  estimatedActScore: number
  questionsPracticed: number
  testsImported: number
  totalQuestionsAvailable: number
  totalPracticeTime: number
  averageSessionTime: number
}

export default function StatsOverviewSection({
  currentActScore,
  estimatedActScore,
  questionsPracticed,
  testsImported,
  totalQuestionsAvailable,
  totalPracticeTime,
  averageSessionTime
}: StatsOverviewSectionProps) {
  const displayActScore = currentActScore || estimatedActScore

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="text-sm text-secondary">
            {currentActScore ? 'Current ACT® Score' : 'Overall ACT® (est.)'}
          </div>
          <div className="text-4xl font-bold text-[var(--color-accent)]">
            {displayActScore} / 36
          </div>
        </motion.div>
        
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="text-sm text-secondary">Questions practiced</div>
          <div className="text-4xl font-bold text-[var(--color-primary)]">{questionsPracticed}</div>
        </motion.div>
        
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3 }}
        >
          <div className="text-sm text-secondary">Tests imported</div>
          <div className="text-4xl font-bold text-[var(--color-accent)]">{testsImported}</div>
        </motion.div>
        
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="text-sm text-secondary">Total questions available</div>
          <div className="text-4xl font-bold text-[var(--color-primary)]">{totalQuestionsAvailable}</div>
        </motion.div>
      </motion.div>

      {/* Time Stats */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      >
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 }}
        >
          <div className="text-sm text-secondary">Total practice time</div>
          <div className="text-4xl font-bold text-[var(--color-accent)]">{Math.round(totalPracticeTime / 60)} min</div>
        </motion.div>
        
        <motion.div 
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.7 }}
        >
          <div className="text-sm text-secondary">Average per session</div>
          <div className="text-4xl font-bold text-[var(--color-primary)]">{Math.round(averageSessionTime / 60)} min</div>
        </motion.div>
      </motion.div>
    </div>
  )
}
