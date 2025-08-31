// Interactive Demo Component
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SuccessCelebration from './SuccessCelebration'
import SimpleParticles from './SimpleParticles'
import AnimatedCounter from './AnimatedCounter'
import { useSoundSettings } from '../hooks/useSoundSettings'

interface InteractiveDemoProps {
  onSignupClick: () => void
  onLoginClick: () => void
}

const DemoStep = {
  PDF_UPLOAD: 'pdf_upload',
  QUESTIONS: 'questions',
  RESULTS: 'results'
} as const

type DemoStepType = typeof DemoStep[keyof typeof DemoStep]

export default function InteractiveDemo({ onSignupClick }: InteractiveDemoProps) {
  const [currentStep, setCurrentStep] = useState<DemoStepType>(DemoStep.PDF_UPLOAD)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showFileSelector, setShowFileSelector] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  
  // Animation and feedback states (matching PDF practice)
  const [streak, setStreak] = useState(0)
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false)
  const correctAudio = useRef<HTMLAudioElement | null>(null)
  const wrongAudio = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  // Sound settings hook
  const { playAudio } = useSoundSettings()

  // Demo data
  const demoQuestions = [
    {
      text: "The students _____ their homework before class.",
      options: ["A) completed", "B) had completed", "C) have completed", "D) will complete"],
      correct: "B",
      explanation: "Past perfect tense is needed here because the action (completing homework) happened before another past action (class)."
    },
    {
      text: "Neither the teacher nor the students _____ ready for the exam.",
      options: ["A) was", "B) were", "C) is", "D) are"],
      correct: "A",
      explanation: "When using 'neither...nor', the verb agrees with the subject closest to it (teacher = singular)."
    },
    {
      text: "The book _____ on the table yesterday is now missing.",
      options: ["A) that was", "B) which was", "C) that is", "D) which is"],
      correct: "A",
      explanation: "Use 'that' for restrictive clauses and past tense 'was' since it refers to yesterday."
    }
  ]

  // Initialize audio elements
  useEffect(() => {
    correctAudio.current = new Audio('/sounds/correct_answer.mp3')
    wrongAudio.current = new Audio('/sounds/wrong_answer.wav')
  }, [])

  // Handle video loading and autoplay
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handleLoadedData = () => {
        console.log('Video loaded successfully')
        setVideoLoaded(true)
        // Start playing after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.log('Autoplay blocked:', error)
            })
          }
        }, 1000)
      }

      const handleCanPlay = () => {
        console.log('Video can play')
        if (!videoLoaded) {
          setVideoLoaded(true)
        }
      }

      const handleError = (error: Event) => {
        console.error('Video loading error:', error)
        setVideoLoaded(false)
      }

      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)

      // Cleanup
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
      }
    }
  }, [videoLoaded])

  // Smooth progress bar animation
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoLoaded) return

    let animationId: number

    const updateProgress = () => {
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100
        setVideoProgress(progress)

      }
      animationId = requestAnimationFrame(updateProgress)
    }

    updateProgress()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [videoLoaded])

  const handleFileSelect = () => {
    setShowFileSelector(false)
    // Simulate upload delay
    setTimeout(() => {
      setCurrentStep(DemoStep.QUESTIONS)
    }, 2000)
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    
    // Check if answer is correct
    const isCorrect = answer === demoQuestions[currentQuestion].correct
    
    // Play sound with user settings applied
    if (isCorrect) {
      if (correctAudio.current) {
        playAudio(correctAudio.current)
      }
    } else {
      if (wrongAudio.current) {
        playAudio(wrongAudio.current)
      }
    }
    
    // Handle streak logic and celebrations (matching PDF practice)
    if (isCorrect) {
      setStreak(prev => {
        const newStreak = prev + 1
        // Show celebrations for milestones
        if (newStreak >= 3 && (newStreak % 3 === 0 || newStreak === 5 || newStreak === 10)) {
          setShowSuccessCelebration(true)
          setTimeout(() => setShowSuccessCelebration(false), 3000)
        } else if (newStreak === 1) {
          // Show success celebration for first correct answer
          setShowSuccessCelebration(true)
          setTimeout(() => setShowSuccessCelebration(false), 2000)
        }
        return newStreak
      })
    } else {
      setStreak(0) // Reset streak on wrong answer
    }
    
    // Feedback is handled through visual state changes (choice colors, streak counter, etc.)
    
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setCurrentStep(DemoStep.RESULTS)
    }
  }

  const getScore = () => {
    return answers.filter((answer, index) => answer === demoQuestions[index].correct).length
  }

  const handleContinue = () => {
    onSignupClick()
  }



  const handleStepClick = (step: DemoStepType) => {
    setCurrentStep(step)
  }

  return (
         <div className="w-full max-w-full mx-auto">
             {/* Step Indicator */}
       <div className="flex justify-center mb-8">
         <div className="flex items-center space-x-4">
           {Object.values(DemoStep).map((step, index) => (
             <div key={step} className="flex items-center">
               <button
                 onClick={() => handleStepClick(step)}
                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 hover:scale-110 ${
                   Object.values(DemoStep).indexOf(currentStep) >= index 
                     ? 'bg-[var(--color-accent)] text-white' 
                     : 'bg-white/20 text-white/50 hover:bg-white/30'
                 }`}>
                 {index + 1}
               </button>
               {index < Object.values(DemoStep).length - 1 && (
                 <div className={`w-12 h-0.5 mx-2 ${
                   Object.values(DemoStep).indexOf(currentStep) > index 
                     ? 'bg-[var(--color-accent)]' 
                     : 'bg-white/20'
                 }`} />
               )}
             </div>
           ))}
         </div>
       </div>

      {/* Demo Content */}
      <AnimatePresence mode="wait">
                 {currentStep === DemoStep.PDF_UPLOAD && (
           <motion.div
             key="upload"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
                           className="grid grid-cols-1 lg:grid-cols-5 gap-20 items-center"
                     >
                           <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col justify-between h-full">
               <div>
                 <h3 className="text-3xl font-bold text-white mb-4">
                   1. Upload Your ACT® Test
                 </h3>
                 <p className="text-secondary mb-6">
                   Watch how easy it is to upload and start practicing with real ACT® questions.
                 </p>

                 {/* Benefits List */}
                 <div className="space-y-3 mb-6">
                   <div className="flex items-center space-x-3">
                     <span className="text-[var(--color-accent)] text-xl">✓</span>
                     <span className="text-white">Get started in 60 seconds</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <span className="text-[var(--color-accent)] text-xl">✓</span>
                     <span className="text-white">Upload any ACT® practice test PDF</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <span className="text-[var(--color-accent)] text-xl">✓</span>
                     <span className="text-white">Automatic question extraction</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <span className="text-[var(--color-accent)] text-xl">✓</span>
                     <span className="text-white">Start practicing immediately</span>
                   </div>
                 </div>
               </div>

                               {/* CTA Button */}
                <button
                  onClick={() => setCurrentStep(DemoStep.QUESTIONS)}
                  className="btn btn-primary text-lg px-8 py-4 w-full"
                >
                  Next
                </button>
             </div>

                           {/* Right Side - Video Demo */}
              <div className="lg:col-span-3 relative">
                <div className="relative">
                                     <video
                     ref={videoRef}
                     className="w-full h-auto rounded-2xl border border-white/30 aspect-video object-cover shadow-2xl"
                   muted
                   loop
                   playsInline
                   autoPlay
                   onLoadedData={() => setVideoLoaded(true)}
                   onCanPlay={() => setVideoLoaded(true)}
                 >
                   <source src="/videos/EditedImportCropped.mp4" type="video/mp4" />
                   <p className="text-white p-4">Your browser doesn't support video playback.</p>
                 </video>
                   
                   {/* Loading overlay - only show if video hasn't loaded yet */}
                   {!videoLoaded && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                       <div className="text-center">
                         <div className="text-4xl mb-2">📹</div>
                         <p className="text-white">Loading demo video...</p>
                       </div>
                     </div>
                   )}
                   
                   {/* Progress Bar */}
                   {videoLoaded && (
                     <div className="absolute bottom-0 left-0 right-0 h-3 bg-black/50 rounded-b-2xl overflow-hidden">
                       <div 
                         className="h-full bg-[var(--color-accent)] transition-all duration-100 ease-out"
                         style={{ width: `${videoProgress}%` }}
                       />
                     </div>
                   )}
                 </div>
               </div>
           </motion.div>
         )}

         {/* File Selector Modal */}
         {showFileSelector && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setShowFileSelector(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4"
               onClick={(e) => e.stopPropagation()}
             >
               <h4 className="text-xl font-bold text-white mb-4">Select ACT® Test File</h4>
               <div className="space-y-2">
                 <button
                   onClick={() => handleFileSelect()}
                   className="w-full text-left p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                 >
                   <div className="text-white font-medium">Example ACT Test 1</div>
                 </button>
                 <button
                   onClick={() => handleFileSelect()}
                   className="w-full text-left p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                 >
                   <div className="text-white font-medium">Example ACT Test 2</div>
                 </button>
               </div>
               <button
                 onClick={() => setShowFileSelector(false)}
                 className="mt-4 w-full btn btn-ghost border border-white/30"
               >
                 Cancel
               </button>
             </motion.div>
           </motion.div>
         )}

        {currentStep === DemoStep.QUESTIONS && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center relative"
          >
            {/* Background Particles - positioned absolutely */}
            <div className="absolute inset-0 pointer-events-none">
              <SimpleParticles count={15} />
            </div>
            
                         <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col justify-between h-full">
               <div>
                 <h3 className="text-2xl font-bold text-white mb-4">
                   Step 2: Practice Questions
                 </h3>
                 <p className="text-secondary mb-6">
                   Answer 3 English questions from your uploaded test
                 </p>

                 {/* Question Display */}
                 <div className="text-left bg-white/5 rounded-xl p-6 mb-6">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-white/70">Question {currentQuestion + 1} of 3</span>
                     <div className="flex items-center gap-2">
                       <span className="text-white/70">English</span>
                       {streak > 0 && (
                         <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                           <AnimatedCounter value={streak} fontSize={12} textColor="white" fontWeight="bold" />
                         </div>
                       )}
                     </div>
                   </div>
                   
                   <p className="text-white text-lg mb-6">
                     {demoQuestions[currentQuestion].text}
                   </p>

                   <div className="space-y-3">
                     {demoQuestions[currentQuestion].options.map((option, index) => {
                       const answerLetter = option.split(')')[0]
                       const isAnswered = answers.length > currentQuestion
                       const userSelectedThis = answers[currentQuestion] === answerLetter
                       const thisIsCorrect = answerLetter === demoQuestions[currentQuestion].correct
                       
                       // Determine the state for each choice (matching PDF practice)
                       let state = ''
                       if (isAnswered) {
                         if (userSelectedThis && thisIsCorrect) {
                           state = 'choice-correct'
                         } else if (userSelectedThis && !thisIsCorrect) {
                           state = 'choice-incorrect'
                         } else if (!userSelectedThis && thisIsCorrect) {
                           state = 'choice-correct'
                         }
                       }
                       
                       const disabled = isAnswered
                       
                       return (
                         <button
                           key={index}
                           onClick={() => handleAnswer(answerLetter)}
                           disabled={disabled}
                           className={`choice ${state} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                         >
                           <span className="font-medium mr-2">{answerLetter}.</span>
                           <span className="text-white">{option.split(') ')[1]}</span>
                           {isAnswered && thisIsCorrect && !userSelectedThis && (
                             <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 px-2 py-1 rounded">
                               Correct Answer
                             </span>
                           )}
                           {isAnswered && userSelectedThis && !thisIsCorrect && (
                             <span className="ml-2 text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 px-2 py-1 rounded">
                               Your Answer
                             </span>
                           )}
                         </button>
                       )
                     })}
                   </div>
                 </div>
               </div>

               {/* Next Button - only show after all questions answered */}
               {answers.length === demoQuestions.length && (
                 <button
                   onClick={() => setCurrentStep(DemoStep.RESULTS)}
                   className="btn btn-primary text-lg px-8 py-4 w-full"
                 >
                   Next
                 </button>
               )}
             </div>
          </motion.div>
        )}

        {currentStep === DemoStep.RESULTS && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">
                Step 3: Your Results
              </h3>
              
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-white mb-2">
                You got {getScore()}/3 correct!
              </h4>
              
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <h5 className="text-white font-semibold mb-4">Performance Breakdown:</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white">English</span>
                    <span className="text-white">{Math.round((getScore() / 3) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(getScore() / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                <h5 className="text-blue-200 font-semibold mb-2">💡 Tip:</h5>
                <p className="text-blue-100 text-sm">
                  {getScore() >= 2 
                    ? "Great job! Focus on reading comprehension to improve further."
                    : "Practice grammar rules and sentence structure to boost your score."
                  }
                </p>
              </div>

              <button
                onClick={handleContinue}
                className="btn btn-primary"
              >
                Continue to Full Access
              </button>
            </div>
          </motion.div>
        )}


      </AnimatePresence>
      
      {/* Success Celebration (matching PDF practice) */}
      <SuccessCelebration 
        show={showSuccessCelebration}
        onComplete={() => setShowSuccessCelebration(false)}
        type={streak >= 3 ? 'streak' : 'correct'}
        message={streak >= 3 ? `Amazing ${streak} in a row!` : 'Correct!'}
      />
    </div>
  )
}
