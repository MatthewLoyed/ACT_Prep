import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listTests, setActiveTestId } from '../lib/testStore'

export default function Practice() {
  const navigate = useNavigate()
  const [tests, setTests] = useState(() => listTests())
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)

  useEffect(() => {
    setTests(listTests())
  }, [])

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId)
    setActiveTestId(testId as any)
  }

  const handleStartTest = () => {
    if (selectedTestId) {
      navigate(`/test-selection/${selectedTestId}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
          Practice Tests
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Choose from your imported tests and start practicing with instant feedback
        </p>
      </div>

      {tests.length === 0 ? (
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
                   ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-950/20 shadow-lg' 
                   : 'hover:shadow-lg'
               }`} onClick={() => handleTestSelect(test.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`size-3 rounded-full ${
                      selectedTestId === test.id ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <div>
                      <div className="font-semibold text-lg">{test.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(test.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(test.sections).map(([section, questions]) => (
                          <span 
                            key={section}
                            className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs"
                          >
                            {section}: {(questions as any[]).length}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                                     {selectedTestId === test.id && (
                     <div className="flex items-center gap-2">
                       <div className="text-sky-500 font-semibold">✓ Selected</div>
                                               <button 
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this test?')) {
                              // TODO: Add delete functionality
                              console.log('Delete test:', test.id)
                            }
                          }}
                        >
                          🗑️ Delete
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          {selectedTestId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
                             <div className="flex items-center justify-center gap-4">
                 <button
                   className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                   onClick={handleStartTest}
                 >
                   Start Test →
                 </button>
                 <button
                   className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                   onClick={() => {
                     if (confirm('Are you sure you want to clear all tests?')) {
                       // TODO: Add clear all functionality
                       console.log('Clear all tests')
                     }
                   }}
                 >
                   Clear All Tests
                 </button>
               </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
