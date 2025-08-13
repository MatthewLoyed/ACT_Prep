import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadTestFromSupabase } from '../lib/supabaseTestStore'
import { useEffect, useState } from 'react'
import { 
  BookOpen,
  Calculator,
  FileText,
  Flask,
  ClipboardText
} from '@phosphor-icons/react'
import EngagingLoader from '../components/EngagingLoader'

const subjects = [
  { 
    id: 'english', 
    title: 'English', 
    color: 'from-rose-400 to-rose-600', 
    icon: BookOpen,
    blurb: 'Grammar, usage, punctuation, and rhetorical skills.',
    time: '35 minutes',
    questions: '50 questions'
  },
  { 
    id: 'math', 
    title: 'Math', 
    color: 'from-emerald-400 to-emerald-600', 
    icon: Calculator,
    blurb: 'Algebra, geometry, functions, and number sense.',
    time: '50 minutes',
    questions: '45 questions'
  },
  { 
    id: 'reading', 
    title: 'Reading', 
    color: 'from-emerald-400 to-emerald-600', 
    icon: FileText,
    blurb: 'Comprehension, inference, and author\'s purpose.',
    time: '40 minutes',
    questions: '36 questions'
  },
  // Science coming soon
  { 
    id: 'science', 
    title: 'Science', 
    color: 'from-teal-400 to-teal-600', 
    icon: Flask,
    blurb: 'Data interpretation, experiment design, and reasoning.',
    time: '40 minutes',
    questions: '40 questions',
    comingSoon: true
  },
]

const fullTestOption = {
  id: 'full', 
  title: 'Full Test', 
      color: 'from-cyan-400 to-cyan-600', 
  icon: ClipboardText,
  blurb: 'Complete ACT® test with all sections and timing.',
  time: '2 hours 55 minutes',
  questions: 'All sections'
}

export default function TestSelection() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState<any>(null)
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
      setTest(loadedTest)
    } catch (error) {
      console.error('Failed to load test:', error)
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
      // Navigate to full test setup
      navigate(`/full-test-setup?testId=${testId}`)
      return
    }
    
    // Check if the test has this subject
    const hasSubject = test.sections[subjectId as keyof typeof test.sections]
    if (!hasSubject || (hasSubject as any[]).length === 0) {
      alert(`This test doesn't have ${subjectId} questions available.`)
      return
    }
    
    // Navigate to PDF practice for this subject with testId
    navigate(`/pdf-practice/${subjectId}?testId=${testId}`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Choose a subject</h2>
        <p className="text-slate-600 dark:text-slate-400">Select which section of "{test.name}" you want to practice</p>
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
                <div className={`card overflow-hidden transition-all duration-300 ${isAvailable ? 'hover:shadow-xl group-hover:-translate-y-2 hover:scale-105' : ''}`}>
                  <div className={`h-32 bg-gradient-to-br ${s.color} relative overflow-hidden flex items-center justify-center`}>
                    <s.icon className="w-12 h-12 text-white" weight="fill" />
                    {s.comingSoon && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Coming Soon</span>
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{s.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {s.time} • {s.questions}
                        </p>
                      </div>
                      {isAvailable && (
                        <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 text-2xl">→</span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{s.blurb}</p>
                    
                    {isAvailable ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-block rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5">
                          {questionCount} questions available
                        </span>
                        <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">PDF Practice</span>
                      </div>
                    ) : s.comingSoon ? (
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
            className="block group w-full cursor-pointer"
            onClick={() => handleSubjectSelect(fullTestOption.id)}
          >
                            <div className="card overflow-hidden transition-all duration-300 hover:shadow-xl group-hover:-translate-y-2 hover:scale-105 border-2 border-cyan-200 dark:border-cyan-800">
              <div className={`h-40 bg-gradient-to-br ${fullTestOption.color} relative overflow-hidden flex items-center justify-center`}>
                <fullTestOption.icon className="w-20 h-20 text-white" weight="fill" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
                <div className="absolute top-4 right-4">
                  <span className="inline-block rounded-full bg-white/20 text-white px-3 py-1 text-sm font-semibold">
                    Complete Test
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{fullTestOption.title}</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                      {fullTestOption.time} • {fullTestOption.questions}
                    </p>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-2 text-3xl">→</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg">{fullTestOption.blurb}</p>
                
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-block rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 font-semibold">
                    Full Test Available
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
      
      <div className="mt-8 text-center">
        <button 
          className="btn btn-ghost btn-lg hover:bg-slate-100 dark:hover:bg-slate-800 transform hover:scale-105 transition-all duration-200" 
          onClick={() => navigate('/practice')}
        >
          ← Back to Practice
        </button>
      </div>
    </motion.div>
  )
}
