import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listTestsFromSupabase, setActiveTestId, deleteTestFromSupabase, clearAllTestsFromSupabase } from '../lib/supabaseTestStore'
import { 
  FileText,
  Trash,
  Play,
  Clock
} from '@phosphor-icons/react'
import EngagingLoader from '../components/EngagingLoader'

// Define the test type locally
type Test = {
  id: string
  name: string
  createdAt: string
  sections: Record<string, unknown[]>
  pdfData?: string
}

export default function Practice() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setLoading(true)
      const testsList = await listTestsFromSupabase()
      setTests(testsList as Test[])
    } catch (error) {
      console.error('Failed to load tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId)
    setActiveTestId(testId)
  }

  const handleStartTest = () => {
    if (selectedTestId) {
      navigate(`/test-selection/${selectedTestId}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Practice Tests
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Choose from your imported tests and start practicing with instant feedback
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <EngagingLoader 
            message="Loading your tests..." 
            size="lg"
            showThinking={true}
          />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center">
          <div className="card p-12 max-w-lg mx-auto">
            <div className="text-8xl mb-6">📚</div>
            <h3 className="text-2xl font-bold mb-4">No tests available</h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Import a PDF to get started with practice tests. We'll automatically extract questions for you.
            </p>
            <button 
              className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/import')}
            >
              Import Your First Test
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
                             <div className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                 selectedTestId === test.id 
                                       ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-lg' 
                   : 'hover:shadow-lg'
               }`} onClick={() => handleTestSelect(test.id)}>
                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                                              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" weight="fill" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{test.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" weight="fill" />
                        {new Date(test.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(test.sections).map(([section, questions]) => (
                          <span 
                            key={section}
                            className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs"
                          >
                            {section}: {(questions as unknown[]).length}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                                     {selectedTestId === test.id && (
                     <div className="flex items-center gap-2">
                                               <div className="text-emerald-500 font-semibold">✓ Selected</div>
                                                                       <button 
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
                              try {
                                await deleteTestFromSupabase(test.id)
                                await loadTests() // Reload the tests list
                                if (selectedTestId === test.id) {
                                  setSelectedTestId(null)
                                }
                              } catch (error) {
                                console.error('Failed to delete test:', error)
                                alert('Failed to delete test. Please try again.')
                              }
                            }
                          }}
                        >
                          <Trash className="w-4 h-4" weight="fill" />
                          Delete
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-4">
              {selectedTestId && (
                <button
                  className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  onClick={handleStartTest}
                >
                  <Play className="w-5 h-5" weight="fill" />
                  Start Test
                </button>
              )}
                             <button
                 className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                 onClick={async () => {
                   if (confirm('Are you sure you want to clear all tests? This action cannot be undone.')) {
                     try {
                       await clearAllTestsFromSupabase()
                       setTests([])
                       setSelectedTestId(null)
                       console.log('All tests cleared successfully from database')
                     } catch (error) {
                       console.error('Failed to clear all tests:', error)
                       alert('Failed to clear all tests. Please try again.')
                     }
                   }
                 }}
               >
                 Clear All Tests
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
