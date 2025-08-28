// Achievement system for the ACT prep app
import { supabase } from './supabase'

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
export async function checkAchievements(stats: UserStats): Promise<Achievement[]> {
  const earnedAchievements: Achievement[] = []
  const existingAchievements = await loadUserAchievements()
  const existingIds = new Set(existingAchievements.map(a => a.id))
  
  for (const achievement of ACHIEVEMENTS) {
    if (achievement.condition(stats) && !existingIds.has(achievement.id)) {
      earnedAchievements.push({
        ...achievement,
        earnedAt: new Date().toISOString()
      })
    }
  }
  
  return earnedAchievements
}

export async function loadUserAchievements(): Promise<Achievement[]> {
  try {
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .order('earned_at', { ascending: false })
    
    return data || []
  } catch (error) {
    console.error('Error loading achievements:', error)
    return []
  }
}

export async function saveUserAchievements(achievements: Achievement[]): Promise<void> {
  try {
    // For simplicity, replace all achievements
    await supabase
      .from('user_achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (achievements.length > 0) {
      await supabase
        .from('user_achievements')
        .insert(achievements.map(achievement => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          earned_at: achievement.earnedAt
        })))
    }
  } catch (error) {
    console.error('Error saving achievements:', error)
  }
}

export async function addNewAchievements(newAchievements: Achievement[]): Promise<void> {
  const existing = await loadUserAchievements()
  const existingIds = new Set(existing.map(a => a.id))
  
  // Only add achievements that don't already exist
  const uniqueNewAchievements = newAchievements.filter(achievement => !existingIds.has(achievement.id))
  
  if (uniqueNewAchievements.length > 0) {
    const updated = [...existing, ...uniqueNewAchievements]
    await saveUserAchievements(updated)
  }
}

export async function cleanDuplicateAchievements(): Promise<void> {
  const existing = await loadUserAchievements()
  const seen = new Set<string>()
  const unique = existing.filter(achievement => {
    if (seen.has(achievement.id)) {
      return false
    }
    seen.add(achievement.id)
    return true
  })
  
  if (unique.length !== existing.length) {
    await saveUserAchievements(unique)
    console.log(`🧹 Cleaned up ${existing.length - unique.length} duplicate achievements`)
  }
}

export async function clearAllAchievements(): Promise<void> {
  await saveUserAchievements([])
  console.log('🗑️ Cleared all achievements')
}

export async function getAchievementProgress(_stats: UserStats): Promise<{
  earned: Achievement[]
  available: Achievement[]
  total: number
  earnedCount: number
}> {
  const userAchievements = await loadUserAchievements()
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
