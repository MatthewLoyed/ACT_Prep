import { motion } from 'framer-motion'

interface GoalTrackingSectionProps {
  goal: number
  currentScore: number | null
  estimatedScore: number
  onGoalChange?: (newGoal: number) => void
}

export default function GoalTrackingSection({ 
  goal, 
  currentScore, 
  estimatedScore, 
  onGoalChange 
}: GoalTrackingSectionProps) {
  const displayScore = currentScore || estimatedScore
  const progressPercentage = Math.min(100, (displayScore / goal) * 100)

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGoal = Number(e.target.value)
    if (newGoal >= 1 && newGoal <= 36 && onGoalChange) {
      onGoalChange(newGoal)
    }
  }

  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎯 Your Goal</h2>
          <p className="text-secondary">Aim high and track your momentum.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            min={1} 
            max={36} 
            value={goal} 
            onChange={handleGoalChange}
            className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900" 
          />
          <span className="text-sm">/ 36</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="h-3 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 text-sm text-secondary">
          {currentScore ? 'Current ACT® vs goal' : 'Estimated ACT® vs goal'}
        </div>
        <div className="mt-1 text-lg font-bold text-[var(--color-accent)]">
          {displayScore} / {goal}
        </div>
      </div>
    </motion.div>
  )
}
