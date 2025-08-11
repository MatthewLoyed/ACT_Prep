import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function FullTestSetup() {
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<number>(120)

  const start = () => {
    navigate(`/full-test?t=${minutes * 60}`)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Full Test setup</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4">All four sections in one sitting.</p>

      <div className="card p-4 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600 dark:text-slate-300">Total minutes</span>
          <input
            type="number"
            min={30}
            max={240}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <button className="btn btn-primary w-full" onClick={start}>Start Full Test</button>
      </div>
    </div>
  )
}




