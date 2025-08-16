// Achievement system for the ACT prep app
export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  category: 'study' | 'performance' | 'consistency' | 'mastery'
  condition: (stats: UserStats) => boolean
  earnedAt?: string
}

export type UserStats = {
  totalQuestions: number
  totalSessions: number
  totalTime: number
  averageScore: number
  bestScore: number
  consecutiveDays: number
  testsImported: number
  sectionsCompleted: {
    english: number
    math: number
    reading: number
    science: number
  }
  perfectScores: number
  studyStreak: number
}

// Define all achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Study milestones
  {
    id: 'first-question',
    title: 'First Steps',
    description: 'Complete your first question',
    icon: '🎯',
    category: 'study',
    condition: (stats) => stats.totalQuestions >= 1
  },
  {
    id: 'question-master',
    title: 'Question Master',
    description: 'Complete 100 questions',
    icon: '📚',
    category: 'study',
    condition: (stats) => stats.totalQuestions >= 100
  },
  {
    id: 'dedicated-learner',
    title: 'Dedicated Learner',
    description: 'Complete 500 questions',
    icon: '🎓',
    category: 'study',
    condition: (stats) => stats.totalQuestions >= 500
  },
  {
    id: 'question-champion',
    title: 'Question Champion',
    description: 'Complete 1000 questions',
    icon: '🏆',
    category: 'study',
    condition: (stats) => stats.totalQuestions >= 1000
  },

  // Performance achievements
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Get 100% on any section',
    icon: '⭐',
    category: 'performance',
    condition: (stats) => stats.perfectScores >= 1
  },
  {
    id: 'high-achiever',
    title: 'High Achiever',
    description: 'Get 90% or higher on any section',
    icon: '🌟',
    category: 'performance',
    condition: (stats) => stats.bestScore >= 90
  },
  {
    id: 'consistent-performer',
    title: 'Consistent Performer',
    description: 'Maintain 80%+ average across 10 sessions',
    icon: '📈',
    category: 'performance',
    condition: (stats) => stats.averageScore >= 80 && stats.totalSessions >= 10
  },

  // Consistency achievements
  {
    id: 'daily-practitioner',
    title: 'Daily Practitioner',
    description: 'Study for 3 consecutive days',
    icon: '📅',
    category: 'consistency',
    condition: (stats) => stats.consecutiveDays >= 3
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: '🗓️',
    category: 'consistency',
    condition: (stats) => stats.consecutiveDays >= 7
  },
  {
    id: 'month-master',
    title: 'Month Master',
    description: 'Study for 30 consecutive days',
    icon: '📆',
    category: 'consistency',
    condition: (stats) => stats.consecutiveDays >= 30
  },

  // Mastery achievements
  {
    id: 'english-expert',
    title: 'English Expert',
    description: 'Complete 50 English questions',
    icon: '📝',
    category: 'mastery',
    condition: (stats) => stats.sectionsCompleted.english >= 50
  },
  {
    id: 'math-wizard',
    title: 'Math Wizard',
    description: 'Complete 50 Math questions',
    icon: '🧮',
    category: 'mastery',
    condition: (stats) => stats.sectionsCompleted.math >= 50
  },
  {
    id: 'reading-scholar',
    title: 'Reading Scholar',
    description: 'Complete 50 Reading questions',
    icon: '📖',
    category: 'mastery',
    condition: (stats) => stats.sectionsCompleted.reading >= 50
  },
  {
    id: 'science-explorer',
    title: 'Science Explorer',
    description: 'Complete 50 Science questions',
    icon: '🔬',
    category: 'mastery',
    condition: (stats) => stats.sectionsCompleted.science >= 50
  },

  // Special achievements
  {
    id: 'test-collector',
    title: 'Test Collector',
    description: 'Import 5 different tests',
    icon: '📁',
    category: 'study',
    condition: (stats) => stats.testsImported >= 5
  },
  {
    id: 'time-investor',
    title: 'Time Investor',
    description: 'Study for 10 hours total',
    icon: '⏰',
    category: 'study',
    condition: (stats) => stats.totalTime >= 600 // 10 hours in minutes
  },
  {
    id: 'brain-trainer',
    title: 'Brain Trainer',
    description: 'Complete all subject types',
    icon: '🧠',
    category: 'mastery',
    condition: (stats) => 
      stats.sectionsCompleted.english >= 10 &&
      stats.sectionsCompleted.math >= 10 &&
      stats.sectionsCompleted.reading >= 10 &&
      stats.sectionsCompleted.science >= 10
  }
]

// Achievement management functions
export function checkAchievements(stats: UserStats): Achievement[] {
  const earnedAchievements: Achievement[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    if (achievement.condition(stats) && !achievement.earnedAt) {
      earnedAchievements.push({
        ...achievement,
        earnedAt: new Date().toISOString()
      })
    }
  }
  
  return earnedAchievements
}

export function loadUserAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem('userAchievements')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading achievements:', error)
    return []
  }
}

export function saveUserAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem('userAchievements', JSON.stringify(achievements))
  } catch (error) {
    console.error('Error saving achievements:', error)
  }
}

export function addNewAchievements(newAchievements: Achievement[]): void {
  const existing = loadUserAchievements()
  const updated = [...existing, ...newAchievements]
  saveUserAchievements(updated)
}

export function getAchievementProgress(stats: UserStats): {
  earned: Achievement[]
  available: Achievement[]
  total: number
  earnedCount: number
} {
  const userAchievements = loadUserAchievements()
  const earnedIds = new Set(userAchievements.map(a => a.id))
  
  const earned = userAchievements
  const available = ACHIEVEMENTS.filter(a => !earnedIds.has(a.id))
  
  return {
    earned,
    available,
    total: ACHIEVEMENTS.length,
    earnedCount: earned.length
  }
}
