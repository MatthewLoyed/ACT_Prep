import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveTest } from '../lib/testStore'
import { supabase } from '../lib/supabase'

type Question = {
  id: string
  prompt: string
  choices: string[]
  answerIndex: number
}

type Section = 'english' | 'math' | 'reading' | 'science'

export default function FullTest() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const totalSeconds = Number(params.get('t') ?? 0)
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds)
  const [sections] = useState<Section[]>(['english', 'math', 'reading', 'science'])
  const [sectionIndex, setSectionIndex] = useState<number>(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState<number>(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState<number>(0)
  const [results, setResults] = useState<Record<string, number>>({})
  const [showIntro, setShowIntro] = useState<boolean>(false)

  const section = sections[sectionIndex]
  const current = questions[index]

  // load section questions
  useEffect(() => {
    const active = getActiveTest()
    if (active && active.sections[section]) {
      setQuestions((active.sections[section] as Question[]) || [])
      setIndex(0)
      setSelected(null)
      setShowIntro(true)
      return
    }
    fetch(`/questions/${section}.json`).then(r => r.json()).then((q: Question[]) => {
      setQuestions(q)
      setIndex(0)
      setSelected(null)
      setShowIntro(true)
    })
  }, [section])

  // timer
  useEffect(() => {
    if (!totalSeconds) return
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!totalSeconds) return
    if (secondsLeft <= 0) finish()
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft, totalSeconds])

  const answeredCount = useMemo(() => Object.keys(results).length, [results])
  const totalCount = useMemo(() =>  questionsPerTestTotal, [])

  function commitAnswer() {
    if (selected === null || !current) return
    setResults(prev => ({ ...prev, [`${section}-${index}`]: selected }))
    if (selected === current.answerIndex) setScore(s => s + 1)
  }

  function next() {
    if (selected === null) return
    commitAnswer()
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      const nextSection = sectionIndex + 1
      if (nextSection >= sections.length) finish()
      else {
        setSectionIndex(nextSection)
        setSelected(null)
        setIndex(0)
      }
    } else {
      setIndex(nextIndex)
      setSelected(null)
    }
  }

  async function finish() {
    // save session to history
    try {
      await supabase
        .from('sessions')
        .insert({
          date: new Date().toISOString(),
          section: 'full',
          rawScore: score,
          total: totalCount,
          durationSec: totalSeconds - secondsLeft,
        })
    } catch (error) {
      console.error('Error saving session:', error)
    }
    navigate('/summary', { state: { score, total: totalCount } })
  }

  return (
    <div className={`max-w-3xl mx-auto ${showIntro ? 'blur-sm select-none' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Full Test</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">Section: {section}</p>
        </div>
        <div className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800 font-mono">
          {formatTime(secondsLeft)}
        </div>
      </div>

      {/* Progress bar of entire test */}
      <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(answeredCount / totalCount) * 100}%` }} />
      </div>

      <div className="card p-5">
        {current && (
          <div>
            <p className="text-lg mb-4 leading-relaxed">{current.prompt}</p>
            <div className="space-y-3">
              {current.choices.map((c, i) => (
                <button key={i} className={`choice ${selected === i ? 'ring-2 ring-sky-400 dark:ring-sky-500' : ''}`} onClick={() => setSelected(i)}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">Question {index + 1} of {questions.length}</div>
              <button className="btn btn-primary" disabled={selected === null} onClick={next}>{sectionIndex + 1 >= sections.length && index + 1 >= questions.length ? 'Finish' : 'Next'}</button>
            </div>
          </div>
        )}
      </div>

      {showIntro && (
        <div className="fixed inset-0 z-[60] grid place-items-center">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
          <div className="relative card p-8 text-center max-w-md">
            <div className="text-base text-slate-200/90 mb-2">You are now entering the</div>
            <div className="text-3xl md:text-4xl font-extrabold capitalize">{section} section</div>
            <button className="mt-6 btn btn-primary" onClick={() => setShowIntro(false)}>Begin</button>
          </div>
        </div>
      )}
    </div>
  )
}

const questionsPerTestTotal = 3 * 4 // using 3 sample Qs per section in this demo

function formatTime(total: number) {
  const s = Math.max(0, total)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`
}


