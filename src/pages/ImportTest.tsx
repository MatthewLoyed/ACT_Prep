import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import { listTestsFromSupabase } from '../lib/simpleSupabaseStorage'
import { getNextDefaultName } from '../lib/testStore'
import { saveTestToSupabase } from '../lib/simpleSupabaseStorage'
import EngagingLoader from '../components/EngagingLoader'
import { parsePdf, type Extracted } from '../lib/pdfParser'

// Configure pdfjs worker from local node_modules to avoid CDN import failures
// Use local worker to avoid CDN issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
GlobalWorkerOptions.workerSrc = pdfWorker

export default function ImportTest() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string>('Drop a PDF or choose a file to parse…')

  const [isProcessing, setIsProcessing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [importedTestId, setImportedTestId] = useState<string | null>(null)

  async function processPdf(file: File) {
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
      
      // Use the new parser system
      const { results: finalResults, format, reason } = await parsePdf(file)
      

      
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
            pageQuestions
          })
          setStatus(`✅ Auto-saved to Supabase as "${saved.name}"! (${format} format: ${reason})`)
          setImportedTestId(saved.id) // Store the test ID for navigation
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
      processPdf(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      processPdf(file)
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

        {/* Main Upload Area */}
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
                  {hasError ? '❌ Try Again' : 'Choose PDF File'}
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
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className={`btn btn-lg ${
                    hasError 
                      ? 'btn-error shadow-lg hover:shadow-xl transform hover:scale-105 animate-pulse' 
                      : 'btn-primary'
                  }`}
                >
                  {hasError ? '🔄 Choose Different File' : 'Choose PDF File'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success Actions - Moved up for better visibility */}
        {importedTestId && !isProcessing && !hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 mb-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              🎉 Test Imported Successfully!
            </h2>
            <p className="text-secondary mb-6">
              Your practice test is ready to use. Start practicing now!
            </p>
            <button
              onClick={handleStartPracticing}
              className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              🚀 Start Practicing
            </button>
          </motion.div>
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