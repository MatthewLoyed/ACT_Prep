import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
// Use CDN worker to avoid version mismatch issues
import { loadTestFromSupabase, updateTestAnswers } from '../lib/simpleSupabaseStorage'
import type { TestBundle } from '../lib/testStore'

import { getTestTypeConfig, type TestTypeConfig } from '../lib/testConfig'
import { useSoundSettings } from '../hooks/useSoundSettings'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Debounce utility function
function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Define types locally
type SectionId = 'english' | 'math' | 'reading' | 'science'
import { AnimatePresence, motion } from 'framer-motion'
import StudyBuddy from '../components/StudyBuddy'
import SuccessCelebration from '../components/SuccessCelebration'
import SimpleParticles from '../components/SimpleParticles'
import EngagingLoader from '../components/EngagingLoader'
import TestCompletionCelebration from '../components/TestCompletionCelebration'
import AnimatedCounter from '../components/AnimatedCounter'

// Use local worker to avoid CDN issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
GlobalWorkerOptions.workerSrc = pdfWorker

type Question = {
  id: string
  prompt: string
  choices: string[]
  choiceLetters?: string[] // Add choice letters (A, B, C, D or F, G, H, J)
  answerIndex?: number
  passage?: string
  passageId?: string
  questionNumber?: number // Pre-parsed question number
}

export default function PdfPractice() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { subject = 'english' } = useParams()
  const [params] = useSearchParams()
  const testId = params.get('testId') || ''
  const isResume = params.get('resume') === 'true'
  const resumeQuestionIndex = parseInt(params.get('questionIndex') || '0')

  // console.log(`PdfPractice: Current subject = ${subject}, testId = ${testId}`)

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pageNum, setPageNum] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1.5)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const leftPaneRef = useRef<HTMLDivElement | null>(null)

  const [active, setActive] = useState<TestBundle | null>(null)
  const [testConfig, setTestConfig] = useState<TestTypeConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Load test from Supabase
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setActive(null)
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        // Load from Supabase
        const loadedTest = await loadTestFromSupabase(testId)
              // Test loaded successfully
        if (loadedTest) {
          // Convert to TestBundle format
          const testBundle: TestBundle = {
            id: loadedTest.id,
            name: loadedTest.name,
            createdAt: loadedTest.createdAt,
            sections: loadedTest.sections,
            pdfData: loadedTest.pdfData,
            sectionPages: loadedTest.sectionPages,
            pageQuestions: loadedTest.pageQuestions,
            answers: loadedTest.answers // Add the answers field for resume functionality
          }
          setActive(testBundle)
          
          // Determine test type and get configuration
          const config = getTestTypeConfig(testBundle)
          
          setTestConfig(config)
        } else {
          setActive(null)
        }
      } catch (error) {
        console.error('Failed to load test:', error)
        setActive(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadTest()
  }, [testId])


  const allQuestions: Question[] = useMemo(() => {
    const fallback: Question[] = []
    if (!subject) return fallback
    const fromActive = (active?.sections as Partial<Record<SectionId, unknown[]>> | undefined)?.[subject as SectionId] as
      | Question[]
      | undefined
    
    const questions = fromActive ?? fallback
    
    // Debug: Show what questions the parser provided
    if (questions.length > 0) {
      // Questions loaded successfully
    }
    
    return questions
  }, [active, subject])


  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [correctAudio] = useState(() => new Audio('/sounds/correct_answer.mp3'))
  const [wrongAudio] = useState(() => new Audio('/sounds/wrong_answer.wav'))
  
  // Session tracking for practice time
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Sound settings hook
  const { playAudio } = useSoundSettings()
  const [feedback, setFeedback] = useState<{ ok: boolean; id: string } | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [showStreakMessage, setShowStreakMessage] = useState<boolean>(false)
  const [showStudyBuddy, setShowStudyBuddy] = useState<boolean>(false)
  const [showSuccessCelebration, setShowSuccessCelebration] = useState<boolean>(false)
  const [qIdx, setQIdx] = useState<number>(0)
  const [testCompleted, setTestCompleted] = useState<boolean>(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState<boolean>(false)
  const [lastManualAdvance, setLastManualAdvance] = useState<number | null>(null)
  const [isIntentionalPageChange, setIsIntentionalPageChange] = useState(false)
  
  // Timer functionality
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false)
  const [timerPaused, setTimerPaused] = useState<boolean>(false)
  const [timerMinutes, setTimerMinutes] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showTimerSetup, setShowTimerSetup] = useState<boolean>(false)
  const [showTimeUp, setShowTimeUp] = useState<boolean>(false)

  // Timer effect
  useEffect(() => {
    if (!timerEnabled || timeRemaining <= 0 || timerPaused) return
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setShowTimeUp(true)
          setTimerEnabled(false)
          setTimerPaused(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [timerEnabled, timeRemaining, timerPaused])



  // Reset all state when subject changes to prevent data corruption
  useEffect(() => {
    // console.log(`Subject changed to: ${subject} - Resetting all state`)

    setAnswers({})
    setFeedback(null)
    // Don't reset question index if we're resuming
    if (!isResume) {
      setQIdx(0)
    }
    setTestCompleted(false)
    setLastManualAdvance(null)
    setStreak(0) // Reset streak when changing subjects
    setShowStreakMessage(false) // Hide any existing streak message
    // Reset page number to 1, will be updated by the section detection useEffect
    setPageNum(1)
  }, [subject, isResume])

  // Handle resume functionality
  useEffect(() => {
    if (isResume && active && resumeQuestionIndex >= 0) {
      // Load existing answers from the test data
      if (active.answers) {
        setAnswers(active.answers)
      }
      
      // Find the page that contains the resumed question
      const subjectPageQuestions = active?.pageQuestions?.[subject as SectionId]
      if (subjectPageQuestions) {
        // Find which page contains the resumed question
        const targetQuestionId = `${subject}-${resumeQuestionIndex + 1}` // Convert index to question ID for current subject
        
        for (const [pageNumStr, questionIds] of Object.entries(subjectPageQuestions)) {
          if (questionIds.includes(targetQuestionId)) {
            const targetPage = parseInt(pageNumStr)
            // Find the index of the target question within this page's question array
            const pageQuestionIndex = questionIds.indexOf(targetQuestionId)
            setPageNum(targetPage)
            // Set the question index to the position within the page, not the global index
            setQIdx(pageQuestionIndex)
            return // Exit early since we found the question
          }
        }
      }
      
      // Fallback: Set the question index to resume from (if page mapping failed)
      setQIdx(resumeQuestionIndex)
    }
  }, [isResume, active, resumeQuestionIndex, subject])

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (answersToSave: Record<string, number>) => {
      if (testId) {
    
        setSaveStatus('saving')
        try {
          await updateTestAnswers(testId, answersToSave)
      
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.warn('🎯 RESUME DEBUG: Could not auto-save answers:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }
    }, 2000), // Save after 2 seconds of no new answers
    [testId]
  )

  // Answer selection handler with debounced auto-save
  const onAnswer = useCallback(async (qid: string, idx: number, correctIdx?: number) => {

    
    // Start session tracking on first answer if not already started
    if (sessionStartTime === null) {
      setSessionStartTime(Date.now())
  
    }
    
    const newAnswers = { ...answers, [qid]: idx }
    setAnswers(newAnswers)
    

    
    // Trigger debounced save
    debouncedSave(newAnswers)
    
    const ok = typeof correctIdx === 'number' ? idx === correctIdx : false
    setFeedback({ ok, id: qid })
    
    // Play sound effects using existing audio files with user settings applied
    if (ok) {
      playAudio(correctAudio)
    } else {
      playAudio(wrongAudio)
    }
    
    // Handle streak logic and celebrations
    if (ok) {
      setStreak(prev => {
        const newStreak = prev + 1
        // Show celebrations for milestones
        if (newStreak >= 3 && (newStreak % 3 === 0 || newStreak === 5 || newStreak === 10)) {
          setShowStreakMessage(true)
          setShowStudyBuddy(true)
          setShowSuccessCelebration(true)
          // Play level up sound for streak milestones with user settings applied
          const levelUpAudio = new Audio('/sounds/level-up-06-370051.mp3')
          playAudio(levelUpAudio)
          setTimeout(() => {
            setShowStreakMessage(false)
            setShowStudyBuddy(false)
            setShowSuccessCelebration(false)
          }, 3000)
        } else if (newStreak === 1) {
          // Show success celebration for first correct answer
          setShowSuccessCelebration(true)
          setTimeout(() => setShowSuccessCelebration(false), 2000)
        } else if (newStreak >= 2) {
          // Show mascot for any streak of 2 or more
          setShowStudyBuddy(true)
          setTimeout(() => setShowStudyBuddy(false), 2000)
        }
        return newStreak
      })
    } else {
      setStreak(0) // Reset streak on wrong answer
    }
  }, [answers, testId, correctAudio, wrongAudio, sessionStartTime])

  // Function to save session data
  const saveSession = useCallback(async () => {
    if (sessionStartTime === null) return
    
    const sessionEndTime = Date.now()
    const durationSec = Math.round((sessionEndTime - sessionStartTime) / 1000)
    
    // Calculate score
    const correctAnswers = allQuestions.filter(q => answers[q.id] === q.answerIndex).length
    const totalQuestions = allQuestions.length
    
    try {
      if (!user) {
        console.error('User not authenticated')
        return
      }

      await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          date: new Date().toISOString(),
          section: subject,
          rawScore: correctAnswers,
          total: totalQuestions,
          durationSec: durationSec,
        })
      console.log('🎯 Session saved:', { durationSec, correctAnswers, totalQuestions })
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }, [sessionStartTime, subject, answers, allQuestions])



  // Add save confirmation when leaving the page - defined after answers state
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0) {
        e.preventDefault()
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (Object.keys(answers).length > 0) {
        const confirmed = confirm('You have unsaved progress. Are you sure you want to leave? Your answers will be saved automatically.')
        if (!confirmed) {
          e.preventDefault()
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [answers])

  // Load PDF from stored data
  useEffect(() => {
    if (!testId || !active) {
      setPdf(null)
      setPdfLoading(false)
      return
    }
    
          // PDF loading debug info removed to focus on page detection
    
    if (!active.pdfData) {
      console.log('No PDF data found in test')
      setPdf(null)
      setPdfLoading(false)
      return
    }
    
    setPdfLoading(true)
    let cancelled = false
    
    try {
      // Handle both data URL format and raw base64
      let base64Data: string
      if (active.pdfData.startsWith('data:')) {
        // Data URL format: data:application/pdf;base64,<base64-data>
        const arr = active.pdfData.split(',')
        base64Data = arr[1]
      } else {
        // Raw base64 format
        base64Data = active.pdfData
      }
      
      // Base64 debug info removed to focus on page detection
      
      // Convert base64 back to array buffer
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // PDF conversion debug info removed to focus on page detection
      
      getDocument({ data: bytes.buffer }).promise.then(doc => { 
        if (!cancelled) {
      
          setPdf(doc) 
          setPdfLoading(false) // PDF loading is complete
        }
      }).catch(err => {
        console.error('Error loading PDF:', err)
        setPdf(null)
        setPdfLoading(false)
      })
    } catch (err) {
              console.error('Error converting PDF data:', err)
      setPdf(null)
      setPdfLoading(false)
    }
    
    return () => { 
      cancelled = true 
      setPdfLoading(false)
    }
  }, [testId, active])

    // Jump to first real question page on load
  useEffect(() => {
    if (!pdf || !active) return
    let mounted = true
    
    ;(async () => {
      // Check if we already have stored page numbers for this test
      if (active.sectionPages && active.sectionPages[subject as SectionId]) {
        const storedPage = active.sectionPages[subject as SectionId]
        if (storedPage) {
      
          if (mounted) {
            // Don't override page if we're resuming - the resume logic will set the correct page
            if (!isResume) {
              setPageNum(storedPage)
              setLastManualAdvance(storedPage)
            }
          }
          return
        }
      }
      
      // If no stored pages, this is an error - section pages should be detected during import
      console.error(`No stored page for ${subject} - section pages should be detected during import`)
    })()
    
    return () => { 
      mounted = false 
    }
  }, [pdf, subject, active])

  // Track current render task to prevent multiple simultaneous renders
  const currentRenderTaskRef = useRef<{ cancel: () => void } | null>(null)
  
  // Render page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    
    let mounted = true
    
    ;(async () => {
      const page = await pdf.getPage(pageNum)
      
      if (!mounted) return
      
      // Check for test ending using pre-parsed data instead of hardcoded regex
      const hasEndOfTest = testConfig && currentNum === testConfig.subjects[subject as keyof typeof testConfig.subjects]?.questions
      
      // Debug: log when we reach the final question
      if (hasEndOfTest) {
        console.log(`Page ${pageNum}: Reached final question (${currentNum}) for ${subject} section`)
      }

      // Clear manual advance flag after a delay
      if (lastManualAdvance === pageNum) {
        setTimeout(() => setLastManualAdvance(null), 100)
      }
      // Render PDF
      if (!mounted) return
      
      // Use zoom directly to allow proper zooming
      const viewport = page.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      if (!canvas || !mounted) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Cancel any previous render task
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel()
        currentRenderTaskRef.current = null
      }
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // Only render if still mounted
      if (mounted) {
        try {
          const renderTask = page.render({ canvasContext: ctx, viewport, canvas })
          currentRenderTaskRef.current = renderTask
          await renderTask.promise
          
          if (mounted) {
            // Don't force canvas to 100% width - let zoom work
            canvas.style.width = `${viewport.width}px`
            canvas.style.height = `${viewport.height}px`
          }
        } catch (error) {
          // Ignore cancellation and abort errors - these are expected when navigating quickly
          if (error && typeof error === 'object' && 'name' in error) {
            const errorName = error.name as string
            if (errorName !== 'AbortError' && errorName !== 'RenderingCancelledException') {
              console.error('PDF render error:', error)
            }
          }
        }
      }
    })()
    
    return () => {
      mounted = false
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel()
        currentRenderTaskRef.current = null
      }
    }
  }, [pdf, pageNum, zoom, lastManualAdvance, subject])

  // Preload sounds
  useEffect(() => {
    correctAudio.load(); wrongAudio.load()
  }, [correctAudio, wrongAudio])

  const pageQuestions: Question[] = useMemo(() => {
    // Get questions for the current page using the stored pageQuestions mapping from parser
    const subjectPageQuestions = active?.pageQuestions?.[subject as SectionId]
    
    if (subjectPageQuestions && subjectPageQuestions[pageNum]) {
      const questionIds = subjectPageQuestions[pageNum]
      const questionsForThisPage = allQuestions.filter(q => questionIds.includes(q.id))
      return questionsForThisPage
    }
    // Fallback: return all questions if no page mapping is available
    return allQuestions
  }, [allQuestions, active?.pageQuestions, subject, pageNum])

  // Compute subject-specific progress (only count answers for current subject)
  const subjectAnswers = useMemo(() => {
    if (!subject || !allQuestions.length) return {}
    
    // Filter answers to only include questions from the current subject
    const subjectQuestionIds = allQuestions.map(q => q.id)
    const filteredAnswers: Record<string, number> = {}
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (subjectQuestionIds.includes(questionId)) {
        filteredAnswers[questionId] = answer
      }
    })
    
    return filteredAnswers
  }, [answers, subject, allQuestions])

  // Reset question index when page changes (but not when resuming or intentional page change)
  useEffect(() => { 
    if (!isResume && !isIntentionalPageChange) {
      setQIdx(0) 
    }
    // Reset the flag after handling
    if (isIntentionalPageChange) {
      setIsIntentionalPageChange(false)
    }
  }, [pageNum, isResume, isIntentionalPageChange])

  // Clear previous test data when switching sections
  useEffect(() => {
    // Don't clear answers if we're resuming - they'll be loaded by the resume logic
    if (!isResume) {
      setAnswers({})
    }
    setFeedback(null)
    setQIdx(0)
    setTestCompleted(false)
    setLastManualAdvance(null)
    setStreak(0) // Reset streak when switching sections
    setShowStreakMessage(false) // Hide any existing streak message

  }, [subject, isResume])





  const current = pageQuestions[qIdx]
  const currentNum = useMemo(() => {
    if (!current) return null
    // Use pre-parsed question number if available, otherwise extract from ID
    return current.questionNumber || (() => {
      const m = current.id.match(/(\d+)/)
      return m ? Number(m[1]) : null
    })()
  }, [current])
  
  // Debug current question
  useEffect(() => {
    if (current && currentNum === 2 && subject === 'math') {
      console.log(`=== MATH QUESTION 2 FULL TEXT ===`)
      console.log(`ID: ${current.id}`)
      console.log(`Prompt: "${current.prompt}"`)
      console.log(`Choices:`, current.choices)
      console.log(`Choice Letters:`, current.choiceLetters)
      console.log(`=== END MATH QUESTION 2 ===`)
    }
  }, [current, currentNum, subject])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen flex flex-col"
    >
      {/* Background Particles */}
      <SimpleParticles count={15} />

      {/* Test Title Bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <div className="flex items-center justify-between mb-3 relative">
          <button 
            className="btn btn-ghost text-white hover:bg-white/20 border-white/20"
            onClick={() => navigate(`/test-selection/${testId}`)}
          >
            ← Back to Subjects
          </button>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="text-3xl font-bold tracking-wide">
              {testConfig ? `${testConfig.name} - ${subject?.toUpperCase()}` : `${subject?.toUpperCase()} TEST`}
            </h1>
            <p className="text-emerald-100 mt-1">
              {testConfig ? 
                `${testConfig.subjects[subject as keyof typeof testConfig.subjects]?.time} — ${testConfig.subjects[subject as keyof typeof testConfig.subjects]?.questions} Questions` :
                'Loading test configuration...'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-save status indicator */}
            <div className="text-sm text-white/80">
              {saveStatus === 'saving' && '⏳ Auto-saving...'}
              {saveStatus === 'saved' && '✅ Auto-saved!'}
              {saveStatus === 'error' && '❌ Save failed'}
              {saveStatus === 'idle' && '💾 Auto-save enabled'}
            </div>
            
            {/* Manual save button */}
            <button
              className="btn btn-sm btn-outline text-white border-white/30 hover:bg-white/20"
              onClick={async () => {
                if (testId && Object.keys(answers).length > 0) {
                  setSaveStatus('saving')
                  try {
                    await updateTestAnswers(testId, answers)
                    setSaveStatus('saved')
                    setTimeout(() => setSaveStatus('idle'), 2000)
                  } catch (error) {
                    console.error('Failed to save progress:', error)
                    setSaveStatus('error')
                    setTimeout(() => setSaveStatus('idle'), 3000)
                  }
                }
              }}
              disabled={saveStatus === 'saving'}
            >
              💾 Save Now
            </button>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="bg-white/20 h-3 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-700 ease-out relative"
            style={{ width: `${Math.min(100, (Object.keys(subjectAnswers).length / allQuestions.length) * 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            <div className="absolute right-0 top-0 w-2 h-full bg-white/50 rounded-full shadow-lg"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Object.keys(subjectAnswers).length} / {allQuestions.length}
            </span>
          </div>
        </div>
        <div className="text-center mt-2 text-sm text-emerald-100 font-semibold">
          <span>{Object.keys(subjectAnswers).length === allQuestions.length ? '🎉 All questions completed!' : 'Keep going!'}</span>
        </div>
        
        {/* Timer UI */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {!timerEnabled && !showTimeUp && (
            <button
              className="btn btn-sm btn-outline text-white border-white/30 hover:bg-white/20"
              onClick={() => setShowTimerSetup(true)}
            >
              ⏱️ Set Timer
            </button>
          )}
          
          {timerEnabled && timeRemaining > 0 && (
            <div className="flex items-center gap-2 text-white">
              <span className="text-lg">⏱️</span>
              <span className="font-mono text-lg font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
              <button
                className="btn btn-sm btn-ghost text-white hover:bg-white/20"
                onClick={() => {
                  setTimerPaused(!timerPaused)
                }}
              >
                {timerPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button
                className="btn btn-sm btn-ghost text-white hover:bg-white/20"
                onClick={() => {
                  setTimerEnabled(false)
                  setTimerPaused(false)
                  setTimeRemaining(0)
                }}
              >
                Stop
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 grid lg:grid-cols-[2fr_1fr] gap-6 p-4 items-center">
        {loading ? (
          <div className="col-span-2 card p-8 text-center">
            <EngagingLoader 
              message="Loading Test..." 
              size="lg"
              showThinking={true}
            />
            <p className="text-secondary mt-4">
              Please wait while we load your test from the database.
            </p>
          </div>
        ) : pdfLoading ? (
          <div className="col-span-2 card p-8 text-center">
            <EngagingLoader 
              message="Loading PDF..." 
              size="lg"
              showThinking={true}
            />
            <p className="text-secondary mt-4">
              Please wait while we load your test PDF.
            </p>
          </div>
        ) : !pdf ? (
          <div className="col-span-2 card p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold mb-4">No PDF Available</h2>
            <p className="text-secondary mb-6">
              {!testId ? 'No test selected. Please select a test first.' : 
               !active?.pdfData ? 'This test does not have PDF data. Please re-import the test.' :
               'PDF failed to load. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                className="btn btn-ghost"
                onClick={() => navigate(`/test-selection/${testId}`)}
              >
                ← Back to Subjects
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/practice')}
              >
                Back to Test Selection
              </button>
            </div>
          </div>
        ) : (
          <>
            <div ref={leftPaneRef} className="card p-2 overflow-auto">
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="text-sm">Page {pageNum} / {pdf?.numPages ?? '?'}</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => setZoom(z => Math.max(0.75, parseFloat((z - 0.1).toFixed(2))))}>-</button>
            <div>{Math.round(zoom * 100)}%</div>
            <button className="btn btn-ghost" onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}>+</button>
          </div>
        </div>
        <canvas ref={canvasRef} className="mx-auto" />
        <div className="flex items-center justify-between mt-2 px-2 pb-2">
          <button className="btn btn-ghost" onClick={() => {
            setIsIntentionalPageChange(true)
            setPageNum(p => Math.max(1, p - 1))
          }}>Prev Page</button>
          <button className="btn btn-ghost" onClick={() => {
            if (pdf && pageNum < pdf.numPages) {
              const nextPage = Math.min(pdf.numPages, pageNum + 1)
              console.log(`READING DEBUG: Left pane navigation from page ${pageNum} to page ${nextPage}`)
              setLastManualAdvance(nextPage)
              setIsIntentionalPageChange(true)
              setPageNum(nextPage)
            }
          }} disabled={!pdf || pageNum >= pdf.numPages}>
            Next Page
          </button>
        </div>
      </div>

      <div className="space-y-4">
                {testCompleted ? (
          <div className="card p-6 text-center bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50">
            <div className="text-3xl font-bold text-emerald-300 mb-3 text-shadow-lg">🎉 Test Completed! 🎉</div>
            <div className="text-white text-lg font-semibold mb-4">
              You have completed the {subject.toUpperCase()} test.
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCompletionCelebration(true)}
              >
                View Results
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => navigate(`/test-selection/${testId}`)}
              >
                ← Back to Subjects
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="card p-4">
              <div className="text-sm text-secondary">Questions on this page</div>
              {pageQuestions.length === 0 && (
                <div className="mt-2 text-sm">
                  {subject === 'reading' ? (
                    <span>Reading passage page. Click "Next Page" to see questions.</span>
                  ) : (
                    <span>No detected questions on this page.</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Navigation for pages with no questions (like reading passage pages) */}
            {pageQuestions.length === 0 && (
              <div className="card p-4">
                <div className="text-center">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {subject === 'reading' ? (
                      <span>This is a reading passage page. Read the passage, then click "Next Page" to see the questions.</span>
                    ) : (
                      <span>No questions detected on this page.</span>
                    )}
                  </div>
                  <div className="flex justify-center gap-2">
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => {
                        setIsIntentionalPageChange(true)
                        setPageNum(p => Math.max(1, p - 1))
                      }}
                      disabled={pageNum === 1}
                    >
                      Previous Page
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (pdf && pageNum < pdf.numPages) {
                          const nextPage = Math.min(pdf.numPages, pageNum + 1)
                          setLastManualAdvance(nextPage)
                          setIsIntentionalPageChange(true)
                          setPageNum(nextPage)
                        }
                      }}
                      disabled={!pdf || pageNum >= pdf.numPages}
                    >
                      Next Page
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {current && (
              <motion.div
                key={current.id}
                className="card p-4 flex flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xs uppercase tracking-wide text-secondary mb-3 flex items-center justify-between">
                  <span>Question {currentNum ?? ''}:</span>
                  {streak > 0 && (
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      <AnimatedCounter value={streak} fontSize={12} textColor="white" fontWeight="bold" />
                    </div>
                  )}
                </div>
                <div className="font-medium mb-3 mt-1">
                                          {current.prompt}
                </div>
                <div className="space-y-2">
                  {current.choices.map((_, i) => {
                    // Determine the state for each choice
                    let state = ''
                    const userAnswered = answers[current.id] !== undefined
                    const userSelectedThis = answers[current.id] === i
                    const thisIsCorrect = i === current.answerIndex
                    
                    if (userAnswered) {
                      if (userSelectedThis && thisIsCorrect) {
                        // User selected correct answer
                        state = 'choice-correct'
                      } else if (userSelectedThis && !thisIsCorrect) {
                        // User selected wrong answer
                        state = 'choice-incorrect'
                      } else if (!userSelectedThis && thisIsCorrect) {
                        // User didn't select this, but it's the correct answer
                        state = 'choice-correct'
                      }
                    }
                    
                    const disabled = userAnswered
                    
                    // Use stored choice letters from parsed data
                    const choiceLetter = current.choiceLetters?.[i] || String.fromCharCode(65 + i)
                    
                    return (
                      <button key={i} className={`choice ${state}`} onClick={() => onAnswer(current.id, i, current.answerIndex)} disabled={disabled}>
                        <span className="font-medium mr-2">{choiceLetter.replace(/\.$/, '')}.</span>
                        {current.choices[i] || ''}
                        {userAnswered && thisIsCorrect && !userSelectedThis && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 px-2 py-1 rounded">
                            Correct Answer
                          </span>
                        )}
                        {userAnswered && userSelectedThis && !thisIsCorrect && (
                          <span className="ml-2 text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 px-2 py-1 rounded">
                            Your Answer
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Streak Celebration Message */}
                <div className="relative h-16">
                  <AnimatePresence>
                    {showStreakMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl shadow-lg"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl">🎉</span>
                          <div className="text-center">
                            <div className="font-bold text-lg">
                              {streak} in a row!
                            </div>
                            <div className="text-sm opacity-90">
                              {streak >= 10 ? "Incredible! You're on fire! 🔥" :
                               streak >= 5 ? "Amazing! Keep it up! 💪" :
                               "Great job! Keep going! ✨"}
                            </div>
                          </div>
                          <span className="text-2xl">🎉</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                                </div>

                {/* Feedback Message - Centered */}
                <AnimatePresence>
                  {feedback?.id === current.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center my-3"
                    >
                      <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg ${feedback.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>
                        {feedback.ok ? '✅ Correct!' : '❌ Incorrect'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1"></div>

                <div className="mt-4 flex justify-between gap-2">
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => {
                      // If we're on the first question of the page, go to previous page
                      if (qIdx === 0 && pdf && pageNum > 1) {
                        // Find the previous page that has questions for this subject
                        let prevPage = pageNum - 1
                        while (prevPage >= 1) {
                          const subjectPageQuestions = active?.pageQuestions?.[subject as SectionId]
                          if (subjectPageQuestions?.[prevPage] && 
                              subjectPageQuestions[prevPage].length > 0) {
                            break
                          }
                          prevPage--
                        }
                        
                        if (prevPage >= 1) {
                          setLastManualAdvance(prevPage)
                          setIsIntentionalPageChange(true)
                          setPageNum(prevPage)
                          // Set to the last question of the previous page
                          const prevPageQuestions = active?.pageQuestions?.[subject as SectionId]?.[prevPage] || []
                          const lastQuestionIndex = prevPageQuestions.length - 1
                          setQIdx(lastQuestionIndex)
                        }
                      } else {
                        // Go to previous question on same page
                        const newQIdx = Math.max(0, qIdx - 1)
                        setQIdx(newQIdx)
                      }
                    }} 
                    disabled={qIdx === 0 && pageNum === 1}
                  >
                    {qIdx === 0 ? 'Prev Page' : 'Prev question'}
                  </button>
                                      <button
                      className="btn btn-primary"
                      onClick={() => {
                        setFeedback(null)
                        setQIdx(i => {
                          // Check if all questions on current page are answered
                          const allAnswered = pageQuestions.every(q => answers[q.id] !== undefined)
                          
                          // Go to next question on same page if not the last question
                          if (i + 1 < pageQuestions.length) {
                            return i + 1
                          }
                          
                          // If all answered, check if this is the final question of the test
                          const isLastQuestion = testConfig && currentNum === testConfig.subjects[subject as keyof typeof testConfig.subjects]?.questions
                          
                          // End test if we've reached the last question
                          if (allAnswered && isLastQuestion) {
                            // Play level up sound for test completion
                            const levelUpAudio = new Audio('/sounds/level-up-06-370051.mp3')
                            playAudio(levelUpAudio)
                            setShowCompletionCelebration(true)
                            return i
                          }
                          
                          // Advance to next page if user is on last question of page (regardless of whether all questions on this page are answered)
                          if (i === pageQuestions.length - 1 && pdf && pageNum < pdf.numPages) {
                            // Find the next page that has questions for this subject
                            let nextPage = pageNum + 1
                            while (nextPage <= pdf.numPages) {
                              const subjectPageQuestions = active?.pageQuestions?.[subject as SectionId]
                              if (subjectPageQuestions?.[nextPage] && 
                                  subjectPageQuestions[nextPage].length > 0) {
                                break
                              }
                              nextPage++
                            }
                            
                            if (nextPage <= pdf.numPages) {
                          
                              setLastManualAdvance(nextPage)
                              setIsIntentionalPageChange(true) // Mark as intentional page change
                              setPageNum(nextPage)
                              return 0
                            }
                          }
                          
                          return i
                        })
                      }}
                      disabled={(() => {
                        const currentAnswer = answers[current?.id]
                        
                        // Button is disabled if current question is not answered
                        return currentAnswer === undefined
                      })()}
                    >
                    {(() => {
                      const allAnswered = pageQuestions.every(q => answers[q.id] !== undefined)
                      const isLastQuestionOnPage = qIdx === pageQuestions.length - 1
                      const isLastQuestion = testConfig && currentNum === testConfig.subjects[subject as keyof typeof testConfig.subjects]?.questions
                      
                      // Check if this is the final question of the test
                      if (allAnswered && isLastQuestion) {
                        return 'See Results'
                      }
                      
                      // Check if user is on last question of page (regardless of whether all questions on this page are answered)
                      if (isLastQuestionOnPage) {
                        return 'Next Page'
                      }
                      
                      // Otherwise show "Next question"
                      return 'Next question'
                    })()}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      </>
        )}
      </div>
      
      {/* Study Buddy - Show celebration version when active, otherwise show persistent */}
      {showStudyBuddy ? (
        <StudyBuddy 
          streak={streak}
          isCorrect={feedback?.ok || false}
          showMessage={showStudyBuddy}
          onMessageComplete={() => setShowStudyBuddy(false)}
        />
      ) : (
        <StudyBuddy 
          streak={streak}
          isCorrect={false}
          showMessage={false}
          onMessageComplete={() => {}}
          persistent={true}
        />
      )}
      
      <SuccessCelebration 
        show={showSuccessCelebration}
        onComplete={() => setShowSuccessCelebration(false)}
        type={streak >= 3 ? 'streak' : 'correct'}
        message={streak >= 3 ? `Amazing ${streak} in a row!` : 'Correct!'}
      />
      
      <TestCompletionCelebration
        show={showCompletionCelebration}
        onComplete={() => {
          setShowCompletionCelebration(false)
          navigate(`/test-selection/${testId}`)
        }}
        onReview={async () => {
          setShowCompletionCelebration(false)
          await saveSession()
          const answersParam = encodeURIComponent(JSON.stringify(answers))
          navigate(`/test-review/${subject}?testId=${testId}&answers=${answersParam}`)
        }}
        subject={subject}
        totalQuestions={allQuestions.length}
        correctAnswers={allQuestions.filter(q => answers[q.id] === q.answerIndex).length}
      />

      {/* Timer Setup Modal */}
      <AnimatePresence>
        {showTimerSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 grid place-items-center bg-black/40 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="card p-6 text-center max-w-md mx-4"
            >
              <div className="text-2xl mb-4">⏱️</div>
              <div className="text-xl font-semibold mb-4">Set Timer</div>
              <div className="text-sm text-secondary mb-6">
                Choose how many minutes to practice {subject}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Minutes (0 for no timer)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Enter minutes"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => setShowTimerSetup(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => {
                    if (timerMinutes > 0) {
                      setTimeRemaining(timerMinutes * 60)
                      setTimerEnabled(true)
                    }
                    setShowTimerSetup(false)
                  }}
                >
                  Start Timer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time's Up Modal */}
      <AnimatePresence>
        {showTimeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 grid place-items-center bg-black/40 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="card p-6 text-center max-w-md mx-4"
            >
              <div className="text-4xl mb-4">⏰</div>
              <div className="text-2xl font-semibold mb-4">Time's Up!</div>
              <div className="text-sm text-secondary mb-6">
                Your timer has expired. You can continue practicing or review your answers.
              </div>
              
              <div className="flex gap-3">
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => setShowTimeUp(false)}
                >
                  Continue
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={async () => {
                    setShowTimeUp(false)
                    await saveSession()
                    const answersParam = encodeURIComponent(JSON.stringify(answers))
                    navigate(`/test-review/${subject}?testId=${testId}&answers=${answersParam}`)
                  }}
                >
                  Review Answers
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

