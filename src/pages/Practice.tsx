import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listTestsFromSupabase, deleteTestFromSupabase, clearAllTestsFromSupabase } from '../lib/simpleSupabaseStorage'
import { 
  FileText,
  Trash,
  Play,
  Clock,
  ArrowClockwise
} from '@phosphor-icons/react'
import EngagingLoader from '../components/EngagingLoader'

// Define the test type locally
type Test = {
  id: string
  name: string
  createdAt: string
  sections: Record<string, unknown[]>
  pdfData?: string
  progress?: any
  answers?: Record<string, number>
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
      
      // Convert to the expected format
      const convertedTests = testsList.map(test => ({
        id: test.id,
        name: test.name,
        createdAt: test.createdAt,
        sections: {}, // We'll load this when needed
        hasProgress: test.hasProgress
      }))
      
      setTests(convertedTests as Test[])
    } catch (error) {
      console.error('Failed to load tests from Supabase:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId)
    // No need to set active test ID for Supabase system
    console.log('✅ Selected test:', testId)
  }

  const handleStartTest = () => {
    if (selectedTestId) {
      navigate(`/test-selection/${selectedTestId}`)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
          Practice Tests
        </h2>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
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
            <p className="text-lg text-secondary mb-6 max-w-md mx-auto">
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
                    ? 'ring-2 ring-[var(--color-accent)] shadow-2xl scale-[1.02] bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-dark)]/10 shadow-[0_0_20px_var(--color-accent),0_0_40px_var(--color-accent),0_0_60px_var(--color-accent)]' 
                    : 'hover:shadow-lg'
                }`} 
                onClick={() => handleTestSelect(test.id)}>
                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(45deg, var(--color-accent), var(--color-accent-dark))' }}>
                                              <FileText className="w-5 h-5 text-[var(--color-text-dark)]" weight="fill" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{test.name}</div>
                      <div className="text-sm text-secondary flex items-center gap-1">
                        <Clock className="w-4 h-4" weight="fill" />
                        {new Date(test.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {(() => {
                          // Define the desired order
                          const desiredOrder = ['english', 'math', 'reading', 'science']
                          
                          // Filter and sort sections in the desired order
                          return desiredOrder
                            .filter(section => test.sections[section])
                            .map(section => {
                              return (
                                <span 
                                  key={section}
                                  className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs"
                                >
                                  {section}: {(test.sections[section] as unknown[]).length}
                                </span>
                              )
                            })
                        })()}
                      </div>
                    </div>
                  </div>
                                     {selectedTestId === test.id && (
                     <div className="flex items-center gap-2">
                       <div className="text-[var(--color-text-dark)] font-semibold px-3 py-1 rounded-full shadow-md" style={{ background: 'linear-gradient(45deg, var(--color-accent), var(--color-accent-dark))' }}>✓ Selected</div>
                       

                       
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
              {selectedTestId && (() => {
                const selectedTest = tests.find(t => t.id === selectedTestId)
                const hasProgress = selectedTest?.hasProgress || false
                
                return (
                  <button
                    className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    onClick={handleStartTest}
                  >
                    {hasProgress ? (
                      <>
                        <ArrowClockwise className="w-5 h-5" weight="fill" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" weight="fill" />
                        Start Test
                      </>
                    )}
                  </button>
                )
              })()}
              

              
              <button
                 className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                 onClick={async () => {
                   if (confirm('Are you sure you want to clear all tests? This will delete ALL test data from Supabase. This action cannot be undone.')) {
                     try {
                       console.log('🔄 Starting clear all tests...')
                       await clearAllTestsFromSupabase()
                       console.log('🔄 Reloading tests list...')
                       await loadTests()
                       setSelectedTestId(null)
                       console.log('✅ All tests cleared successfully from Supabase')
                       alert('✅ All tests cleared successfully!')
                     } catch (error) {
                       console.error('❌ Failed to clear all tests:', error)
                       alert(`❌ Failed to clear all tests: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    </motion.div>
  )
}
