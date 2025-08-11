import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

export default function TimerSetup() {
  const { subject } = useParams()
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<number>(0)

  const start = () => {
    const secs = Math.max(0, minutes * 60)
    navigate(`/quiz/${subject}?t=${secs}`)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Set timer</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4 capitalize">Subject: {subject}</p>

      <div className="card p-4 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600 dark:text-slate-300">Minutes (0 for no timer)</span>
          <input
            type="number"
            min={0}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <button className="btn btn-primary w-full" onClick={start}>Start</button>
      </div>
    </div>
  )
}


