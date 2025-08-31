import { motion } from 'framer-motion'

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  earnedAt?: string
}

interface AchievementsSectionProps {
  achievements: Achievement[]
  earnedCount: number
  totalCount: number
}

export default function AchievementsSection({ achievements, earnedCount, totalCount }: AchievementsSectionProps) {
  return (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">🏆 Achievements</h2>
          <p className="text-secondary">Celebrate your progress and milestones!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--color-accent)]">
            {`${earnedCount}/${totalCount}`}
          </div>
          <div className="text-sm text-secondary">Badges Earned</div>
        </div>
      </div>
      
      {achievements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={`${achievement.id}-${achievement.earnedAt || index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + (index * 0.1) }}
              className="bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-xl p-4 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--color-primary)]">{achievement.title}</h4>
                  <p className="text-sm text-secondary">{achievement.description}</p>
                  {achievement.earnedAt && (
                    <p className="text-xs text-[var(--color-accent)] mt-1">
                      Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-secondary">Complete your first question to earn your first achievement!</p>
        </motion.div>
      )}
    </motion.div>
  )
}
