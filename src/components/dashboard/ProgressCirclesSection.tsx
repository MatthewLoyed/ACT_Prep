import { motion } from 'framer-motion'
import ProgressCircle from '../ProgressCircle'

interface ProgressCirclesSectionProps {
  practiceProgress: number
  testCollection: number
  actScore: number
  studySessions: number
}

export default function ProgressCirclesSection({ 
  practiceProgress, 
  testCollection, 
  actScore, 
  studySessions 
}: ProgressCirclesSectionProps) {
  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <motion.div 
        className="card p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <ProgressCircle 
          progress={practiceProgress} 
          size="md" 
          color="blue"
          label="Practice Progress"
        />
      </motion.div>
      
      <motion.div 
        className="card p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
      >
        <ProgressCircle 
          progress={testCollection} 
          size="md" 
          color="green"
          label="Test Collection"
        />
      </motion.div>
      
      <motion.div 
        className="card p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0 }}
      >
        <ProgressCircle 
          progress={actScore} 
          size="md" 
          color="purple"
          label="ACT® Score"
        />
      </motion.div>
      
      <motion.div 
        className="card p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1 }}
      >
        <ProgressCircle 
          progress={studySessions} 
          size="md" 
          color="orange"
          label="Study Sessions"
        />
      </motion.div>
    </motion.div>
  )
}
