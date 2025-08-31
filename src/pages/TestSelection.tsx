import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadTestFromSupabase, findEarliestUnansweredQuestion } from '../lib/simpleSupabaseStorage'
import { useEffect, useState } from 'react'
import { 
  BookOpen,
  Calculator,
  FileText,
  Flask,
  ClipboardText
} from '@phosphor-icons/react'
import EngagingLoader from '../components/EngagingLoader'
import { getTestTypeConfig, type TestTypeConfig } from '../lib/testConfig'

// Subject configuration with icons and colors
const subjectConfig = {
  english: { 
    title: 'English', 
    color: 'from-[var(--color-accent)] to-[var(--color-accent-dark)]', 
    icon: BookOpen
  },
  math: { 
    title: 'Math', 
    color: 'from-[var(--color-accent)] to-[var(--color-accent-dark)]', 
    icon: Calculator
  },
  reading: { 
    title: 'Reading', 
    color: 'from-[var(--color-accent)] to-[var(--color-accent-dark)]', 
    icon: FileText
  },
  science: { 
    title: 'Science', 
    color: 'from-[var(--color-accent)] to-[var(--color-accent-dark)]', 
    icon: Flask
  }
}

// Full test option will be populated dynamically based on test type
const getFullTestOption = (testConfig: TestTypeConfig) => ({
  id: 'full', 
  title: 'Full Test', 
  color: 'from-[var(--color-primary)] to-[var(--color-accent)]', 
  icon: ClipboardText,
  blurb: `Complete ${testConfig.name} with all sections and timing.`,
  time: testConfig.totalTime,
  questions: `${testConfig.totalQuestions} questions`
})

export default function TestSelection() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState<any>(null)
  const [testConfig, setTestConfig] = useState<TestTypeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (testId) {
      loadTest()
    }
  }, [testId])
  
  const loadTest = async () => {
    try {
      setLoading(true)
      const loadedTest = await loadTestFromSupabase(testId!)
      
      if (loadedTest) {
        // Convert to TestBundle format for compatibility
        const testBundle = {
          id: loadedTest.id,
          name: loadedTest.name,
          createdAt: loadedTest.createdAt,
          sections: loadedTest.sections,
          pdfData: loadedTest.pdfData,
          sectionPages: loadedTest.sectionPages,
          pageQuestions: loadedTest.pageQuestions,
          answers: loadedTest.answers // Add the answers field for resume functionality
        }
        setTest(testBundle)
        
        // Determine test type and get configuration
        const config = getTestTypeConfig(testBundle)
        setTestConfig(config)
      } else {
        setTest(null)
      }
    } catch (error) {
      console.error('Failed to load test from Supabase:', error)
      setTest(null)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <EngagingLoader 
          message="Loading your test..." 
          size="lg"
          showThinking={true}
        />
      </div>
    )
  }
  
  if (!test) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4">Test not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/practice')}>
          Back to Practice
        </button>
      </div>
    )
  }

  const handleSubjectSelect = (subjectId: string) => {
    if (subjectId === 'science') {
      alert('Science section coming soon!')
      return
    }
    
    if (subjectId === 'full') {
      // Full test coming soon
      alert('Full test feature coming soon! This will allow you to take a complete ACT® test with all sections.')
      return
    }
    
    // Check if the test has this subject
    const hasSubject = test.sections[subjectId as keyof typeof test.sections]
    if (!hasSubject || (hasSubject as any[]).length === 0) {
      alert(`This test doesn't have ${subjectId} questions available.`)
      return
    }
    
         // Check for progress and find earliest unanswered question
     const earliestUnanswered = findEarliestUnansweredQuestion(test, subjectId)
     
     if (earliestUnanswered && earliestUnanswered.section === subjectId) {
       // Resume to the earliest unanswered question in this subject
       navigate(`/pdf-practice/${subjectId}?testId=${testId}&resume=true&questionIndex=${earliestUnanswered.questionIndex}`)
     } else {
       // Start fresh for this subject
       navigate(`/pdf-practice/${subjectId}?testId=${testId}`)
     }
  }

  if (!testConfig) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <EngagingLoader 
          message="Loading test configuration..." 
          size="lg"
          showThinking={true}
        />
      </div>
    )
  }

  const fullTestOption = getFullTestOption(testConfig)
  const subjects = Object.entries(testConfig.subjects).map(([id, config]) => ({
    id,
    ...subjectConfig[id as keyof typeof subjectConfig],
    ...config
  }))

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      {/* Back to Practice button - top left */}
      <div className="mb-6">
        <button 
          className="btn btn-ghost hover:bg-slate-100 dark:hover:bg-slate-800 transform hover:scale-105 transition-all duration-200" 
          onClick={() => navigate('/practice')}
        >
          ← Back to Practice
        </button>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{testConfig.name}</h1>
        <h2 className="text-xl text-slate-600 dark:text-slate-400 mb-4">{test.name}</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Choose a subject to practice
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {subjects.map((s, i) => {
          const hasSubject = test.sections[s.id as keyof typeof test.sections]
          const questionCount = hasSubject ? (hasSubject as any[]).length : 0
          const isAvailable = s.id !== 'science' && questionCount > 0
          
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button 
                className={`block group w-full ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => handleSubjectSelect(s.id)}
                disabled={!isAvailable}
              >
                                 <div className={`card overflow-hidden transition-all duration-300 ${isAvailable ? 'hover:shadow-xl group-hover:-translate-y-2 hover:scale-105' : 'cursor-not-allowed'}`}>
                  <div className={`h-32 bg-gradient-to-br ${s.color} relative overflow-hidden flex items-center justify-center`}>
                    <s.icon className="w-12 h-12 text-white" weight="fill" />
                    {s.id === 'science' && !test.sections?.science && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Coming Soon</span>
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                                             <div className="flex-1">
                         <h3 className="text-2xl font-bold text-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] bg-clip-text text-transparent mb-1">{s.title}</h3>
                         <p className="text-sm text-slate-600 dark:text-slate-400 text-left">
                           {s.time} • {s.questions} questions
                         </p>
                       </div>
                      {isAvailable && (
                        <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 text-2xl ml-2">→</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-slate-700 dark:text-slate-300 text-left">{s.description}</p>
                      
                      {isAvailable ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-block rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5">
                            {questionCount} questions available
                          </span>
                          
                          {/* Show progress indicator if there are answers for this subject */}
                          {(() => {
                            const subjectAnswers = Object.keys(test.answers || {}).filter(qId => {
                              const sectionQuestions = test.sections[s.id] as any[] || []
                              return sectionQuestions.some(q => q.id === qId)
                            })
                            const answeredCount = subjectAnswers.length
                            
                            if (answeredCount > 0) {
                              return (
                                <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5">
                                  {answeredCount} answered
                                </span>
                              )
                            }
                            return null
                          })()}
                          
                          <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">PDF Practice</span>
                        </div>
                      ) : s.id === 'science' && !test.sections?.science ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-block rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5">
                            Coming Soon
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-block rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5">
                            Not available in this test
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          )
        })}
      </div>
      
             {/* Full Test Option - Spans 2 columns */}
       <div className="mt-8">
         <motion.div
           initial={{ opacity: 0, y: 8 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="col-span-2"
         >
           <button 
             className="block group w-full opacity-50 cursor-not-allowed"
             disabled={true}
           >
             <div className="card overflow-hidden transition-all duration-300 border-2 border-cyan-200 dark:border-cyan-800 cursor-not-allowed">
               <div className={`h-40 bg-gradient-to-br ${fullTestOption.color} relative overflow-hidden flex items-center justify-center`}>
                 <fullTestOption.icon className="w-20 h-20 text-white" weight="fill" />
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                   <span className="text-white font-bold text-lg">Coming Soon</span>
                 </div>
               </div>
               <div className="p-6 space-y-3">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="text-2xl font-bold text-left">{fullTestOption.title}</h3>
                     <p className="text-lg text-slate-600 dark:text-slate-400 text-left">
                       {fullTestOption.time} • {fullTestOption.questions}
                     </p>
                   </div>
                 </div>
                 <p className="text-slate-700 dark:text-slate-300 text-left text-lg">{fullTestOption.blurb}</p>
                 
                 <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                   <span className="inline-block rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 font-semibold">
                     Coming Soon
                   </span>
                   <span className="inline-block rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-3 py-1 font-semibold">
                     Timed Test
                   </span>
                   <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 font-semibold">
                     All Sections
                   </span>
                 </div>
               </div>
             </div>
           </button>
         </motion.div>
       </div>
    </motion.div>
  )
}
