import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Target
} from '@phosphor-icons/react'

type ProgressCircleProps = {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  label?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
  animated?: boolean
}

export default function ProgressCircle({ 
  progress, 
  size = 'md', 
  showIcon = false,
  label,
  color = 'blue',
  animated = true
}: ProgressCircleProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const strokeWidth = {
    sm: 3,
    md: 4,
    lg: 6
  }

  const radius = {
    sm: 26,
    md: 40,
    lg: 58
  }

  const circumference = 2 * Math.PI * radius[size]
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const colorClasses = {
    blue: 'stroke-emerald-500',
    green: 'stroke-teal-500',
    purple: 'stroke-cyan-500',
    orange: 'stroke-orange-500'
  }

  const bgColorClasses = {
    blue: 'bg-emerald-50 dark:bg-emerald-900/20',
    green: 'bg-teal-50 dark:bg-teal-900/20',
    purple: 'bg-cyan-50 dark:bg-cyan-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20'
  }

  const iconColorClasses = {
    blue: 'text-emerald-600',
    green: 'text-teal-600',
    purple: 'text-cyan-600',
    orange: 'text-orange-600'
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Background circle */}
        <svg
          className={`${sizeClasses[size]} transform -rotate-90`}
          viewBox={`0 0 ${radius[size] * 2 + strokeWidth[size]} ${radius[size] * 2 + strokeWidth[size]}`}
        >
          <circle
            cx={radius[size] + strokeWidth[size] / 2}
            cy={radius[size] + strokeWidth[size] / 2}
            r={radius[size]}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
        </svg>

        {/* Progress circle */}
        <motion.svg
          className={`${sizeClasses[size]} absolute transform -rotate-90`}
          viewBox={`0 0 ${radius[size] * 2 + strokeWidth[size]} ${radius[size] * 2 + strokeWidth[size]}`}
        >
          <motion.circle
            cx={radius[size] + strokeWidth[size] / 2}
            cy={radius[size] + strokeWidth[size] / 2}
            r={radius[size]}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            className={colorClasses[color]}
            strokeLinecap="round"
            initial={animated ? { strokeDasharray, strokeDashoffset: circumference } : undefined}
            animate={animated ? { strokeDashoffset } : undefined}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray,
              strokeDashoffset: animated ? undefined : strokeDashoffset
            }}
          />
        </motion.svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showIcon ? (
            <motion.div
              initial={animated ? { scale: 0, opacity: 0 } : undefined}
              animate={animated ? { scale: 1, opacity: 1 } : undefined}
              transition={{ delay: 0.5, duration: 0.3 }}
              className={`${iconColorClasses[color]} ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'}`}
            >
                             {progress >= 100 ? (
                 <CheckCircle className="w-full h-full" weight="fill" />
               ) : (
                 <Target className="w-full h-full" weight="fill" />
               )}
            </motion.div>
          ) : (
            <motion.div
              initial={animated ? { scale: 0, opacity: 0 } : undefined}
              animate={animated ? { scale: 1, opacity: 1 } : undefined}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-center"
            >
              <div className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'} ${colorClasses[color].replace('stroke-', 'text-')}`}>
                {Math.round(progress)}%
              </div>
            </motion.div>
          )}
        </div>

        {/* Pulse effect for high progress */}
        {progress >= 80 && animated && (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute inset-0 rounded-full ${bgColorClasses[color]} -z-10`}
          />
        )}
      </div>

      {/* Label */}
      {label && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-2 text-center"
        >
          <div className={`text-sm font-medium ${colorClasses[color].replace('stroke-', 'text-')}`}>
            {label}
          </div>
        </motion.div>
      )}
    </div>
  )
}
