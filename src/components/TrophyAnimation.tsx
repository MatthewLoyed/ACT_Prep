import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Sparkle
} from '@phosphor-icons/react'

type TrophyAnimationProps = {
  show: boolean
  onComplete: () => void
  type?: 'section' | 'streak' | 'perfect'
  size?: 'sm' | 'md' | 'lg'
}

export default function TrophyAnimation({ 
  show, 
  onComplete, 
  type = 'section',
  size = 'md' 
}: TrophyAnimationProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const getTrophyConfig = () => {
    switch (type) {
      case 'streak':
        return {
          icon: Star,
          color: 'from-emerald-400 to-teal-500',
          message: 'Amazing Streak!'
        }
      case 'perfect':
        return {
          icon: Sparkle,
          color: 'from-emerald-400 to-teal-500',
          message: 'Perfect Score!'
        }
      default:
        return {
          icon: Trophy,
          color: 'from-yellow-400 to-amber-500',
          message: 'Section Complete!'
        }
    }
  }

  const config = getTrophyConfig()
  const IconComponent = config.icon

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          onAnimationComplete={() => {
            setTimeout(onComplete, 2000)
          }}
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Trophy container */}
          <motion.div
            initial={{ y: 50, rotateY: -90 }}
            animate={{ y: 0, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="relative z-10"
          >
            {/* Trophy */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 1,
                repeat: 2,
                ease: "easeInOut"
              }}
              className={`${sizeClasses[size]} bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white relative overflow-hidden`}
            >
                             <IconComponent className={`${iconSizes[size]} text-white`} weight="fill" />
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
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
                    x: Math.cos(i * 60 * Math.PI / 180) * 40,
                    y: Math.sin(i * 60 * Math.PI / 180) * 40
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 bg-white rounded-full"
                />
              ))}
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-4 text-center"
            >
              <div className="text-white text-xl font-bold mb-2">
                {config.message}
              </div>
              <div className="text-white/80 text-sm">
                {type === 'streak' && 'You\'re on fire! 🔥'}
                {type === 'perfect' && 'Incredible work! 🌟'}
                {type === 'section' && 'Great job completing this section! 🎉'}
              </div>
            </motion.div>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
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
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
