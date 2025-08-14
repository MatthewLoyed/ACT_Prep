import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
import { loadTestFromSupabase } from '../lib/supabaseTestStore'
import type { TestBundle } from '../lib/testStore'
import { cleanMathText } from '../lib/actParser'

// Define types locally
type SectionId = 'english' | 'math' | 'reading' | 'science'
import { AnimatePresence, motion } from 'framer-motion'
import StudyBuddy from '../components/StudyBuddy'
import SuccessCelebration from '../components/SuccessCelebration'
import SimpleParticles from '../components/SimpleParticles'
import EngagingLoader from '../components/EngagingLoader'
import TestCompletionCelebration from '../components/TestCompletionCelebration'
import AnimatedCounter from '../components/AnimatedCounter'

GlobalWorkerOptions.workerSrc = pdfWorker

type Question = {
  id: string
  prompt: string
  choices: string[]
  choiceLetters?: string[] // Add choice letters (A, B, C, D or F, G, H, J)
  answerIndex?: number
  passage?: string
  passageId?: string
}

export default function PdfPractice() {
  const navigate = useNavigate()
  const { subject = 'english' } = useParams()
  const [params] = useSearchParams()
  const testId = params.get('testId') || ''

  // console.log(`PdfPractice: Current subject = ${subject}, testId = ${testId}`)

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1.5)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const leftPaneRef = useRef<HTMLDivElement | null>(null)

  const [active, setActive] = useState<TestBundle | null>(null)
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
        // PDF debug removed
        const loadedTest = await loadTestFromSupabase(testId)
        console.log('PDF DEBUG: Test loaded:', loadedTest)
        console.log('PDF DEBUG: Has PDF data:', !!loadedTest?.pdfData)
        setActive(loadedTest)
      } catch (error) {
        console.error('PDF DEBUG: Failed to load test:', error)
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
    
    // Debug: Check if questions have answers
    if (questions.length > 0) {
      const questionsWithAnswers = questions.filter(q => q.answerIndex !== undefined)
      console.log(`PRACTICE DEBUG: ${subject} section loaded ${questions.length} questions`)
      console.log(`PRACTICE DEBUG: ${questionsWithAnswers.length} questions have answers`)
      
      // Show first few questions with their answers
      questions.slice(0, 3).forEach((q, i) => {
        console.log(`PRACTICE DEBUG: Question ${i + 1}: ID=${q.id}, Answer=${q.answerIndex}, Choices=${q.choices.length}`)
      })
    }
    
    return questions
  }, [active, subject])


  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [correctAudio] = useState(() => new Audio('/sounds/correct_answer.mp3'))
  const [wrongAudio] = useState(() => new Audio('/sounds/wrong_answer.wav'))
  const [feedback, setFeedback] = useState<{ ok: boolean; id: string } | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [showStreakMessage, setShowStreakMessage] = useState<boolean>(false)
  const [showStudyBuddy, setShowStudyBuddy] = useState<boolean>(false)
  const [showSuccessCelebration, setShowSuccessCelebration] = useState<boolean>(false)
  const [qIdx, setQIdx] = useState<number>(0)
  const [testCompleted, setTestCompleted] = useState<boolean>(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState<boolean>(false)
  const [lastManualAdvance, setLastManualAdvance] = useState<number | null>(null)
  const [isPageDetectionRunning, setIsPageDetectionRunning] = useState(false)
  const [currentPageText, setCurrentPageText] = useState<string>('')

  // Reset all state when subject changes to prevent data corruption
  useEffect(() => {
    // console.log(`Subject changed to: ${subject} - Resetting all state`)

    setAnswers({})
    setFeedback(null)
    setQIdx(0)
    setTestCompleted(false)
    setLastManualAdvance(null)
    setCurrentPageText('')
    setStreak(0) // Reset streak when changing subjects
    setShowStreakMessage(false) // Hide any existing streak message
    // Reset page number to 1, will be updated by the section detection useEffect
    setPageNum(1)
  }, [subject])

  // Load PDF from stored data
  useEffect(() => {
    if (!testId || !active) {
      setPdf(null)
      return
    }
    
          // PDF loading debug info removed to focus on page detection
    
    if (!active.pdfData) {
      console.log('PDF DEBUG: No PDF data found in test')
      setPdf(null)
      return
    }
    
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
          console.log('PDF DEBUG: PDF loaded successfully, pages:', doc.numPages)
          setPdf(doc) 
        }
      }).catch(err => {
        console.error('PDF DEBUG: Error loading PDF:', err)
        setPdf(null)
      })
    } catch (err) {
      console.error('PDF DEBUG: Error converting PDF data:', err)
      setPdf(null)
    }
    
    return () => { cancelled = true }
  }, [testId, active])

  // Jump to first real question page on load
  useEffect(() => {
    if (!pdf || !active) return
    let mounted = true
    setIsPageDetectionRunning(true)
    
    ;(async () => {
      // Check if we already have stored page numbers for this test
      if (active.sectionPages && active.sectionPages[subject as SectionId]) {
        const storedPage = active.sectionPages[subject as SectionId]
        if (storedPage) {
          console.log(`PDF DEBUG: Using stored page ${storedPage} for ${subject} section`)
          if (mounted) {
            setPageNum(storedPage)
            setLastManualAdvance(storedPage)
            setIsPageDetectionRunning(false)
          }
          return
        }
      }
      
      // If no stored pages, this is an error - section pages should be detected during import
      console.error(`PDF DEBUG: No stored page for ${subject} - section pages should be detected during import`)
      if (mounted) {
        setIsPageDetectionRunning(false)
      }
      return
      
      // Mark detection as complete
      if (mounted) {
        setIsPageDetectionRunning(false)
      }
    })()
    
    return () => { 
      mounted = false 
      setIsPageDetectionRunning(false)
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
      const content = await page.getTextContent()
      type PDFTextItem = { str: string }
      const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
      
      if (!mounted) return
      setCurrentPageText(text)
      
      
      // Check for test ending - allow completion of questions on the final page
      const hasEndOfTest = 
        (subject === 'english' && /END OF TEST 1/i.test(text)) ||
        (subject === 'math' && /END OF TEST 2/i.test(text)) ||
        (subject === 'reading' && /END OF TEST 3/i.test(text))
      
      // Debug: log when we see "END OF TEST" 
      if (hasEndOfTest) {
        // console.log(`Page ${pageNum}: Found "END OF TEST" with questions [${questionNumbers.join(', ')}]`)
      }

      // Clear manual advance flag after a delay
      if (lastManualAdvance === pageNum) {
        setTimeout(() => setLastManualAdvance(null), 100)
      }
      // Render PDF
      if (!mounted) return
      
      const natural = page.getViewport({ scale: 1 })
      let fitScale = 1
      if (leftPaneRef.current) {
        const containerWidth = leftPaneRef.current.clientWidth - 16
        fitScale = Math.max(1, containerWidth / natural.width)
      }
      const viewport = page.getViewport({ scale: fitScale * zoom })
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
            canvas.style.width = '100%'
            canvas.style.height = 'auto'
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
    // Get questions for the current page using the stored pageQuestions mapping
    const subjectPageQuestions = active?.pageQuestions?.[subject as SectionId]
    if (subjectPageQuestions && subjectPageQuestions[pageNum]) {
      const questionIds = subjectPageQuestions[pageNum]
      return allQuestions.filter(q => questionIds.includes(q.id))
    }
    // Fallback: return all questions if no page mapping is available
    return allQuestions
  }, [allQuestions, active?.pageQuestions, subject, pageNum])

  // Reset question index when page changes
  useEffect(() => { setQIdx(0) }, [pageNum])

  // Clear previous test data when switching sections
  useEffect(() => {
    setAnswers({})
    setFeedback(null)
    setQIdx(0)
    setTestCompleted(false)
    setLastManualAdvance(null)
    setStreak(0) // Reset streak when switching sections
    setShowStreakMessage(false) // Hide any existing streak message
    console.log(`Switched to ${subject} section - cleared previous test data`)
  }, [subject])



  const onAnswer = useCallback((qid: string, idx: number, correctIdx?: number) => {
    setAnswers(prev => ({ ...prev, [qid]: idx }))
    const ok = typeof correctIdx === 'number' ? idx === correctIdx : false
    setFeedback({ ok, id: qid })
    
    // Play sound effects using existing audio files
    if (ok) {
      try { correctAudio.currentTime = 0 } catch { /* ignore */ }
      correctAudio.play().catch(() => {})
    } else {
      try { wrongAudio.currentTime = 0 } catch { /* ignore */ }
      wrongAudio.play().catch(() => {})
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
          // Play level up sound for streak milestones
          const levelUpAudio = new Audio('/sounds/level-up-06-370051.mp3')
          levelUpAudio.play().catch(() => {})
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
    
    try { (ok ? correctAudio : wrongAudio).currentTime = 0 } catch { /* ignore */ }
    ;(ok ? correctAudio : wrongAudio).play().catch(() => {})
    // Keep feedback visible longer so colors stay - only clear when moving to next question
    // setTimeout(() => setFeedback(f => (f?.id === qid ? null : f)), 800)
  }, [correctAudio, wrongAudio])

  const current = pageQuestions[qIdx]
  const currentNum = useMemo(() => {
    if (!current) return null
    const m = current.id.match(/(\d+)/)
    return m ? Number(m[1]) : null
  }, [current])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-dvh flex flex-col"
    >
      {/* Background Particles */}
      <SimpleParticles count={15} />

      {/* Test Title Bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <button 
            className="btn btn-ghost text-white hover:bg-white/20 border-white/20"
            onClick={() => navigate(`/test-selection/${testId}`)}
          >
            ← Back to Subjects
          </button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold tracking-wide">
              {subject?.toUpperCase()} TEST
            </h1>
            <p className="text-emerald-100 mt-1">
              {subject === 'english' && '35 Minutes — 50 Questions'}
              {subject === 'math' && '50 Minutes — 45 Questions'}
              {subject === 'reading' && '40 Minutes — 36 Questions'}
              {subject === 'science' && '40 Minutes — 40 Questions'}
            </p>
          </div>
          <div className="w-24"></div> {/* Spacer to center the title */}
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="bg-white/20 h-3 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-700 ease-out relative"
            style={{ width: `${Math.min(100, (Object.keys(answers).length / allQuestions.length) * 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            <div className="absolute right-0 top-0 w-2 h-full bg-white/50 rounded-full shadow-lg"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Object.keys(answers).length} / {allQuestions.length}
            </span>
          </div>
        </div>
        <div className="text-center mt-2 text-sm text-emerald-100 font-semibold">
          {Object.keys(answers).length === allQuestions.length ? '🎉 All questions completed!' : 'Keep going!'}
        </div>
      </div>
      
      <div className="flex-1 grid lg:grid-cols-[2fr_1fr] gap-6 p-4">
        {loading ? (
          <div className="col-span-2 card p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-4">Loading Test...</h2>
            <p className="text-secondary mb-6">
              Please wait while we load your test from the database.
            </p>
          </div>
        ) : !pdf ? (
          <div className="col-span-2 card p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold mb-4">No PDF Available</h2>
            <p className="text-secondary mb-6">
              {!testId ? 'No test selected. Please select a test first.' : 
               !active?.pdfData ? 'This test does not have PDF data. Please re-import the test.' :
               'Loading PDF... Please wait.'}
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
        ) : isPageDetectionRunning ? (
          <div className="col-span-2 card p-8 text-center">
            <EngagingLoader 
              message="Finding the right page for your test..." 
              size="lg"
              showThinking={true}
            />
            <p className="text-secondary mt-4">
              We're scanning through the PDF to find the {subject} section for you.
            </p>
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
        <canvas ref={canvasRef} className="mx-auto w-full" style={{ maxWidth: '100%', height: 'auto' }} />
        <div className="flex items-center justify-between mt-2 px-2 pb-2">
          <button className="btn btn-ghost" onClick={() => setPageNum(p => Math.max(1, p - 1))}>Prev</button>
          <button className="btn btn-primary" onClick={() => {
            if (pdf && pageNum < pdf.numPages) {
              const nextPage = Math.min(pdf.numPages, pageNum + 1)
              console.log(`READING DEBUG: Left pane navigation from page ${pageNum} to page ${nextPage}`)
              setLastManualAdvance(nextPage)
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
              {/* Debug info - commented out
      
              <div className="mt-2 text-xs opacity-60">Current: Question {currentNum} of {pageQuestions.length}</div>
              <div className="mt-2 text-xs opacity-60">Subject: {subject}</div>
              {subject === 'math' && (
                <div className="mt-2 text-xs opacity-60">
                  Math Debug: {pageQuestions.length} questions loaded
                </div>
              )}
              {current && subject === 'math' && (
                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                  <div>Question {currentNum}: {current.prompt.substring(0, 50)}...</div>
                  <div>Answer Index: {current.answerIndex !== undefined ? current.answerIndex : 'Not set'}</div>
                  <div>Answer Letter: {current.answerIndex !== undefined && current.choiceLetters?.[current.answerIndex] ? current.choiceLetters[current.answerIndex] : 'Not set'}</div>
                  <div>Choices: {current.choices.length}</div>
                </div>
              )}
              */}
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
                      onClick={() => setPageNum(p => Math.max(1, p - 1))}
                      disabled={pageNum === 1}
                    >
                      Previous Page
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (pdf && pageNum < pdf.numPages) {
                          const nextPage = Math.min(pdf.numPages, pageNum + 1)
                          // console.log(`READING DEBUG: Manual navigation from page ${pageNum} to page ${nextPage}`)
                          setLastManualAdvance(nextPage)
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
                className="card p-4 max-h-[75vh] overflow-y-auto"
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
                <div className="font-medium mb-4 mt-1">
                  {cleanMathText(current.prompt)}
                </div>
                <div className="space-y-3">
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
                    
                    // Use stored choice letters if available, otherwise fall back to A-D or F-J detection
                    let choiceLetter = current.choiceLetters?.[i] || 'A'
                    if (!current.choiceLetters || !current.choiceLetters[i]) {
                      // Fallback logic: check if first choice starts with F, G, H, J
                      if (current.choices.length > 0) {
                        const firstChoice = current.choices[0].trim()
                        // Enhanced pattern detection: supports both A-D and F-J patterns
                        if (firstChoice.match(/^[FGHJ][.)]/)) {
                          choiceLetter = String.fromCharCode(70 + i) // F-J
                        } else if (firstChoice.match(/^[ABCD][.)]/)) {
                          choiceLetter = String.fromCharCode(65 + i) // A-D
                        } else {
                          // Default fallback
                          choiceLetter = String.fromCharCode(65 + i) // A-D
                        }
                      }
                    }
                    
                    return (
                      <button key={i} className={`choice ${state}`} onClick={() => onAnswer(current.id, i, current.answerIndex)} disabled={disabled}>
                        <span className="font-medium mr-2">{choiceLetter}.</span>
                        {cleanMathText(current.choices[i] || '')}
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
                <div className="relative h-20">
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
                      className="flex justify-center my-4"
                    >
                      <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg ${feedback.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>
                        {feedback.ok ? '✅ Correct!' : '❌ Incorrect'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={() => setQIdx(i => Math.max(0, i - 1))} disabled={qIdx === 0}>Prev question</button>
                                      <button
                      className="btn btn-primary"
                      onClick={() => {
                        setFeedback(null)
                        setQIdx(i => {
                          // Check if all questions on current page are answered
                          const allAnswered = pageQuestions.every(q => answers[q.id] !== undefined)
                          
                          // If not all answered, go to next question on same page
                          if (!allAnswered && i + 1 < pageQuestions.length) {
                            return i + 1
                          }
                          
                          // If all answered, check if this is the final question of the test
                          const isLastQuestion = 
                            (subject === 'english' && currentNum === 50) ||
                            (subject === 'math' && currentNum === 45) ||
                            (subject === 'reading' && currentNum === 36)
                          
                          // Check if we're on a page with "END OF TEST" text
                          const hasEndOfTest = 
                            (subject === 'english' && /END OF TEST 1/i.test(currentPageText)) ||
                            (subject === 'math' && /END OF TEST 2/i.test(currentPageText)) ||
                            (subject === 'reading' && /END OF TEST 3/i.test(currentPageText))
                          
                          // End test if we've reached the last question OR completed all questions on END OF TEST page
                          if (allAnswered && (isLastQuestion || hasEndOfTest)) {
                            console.log(`${subject.toUpperCase()} test completed - ${isLastQuestion ? 'reached last question' : 'completed all questions on END OF TEST page'}`)
                            // Play level up sound for test completion
                            const levelUpAudio = new Audio('/sounds/level-up-06-370051.mp3')
                            levelUpAudio.play().catch(() => {})
                            setShowCompletionCelebration(true)
                            return i
                          }
                          
                          // Otherwise, advance to next page if all questions are answered
                          if (allAnswered && pdf && pageNum < pdf.numPages) {
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
                              console.log(`Manual advance from page ${pageNum} to page ${nextPage}`)
                              setLastManualAdvance(nextPage)
                              setPageNum(nextPage)
                              return 0
                            }
                          }
                          
                          return i
                        })
                      }}
                      disabled={answers[current?.id] === undefined}
                    >
                    {(() => {
                      const allAnswered = pageQuestions.every(q => answers[q.id] !== undefined)
                      const isLastQuestion = 
                        (subject === 'english' && currentNum === 50) ||
                        (subject === 'math' && currentNum === 45) ||
                        (subject === 'reading' && currentNum === 36)
                      const hasEndOfTest = 
                        (subject === 'english' && /END OF TEST 1/i.test(currentPageText)) ||
                        (subject === 'math' && /END OF TEST 2/i.test(currentPageText)) ||
                        (subject === 'reading' && /END OF TEST 3/i.test(currentPageText))
                      
                      // Check if this is the final question of the test
                      if (allAnswered && (isLastQuestion || hasEndOfTest)) {
                        return 'See Results'
                      }
                      
                      // Check if all questions on current page are answered
                      if (allAnswered) {
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
      
      {/* Visual Enhancement Components */}
      <StudyBuddy 
        streak={streak}
        isCorrect={feedback?.ok || false}
        showMessage={showStudyBuddy}
        onMessageComplete={() => setShowStudyBuddy(false)}
      />
      
      {/* Persistent Study Buddy */}
      <StudyBuddy 
        streak={streak}
        isCorrect={false}
        showMessage={false}
        onMessageComplete={() => {}}
        persistent={true}
      />
      
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
        onReview={() => {
          setShowCompletionCelebration(false)
          const answersParam = encodeURIComponent(JSON.stringify(answers))
          navigate(`/test-review/${subject}?testId=${testId}&answers=${answersParam}`)
        }}
        subject={subject}
        totalQuestions={allQuestions.length}
        correctAnswers={allQuestions.filter(q => answers[q.id] === q.answerIndex).length}
      />

    </motion.div>
  )
}

