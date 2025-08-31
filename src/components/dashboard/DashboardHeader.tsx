import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedCounter from '../AnimatedCounter'

type DashboardStats = {
  currentGoal: number
  recentScore: number
  actScoreGoal: number
}

interface DashboardHeaderProps {
  stats: DashboardStats
}

export default function DashboardHeader({ stats }: DashboardHeaderProps) {
  const { user } = useAuth()

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-center mb-8"
    >
      {/* Welcome Message */}
      <motion.h1 
        className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Welcome back, {user?.email?.split('@')[0]}! 👋
      </motion.h1>
      
      <motion.p 
        className="text-xl text-secondary max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Here's your progress and what you can work on next
      </motion.p>

      {/* Quick Stats Row */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Current Goal */}
        <motion.div 
          className="card p-6 text-center hover:scale-105 transition-transform duration-200"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-[var(--color-accent)] mb-2">
                         <AnimatedCounter 
               value={stats.currentGoal} 
               fontSize={24}
               textColor="var(--color-accent)"
               fontWeight="bold"
             />
          </div>
          <div className="text-secondary font-medium">Current Goal</div>
        </motion.div>

        {/* Recent Score */}
        <motion.div 
          className="card p-6 text-center hover:scale-105 transition-transform duration-200"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                         <AnimatedCounter 
               value={stats.recentScore} 
               fontSize={24}
               textColor="var(--color-primary)"
               fontWeight="bold"
             />
          </div>
          <div className="text-secondary font-medium">Recent Score</div>
        </motion.div>

        {/* ACT Score Goal */}
        <motion.div 
          className="card p-6 text-center hover:scale-105 transition-transform duration-200"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-[var(--color-accent)] mb-2">
                         <AnimatedCounter 
               value={stats.actScoreGoal} 
               fontSize={24}
               textColor="var(--color-accent)"
               fontWeight="bold"
             />
          </div>
          <div className="text-secondary font-medium">ACT Score Goal</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
