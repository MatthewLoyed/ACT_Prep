import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Upload, Play, ChartLineUp } from '@phosphor-icons/react'

interface QuickActionsProps {
  onImportClick?: () => void
  onPracticeClick?: () => void
  onStatsClick?: () => void
}

export default function QuickActions({ 
  onImportClick, 
  onPracticeClick, 
  onStatsClick 
}: QuickActionsProps) {
  const navigate = useNavigate()

  const handleImport = () => {
    if (onImportClick) {
      onImportClick()
    } else {
      navigate('/import')
    }
  }

  const handlePractice = () => {
    if (onPracticeClick) {
      onPracticeClick()
    } else {
      navigate('/practice')
    }
  }

  const handleStats = () => {
    if (onStatsClick) {
      onStatsClick()
    } else {
      navigate('/history')
    }
  }

  const actions = [
    {
      label: 'Import New Test',
      icon: Upload,
      onClick: handleImport,
      primary: true,
      description: 'Upload a new ACT practice test'
    },
    {
      label: 'Practice Now',
      icon: Play,
      onClick: handlePractice,
      primary: false,
      description: 'Start practicing with your tests'
    },
    {
      label: 'View Detailed Stats',
      icon: ChartLineUp,
      onClick: handleStats,
      primary: false,
      description: 'See your progress analytics'
    }
  ]

  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4">⚡ Quick Actions</h2>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            className={`btn w-full flex items-center gap-3 justify-start ${
              action.primary ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={action.onClick}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <action.icon 
              size={20} 
              weight={action.primary ? "fill" : "regular"}
              className={action.primary ? "text-white" : "text-[var(--color-accent)]"}
            />
            <div className="text-left">
              <div className="font-semibold">{action.label}</div>
              <div className="text-xs opacity-75">{action.description}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick Tips */}
      <motion.div 
        className="mt-6 p-4 bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-primary)]/10 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <h3 className="font-semibold text-[var(--color-accent)] mb-2">
          💡 Quick Tip
        </h3>
        <p className="text-sm text-secondary">
          Regular practice sessions of 20-30 minutes are more effective than long, infrequent study sessions.
        </p>
      </motion.div>
    </motion.div>
  )
}
