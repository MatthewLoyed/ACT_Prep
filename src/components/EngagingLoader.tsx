import { motion } from 'framer-motion'
import { Brain } from '@phosphor-icons/react'

type EngagingLoaderProps = {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showThinking?: boolean
}

export default function EngagingLoader({ 
  message = "Processing...", 
  size = 'md',
  showThinking = true
}: EngagingLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Main brain animation */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`${sizeClasses[size]} bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
        <Brain className={`${iconSizes[size]} text-white`} weight="fill" />
        
        {/* Thinking particles */}
        {showThinking && (
          <>
            {[...Array(4)].map((_, i) => (
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
                  x: Math.cos(i * 90 * Math.PI / 180) * 25,
                  y: Math.sin(i * 90 * Math.PI / 180) * 25
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center"
      >
        <div className={`font-medium text-slate-700 dark:text-slate-300 ${textSizes[size]}`}>
          {message}
        </div>
        
        {/* Animated dots */}
        <motion.div className="flex justify-center space-x-1 mt-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
                             className="w-2 h-2 bg-emerald-500 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Ripple effect */}
      <motion.div
        animate={{
          scale: [1, 1.5, 2],
          opacity: [0.6, 0.3, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
        className="absolute w-12 h-12 border-2 border-emerald-400 rounded-full"
      />
    </div>
  )
}
