import { motion } from 'framer-motion'
import { Brain } from '@phosphor-icons/react'

type BrainAnimationProps = {
  isThinking: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function BrainAnimation({ isThinking, size = 'md' }: BrainAnimationProps) {
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

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={isThinking ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {
          scale: 1,
          rotate: 0
        }}
        transition={isThinking ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {
          duration: 0.3
        }}
        className={`${sizeClasses[size]} bg-gradient-to-br from-[#facc15] to-[#eab308] rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
                 <Brain className={`${iconSizes[size]} text-white`} weight="fill" />
        
        {/* Thinking particles */}
        {isThinking && (
          <>
            {[...Array(3)].map((_, i) => (
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
                  x: Math.cos(i * 120 * Math.PI / 180) * 30,
                  y: Math.sin(i * 120 * Math.PI / 180) * 30
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
                className="absolute w-1 h-1 bg-[#ffeaa7] rounded-full"
              />
            ))}
          </>
        )}
      </motion.div>
      
      {/* Thinking text */}
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          Thinking...
        </motion.div>
      )}
    </div>
  )
}
