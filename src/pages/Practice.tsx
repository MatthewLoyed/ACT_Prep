import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listTestsFromSupabase, deleteTestFromSupabase, clearAllTestsFromSupabase } from '../lib/simpleSupabaseStorage'
import { 
  FileText,
  Trash,
  Play,
  ArrowClockwise
} from '@phosphor-icons/react'
import EngagingLoader from '../components/EngagingLoader'
import { useAuth } from '../contexts/AuthContext'

// Define the test type locally
type Test = {
  id: string
  name: string
  createdAt: string
  sections: Record<string, unknown[]>
  pdfData?: string
  progress?: Record<string, unknown>
  answers?: Record<string, number>
  hasProgress?: boolean
  testType?: 'enhanced' | 'old'
}

export default function Practice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [testToDelete, setTestToDelete] = useState<Test | null>(null)
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null)
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false)

  // Authentication check
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      loadTests()
    }
  }, [user])



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
        hasProgress: test.hasProgress,
        testType: test.testType
      }))
      
      setTests(convertedTests as Test[])
    } catch (error) {
      console.error('Failed to load tests from Supabase:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = (testId: string) => {
    navigate(`/test-selection/${testId}`)
  }

  const handleDeleteClick = (test: Test) => {
    setTestToDelete(test)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!testToDelete) return
    
    setDeleteModalOpen(false)
    setDeletingTestId(testToDelete.id)
    
    // Wait for animation to complete before actually deleting
    setTimeout(async () => {
      try {
        await deleteTestFromSupabase(testToDelete.id)
        await loadTests()
        setDeletingTestId(null)
        setTestToDelete(null)
      } catch (error) {
        console.error('Failed to delete test:', error)
        alert('Failed to delete test. Please try again.')
        setDeletingTestId(null)
      }
    }, 600) // Match animation duration
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setTestToDelete(null)
  }

  const handleClearAllClick = () => {
    setClearAllModalOpen(true)
  }

  const handleConfirmClearAll = async () => {
    try {
      setClearAllModalOpen(false)
      console.log('🔄 Starting clear all tests...')
      await clearAllTestsFromSupabase()
      console.log('🔄 Reloading tests list...')
      await loadTests()

      console.log('✅ All tests cleared successfully from Supabase')
    } catch (error) {
      console.error('❌ Failed to clear all tests:', error)
      alert(`❌ Failed to clear all tests: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCancelClearAll = () => {
    setClearAllModalOpen(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
          Practice Tests
        </h2>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          Click Start or Resume on any test below to begin practicing
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
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-left mb-2">📚 Recently Imported Tests</h3>
              <p className="text-secondary text-left">Click Start or Resume to begin practicing any test</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-secondary mb-1">Total Tests</div>
              <div className="text-2xl font-bold text-[var(--color-accent)]">{tests.length}</div>
            </div>
          </div>

          {/* Table Header */}
          <div className="card p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
              <div className="col-span-1 text-center">📄</div>
              <div className="col-span-5">Test Name</div>
              <div className="col-span-2 text-center">Type</div>
              <div className="col-span-2 text-center">Date Added</div>
              <div className="col-span-1 text-center">Start</div>
              <div className="col-span-1 text-center">Delete</div>
            </div>
          </div>

          {/* Test Rows */}
          <div className="space-y-2">
            {tests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 8 }}
                animate={deletingTestId === test.id 
                  ? { 
                      scale: [1, 1.1, 0], 
                      opacity: [1, 1, 0],
                      y: [0, -10, -50]
                    }
                  : { opacity: 1, y: 0 }
                }
                transition={{ 
                  delay: deletingTestId === test.id ? 0 : index * 0.05,
                  duration: deletingTestId === test.id ? 0.6 : 0.3,
                  ease: deletingTestId === test.id ? "easeInOut" : "easeOut"
                }}
                className="card p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[80px]"
              >
                <div className="grid grid-cols-12 gap-4 items-center h-full">
                  {/* Icon */}
                  <div className="col-span-1 flex justify-center items-center">
                    <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(45deg, var(--color-accent), var(--color-accent-dark))' }}>
                      <FileText className="w-4 h-4 text-[var(--color-text-dark)]" weight="fill" />
                    </div>
                  </div>

                  {/* Test Name */}
                  <div className="col-span-5 flex items-center">
                    <div className="font-semibold text-lg truncate" title={test.name}>
                      {test.name}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2 flex justify-center items-center">
                    <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 text-xs font-medium">
                      {test.testType === 'enhanced' ? 'Enhanced' : test.testType === 'old' ? 'Old ACT' : 'Enhanced'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-sm text-secondary flex justify-center items-center">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </div>

                  {/* Start Button */}
                  <div className="col-span-1 flex justify-center items-center">
                    <button 
                      className="btn btn-sm btn-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 w-[120px] justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartTest(test.id)
                      }}
                    >
                      {test.hasProgress ? (
                        <>
                          <ArrowClockwise className="w-5 h-5" weight="fill" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }} />
                          Resume
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" weight="fill" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }} />
                          Start
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-center items-center">
                    <button 
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(test)
                      }}
                      title="Delete test"
                    >
                      <Trash className="w-4 h-4" weight="fill" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Clear All Tests Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <button
              className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={handleClearAllClick}
            >
              Clear All Tests
            </button>
          </motion.div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteModalOpen && testToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card p-8 max-w-md mx-4"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold mb-4">Delete Test?</h3>
              <p className="text-secondary mb-6">
                Remove <span className="font-semibold text-white">{testToDelete.name}</span> from your library?
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCancelDelete}
                  className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="btn btn-ghost btn-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-400/50 hover:border-red-400 transition-all duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Clear All Tests Confirmation Modal */}
      {clearAllModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card p-8 max-w-lg mx-4"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-4 text-red-500">Clear All Tests?</h3>
              <div className="space-y-4 mb-8">
                <p className="text-lg text-secondary">
                  This will <span className="font-bold text-red-400">permanently delete</span> all {tests.length} test(s) from your library.
                </p>
                <p className="text-sm text-red-300">
                  All your imported PDFs, progress, and answers will be lost permanently.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCancelClearAll}
                  className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep All Tests
                </button>
                <button
                  onClick={handleConfirmClearAll}
                  className="btn btn-ghost btn-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border-2 border-red-400 hover:border-red-300 transition-all duration-200 font-semibold"
                >
                  Clear All Tests
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
