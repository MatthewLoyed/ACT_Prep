import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import { listTestsFromSupabase } from '../lib/simpleSupabaseStorage'
import { getNextDefaultName } from '../lib/testStore'
import { saveTestToSupabase } from '../lib/simpleSupabaseStorage'
import EngagingLoader from '../components/EngagingLoader'
import SuccessAnimation from '../components/SuccessAnimation'
import { parsePdf, type Extracted } from '../lib/pdfParser'
import { useAuth } from '../contexts/AuthContext'

// Configure pdfjs worker from local node_modules to avoid CDN import failures
// Use local worker to avoid CDN issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
GlobalWorkerOptions.workerSrc = pdfWorker

export default function ImportTest() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string>('Drop your ACT® practice test here or click to browse…')

  const [isProcessing, setIsProcessing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [importedTestId, setImportedTestId] = useState<string | null>(null)
  const [showSuccessIcons, setShowSuccessIcons] = useState(false)
  const [showTestTypeModal, setShowTestTypeModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Authentication check
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  async function processPdf(file: File, testType: 'enhanced' | 'old') {
    try {
      setIsProcessing(true)
      setHasError(false)
      
      // Check file size - limit to 50MB to prevent memory issues
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Please use a file smaller than 50MB.`)
      }
      
      setStatus('Reading PDF…')
      
      // Convert to base64 for storage
      const buf = await file.arrayBuffer()
      const base64 = await arrayBufferToBase64(buf)
      
      setStatus('Detecting format and parsing...')
      
      // Use the new parser system with test type
      const { results: finalResults, format, reason } = await parsePdf(file, testType)
      

      
      // Auto-save to library if we have any sections
      if (finalResults.length > 0) {
        setStatus('Auto-saving to library...')
        
        // Use the original filename as the test name, removing the .pdf extension
        const originalName = file.name.replace(/\.pdf$/i, '')
        const baseName = originalName || getNextDefaultName()
        
        // Generate a unique name by checking for duplicates
        const name = await generateUniqueTestName(baseName)
        
        const sectionsRecord: Record<string, Extracted['questions']> = {}
        let sectionPages: Partial<Record<string, number>> = {}
        const pageQuestions: Partial<Record<string, Record<number, string[]>>> = {}
        
        // Convert results to sections record and extract section pages and page questions
        finalResults.forEach((section) => {
          sectionsRecord[section.section] = section.questions
          // Extract section pages from the first section that has them
          if (section.sectionPages && Object.keys(sectionPages).length === 0) {
            sectionPages = section.sectionPages
          }
          // Extract page questions mapping
          if (section.pageQuestions) {
            pageQuestions[section.section] = section.pageQuestions
          }
        })
        
        try {
          const saved = await saveTestToSupabase({ 
            name, 
            sections: sectionsRecord, 
            pdfData: base64,
            sectionPages,
            pageQuestions,
            testType: testType // Pass the selected test type
          })
          setStatus(`✅ Auto-saved to Supabase as "${saved.name}"! (${format} format: ${reason})`)
          setImportedTestId(saved.id) // Store the test ID for navigation
          setShowSuccessIcons(true) // Show success icons
        } catch (error) {
          console.error('Failed to save test:', error)
          setStatus(`❌ ${error instanceof Error ? error.message : 'Failed to save test to Supabase.'}`)
          setHasError(true)
        }
      } else {
        setStatus(`❌ No questions found. (${format} format: ${reason})`)
        setHasError(true)
      }
    } catch (error) {
      console.error('Error during PDF parsing:', error)
      setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      setHasError(true)
    } finally {
      setIsProcessing(false)
    }
  }

  async function generateUniqueTestName(baseName: string): Promise<string> {
    let name = baseName
    let counter = 1
    
    // Get existing tests to check for name conflicts
    const existingTests = await listTestsFromSupabase()
    const existingNames = new Set(existingTests.map((test: any) => test.name))
    
    // Check if name already exists and add suffix if needed
    while (existingNames.has(name)) {
      if (counter === 1) {
        name = `${baseName}_copy`
      } else {
        name = `${baseName}_${counter}`
      }
      counter++
      
      // Prevent infinite loop
      if (counter > 100) {
        name = `${baseName}_${Date.now()}`
        break
      }
    }
    
    return name
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowTestTypeModal(true)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setShowTestTypeModal(true)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleStartPracticing = () => {
    if (importedTestId) {
      navigate(`/practice?selectedTest=${importedTestId}`)
    } else {
      navigate('/practice')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Import Practice Test
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Upload your ACT® practice test PDF to start practicing
          </p>
        </div>

        {/* Main Upload Area - Hidden after successful import */}
        {!importedTestId && (
          <div className="card p-8 mb-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                hasError 
                  ? 'border-red-300 bg-red-500/20 animate-shake' 
                  : 'border-white/30 hover:border-white/50 hover:bg-white/10'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isProcessing ? (
                <EngagingLoader />
              ) : (
                <>
                  <div className="text-6xl mb-4">📄</div>
                  <h2 className="text-2xl font-semibold mb-4">
                    {hasError ? '❌ Try Again' : 'Select Your Test'}
                  </h2>
                  <p className="text-secondary mb-6">
                    {status}
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    // Add performance optimizations
                    multiple={false}
                    // Prevent unnecessary re-renders
                    key={isProcessing ? 'processing' : 'ready'}
                  />
                  <button
                    onClick={() => inputRef.current?.click()}
                    className={`btn btn-lg ${
                      hasError 
                        ? 'btn-error shadow-lg hover:shadow-xl transform hover:scale-105 animate-pulse' 
                        : 'btn-primary'
                    }`}
                  >
                    {hasError ? '🔄 Try Again' : 'Browse Files'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success Actions - Enhanced with fun animations */}
        {importedTestId && !isProcessing && !hasError && (
          <div className="relative">
            {/* Success Animation Overlay */}
            <SuccessAnimation 
              show={showSuccessIcons}
              onComplete={() => setShowSuccessIcons(false)}
            />

            {/* Success Box Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
              className="card p-8 mb-8 text-center bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
            >
              {/* Success Celebration Animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring",
                  delay: 0.2
                }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-3xl font-bold mb-4"
              >
                <span className="text-white">
                  Test Imported{' '}
                </span>
                <span className="text-emerald-400">
                  Successfully
                </span>
                <span className="text-white">
                  !
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-lg text-secondary mb-8"
              >
                Your practice test is ready to use. Start practicing now!
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                {/* Glowing Start Practicing Button */}
                <motion.button
                  onClick={handleStartPracticing}
                  className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)',
                      '0 0 50px rgba(255, 234, 167, 0.9), 0 0 100px rgba(102, 126, 234, 0.8)',
                      '0 0 30px rgba(255, 234, 167, 0.6), 0 0 60px rgba(102, 126, 234, 0.5)'
                    ],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🚀 Start Practicing
                </motion.button>
                
                <button
                  onClick={() => {
                    setImportedTestId(null)
                    setStatus('Drop a PDF or choose a file to parse…')
                    if (inputRef.current) {
                      inputRef.current.value = ''
                    }
                  }}
                  className="btn btn-ghost btn-lg border border-white/30 hover:bg-white/20 transition-all duration-200"
                >
                  📄 Upload Another Test
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* External Resources Section */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Need Practice Tests?</h2>
          <p className="text-secondary mb-6">
            Download official ACT® practice tests from these trusted sources:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              📚 ACT.org Official Tests
            </a>
            <a
              href="https://www.mysatactprep.com/free-act-practice-tests"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              🎯 MySATACTPrep
            </a>
            <a
              href="https://magoosh.com/hs/act/act-practice-test/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              🧠 Magoosh ACT Prep
            </a>
          </div>
        </div>


      </div>

      {/* Test Type Selection Modal */}
      {showTestTypeModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card p-8 max-w-md mx-4"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-4">Select Test Type</h3>
              <p className="text-secondary mb-6">
                What type of ACT® test is this?
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                File: <span className="font-mono text-[var(--color-accent)] font-semibold">{selectedFile?.name}</span>
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowTestTypeModal(false)
                    processPdf(selectedFile, 'enhanced')
                  }}
                  className="w-full btn btn-ghost btn-lg border border-white/30 hover:bg-white/20 transition-all duration-200"
                >
                  <div className="text-left">
                    <div className="font-semibold">Enhanced ACT®</div>
                    <div className="text-sm opacity-75">2025 - Present (New Format)</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowTestTypeModal(false)
                    processPdf(selectedFile, 'old')
                  }}
                  className="w-full btn btn-ghost btn-lg border border-white/30 hover:bg-white/20 transition-all duration-200"
                >
                  <div className="text-left">
                    <div className="font-semibold">Old ACT®</div>
                    <div className="text-sm opacity-75">Pre-2025 (Classic Format)</div>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowTestTypeModal(false)
                  setSelectedFile(null)
                }}
                className="mt-4 text-sm text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data URL prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(new Blob([buffer]))
  })
}