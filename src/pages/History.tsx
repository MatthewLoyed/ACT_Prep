import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { listTestsFromSupabase } from '../lib/simpleSupabaseStorage'
import ProgressCircle from '../components/ProgressCircle'
import { 
  getAchievementProgress, 
  type UserStats, 
  addNewAchievements,
  checkAchievements,
  cleanDuplicateAchievements
} from '../lib/achievements'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type SectionKey = 'english' | 'math' | 'reading' | 'science'

type Session = {
  date: string
  section: SectionKey | 'full'
  rawScore: number
  total: number
  durationSec: number
}

type Test = {
  id: string
  name: string
  createdAt: string
  sections: Record<string, any[]>
}

export default function History() {
  const { user } = useAuth()
  const [goal, setGoal] = useState<number>(28)
  const [currentActScore, setCurrentActScore] = useState<number | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [achievementProgress, setAchievementProgress] = useState<{
    earned: any[]
    available: any[]
    total: number
    earnedCount: number
  }>({ earned: [], available: [], total: 0, earnedCount: 0 })

  useEffect(() => {
    if (user && !dataLoaded) {
      setDataLoaded(true)
      loadData()
      // Clean up any duplicate achievements on load
      cleanDuplicateAchievements().catch(console.error)
    } else if (!user) {
      setLoading(false)
    }
  }, [user, dataLoaded])

  const loadData = async () => {
    try {
      // Load goal and current ACT score from Supabase - get the most recent row for current user
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('goal_score, current_act_score')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (preferencesError) {
        console.error('❌ Error loading preferences:', preferencesError)
      } else if (preferencesData) {
        if (preferencesData.goal_score) {
          setGoal(preferencesData.goal_score)
        }
        if (preferencesData.current_act_score !== null && preferencesData.current_act_score !== undefined) {
          setCurrentActScore(preferencesData.current_act_score)
          // setShowActScoreModal(false) // ARCHIVED - Modal is disabled
        } else {
          // Show ACT score modal if no current score is set
          // setShowActScoreModal(true) // ARCHIVED - Modal is disabled
        }
      } else {
        // No preferences found, show ACT score modal
        // setShowActScoreModal(true) // ARCHIVED - Modal is disabled
      }
      
              // Mark preferences as loaded
        setPreferencesLoaded(true)
      
      // Load sessions from Supabase
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
      
      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        setSessions([])
      } else if (sessionsData) {
        setSessions(sessionsData as Session[])
      } else {
        setSessions([])
      }
      
      // Load tests from Supabase
      const supabaseTests = await listTestsFromSupabase()
      if (supabaseTests && Array.isArray(supabaseTests)) {
        setTests(supabaseTests.map(test => ({
          id: test.id,
          name: test.name,
          createdAt: test.createdAt,
          sections: {} // Tests from Supabase don't include full content
        })))
      } else {
        setTests([])
      }
      
    } catch (error) {
      console.error('Error loading history data:', error)
    } finally {
      setLoading(false)
    }
  }





  const updateGoal = async (newGoal: number) => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('❌ User not authenticated')
        return
      }

      setGoal(newGoal)
      
      // Use upsert like Settings page does
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id,
          goal_score: newGoal,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ Error updating goal:', error)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const totals = useMemo(() => {
    const by: Record<SectionKey, { raw: number; total: number; time: number; count: number }> = {
      english: { raw: 0, total: 0, time: 0, count: 0 },
      math: { raw: 0, total: 0, time: 0, count: 0 },
      reading: { raw: 0, total: 0, time: 0, count: 0 },
      science: { raw: 0, total: 0, time: 0, count: 0 },
    }
    for (const s of sessions) {
      if (s.section === 'full') continue
      const t = by[s.section]
      t.raw += s.rawScore
      t.total += s.total
      t.time += s.durationSec
      t.count += 1
    }
    return by
  }, [sessions])

  function addTip(section: SectionKey): string {
    const map: Record<SectionKey, string> = {
      english: 'Brush up on punctuation and concision. Practice spotting unnecessary words.',
      math: 'Review formula flashcards and practice under a tighter time per question.',
      reading: 'Skim questions first, then read for purpose. Mark evidence quickly.',
      science: 'Focus on trends in tables/graphs. Don’t over-read the science narrative.',
    }
    return map[section]
  }

  function actScale(raw: number, total: number) {
    if (total <= 0) return 0
    return Math.max(1, Math.round((raw / total) * 35 + 1))
  }

  const overallRaw = sessions.reduce((a, s) => a + s.rawScore, 0)
  const overallTotal = sessions.reduce((a, s) => a + s.total, 0)
  const overallAct = actScale(overallRaw, overallTotal)
  const overallTime = sessions.reduce((a, s) => a + s.durationSec, 0)
  
  // Calculate total questions from imported tests
  const totalImportedQuestions = tests.reduce((sum, test) => {
    if (!test.sections) return sum
    return sum + Object.values(test.sections).reduce((sectionSum: number, section: any) => sectionSum + (section?.length || 0), 0)
  }, 0)

  // Calculate user stats for achievements (memoized)
  const userStats = useMemo((): UserStats => {
    const sectionCounts = {
      english: sessions.filter(s => s.section === 'english').reduce((sum, s) => sum + s.total, 0),
      math: sessions.filter(s => s.section === 'math').reduce((sum, s) => sum + s.total, 0),
      reading: sessions.filter(s => s.section === 'reading').reduce((sum, s) => sum + s.total, 0),
      science: sessions.filter(s => s.section === 'science').reduce((sum, s) => sum + s.total, 0)
    }

    const scores = sessions.map(s => (s.rawScore / s.total) * 100).filter(score => !isNaN(score))
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0
    const perfectScores = scores.filter(score => score === 100).length

    // Calculate consecutive days (simplified - just count unique dates)
    const uniqueDates = new Set(sessions.map(s => new Date(s.date).toDateString()))
    const consecutiveDays = uniqueDates.size

    return {
      totalQuestions: overallTotal,
      totalSessions: sessions.length,
      totalTime: Math.round(overallTime / 60), // Convert to minutes
      averageScore,
      bestScore,
      consecutiveDays,
      testsImported: tests.length,
      sectionsCompleted: sectionCounts,
      perfectScores,
      studyStreak: consecutiveDays // Simplified for now
    }
  }, [sessions, tests, overallTotal, overallTime])

  // Load achievement progress when userStats changes
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const progress = await getAchievementProgress(userStats)
        setAchievementProgress(progress)
      } catch (error) {
        console.error('Error loading achievements:', error)
      }
    }
    
    if (!loading) {
      loadAchievements()
    }
  }, [userStats, loading])

  // Check for new achievements when data loads
  useEffect(() => {
    const checkForNewAchievements = async () => {
      if (!loading) {
        try {
                  const newAchievements = await checkAchievements(userStats)
        if (newAchievements.length > 0) {
          await addNewAchievements(newAchievements)
        }
        } catch (error) {
          console.error('Error checking achievements:', error)
        }
      }
    }
    
    checkForNewAchievements()
  }, [loading, userStats]) // Run when loading changes or userStats changes



  // Show loading state while checking authentication or loading preferences
  if (loading || !preferencesLoaded) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p className="text-secondary">Loading your progress...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-secondary mb-6">
            Please sign in to view your progress and history.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-2">Progress & History</h2>
              <p className="text-secondary mb-6">Stay encouraged — progress compounds.</p>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="card p-5">
                <div className="text-sm text-secondary">
                  {currentActScore ? 'Current ACT® Score' : 'Overall ACT® (est.)'}
                </div>
                <div className="text-4xl font-bold">
                  {currentActScore || overallAct} / 36
                </div>
              </div>
              <div className="card p-5">
                <div className="text-sm text-secondary">Questions practiced</div>
                <div className="text-4xl font-bold">{overallTotal}</div>
              </div>
              <div className="card p-5">
                <div className="text-sm text-secondary">Tests imported</div>
                <div className="text-4xl font-bold">{tests.length}</div>
              </div>
              <div className="card p-5">
                <div className="text-sm text-secondary">Total questions available</div>
                <div className="text-4xl font-bold">{totalImportedQuestions}</div>
              </div>
            </div>
            
            {/* Achievements Section */}
            <div className="mt-8 card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Achievements</h3>
                  <p className="text-secondary">Celebrate your progress and milestones!</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--color-accent)]">
                    {`${achievementProgress.earnedCount}/${achievementProgress.total}`}
                  </div>
                  <div className="text-sm text-secondary">Badges Earned</div>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievementProgress.earned.map((achievement, index) => (
                    <motion.div
                      key={`${achievement.id}-${achievement.earnedAt || index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-dark)]/20 border border-[var(--color-accent)]/30 rounded-xl p-4 hover:scale-105 transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{achievement.title}</h4>
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
              
              {achievementProgress.earned.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="text-secondary">Complete your first question to earn your first achievement!</p>
                  </div>
                ) : null}
            </div>
            
            {/* Progress Circles */}
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="card p-6 text-center">
                <ProgressCircle 
                  progress={Math.min(100, (overallTotal / 200) * 100)} 
                  size="md" 
                  color="blue"
                  label="Practice Progress"
                />
              </div>
              <div className="card p-6 text-center">
                <ProgressCircle 
                  progress={Math.min(100, (tests.length / 10) * 100)} 
                  size="md" 
                  color="green"
                  label="Test Collection"
                />
              </div>
              <div className="card p-6 text-center">
                <ProgressCircle 
                  progress={Math.min(100, (overallAct / 36) * 100)} 
                  size="md" 
                  color="purple"
                  label="ACT® Score"
                />
              </div>
              <div className="card p-6 text-center">
                <ProgressCircle 
                  progress={Math.min(100, (sessions.length / 50) * 100)} 
                  size="md" 
                  color="orange"
                  label="Study Sessions"
                />
              </div>
            </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="text-sm text-secondary">Total practice time</div>
          <div className="text-4xl font-bold">{Math.round(overallTime / 60)} min</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-secondary">Average per session</div>
          <div className="text-4xl font-bold">{sessions.length > 0 ? Math.round(overallTime / sessions.length / 60) : 0} min</div>
        </div>
      </div>

      <div className="mt-8 card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Your goal</h3>
            <p className="text-secondary">Aim high and track your momentum.</p>
          </div>
          <div className="flex items-center gap-2">
                            <input type="number" min={1} max={36} value={goal} onChange={e => updateGoal(Number(e.target.value))} className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900" />
            <span className="text-sm">/ 36</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
            <div className="h-full brand-gradient" style={{ width: `${Math.min(100, ((currentActScore || overallAct) / goal) * 100)}%` }} />
          </div>
                      <div className="mt-1 text-sm text-secondary">
                        {currentActScore ? 'Current ACT® vs goal' : 'Estimated ACT® vs goal'}
                      </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {(Object.keys(totals) as SectionKey[]).map((k) => {
          const t = totals[k]
          const act = actScale(t.raw, t.total)
          return (
            <div key={k} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{k}</h3>
                <div className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800">{act} / 36</div>
              </div>
              <p className="mt-2 text-sm text-secondary">{addTip(k)}</p>
                              <div className="mt-3 text-sm text-secondary">Practiced: {t.total} questions • {Math.round(t.time / 60)} min</div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 card p-5">
        <h3 className="text-xl font-semibold">Imported Tests</h3>
        <div className="mt-2">
          {loading ? (
            <div className="py-4 text-secondary">Loading tests...</div>
          ) : tests.length === 0 ? (
                          <div className="py-4 text-secondary">No tests imported yet. Import a test to get started!</div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => {
                const totalQuestions = Object.values(test.sections).reduce((sum: number, section: any) => sum + (section?.length || 0), 0)
                const sections = Object.keys(test.sections).filter(key => test.sections[key]?.length > 0)
                return (
                  <div key={test.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{test.name}</h4>
                        <p className="text-sm text-secondary">
                          {totalQuestions} questions • {sections.join(', ')} sections
                        </p>
                      </div>
                                              <div className="text-sm text-secondary">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 card p-5">
        <h3 className="text-xl font-semibold">Recent sessions</h3>
        <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
          {sessions.length === 0 && (
            <div className="py-4 text-secondary">No practice sessions yet. Start a subject or a full test — small steps build big results!</div>
          )}
          {sessions.map((s, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-sm">
              <div className="capitalize">{s.section}</div>
              <div className="text-secondary">{new Date(s.date).toLocaleString()}</div>
              <div>{s.rawScore}/{s.total}</div>
              <div>{Math.round(s.durationSec/60)} min</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACT Score Input Modal - ARCHIVED */}
      {/* 
      {(() => {
        const modalShouldShow = showActScoreModal && preferencesLoaded && currentActScore === null
        console.log('🎯 Modal condition evaluation:', { 
          showActScoreModal, 
          preferencesLoaded, 
          currentActScore, 
          modalShouldShow 
        })
        return modalShouldShow
      })() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 grid place-items-center bg-black/60 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="card p-8 text-center max-w-md mx-4"
          >
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-4">What's Your Current ACT® Score?</h2>
            <p className="text-secondary mb-6">
              We need your current ACT® score to track your progress and provide personalized insights.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Your ACT® Score (1-36)</label>
              <input
                type="number"
                min="1"
                max="36"
                value={actScoreInput}
                onChange={(e) => setActScoreInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Enter score"
                autoFocus
              />
            </div>
            
            <button
              onClick={() => {
                const score = parseInt(actScoreInput)
                if (score >= 1 && score <= 36) {
                  saveActScore(score)
                }
              }}
              disabled={!actScoreInput || parseInt(actScoreInput) < 1 || parseInt(actScoreInput) > 36}
              className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Score
            </button>
            
            <p className="text-xs text-secondary mt-4">
              You can update this later in your settings.
            </p>
          </motion.div>
        </motion.div>
      )}
      */}
    </motion.div>
  )
}




