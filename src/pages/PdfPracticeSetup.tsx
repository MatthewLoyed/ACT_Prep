import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const subjects = [
  { id: 'english', title: 'English' },
  { id: 'math', title: 'Math' },
  { id: 'reading', title: 'Reading' },
  { id: 'science', title: 'Science' },
]

export default function PdfPracticeSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subject, setSubject] = useState('english')
  const [url, setUrl] = useState('')

  // Authentication check
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">PDF Practice</h2>
              <p className="text-secondary mb-6">View the official-style PDF on the left and answer on the right.</p>

      <div className="card p-5 space-y-4">
        <div>
          <div className="text-sm text-secondary mb-1">Subject</div>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <button key={s.id} className={`btn btn-ghost ${subject === s.id ? 'ring-2 ring-sky-500' : ''}`} onClick={() => setSubject(s.id)}>
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
                      <span className="text-sm text-secondary">PDF URL (or relative path)</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => navigate(`/pdf-practice/${subject}?url=${encodeURIComponent(url)}`)}>
            Start
          </button>
        </div>
      </div>
    </div>
  )
}




