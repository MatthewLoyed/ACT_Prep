import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Star, 
  Sparkle
} from '@phosphor-icons/react'

type SuccessCelebrationProps = {
  show: boolean
  onComplete: () => void
  type?: 'correct' | 'streak' | 'milestone'
  message?: string
}

export default function SuccessCelebration({ 
  show, 
  onComplete, 
  type = 'correct',
  message 
}: SuccessCelebrationProps) {
  const getConfig = () => {
    switch (type) {
      case 'streak':
        return {
          icon: Star,
          color: 'from-emerald-400 to-teal-500',
          defaultMessage: 'Amazing streak!'
        }
      case 'milestone':
        return {
          icon: Sparkle,
          color: 'from-emerald-400 to-teal-500',
          defaultMessage: 'Milestone reached!'
        }
      default:
        return {
          icon: CheckCircle,
          color: 'from-green-400 to-emerald-500',
          defaultMessage: 'Correct!'
        }
    }
  }

  const config = getConfig()
  const IconComponent = config.icon
  const displayMessage = message || config.defaultMessage

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-40"
          onAnimationComplete={() => {
            setTimeout(onComplete, 2000)
          }}
        >
          {/* Success indicator */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 0.6,
                repeat: 1,
                ease: "easeInOut"
              }}
              className={`w-20 h-20 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white`}
            >
                             <IconComponent className="w-10 h-10 text-white" weight="fill" />
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-4 text-center"
            >
              <div className="text-white text-lg font-bold bg-black/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                {displayMessage}
              </div>
            </motion.div>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.05,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE66D', '#FF8E8E'][Math.floor(Math.random() * 7)]
              }}
            />
          ))}

          {/* Sparkle effects around the success indicator */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.cos(i * 45 * Math.PI / 180) * 80,
                y: Math.sin(i * 45 * Math.PI / 180) * 80
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-300 rounded-full"
            />
          ))}

          {/* Ripple effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
