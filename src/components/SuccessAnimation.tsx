
import { motion } from 'framer-motion'

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
}

export default function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  const successIcons = ['⭐', '🎯', '🏆', '💯', '🚀', '✨']

  return (
    <>
      {show && (
        <>
          {/* Green Border Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            initial={{ 
              boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)'
            }}
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0)',
                '0 0 30px 4px rgba(34, 197, 94, 0.8)',
                '0 0 50px 6px rgba(34, 197, 94, 0.6)',
                '0 0 20px 2px rgba(34, 197, 94, 0.3)',
                '0 0 0 0 rgba(34, 197, 94, 0)'
              ]
            }}
            transition={{ 
              duration: 2,
              ease: "easeOut",
              times: [0, 0.2, 0.5, 0.8, 1]
            }}
          />
          
          {/* Floating Success Icons */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {successIcons.map((icon, i) => {
              // Generate random positions within the container area
              const randomX = Math.random() * 80 - 40 // -40% to +40%
              const randomY = Math.random() * 80 - 40 // -40% to +40%
              
              return (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    y: 50
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1.2, 0.8, 0],
                    y: [50, -20, 0, -30]
                  }}
                  transition={{ 
                    duration: 1.2,
                    delay: 0.5 + i * 0.15,
                    ease: "easeOut",
                    times: [0, 0.3, 0.7, 1]
                  }}
                  onAnimationComplete={() => {
                    // Call onComplete when the last icon finishes animating
                    if (i === successIcons.length - 1 && onComplete) {
                      setTimeout(onComplete, 100)
                    }
                  }}
                  className="absolute text-2xl"
                  style={{
                    left: `${50 + randomX}%`,
                    top: `${50 + randomY}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {icon}
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
