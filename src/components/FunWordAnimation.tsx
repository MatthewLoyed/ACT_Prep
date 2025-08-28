import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface FunWordAnimationProps {
  className?: string
}

export default function FunWordAnimation({ className = "" }: FunWordAnimationProps) {
  const [currentWord, setCurrentWord] = useState("fun")
  
  // Word replacement animation
  useEffect(() => {
    const words = ["fun", "fast", "free", "fun"]
    let index = 0
    
    const interval = setInterval(() => {
      index = (index + 1) % words.length
      setCurrentWord(words[index])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.span
      className={`inline-block ${className}`}
      key={currentWord}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        textShadow: '0 0 20px rgba(255, 234, 167, 0.8), 0 0 40px rgba(102, 126, 234, 0.6)'
      }}
      whileHover={{
        textShadow: '0 0 30px rgba(255, 234, 167, 1), 0 0 60px rgba(102, 126, 234, 0.8)',
        scale: 1.05
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut"
      }}
    >
      {currentWord}
    </motion.span>
  )
}
