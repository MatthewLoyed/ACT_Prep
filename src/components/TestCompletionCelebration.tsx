import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Brain, 
  Target, 
  CheckCircle,
  ArrowRight,
  Play
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

type TestCompletionCelebrationProps = {
  show: boolean
  onComplete: () => void
  onReview: () => void
  subject: string
  totalQuestions: number
  correctAnswers: number
  timeSpent?: string
}

export default function TestCompletionCelebration({ 
  show, 
  onComplete, 
  onReview,
  subject,
  totalQuestions,
  correctAnswers,
  timeSpent
}: TestCompletionCelebrationProps) {
  console.log('TestCompletionCelebration props:', { show, subject, totalQuestions, correctAnswers })
  const [showConfetti, setShowConfetti] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const score = correctAnswers

  useEffect(() => {
    if (show) {
      // Sequence the animations
      setShowConfetti(true)
      setShowStats(true)
      setShowActions(true) // Show buttons immediately for testing
    } else {
      setShowConfetti(false)
      setShowStats(false)
      setShowActions(false)
    }
  }, [show])

  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! You're a master! 🏆"
    if (percentage >= 80) return "Excellent work! You're crushing it! 💪"
    if (percentage >= 70) return "Great job! You're on fire! 🔥"
    if (percentage >= 60) return "Good work! Keep improving! 📈"
    if (percentage >= 50) return "Not bad! Practice makes perfect! ✨"
    return "Keep practicing! You'll get better! 💪"
  }

  const getScoreColor = () => {
    if (percentage >= 90) return "from-yellow-400 to-yellow-600"
    if (percentage >= 80) return "from-emerald-400 to-emerald-600"
    if (percentage >= 70) return "from-blue-400 to-blue-600"
    if (percentage >= 60) return "from-purple-400 to-purple-600"
    if (percentage >= 50) return "from-orange-400 to-orange-600"
    return "from-red-400 to-red-600"
  }

  const getScoreIcon = () => {
    if (percentage >= 90) return <Trophy className="w-16 h-16 text-yellow-300" weight="fill" />
    if (percentage >= 80) return <Star className="w-16 h-16 text-emerald-300" weight="fill" />
    if (percentage >= 70) return <Brain className="w-16 h-16 text-yellow-300" weight="fill" />
    if (percentage >= 60) return <Target className="w-16 h-16 text-purple-300" weight="fill" />
    if (percentage >= 50) return <CheckCircle className="w-16 h-16 text-orange-300" weight="fill" />
    return <Target className="w-16 h-16 text-red-300" weight="fill" />
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    y: -10, 
                    x: Math.random() * window.innerWidth,
                    rotate: 0
                  }}
                  animate={{
                    opacity: [1, 0],
                    y: window.innerHeight + 100,
                    x: Math.random() * window.innerWidth,
                    rotate: 360
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px'
                  }}
                />
              ))}
            </div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden mx-auto"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full"></div>
            </div>

            {/* Trophy/Icon Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", delay: 0.3 }}
              className="mb-6 flex justify-center"
            >
              {getScoreIcon()}
            </motion.div>

            {/* Completion Message */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Test Complete! 🎉
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-white/80 text-lg mb-6"
            >
              {subject.toUpperCase()} Test
            </motion.p>

            {/* Score Display */}
            {showStats && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-6"
              >
                <div className={`bg-gradient-to-r ${getScoreColor()} rounded-2xl p-6 text-white mb-4`}>
                  <div className="text-4xl font-bold mb-2">
                    {score}/{totalQuestions}
                  </div>
                  <div className="text-2xl font-semibold mb-2">
                    {percentage}%
                  </div>
                  <div className="text-sm opacity-90">
                    {getScoreMessage()}
                  </div>
                </div>

                {timeSpent && (
                  <div className="text-white/70 text-sm">
                    Time: {timeSpent}
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="text-white text-xs mb-2">Debug: Buttons should be visible</div>
            )}
            {showActions && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-3 relative z-10"
              >
                <button
                  onClick={() => {
                    console.log('Review button clicked')
                    onReview()
                  }}
                                     className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-800 font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play weight="fill" />
                  Review Test
                </button>
                
                <button
                  onClick={() => {
                    console.log('Continue button clicked')
                    onComplete()
                  }}
                  className="w-full bg-white/20 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight weight="bold" />
                  Continue
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
