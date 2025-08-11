import { useEffect, useMemo, useState } from 'react'
import { getActiveTest } from '../lib/testStore'

type Question = {
  id: string
  prompt: string
  choices: string[]
  answerIndex?: number
  passageId?: string
  passage?: string
}

export default function EnglishPassageView() {
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    const active = getActiveTest()
    const items = (active?.sections.english as Question[]) || []
    setQuestions(items)
  }, [])

  const byPassage = useMemo(() => {
    const map = new Map<string, { passage: string; qs: Question[] }>()
    for (const q of questions) {
      const key = q.passageId ?? 'unknown'
      const current = map.get(key) || { passage: q.passage ?? '', qs: [] }
      current.qs.push(q)
      if (!current.passage && q.passage) current.passage = q.passage
      map.set(key, current)
    }
    return Array.from(map.entries())
  }, [questions])

  return (
    <div className="space-y-8">
      {byPassage.map(([pid, block]) => (
        <div key={pid} className="grid md:grid-cols-2 gap-4">
          <div className="card p-4 leading-relaxed">
            <h3 className="font-semibold mb-2">{pid.toUpperCase()}</h3>
            <div className="text-sm whitespace-pre-wrap">{block.passage}</div>
          </div>
          <div className="space-y-4">
            {block.qs.map(q => (
              <div key={q.id} className="card p-4">
                <div className="font-medium mb-2">{q.prompt}</div>
                <div className="space-y-2">
                  {q.choices.map((c, i) => (
                    <label key={i} className="choice block">
                      <input type="radio" name={q.id} className="mr-2" />
                      {String.fromCharCode(65 + i)}. {c}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}




