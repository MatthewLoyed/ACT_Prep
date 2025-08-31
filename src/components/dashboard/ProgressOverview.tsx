import { motion } from 'framer-motion'
import ProgressCircle from '../ProgressCircle'

interface ProgressOverviewProps {
  improvementPoints: number
  subject: string
  timeFrame: string
  currentProgress: number
  targetProgress: number
}

export default function ProgressOverview({ 
  improvementPoints, 
  subject, 
  timeFrame, 
  currentProgress, 
  targetProgress 
}: ProgressOverviewProps) {
  const progressPercentage = Math.round((currentProgress / targetProgress) * 100)
  
  // Determine motivational message based on improvement
  const getMotivationalMessage = () => {
    if (improvementPoints >= 5) {
      return `Amazing! You've improved ${improvementPoints} points in ${subject} this ${timeFrame}! 🚀`
    } else if (improvementPoints >= 3) {
      return `Great work! You've improved ${improvementPoints} points in ${subject} this ${timeFrame}! 📈`
    } else if (improvementPoints >= 1) {
      return `Good progress! You've improved ${improvementPoints} point${improvementPoints > 1 ? 's' : ''} in ${subject} this ${timeFrame}! 💪`
    } else {
      return `Keep practicing! Every session brings you closer to your goal in ${subject}! 🎯`
    }
  }



  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">📈 Progress Overview</h2>
        <div className="flex items-center gap-2">
                     <ProgressCircle 
             progress={progressPercentage}
             size="lg"
             color="blue"
           />
          <span className="text-sm font-semibold text-secondary">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Motivational Message */}
      <motion.div 
        className="bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-primary)]/20 rounded-lg p-4 mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="text-lg font-semibold text-[var(--color-accent)]">
          {getMotivationalMessage()}
        </p>
      </motion.div>

      {/* Progress Chart Placeholder */}
      <motion.div 
        className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 via-[var(--color-primary)]/10 to-[var(--color-accent)]/10 animate-pulse"></div>
        
        <div className="relative z-10 text-center">
          <p className="text-secondary mb-2">📊 Progress Chart</p>
          <p className="text-sm text-secondary opacity-75">
            Interactive chart coming soon...
          </p>
        </div>
      </motion.div>

      {/* Progress Stats */}
      <motion.div 
        className="grid grid-cols-2 gap-4 mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-[var(--color-primary)]">
            {currentProgress}
          </div>
          <div className="text-sm text-secondary">Current</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-lg font-bold text-[var(--color-accent)]">
            {targetProgress}
          </div>
          <div className="text-sm text-secondary">Target</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
