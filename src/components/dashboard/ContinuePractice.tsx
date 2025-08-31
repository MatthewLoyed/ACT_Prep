import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ArrowClockwise } from '@phosphor-icons/react'

type ContinuePracticeData = {
  testId: string
  testName: string
  currentQuestion: number
  totalQuestions: number
  section: string
}

interface ContinuePracticeProps {
  continuePractice: ContinuePracticeData | null
  onStartPractice?: () => void
}

export default function ContinuePractice({ continuePractice, onStartPractice }: ContinuePracticeProps) {
  const navigate = useNavigate()

  const handleResume = () => {
    if (continuePractice) {
      // Navigate to the appropriate practice page based on section
      navigate(`/test-selection/${continuePractice.testId}`)
    }
  }

  const handleStartPractice = () => {
    if (onStartPractice) {
      onStartPractice()
    } else {
      navigate('/practice')
    }
  }

  const progressPercentage = continuePractice 
    ? (continuePractice.currentQuestion / continuePractice.totalQuestions) * 100 
    : 0

  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-4">🎯 Continue Practice</h2>
      
      {continuePractice ? (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Test Info and Resume Button */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                {continuePractice.testName}
              </h3>
              <p className="text-secondary">
                {continuePractice.section} • Question {continuePractice.currentQuestion} of {continuePractice.totalQuestions}
              </p>
            </div>
            <motion.button 
              className="btn btn-primary flex items-center gap-2"
              onClick={handleResume}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowClockwise 
                size={20} 
                weight="bold"
                style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
              />
              Resume
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Progress</span>
              <span className="font-semibold text-[var(--color-accent)]">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-primary)]">
                {continuePractice.currentQuestion}
              </div>
              <div className="text-xs text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-accent)]">
                {continuePractice.totalQuestions - continuePractice.currentQuestion}
              </div>
              <div className="text-xs text-secondary">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-primary)]">
                {continuePractice.section}
              </div>
              <div className="text-xs text-secondary">Section</div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Play 
                size={24} 
                weight="fill" 
                className="text-[var(--color-accent)] ml-1"
              />
            </div>
            <p className="text-secondary mb-4">No active practice session</p>
            <p className="text-sm text-secondary opacity-75 mb-6">
              Start a new practice session to track your progress
            </p>
          </div>
          
          <motion.button 
            className="btn btn-primary flex items-center gap-2 mx-auto"
            onClick={handleStartPractice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={20} weight="fill" />
            Start Practicing
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
