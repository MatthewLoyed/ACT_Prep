import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTestsFromSupabase, setActiveTestId, getActiveTestId, clearAllTestsFromSupabase } from '../lib/supabaseTestStore'

export default function ChooseTest() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<string | null>(() => getActiveTestId())

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setLoading(true)
      const testsList = await listTestsFromSupabase()
      setTests(testsList)
    } catch (error) {
      console.error('Failed to load tests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Choose a test</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4">Select which imported test to use for practice.</p>
      <div className="space-y-3">
        {loading ? (
          <div className="card p-4">Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="card p-4">No imported tests yet. Go to Import to add one.</div>
        ) : null}
        {tests.map(t => (
          <div key={t.id} className="card p-4 w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className={`flex items-center justify-between transition-colors ${active === t.id ? 'ring-2 ring-sky-500' : ''}`}
                onClick={() => {
                  const newId = active === t.id ? null : t.id
                  setActive(newId)
                  setActiveTestId(newId as any)
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className={`ml-4 size-3 rounded-full ${active === t.id ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              </button>
            </div>
            {active === t.id && (
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/test-selection/${t.id}`)}
              >
                Start Test
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="btn btn-ghost"
          onClick={async () => {
            if (confirm('Clear all saved tests? This cannot be undone.')) {
              try {
                await clearAllTestsFromSupabase()
                setActive(null)
                setTests([])
                console.log('All tests cleared successfully from database')
              } catch (error) {
                console.error('Failed to clear all tests:', error)
                alert('Failed to clear all tests. Please try again.')
              }
            }
          }}
        >
          Clear all tests
        </button>
        <button
          className="btn btn-ghost ml-2"
          onClick={() => { setActive(null); setActiveTestId(null as any) }}
        >
          Clear selected
        </button>
      </div>
    </div>
  )
}


