import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getActiveTest } from '../lib/testStore'
import { motion, AnimatePresence } from 'framer-motion'

type Question = {
  id: string
  prompt: string
  choices: string[]
  answerIndex: number
  passage?: string
  passageId?: string
}

export default function Quiz() {
  const { subject } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const totalSeconds = Number(params.get('t') ?? 0)
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState<number>(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState<number>(0)
  const [showTimesUp, setShowTimesUp] = useState<boolean>(false)

  const correctAudio = useRef<HTMLAudioElement | null>(null)
  const incorrectAudio = useRef<HTMLAudioElement | null>(null)
  const timeupAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!subject) return
    const active = getActiveTest()
    if (active && active.sections[subject as any]) {
      setQuestions(active.sections[subject as any] as Question[])
      return
    }
    fetch(`/questions/${subject}.json`).then(r => r.json()).then((data: Question[]) => setQuestions(data)).catch(() => setQuestions([]))
  }, [subject])

  // Timer
  useEffect(() => {
    if (!totalSeconds) return
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!totalSeconds) return
    if (secondsLeft <= 0) {
      setShowTimesUp(true)
      timeupAudio.current?.play().catch(() => {})
      setTimeout(() => navigate('/summary', { replace: true, state: { score, total: questions.length } }), 1200)
      return
    }
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft, totalSeconds])

  const current = questions[index]
  const [results, setResults] = useState<Record<number, number | null>>({})

  const selectChoice = (i: number) => {
    if (!current) return
    if (selected !== null) return // prevent double taps during feedback
    setSelected(i)
    const correct = i === current.answerIndex
    setIsCorrect(correct)
    ;(correct ? correctAudio.current : incorrectAudio.current)?.play().catch(() => {})
  }

  const goNext = () => {
    if (selected === null) return
    // commit answer to results and score
    setResults(prev => ({ ...prev, [index]: selected }))
    if (isCorrect) setScore(s => s + 1)

    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      navigate('/summary', { state: { score: isCorrect ? score + 1 : score, total: questions.length } })
    } else {
      setIndex(nextIndex)
      setSelected(null)
      setIsCorrect(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <audio ref={correctAudio} src="/sounds/correct_answer.mp3" preload="auto" />
      <audio ref={incorrectAudio} src="/sounds/wrong_answer.wav" preload="auto" />
      <audio ref={timeupAudio} src="/sounds/timeup.mp3" preload="auto" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold capitalize">{subject} Practice</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Question {Math.min(index + 1, questions.length)} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalSeconds > 0 && (
            <div className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800 font-mono">
              {formatTime(secondsLeft)}
            </div>
          )}
          <div className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800 font-mono">Score: {score}</div>
        </div>
      </div>

      {/* Progress bar reflects answered count */}
      {questions.length > 0 && (
        <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all"
            style={{ width: `${(Object.keys(results).length / questions.length) * 100}%` }}
          />
        </div>
      )}

      <div className="card p-5">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {subject === 'english' && current.passage ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card p-4 leading-relaxed">
                    <h3 className="font-semibold mb-2">{(current.passageId || '').toUpperCase()}</h3>
                    <div className="text-sm whitespace-pre-wrap">{current.passage}</div>
                  </div>
                  <div>
                    <p className="text-lg mb-4 leading-relaxed">{current.prompt}</p>
                    <div className="space-y-3">
                      {current.choices.map((c, i) => {
                        let stateClass = ''
                        if (selected !== null) {
                          if (i === selected) {
                            stateClass = isCorrect ? 'choice-correct' : 'choice-incorrect'
                          } else if (!isCorrect && i === current.answerIndex) {
                            stateClass = 'choice-correct'
                          }
                        }
                        return (
                          <button key={i} className={`choice ${stateClass}`} onClick={() => selectChoice(i)}>
                            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-lg mb-4 leading-relaxed">{current.prompt}</p>
                  <div className="space-y-3">
                    {current.choices.map((c, i) => {
                      let stateClass = ''
                      if (selected !== null) {
                        if (i === selected) {
                          stateClass = isCorrect ? 'choice-correct' : 'choice-incorrect'
                        } else if (!isCorrect && i === current.answerIndex) {
                          stateClass = 'choice-correct'
                        }
                      }
                      return (
                        <button key={i} className={`choice ${stateClass}`} onClick={() => selectChoice(i)}>
                          <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              <AnimatePresence>
                {isCorrect !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}
                  >
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex justify-end">
                <button className="btn btn-primary" onClick={goNext} disabled={selected === null}>
                  {index + 1 >= questions.length ? 'Finish' : 'Next'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showTimesUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 grid place-items-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="card p-6 text-center"
            >
              <div className="text-2xl font-semibold">Time’s Up!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatTime(total: number) {
  const s = Math.max(0, total)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`
}


