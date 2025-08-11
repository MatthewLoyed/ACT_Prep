import { Link, useLocation } from 'react-router-dom'

function convertToActScale(rawScore: number, total: number) {
  if (total <= 0) return 0
  const proportion = rawScore / total
  // Simple linear mapping to 1-36 (floor with min 1)
  const scaled = Math.max(1, Math.round(proportion * 35 + 1))
  return scaled
}

export default function Summary() {
  const location = useLocation() as { state?: { score?: number; total?: number } }
  const score = location.state?.score ?? 0
  const total = location.state?.total ?? 0
  const act = convertToActScale(score, total)

  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-2">Great work!</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">You scored</p>
      <div className="card p-6">
        <div className="text-5xl font-bold">{score} / {total}</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">ACT (est.): <span className="font-semibold">{act}</span> / 36</div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link to="/subjects" className="btn btn-primary">Try another subject</Link>
        <Link to="/" className="btn btn-ghost">Home</Link>
      </div>
    </div>
  )
}


