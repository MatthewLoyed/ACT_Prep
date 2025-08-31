import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowUp, ArrowDown } from '@phosphor-icons/react'

type RecentSession = {
  id: string
  testName: string
  section: string
  score: number
  total: number
  percentage: number
  date: string
}

interface RecentSessionsProps {
  sessions: RecentSession[]
  maxDisplay?: number
}

export default function RecentSessions({ sessions, maxDisplay = 3 }: RecentSessionsProps) {
  const navigate = useNavigate()
  
  const displayedSessions = sessions.slice(0, maxDisplay)
  const hasMoreSessions = sessions.length > maxDisplay

  const handleViewAll = () => {
    navigate('/history')
  }

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) {
      return <ArrowUp size={16} weight="fill" className="text-green-500" />
    } else if (percentage >= 60) {
      return <ArrowUp size={16} weight="fill" className="text-blue-500" />
    } else {
      return <ArrowDown size={16} weight="fill" className="text-red-500" />
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-blue-500'
    if (percentage >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">📊 Recent Sessions</h2>
        <div className="text-sm text-secondary">
          {sessions.length} total
        </div>
      </div>

      {displayedSessions.length > 0 ? (
        <div className="space-y-3">
          {displayedSessions.map((session, index) => (
            <motion.div 
              key={session.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--color-primary)]">
                    {session.section}
                  </p>
                  {getPerformanceIcon(session.percentage)}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Clock size={14} />
                  <span>{session.date}</span>
                </div>
                <p className="text-xs text-secondary mt-1 truncate">
                  {session.testName}
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <p className="font-semibold">
                    {session.score}/{session.total}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${getPerformanceColor(session.percentage)}`}>
                  {session.percentage}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Clock size={24} className="text-secondary" />
          </div>
          <p className="text-secondary mb-2">No recent sessions</p>
          <p className="text-sm text-secondary opacity-75">
            Start practicing to see your session history
          </p>
        </motion.div>
      )}

      {/* View All Button */}
      {hasMoreSessions && (
        <motion.button 
          className="btn btn-ghost w-full mt-4"
          onClick={handleViewAll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View All Sessions ({sessions.length})
        </motion.button>
      )}

      {/* Quick Stats */}
      {sessions.length > 0 && (
        <motion.div 
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[var(--color-primary)]">
                {Math.round(sessions.reduce((acc, s) => acc + s.percentage, 0) / sessions.length)}
              </div>
              <div className="text-xs text-secondary">Avg Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--color-accent)]">
                {sessions.length}
              </div>
              <div className="text-xs text-secondary">Sessions</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
