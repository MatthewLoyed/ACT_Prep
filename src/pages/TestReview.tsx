import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Eye,
  Trophy,
  Target,
  Brain,
  Star
} from '@phosphor-icons/react'
import { loadTestFromSupabase } from '../lib/simpleSupabaseStorage'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type SectionId = 'english' | 'math' | 'reading' | 'science'

type Question = {
  id: string
  prompt: string
  choices: string[]
  choiceLetters?: string[]
  answerIndex?: number
  passage?: string
  passageId?: string
}

export default function TestReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { subject = 'english' } = useParams()
  const [params] = useSearchParams()
  const testId = params.get('testId') || ''
  const answersParam = params.get('answers') || '{}'
  
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showQuestionDetail, setShowQuestionDetail] = useState(false)

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const loadedTest = await loadTestFromSupabase(testId)
        
        // Parse answers from URL
        const parsedAnswers = JSON.parse(decodeURIComponent(answersParam))
        setAnswers(parsedAnswers)
        
        // Load questions for the subject
        const subjectQuestions = (loadedTest?.sections as Partial<Record<SectionId, unknown[]>> | undefined)?.[subject as SectionId] as Question[] | undefined
        setAllQuestions(subjectQuestions || [])
      } catch (error) {
        console.error('Failed to load test:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTest()
  }, [testId, subject, answersParam])

  const correctAnswers = allQuestions.filter(q => answers[q.id] === q.answerIndex).length
  const totalQuestions = allQuestions.length
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  // Save session data when page loads (in case user navigated here directly)
  useEffect(() => {
    const saveSession = async () => {
      if (totalQuestions === 0 || Object.keys(answers).length === 0) return
      if (!user) {
        console.error('User not authenticated')
        return
      }
      
      try {
        // Estimate session duration (since we don't have exact start time)
        // Assume average of 2 minutes per question as a reasonable estimate
        const estimatedDurationSec = Math.round(totalQuestions * 2 * 60)
        
        await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            date: new Date().toISOString(),
            section: subject,
            rawScore: correctAnswers,
            total: totalQuestions,
            durationSec: estimatedDurationSec,
          })
        console.log('🎯 Session saved from TestReview:', { estimatedDurationSec, correctAnswers, totalQuestions })
      } catch (error) {
        console.error('Error saving session from TestReview:', error)
      }
    }
    
    if (!loading) {
      saveSession()
    }
  }, [loading, subject, correctAnswers, totalQuestions, answers, user])

  const getScoreIcon = () => {
    if (percentage >= 90) return <Trophy className="w-8 h-8 text-yellow-500" weight="fill" />
    if (percentage >= 80) return <Star className="w-8 h-8 text-emerald-500" weight="fill" />
    if (percentage >= 70) return <Brain className="w-8 h-8 text-yellow-500" weight="fill" />
    if (percentage >= 60) return <Target className="w-8 h-8 text-purple-500" weight="fill" />
    return <Target className="w-8 h-8 text-orange-500" weight="fill" />
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! You're a master!"
    if (percentage >= 80) return "Excellent work! You're crushing it!"
    if (percentage >= 70) return "Great job! You're on fire!"
    if (percentage >= 60) return "Good work! Keep improving!"
    if (percentage >= 50) return "Not bad! Practice makes perfect!"
    return "Keep practicing! You'll get better!"
  }

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setShowQuestionDetail(true)
  }

  const handleBackToReview = () => {
    setShowQuestionDetail(false)
    setSelectedQuestion(null)
  }

  const cleanMathText = (text: string) => {
    return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading test review...</div>
      </div>
    )
  }

  if (showQuestionDetail && selectedQuestion) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToReview}
              className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Question Detail</h1>
          </div>

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6"
          >
            <div className="text-sm text-white/70 mb-3">
              Question {selectedQuestion.id.split('-')[1]}
            </div>
            
            <div className="text-white text-lg mb-6">
              {cleanMathText(selectedQuestion.prompt)}
            </div>

            <div className="space-y-3">
              {selectedQuestion.choices.map((choice, index) => {
                const isCorrect = index === selectedQuestion.answerIndex
                const isSelected = answers[selectedQuestion.id] === index
                const isWrong = isSelected && !isCorrect
                
                let state = ''
                if (isCorrect) state = 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                else if (isWrong) state = 'bg-red-500/20 border-red-500 text-red-200'
                else state = 'bg-white/10 border-white/20 text-white/70'

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${state} flex items-center gap-3`}
                  >
                    <div className="flex-shrink-0">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" weight="fill" />}
                      {isWrong && <XCircle className="w-5 h-5 text-red-400" weight="fill" />}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium mr-2">
                        {(selectedQuestion.choiceLetters?.[index] || String.fromCharCode(65 + index)).replace(/\.$/, '')}.
                      </span>
                      {cleanMathText(choice)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Explanation */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <div className="text-white/80 text-sm">
                <strong>Your Answer:</strong> {
                  answers[selectedQuestion.id] !== undefined 
                    ? (selectedQuestion.choiceLetters?.[answers[selectedQuestion.id]] || String.fromCharCode(65 + answers[selectedQuestion.id])).replace(/\.$/, '') + '.'
                    : 'Not answered'
                }
              </div>
              <div className="text-white/80 text-sm mt-1">
                <strong>Correct Answer:</strong> {
                  selectedQuestion.answerIndex !== undefined
                    ? (selectedQuestion.choiceLetters?.[selectedQuestion.answerIndex] || String.fromCharCode(65 + selectedQuestion.answerIndex)).replace(/\.$/, '') + '.'
                    : 'Not available'
                }
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/test-selection/${testId}`)}
            className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-white">Test Review</h1>
          <div className="w-10"></div>
        </div>

        {/* Score Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{subject.toUpperCase()} Test Results</h2>
            {getScoreIcon()}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{correctAnswers}/{totalQuestions}</div>
              <div className="text-white/70">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{percentage}%</div>
              <div className="text-white/70">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalQuestions - correctAnswers}</div>
              <div className="text-white/70">Incorrect</div>
            </div>
          </div>
          
          <div className="text-center mt-4 text-white/80">
            {getScoreMessage()}
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Question Review</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allQuestions.map((question, index) => {
              const questionNum = index + 1
              const isCorrect = answers[question.id] === question.answerIndex
              const isAnswered = answers[question.id] !== undefined
              
              return (
                <motion.button
                  key={question.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleViewQuestion(question)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    isCorrect 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' 
                      : isAnswered 
                        ? 'bg-red-500/20 border-red-500 text-red-200'
                        : 'bg-white/10 border-white/20 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">#{questionNum}</span>
                    {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" weight="fill" />}
                    {isAnswered && !isCorrect && <XCircle className="w-5 h-5 text-red-400" weight="fill" />}
                  </div>
                  <div className="text-sm opacity-80">
                    {isCorrect ? 'Correct' : isAnswered ? 'Incorrect' : 'Not answered'}
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <Eye className="w-4 h-4" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
