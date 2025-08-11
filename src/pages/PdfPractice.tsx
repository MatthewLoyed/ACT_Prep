import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
import { getActiveTest } from '../lib/testStore'
import type { SectionId } from '../lib/testStore'
import { AnimatePresence, motion } from 'framer-motion'

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
  const { subject = 'english' } = useParams()
  const [params] = useSearchParams()
  const pdfUrl = params.get('url') || '/practice_tests/Preparing-for-the-ACT.pdf'

  console.log(`PdfPractice: Current subject = ${subject}`)

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1.5)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const leftPaneRef = useRef<HTMLDivElement | null>(null)

  const active = getActiveTest()
  const allQuestions: Question[] = useMemo(() => {
    const fallback: Question[] = []
    if (!subject) return fallback
    const fromActive = (active?.sections as Partial<Record<SectionId, unknown[]>> | undefined)?.[subject as SectionId] as
      | Question[]
      | undefined
    return (fromActive ?? fallback)
  }, [active, subject])

  const [pageQuestionNums, setPageQuestionNums] = useState<number[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [correctAudio] = useState(() => new Audio('/sounds/correct_answer.mp3'))
  const [wrongAudio] = useState(() => new Audio('/sounds/wrong_answer.wav'))
  const [feedback, setFeedback] = useState<{ ok: boolean; id: string } | null>(null)
  const [qIdx, setQIdx] = useState<number>(0)
  const [testCompleted, setTestCompleted] = useState<boolean>(false)
  const [lastManualAdvance, setLastManualAdvance] = useState<number | null>(null)
  const [currentPageText, setCurrentPageText] = useState<string>('')

  // Reset all state when subject changes to prevent data corruption
  useEffect(() => {
    console.log(`Subject changed to: ${subject} - Resetting all state`)
    setPageQuestionNums([])
    setAnswers({})
    setFeedback(null)
    setQIdx(0)
    setTestCompleted(false)
    setLastManualAdvance(null)
    setLastAutoSkip(null)
    setCurrentPageText('')
    // Reset page number to 1, will be updated by the section detection useEffect
    setPageNum(1)
  }, [subject])

  // Load PDF
  useEffect(() => {
    let cancelled = false
    getDocument(pdfUrl).promise.then(doc => { if (!cancelled) setPdf(doc) })
    return () => { cancelled = true }
  }, [pdfUrl])

  // Jump to first real question page on load
  useEffect(() => {
    if (!pdf) return
    let mounted = true
    ;(async () => {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        type PDFTextItem = { str: string }
        const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
        
        // Check for section headers
        const isEnglishSection = /ENGLISH TEST/i.test(text)
        const isMathSection = /MATHEMATICS TEST\s+50\s+Minutes—45\s+Questions/i.test(text)
        const isReadingSection = /READING TEST\s+40\s+Minutes—36\s+Questions/i.test(text)
        
        if ((isEnglishSection || isMathSection || isReadingSection) && subject) {
          const sectionMatch = 
            (isEnglishSection && subject === 'english') ||
            (isMathSection && subject === 'math') ||
            (isReadingSection && subject === 'reading')
          
          if (sectionMatch) {
            // For reading, start on the section header page (even if no questions)
            if (subject === 'reading') {
              console.log(`READING TEST section found on page ${i} - setting as starting page`)
              console.log(`READING DEBUG: Page ${i} text preview: "${text.substring(0, 200)}..."`)
              if (mounted) setPageNum(i)
              break
            } else {
              // For other sections, look for actual questions with answer choices
              const hasQuestions = /\d{1,2}[.)]\s+[^]*?[A-DFGHJ][.)]\s+/.test(text)
              if (hasQuestions) {
                console.log(`${subject.toUpperCase()} section found on page ${i} - setting as starting page`)
                if (mounted) setPageNum(i)
                break
              }
            }
          }
        }
      }
    })()
    return () => { mounted = false }
  }, [pdf, subject])

  // Render page
  const [lastAutoSkip, setLastAutoSkip] = useState<number | null>(null)

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    ;(async () => {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      type PDFTextItem = { str: string }
      const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
      setCurrentPageText(text)
      
      // Enhanced question detection: look for numbers followed by answer choices
      // Must have a period after the number (like 6.) and find answer choices before next question
      // IMPORTANT: Questions cannot extend past page boundaries
      // Use parentheses-aware pattern to prevent cutting inside parentheses
      let questionMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
      let nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 75)
      
      // For reading, also try a more flexible pattern since questions might be shorter
      if (subject === 'reading' && nums.length === 0) {
        console.log('No reading questions found with standard pattern, trying flexible pattern...')
        questionMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
        nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 36)
        console.log(`Reading flexible pattern found: ${nums.length} questions`)
      }
      
      // Use all question matches without page boundary filtering
      nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 75)
      
      // Debug for page 27 specifically
      if (pageNum === 27) {
        console.log(`=== PAGE 27 DEBUG ===`)
        console.log(`Raw text preview:`, text.substring(0, 500))
        console.log(`All question matches:`, questionMatches.map(m => ({
          num: m[1],
          fullMatch: m[0].substring(0, 100),
          index: m.index
        })))
        console.log(`Filtered numbers:`, nums)
        
        // Also try a broader search for any numbers that might be questions
        const allNumbers = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]/g))
        console.log(`All numbers found:`, allNumbers.map(m => ({
          num: m[1],
          context: text.substring(Math.max(0, m.index - 20), m.index + 50)
        })))
      }
      
      // Debug for questions 22 and 44 specifically
      if (nums.includes(22) || nums.includes(44)) {
        console.log(`=== QUESTIONS 22/44 DEBUG ===`)
        console.log(`Page ${pageNum} detected questions:`, nums)
        console.log(`Question 22 detected:`, nums.includes(22))
        console.log(`Question 44 detected:`, nums.includes(44))
      }
      
      // Debug for reading questions specifically
      if (subject === 'reading') {
        console.log(`=== READING QUESTIONS DEBUG ===`)
        console.log(`Page ${pageNum} detected reading questions:`, nums)
        console.log(`Question matches:`, questionMatches.map(m => ({
          num: m[1],
          fullMatch: m[0].substring(0, 100),
          index: m.index
        })))
        
        // Show sample of detected questions
        if (nums.length > 0) {
          console.log(`Sample reading questions on page ${pageNum}:`, nums.slice(0, 5))
        }
      }
      
      // Use all detected question numbers without consecutive filtering
      const uniqueNums = [...new Set(nums)].sort((a, b) => a - b)
      setPageQuestionNums(uniqueNums)
      
      // Auto-skip pages with no questions, but allow reading test start page
      if (uniqueNums.length === 0 && pdf && pageNum < pdf.numPages && lastAutoSkip !== pageNum && lastManualAdvance !== pageNum) {
        // Special case: don't auto-skip reading test start page even if no questions
        const isReadingTestStart = subject === 'reading' && /READING TEST\s+40\s+Minutes—36\s+Questions/i.test(text)
        
        if (!isReadingTestStart) {
          console.log(`Auto-skipping page ${pageNum} (no questions detected)`)
          setLastAutoSkip(pageNum)
          setTimeout(() => setPageNum(p => Math.min(pdf.numPages, p + 1)), 0)
          return
        } else {
          console.log(`READING DEBUG: Staying on reading test start page ${pageNum} (no questions but test start detected)`)
        }
      }

      // Check for test ending - allow completion of questions on the final page
      const hasEndOfTest = 
        (subject === 'english' && /END OF TEST 1/i.test(text)) ||
        (subject === 'math' && /END OF TEST 2/i.test(text)) ||
        (subject === 'reading' && /END OF TEST 3/i.test(text))
      
      // Debug: log when we see "END OF TEST" 
      if (hasEndOfTest) {
        console.log(`Page ${pageNum}: Found "END OF TEST" with questions [${uniqueNums.join(', ')}]`)
      }

      console.log(`Rendering page ${pageNum}, detected questions: [${uniqueNums.join(', ')}]`)
      
      // Clear manual advance flag after a delay to allow auto-skip on subsequent pages
      if (lastManualAdvance === pageNum) {
        setTimeout(() => setLastManualAdvance(null), 100)
      }
      // Render PDF
      const natural = page.getViewport({ scale: 1 })
      let fitScale = 1
      if (leftPaneRef.current) {
        const containerWidth = leftPaneRef.current.clientWidth - 16
        fitScale = Math.max(1, containerWidth / natural.width)
      }
      const viewport = page.getViewport({ scale: fitScale * zoom })
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
    })()
  }, [pdf, pageNum, zoom, lastAutoSkip, lastManualAdvance])

  // Preload sounds
  useEffect(() => {
    correctAudio.load(); wrongAudio.load()
  }, [correctAudio, wrongAudio])

  const pageQuestions: Question[] = useMemo(() => {
    if (!pageQuestionNums.length) return []
    
    // Filter questions by section - only use questions from the current subject
    const sectionQuestions = allQuestions.filter(q => {
      const sectionMatch = q.id.match(/^(english|math|reading)-/)
      return sectionMatch && sectionMatch[1] === subject
    })
    
    // Pre-create all question slots for consistent mapping
    const questionSlots = new Map<number, Question>()
    
    // For Math, pre-create slots 1-45
    if (subject === 'math') {
      for (let i = 1; i <= 45; i++) {
        questionSlots.set(i, {
          id: `math-${i}`,
          prompt: `Question ${i} (not loaded)`,
          choices: ['', '', '', ''],
          choiceLetters: ['A', 'B', 'C', 'D']
        })
      }
    }
    // For English, pre-create slots 1-50
    else if (subject === 'english') {
      for (let i = 1; i <= 50; i++) {
        questionSlots.set(i, {
          id: `english-${i}`,
          prompt: `Question ${i} (not loaded)`,
          choices: ['', '', '', ''],
          choiceLetters: ['A', 'B', 'C', 'D']
        })
      }
    }
    // For Reading, pre-create slots 1-36 (ACT reading has 36 questions)
    else if (subject === 'reading') {
      for (let i = 1; i <= 36; i++) {
        questionSlots.set(i, {
          id: `reading-${i}`,
          prompt: `Question ${i} (not loaded)`,
          choices: ['', '', '', ''],
          choiceLetters: ['A', 'B', 'C', 'D']
        })
      }
    }
    
          // Fill in the actual questions from parsed data
      for (const q of sectionQuestions) {
        const m = q.id.match(/(\d+)/)
        const num = m ? Number(m[1]) : -1
        if (num > 0 && questionSlots.has(num)) {
          questionSlots.set(num, q)
          if (pageNum === 27) {
            console.log(`Mapped question ${num} to ${q.id}`)
          }
          
          // Debug for reading questions
          if (subject === 'reading' && (num === 1 || num === 10 || num === 20 || num === 30)) {
            console.log(`Reading question ${num} mapped:`, {
              id: q.id,
              prompt: q.prompt.substring(0, 100) + '...',
              choices: q.choices,
              answerIndex: q.answerIndex
            })
          }
        }
      }
    
    // Get questions for this page
    const ordered = pageQuestionNums.map(n => questionSlots.get(n)).filter(Boolean) as Question[]
    
   
    
    console.log(`Page ${pageNum}: ${subject} questions [${ordered.map(q => q.id).join(', ')}]`)
    
    // Debug: show question details for Math
    if (subject === 'math' && ordered.length > 0) {
      console.log(`${subject} questions on page ${pageNum}:`)
      ordered.forEach(q => {
        console.log(`  ${q.id}: "${q.prompt.substring(0, 50)}..."`)
      })
    }
    
    // Debug: show question details for Math
    if (subject === 'math' && ordered.length > 0) {
      console.log(`${subject} questions on page ${pageNum}:`)
      ordered.forEach(q => {
        console.log(`  ${q.id}: "${q.prompt.substring(0, 50)}..."`)
      })
    }
    
    return ordered
  }, [pageQuestionNums, allQuestions, pageNum, subject])

  // Reset question index when page changes
  useEffect(() => { setQIdx(0) }, [pageNum])

  // Clear previous test data when switching sections
  useEffect(() => {
    setAnswers({})
    setFeedback(null)
    setQIdx(0)
    setTestCompleted(false)
    setLastManualAdvance(null)
    setLastAutoSkip(null)
    console.log(`Switched to ${subject} section - cleared previous test data`)
  }, [subject])

  // Clean up math symbols for better display
  const cleanMathText = useCallback((text: string): string => {
    return text
      // Remove page artifacts and unwanted text
      .replace(/DO YOUR FIGURING HERE\.?\s*\d*\s*\d*/gi, '')
      .replace(/GO ON TO THE NEXT PAGE\.?/gi, '')
      .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n|$)/gi, '')
      .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
      .replace(/QU[0-9A-Z.-]+/g, '')
      // Remove test ending text that might contaminate choices
      .replace(/END OF TEST\s*\d+\.?/gi, '')
      .replace(/END OF TEST\s*\d+\.?\s*$/gi, '')
      // Fix pi symbols: "7200 _ pi_symbol" → "7200π"
      .replace(/(\d+)\s*_\s*pi_symbol/g, '$1π')
      .replace(/pi_symbol/g, 'π')
      // Fix all square root patterns: "√ _ 143" → "√143", "√ _ -16" → "√-16"
      .replace(/√\s*_\s*(-?\d+)/g, '√$1')
      // Fix "12 _ √ 194" → "12 / √194"
      .replace(/(\d+)\s*_\s*√\s*(\d+)/g, '$1 / √$2')
      // Fix fractions: "6 _ 5" → "6/5"
      .replace(/(\d+)\s*_\s*(\d+)/g, '$1/$2')
      // Fix exponents: "t 2" → "t^2" (only for standalone letters, not words)
      .replace(/(?<=\s|^)([a-zA-Z])\s+(\d+)(?=\s|$|[^\w])/g, (match, letter, num) => {
        // Don't add ^ if the letter is part of a word (like "at", "a", "an", "the")
        const commonWords = ['at', 'a', 'an', 'the', 'in', 'on', 'of', 'to', 'by', 'for', 'with', 'from']
        if (commonWords.includes(letter.toLowerCase())) {
          return `${letter} ${num}`
        }
        return `${letter}^${num}`
      })
      // Fix negative signs: "- 4.9" → "-4.9"
      .replace(/-\\s+(\\d+\\.?\\d*)/g, '-$1')
      // Add line breaks between equations in systems
      .replace(/(\d+\s*[a-zA-Z]\s*[+\-*/=]\s*[a-zA-Z]\s*=\s*\d+)\s+(-\s*\d+\s*[a-zA-Z]\s*[+\-*/=]\s*[a-zA-Z]\s*=\s*\d+)/g, '$1\n$2')
      // Clean up extra spaces around operators
      .replace(/\s*([+\-*/=])\s*/g, ' $1 ')
      .trim()
  }, [])

  const onAnswer = useCallback((qid: string, idx: number, correctIdx?: number) => {
    setAnswers(prev => ({ ...prev, [qid]: idx }))
    const ok = typeof correctIdx === 'number' ? idx === correctIdx : false
    setFeedback({ ok, id: qid })
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
    <div className="grid lg:grid-cols-[3fr_1fr] gap-4">
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
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-2">🎉 Test Completed!</div>
            <div className="text-slate-600 dark:text-slate-400">
              You have completed the {subject.toUpperCase()} test.
            </div>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => window.history.back()}
            >
              Back to Test Selection
            </button>
          </div>
                ) : (
          <>
            <div className="card p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Questions on this page</div>
              {pageQuestions.length === 0 && (
                <div className="mt-2 text-sm">
                  {subject === 'reading' ? (
                    <span>Reading passage page. Click "Next Page" to see questions.</span>
                  ) : (
                    <span>No detected questions on this page.</span>
                  )}
                </div>
              )}
              <div className="mt-2 text-xs opacity-60">Detected: [{pageQuestionNums.join(', ')}]</div>
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
                          console.log(`READING DEBUG: Manual navigation from page ${pageNum} to page ${nextPage}`)
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
                className="card p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Question {currentNum ?? ''}:
                </div>
                <div className="font-medium mb-2 mt-1">
                  {cleanMathText(current.prompt)}
                </div>
                <div className="space-y-2">
                  {current.choices.map((choice, i) => {
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

                <AnimatePresence>
                  {feedback?.id === current.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm ${feedback.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}
                    >
                      {feedback.ok ? 'Correct!' : 'Incorrect'}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-20 flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={() => setQIdx(i => Math.max(0, i - 1))} disabled={qIdx === 0}>Prev question</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setFeedback(null)
                      setQIdx(i => {
                        if (i + 1 < pageQuestions.length) return i + 1
                        // Only advance if all questions answered
                        const allAnswered = pageQuestions.every(q => answers[q.id] !== undefined)
                        
                        // Check if this is the final question of the test
                        const isLastQuestion = 
                          (subject === 'english' && currentNum === 50) ||
                          (subject === 'math' && currentNum === 45) ||
                          (subject === 'reading' && currentNum === 36)
                        
                        // Debug completion status for reading
                        if (subject === 'reading') {
                          console.log(`Reading completion check: currentNum=${currentNum}, isLastQuestion=${isLastQuestion}`)
                        }
                        
                        // Check if we're on a page with "END OF TEST" text
                        const hasEndOfTest = 
                          (subject === 'english' && /END OF TEST 1/i.test(currentPageText)) ||
                          (subject === 'math' && /END OF TEST 2/i.test(currentPageText)) ||
                          (subject === 'reading' && /END OF TEST 3/i.test(currentPageText))
                        
                        // End test if we've reached the last question OR completed all questions on END OF TEST page
                        if (allAnswered && (isLastQuestion || hasEndOfTest)) {
                          console.log(`${subject.toUpperCase()} test completed - ${isLastQuestion ? 'reached last question' : 'completed all questions on END OF TEST page'}`)
                          setTestCompleted(true)
                          return i
                        }
                        
                        // Otherwise, advance to next page if possible
                        if (allAnswered && pdf && pageNum < pdf.numPages) {
                          const nextPage = Math.min(pdf.numPages, pageNum + 1)
                          console.log(`Manual advance from page ${pageNum} to page ${nextPage}`)
                          setLastManualAdvance(nextPage)
                          setPageNum(nextPage)
                          return 0
                        }
                        
                        return i
                      })
                    }}
                    disabled={qIdx >= pageQuestions.length - 1 && !pageQuestions.every(q => answers[q.id] !== undefined)}
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
                        
                        // Debug button text for reading
                        if (subject === 'reading') {
                          console.log(`Reading button text check: qIdx=${qIdx}, pageQuestions.length=${pageQuestions.length}, allAnswered=${allAnswered}, isLastQuestion=${isLastQuestion}, hasEndOfTest=${hasEndOfTest}`)
                        }
                        
                        if (qIdx >= pageQuestions.length - 1 && allAnswered && (isLastQuestion || hasEndOfTest)) {
                        return 'Finish Test'
                      }
                      return qIdx >= pageQuestions.length - 1 ? 'Next Page' : 'Next question'
                    })()}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

