import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import EngagingLoader from '../components/EngagingLoader'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ProgressOverview from '../components/dashboard/ProgressOverview'
import ContinuePractice from '../components/dashboard/ContinuePractice'
import RecentSessions from '../components/dashboard/RecentSessions'
import QuickActions from '../components/dashboard/QuickActions'
import AchievementsSection from '../components/dashboard/AchievementsSection'
import ProgressCirclesSection from '../components/dashboard/ProgressCirclesSection'
import GoalTrackingSection from '../components/dashboard/GoalTrackingSection'
import SubjectProgressSection from '../components/dashboard/SubjectProgressSection'
import StatsOverviewSection from '../components/dashboard/StatsOverviewSection'

// Dashboard data types
type DashboardStats = {
  currentGoal: number
  recentScore: number
  actScoreGoal: number
}

type RecentSession = {
  id: string
  testName: string
  section: string
  score: number
  total: number
  percentage: number
  date: string
}

type ContinuePracticeData = {
  testId: string
  testName: string
  currentQuestion: number
  totalQuestions: number
  section: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats] = useState<DashboardStats>({
    currentGoal: 28,
    recentScore: 26,
    actScoreGoal: 28
  })
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [continuePractice, setContinuePractice] = useState<ContinuePracticeData | null>(null)
  
  // Progress overview data
  const [progressData] = useState({
    improvementPoints: 3,
    subject: 'Math',
    timeFrame: 'month',
    currentProgress: 24,
    targetProgress: 30
  })

  // Mock data for new components
  const [achievements] = useState([
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first practice question',
      icon: '🎯',
      earnedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Math Master',
      description: 'Complete 50 math questions',
      icon: '📐',
      earnedAt: '2024-01-20'
    },
    {
      id: '3',
      title: 'Study Streak',
      description: 'Practice for 3 consecutive days',
      icon: '🔥',
      earnedAt: '2024-01-22'
    }
  ])

  const [subjectProgress] = useState([
    {
      name: 'english',
      actScore: 28,
      questionsPracticed: 75,
      timeSpent: 3600,
      tip: 'Focus on grammar rules and punctuation patterns.'
    },
    {
      name: 'math',
      actScore: 26,
      questionsPracticed: 60,
      timeSpent: 4200,
      tip: 'Practice algebra and geometry fundamentals.'
    },
    {
      name: 'reading',
      actScore: 30,
      questionsPracticed: 40,
      timeSpent: 2400,
      tip: 'Improve reading speed and comprehension.'
    },
    {
      name: 'science',
      actScore: 27,
      questionsPracticed: 35,
      timeSpent: 2100,
      tip: 'Focus on data interpretation and analysis.'
    }
  ])

  // Authentication check - reusing pattern from Practice.tsx
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Load actual data from Supabase
      // For now, using mock data for UI development
      
      // Mock recent sessions
      const mockSessions: RecentSession[] = [
        {
          id: '1',
          testName: 'ACT Practice Test 2024',
          section: 'Math',
          score: 24,
          total: 60,
          percentage: 40,
          date: '2 hours ago'
        },
        {
          id: '2',
          testName: 'ACT Practice Test 2024',
          section: 'English',
          score: 45,
          total: 75,
          percentage: 60,
          date: 'Yesterday'
        },
        {
          id: '3',
          testName: 'ACT Practice Test 2024',
          section: 'Reading',
          score: 32,
          total: 40,
          percentage: 80,
          date: '3 days ago'
        }
      ]
      
      setRecentSessions(mockSessions)
      
      // Mock continue practice data
      setContinuePractice({
        testId: 'test-123',
        testName: 'ACT Practice Test 2024',
        currentQuestion: 15,
        totalQuestions: 75,
        section: 'English'
      })
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <EngagingLoader 
          message="Loading your dashboard..." 
          size="lg"
          showThinking={true}
        />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto p-4"
    >
      {/* Header Section */}
      <DashboardHeader stats={stats} />

      {/* Stats Overview Section */}
      <StatsOverviewSection
        currentActScore={stats.recentScore}
        estimatedActScore={26}
        questionsPracticed={210}
        testsImported={3}
        totalQuestionsAvailable={450}
        totalPracticeTime={12300}
        averageSessionTime={1800}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Progress Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Overview Card */}
          <ProgressOverview {...progressData} />

          {/* Continue Practice Card */}
          <ContinuePractice continuePractice={continuePractice} />

          {/* Achievements Section */}
          <AchievementsSection 
            achievements={achievements}
            earnedCount={3}
            totalCount={12}
          />

          {/* Progress Circles Section */}
          <ProgressCirclesSection
            practiceProgress={47}
            testCollection={30}
            actScore={72}
            studySessions={42}
          />

          {/* Goal Tracking Section */}
          <GoalTrackingSection
            goal={stats.actScoreGoal}
            currentScore={stats.recentScore}
            estimatedScore={26}
          />

          {/* Subject Progress Section */}
          <SubjectProgressSection subjects={subjectProgress} />
        </div>

        {/* Right Column - Recent Sessions & Quick Actions */}
        <div className="space-y-8">
          {/* Recent Sessions Card */}
          <RecentSessions sessions={recentSessions} />

          {/* Quick Actions Card */}
          <QuickActions />
        </div>
      </div>
    </motion.div>
  )
}
