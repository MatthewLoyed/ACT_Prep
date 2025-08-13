import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Trophy, 
  Target, 
  Lightbulb
} from '@phosphor-icons/react'

type StudyBuddyProps = {
  streak: number
  isCorrect: boolean
  showMessage: boolean
  onMessageComplete: () => void
  persistent?: boolean
}

const motivationalMessages = [
  "You're on fire! 🔥",
  "Keep that momentum going! 💪",
  "You're crushing it! 🎯",
  "Amazing work! 🌟",
  "You've got this! ✨",
  "Incredible focus! 🧠",
  "You're unstoppable! 🚀",
  "Perfect streak! 🏆",
  "You're learning so fast! 📚",
  "Outstanding! 🌈",
  "Your brain is growing! 🧠✨",
  "You're becoming unstoppable! 💫"
]

const celebrationMessages = [
  "YES! That's the way! 🎉",
  "BOOM! Perfect answer! 💥",
  "WOW! You nailed it! ⭐",
  "FANTASTIC! Keep going! 🚀",
  "INCREDIBLE! You're amazing! 🌟"
]

export default function StudyBuddy({ streak, isCorrect, showMessage, onMessageComplete, persistent = false }: StudyBuddyProps) {
  const [currentMessage, setCurrentMessage] = useState('')
  const [isCelebrating, setIsCelebrating] = useState(false)

  useEffect(() => {
    if (showMessage && isCorrect) {
      setIsCelebrating(true)
      const message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
      setCurrentMessage(message)
      
      setTimeout(() => {
        setIsCelebrating(false)
        onMessageComplete()
      }, 3000)
    } else if (streak >= 3 && showMessage) {
      const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      setCurrentMessage(message)
      
      setTimeout(() => {
        onMessageComplete()
      }, 3000)
    }
  }, [showMessage, isCorrect, streak, onMessageComplete])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {(showMessage || persistent) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
            className="relative"
          >
                         {/* Study Buddy Character */}
             <motion.div
               animate={isCelebrating ? {
                 rotate: [0, -10, 10, -10, 0],
                 scale: [1, 1.1, 1]
               } : {
                 y: [0, -5, 0]
               }}
               transition={isCelebrating ? {
                 duration: 0.6,
                 repeat: 2
               } : {
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
                               className={`${persistent ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white cursor-pointer hover:scale-110 transition-transform`}
               onClick={() => {
                 if (persistent) {
                   setCurrentMessage("Keep going! You're doing great! 💪")
                   setTimeout(() => setCurrentMessage(''), 2000)
                 }
               }}
             >
                             {isCelebrating ? (
                 <Trophy className={`${persistent ? 'w-8 h-8' : 'w-10 h-10'} text-yellow-300`} weight="fill" />
               ) : streak >= 5 ? (
                 <Brain className={`${persistent ? 'w-8 h-8' : 'w-10 h-10'} text-white`} weight="fill" />
               ) : streak >= 3 ? (
                 <Target className={`${persistent ? 'w-8 h-8' : 'w-10 h-10'} text-white`} weight="fill" />
               ) : (
                 <Lightbulb className={`${persistent ? 'w-8 h-8' : 'w-10 h-10'} text-white`} weight="fill" />
               )}
            </motion.div>

                         {/* Speech Bubble */}
             {(currentMessage || persistent) && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.8, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 transition={{ delay: 0.2, duration: 0.3 }}
                 className="absolute bottom-full right-0 mb-3 bg-white dark:bg-slate-800 rounded-3xl px-6 py-2 shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm min-w-[200px]"
               >
                 <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
                   {currentMessage || (persistent && streak === 0 ? "Ready to help you study! 📚" : "")}
                 </div>
                 
                                   {/* Thought bubble circles */}
                  <div className="absolute top-full right-4 w-2 h-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"></div>
                  <div className="absolute top-full right-6 w-1 h-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"></div>
                  <div className="absolute top-full right-7 w-0.5 h-0.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"></div>
               </motion.div>
             )}

            {/* Particle effects for celebration */}
            {isCelebrating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 1, 
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{
                      opacity: [1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos(i * 45 * Math.PI / 180) * 60,
                      y: Math.sin(i * 45 * Math.PI / 180) * 60
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
