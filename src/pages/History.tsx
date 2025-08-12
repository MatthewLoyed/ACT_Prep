import { useEffect, useMemo, useState } from 'react'

type SectionKey = 'english' | 'math' | 'reading' | 'science'

type Session = {
  date: string
  section: SectionKey | 'full'
  rawScore: number
  total: number
  durationSec: number
}

export default function History() {
  const [goal, setGoal] = useState<number>(() => Number(localStorage.getItem('goal36') ?? 28))
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sessions') ?? '[]') as Session[]
      setSessions(stored)
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('goal36', String(goal))
  }, [goal])

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

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Progress & History</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">Stay encouraged — progress compounds.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Overall ACT® (est.)</div>
          <div className="text-4xl font-bold">{overallAct} / 36</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Questions practiced</div>
          <div className="text-4xl font-bold">{overallTotal}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total minutes</div>
          <div className="text-4xl font-bold">{Math.round(overallTime / 60)}</div>
        </div>
      </div>

      <div className="mt-8 card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Your goal</h3>
            <p className="text-slate-600 dark:text-slate-400">Aim high and track your momentum.</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={36} value={goal} onChange={e => setGoal(Number(e.target.value))} className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900" />
            <span className="text-sm">/ 36</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
            <div className="h-full brand-gradient" style={{ width: `${Math.min(100, (overallAct / goal) * 100)}%` }} />
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Estimated ACT® vs goal</div>
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
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{addTip(k)}</p>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">Practiced: {t.total} questions • {Math.round(t.time / 60)} min</div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 card p-5">
        <h3 className="text-xl font-semibold">Recent sessions</h3>
        <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
          {sessions.length === 0 && (
            <div className="py-4 text-slate-600 dark:text-slate-400">No practice yet. Start a subject or a full test — small steps build big results!</div>
          )}
          {sessions.map((s, i) => (
            <div key={i} className="py-3 flex items-center justify-between text-sm">
              <div className="capitalize">{s.section}</div>
              <div className="text-slate-600 dark:text-slate-400">{new Date(s.date).toLocaleString()}</div>
              <div>{s.rawScore}/{s.total}</div>
              <div>{Math.round(s.durationSec/60)} min</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




