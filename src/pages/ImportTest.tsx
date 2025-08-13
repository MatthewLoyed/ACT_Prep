import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import { getNextDefaultName, saveTestToSupabase } from '../lib/supabaseTestStore'
import EngagingLoader from '../components/EngagingLoader'

// Configure pdfjs worker from local node_modules to avoid CDN import failures
// Vite will serve this asset in dev
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
GlobalWorkerOptions.workerSrc = pdfWorker

type Extracted = {
  section: 'english' | 'math' | 'reading'
  questions: Array<{
    id: string
    prompt: string
    choices: string[]
    choiceLetters?: string[] // Add choice letters (A, B, C, D or F, G, H, J)
    answerIndex?: number
    passageId?: string
    passage?: string
  }>
}

export default function ImportTest() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string>('Drop a PDF or choose a file to parse…')
  const [results, setResults] = useState<Extracted[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  async function parsePdf(file: File) {
    try {
      setIsProcessing(true)
      // Import debug removed
      
      // Check file size - limit to 50MB to prevent memory issues
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Please use a file smaller than 50MB.`)
      }
      
      setStatus('Reading PDF…')
      
      const buf = await file.arrayBuffer()
      
      // Convert to base64 for storage - use a safer method for large files
      const base64 = await arrayBufferToBase64(buf)
      
      const pdf: PDFDocumentProxy = await getDocument({ data: buf }).promise

    setStatus(`Parsing ${pdf.numPages} pages…`)
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      // Extract text content
      const content = await page.getTextContent()
      type PDFTextItem = { str: string }
      const text = (content.items as PDFTextItem[])
        .map((it) => it.str)
        .join('\n')
      pages.push(text)
    }

    // Naive split heuristics for Math/Reading/English
    const combined = pages.join('\n')

    const sections: Extracted[] = []
    
    // Improved section slicing with better boundaries
    const englishText = sliceBetween(combined, /ENGLISH TEST\s+35\s+Minutes—50\s+Questions/i, /(MATH|MATHEMATICS) TEST/i)
    const mathText = sliceBetween(combined, /(MATH|MATHEMATICS) TEST\s+50\s+Minutes—45\s+Questions/i, /READING TEST/i)
    const readingText = sliceBetween(combined, /READING TEST\s+40\s+Minutes—36\s+Questions/i, /SCIENCE TEST/i)
    
    // Section detection debug removed

    const english: Extracted = englishText
      ? extractEnglish(englishText)
      : { section: 'english', questions: [] as Extracted['questions'] }
    if (english.questions.length) sections.push(english)

    const math = mathText 
      ? extractMath(mathText) 
      : { section: 'math' as const, questions: [] as Extracted['questions'] }
    if (math.questions.length) sections.push(math)
    
    const reading = readingText 
      ? extractReading(readingText) 
      : { section: 'reading' as const, questions: [] as Extracted['questions'] }
    if (reading.questions.length) sections.push(reading)

    // Extract and assign answer keys for each section separately
    // Answer key extraction debug removed
    
    // Answer key sections debug removed
    
    // Create a helper function to clone questions
    function cloneQuestions(questions: Extracted['questions']): Extracted['questions'] {
      return questions.map(q => ({ ...q }))
    }

    // Store sections in a map to prevent cross-contamination
    const sectionMap: Record<string, Extracted> = {}

    // English answer key - use section-specific text
    if (english.questions.length > 0) {
      // English answer key extraction debug removed
      // Clone questions to ensure independence
      const englishClone = { ...english, questions: cloneQuestions(english.questions) }
      sectionMap.english = englishClone
      
      const englishKey = extractEnglishAnswerKey(combined)
      if (englishKey) {
        console.log(`ENGLISH DEBUG: Found ${Object.keys(englishKey).length} answers`)
        console.log('ENGLISH DEBUG: First 4 answers:', Object.entries(englishKey).slice(0, 4).map(([q, a]) => `${q}:${a}`).join(', '))
        
        // Assign answers to ALL questions (not just first 4)
        englishClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = englishKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
        
        // Debug first 4 questions only for readability
        console.log('ENGLISH DEBUG: Step-by-step answer assignment (first 4):')
        englishClone.questions.slice(0, 4).forEach((q) => {
          const num = Number(q.id.split('-')[1])
          const letter = englishKey[num]
          const mappedIndex = letter ? mapAnswerLetterToIndex(letter) : 'undefined'
          console.log(`  Question ${num}:`)
          console.log(`    Answer Key Letter: ${letter || 'NOT FOUND'}`)
          console.log(`    Mapped to Index: ${mappedIndex}`)
          console.log(`    Question Text: "${q.prompt.substring(0, 100)}..."`)
        })
        
        // Show first 4 questions after assignment
        console.log('ENGLISH DEBUG: First 4 questions after assignment:')
        englishClone.questions.slice(0, 4).forEach((q) => {
          const num = Number(q.id.split('-')[1])
          console.log(`  Question ${num}: Answer=${q.answerIndex}`)
        })
        
        // Final English answers debug
        console.log('=== FINAL ENGLISH ANSWERS ===')
        englishClone.questions.forEach((q) => {
          const num = Number(q.id.split('-')[1])
          const answerLetter = englishKey[num] || 'NOT FOUND'
          const answerIndex = q.answerIndex !== undefined ? q.answerIndex : 'NOT SET'
          console.log(`English Question ${num}: ${answerLetter} (index: ${answerIndex})`)
        })
        console.log('=== END FINAL ENGLISH ANSWERS ===')
      } else {
        console.log('ENGLISH DEBUG: No answer key found')
      }
    }

    // Math answer key - use section-specific text
    if (math.questions.length > 0) {
      // Math answer key extraction debug removed
      // Clone questions to ensure independence
      const mathClone = { ...math, questions: cloneQuestions(math.questions) }
      sectionMap.math = mathClone
      
      const mathKey = extractMathAnswerKey(combined)
      if (mathKey) {
        // Math answer key debug removed
        mathClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = mathKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
        
        // Math answers after assignment debug removed
      } else {
        // No Math answer key found debug removed
      }
    }

    // Reading answer key - use section-specific text
    if (reading.questions.length > 0) {
      // Reading answer key extraction debug removed
      // Clone questions to ensure independence
      const readingClone = { ...reading, questions: cloneQuestions(reading.questions) }
      sectionMap.reading = readingClone
      
      const readingKey = extractReadingAnswerKey(combined)
      if (readingKey) {
        // Reading answer key debug removed
        readingClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = readingKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
      }
    }

    // Auto-save to library if we have any sections (AFTER assigning answers)
    if (Object.keys(sectionMap).length > 0) {
      setStatus('Auto-saving to library...')
      const name = getNextDefaultName()
      const sectionsRecord: Record<string, Extracted['questions']> = {}
      
      // Use sectionMap instead of sections array to prevent cross-contamination
      Object.entries(sectionMap).forEach(([sectionName, section]) => {
        sectionsRecord[sectionName] = section.questions
      })
      
      
      
      
      // Section answer count debug removed
      
      try {
        const saved = await saveTestToSupabase({ name, sections: sectionsRecord, pdfData: base64 })
        
        // Save debug removed
        
        setStatus(`✅ Auto-saved as "${saved.name}"! You can now start testing.`)
      } catch (error) {
        console.error('IMPORT DEBUG: Failed to save test:', error)
        setStatus(`❌ ${error instanceof Error ? error.message : 'Failed to save test. Please clear some tests and try again.'}`)
      }
    } else {
      setStatus('No test sections found. Please check your PDF.')
    }

    setResults(sections)
    setStatus('Parsed. Review and export JSON.')
    } catch (error) {
      console.error('IMPORT DEBUG: Error during PDF parsing:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(false)
    }
  }



  function extractMath(mathText: string): Extracted {
    // Clean footers, page artifacts, and guidance lines
    const text = mathText
      .replace(/GO ON TO THE NEXT PAGE\.?/gi, ' ')
      .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n)/gi, ' ')
      .replace(/Page\s+\d+\s+of\s+\d+/gi, ' ')
      .replace(/QU[0-9A-Z.-]+/g, ' ')
      .replace(/\n\s*(?:\d+\s+){2,}\n/g, '\n') // sequences of numbers like 5 6 7 8...
      // Remove legal statements and other non-question content
      .replace(/I understand that by registering[\s\S]*?authorities\./gi, ' ')
      .replace(/Terms and Conditions[\s\S]*?privacy\.html/gi, ' ')

    const questions: Extracted['questions'] = []

    // Extract question blocks by line-start numbers - be more specific
    const qRegex = /(?:^|\n)\s*(\d{1,2})\.\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}\.\s)|$)/g
    let m: RegExpExecArray | null
    while ((m = qRegex.exec(text)) !== null) {
      const qNum = Number(m[1])
      if (qNum < 1 || qNum > 60) continue // Allow up to 60 for Math
      const block = m[2]

      // Find the end of the question prompt - look for the first choice letter
      const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
      const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
      const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

      // Clean up the prompt - remove extra whitespace and line breaks
      const prompt = promptFragment
        .replace(/\s+/g, ' ')
        .trim()

      // Skip if prompt is too short or contains obvious non-question content
      if (prompt.length < 10) continue
      if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

      // Extract choices using a more robust approach
      const choices: string[] = []
      const choiceLetters: string[] = []
      if (choiceRegion) {
        // Split by choice letters and collect the text after each
        const choiceParts = choiceRegion.split(/([A-DFGHJ])[.)]\s*/)
        
        for (let i = 1; i < choiceParts.length; i += 2) {
          if (i + 1 < choiceParts.length) {
            const letter = choiceParts[i]
            let choiceText = choiceParts[i + 1]
            
            // Find where this choice ends by looking for the next choice letter
            const nextChoiceMatch = choiceText.match(/([A-DFGHJ])[.)]\s*/)
            if (nextChoiceMatch) {
              // Only cut off if we're not inside parentheses
              const beforeNextChoice = choiceText.slice(0, nextChoiceMatch.index)
              const parenCount = (beforeNextChoice.match(/\(/g) || []).length - (beforeNextChoice.match(/\)/g) || []).length
              
              if (parenCount <= 0) {
                // We're not inside parentheses, safe to cut off
                choiceText = beforeNextChoice
              } else {
                // We're inside parentheses, look for the next choice after closing all parentheses
                const searchText = choiceText
                let parenLevel = 0
                let cutIndex = -1
                
                for (let j = 0; j < searchText.length; j++) {
                  if (searchText[j] === '(') parenLevel++
                  else if (searchText[j] === ')') parenLevel--
                  else if (parenLevel === 0 && /[A-DFGHJ][.)]\s/.test(searchText.slice(j, j + 3))) {
                    cutIndex = j
                    break
                  }
                }
                
                if (cutIndex !== -1) {
                  choiceText = searchText.slice(0, cutIndex)
                }
              }
            }
            
            // Clean up the choice text
            choiceText = choiceText.replace(/\s+/g, ' ').trim()
            if (choiceText && choiceText.length > 0) {
              choices.push(choiceText)
              choiceLetters.push(letter)
            }
          }
        }
      }

      // Ensure we have exactly 4 choices
      const finalChoices = choices.slice(0, 4)
      const finalChoiceLetters = choiceLetters.slice(0, 4)
      while (finalChoices.length < 4) {
        finalChoices.push('') // Add empty choices if needed
        finalChoiceLetters.push('') // Add empty choice letters if needed
      }

      // Skip if we don't have any valid choices
      if (finalChoices.every(c => !c.trim())) continue

      questions.push({
        id: `math-${qNum}`,
        prompt,
        choices: finalChoices,
        choiceLetters: finalChoiceLetters,
      })
    }

    // Math questions extracted debug removed
    return { section: 'math', questions }
  }

  function extractEnglish(englishText: string): Extracted {
    // Clean footers, page artifacts, and guidance lines
    const text = englishText
      .replace(/GO ON TO THE NEXT PAGE\.?/gi, ' ')
      .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n)/gi, ' ')
      .replace(/Page\s+\d+\s+of\s+\d+/gi, ' ')
      .replace(/QU[0-9A-Z.-]+/g, ' ')
      .replace(/\n\s*(?:\d+\s+){2,}\n/g, '\n') // sequences of numbers like 5 6 7 8...

    const questions: Extracted['questions'] = []

    // Split by PASSAGE headings with Roman numerals
    const parts = text.split(/PASSAGE\s+([IVX]+)/i)
    for (let i = 1; i < parts.length; i += 2) {
      const roman = parts[i].trim().toUpperCase()
      const passageId = `passage-${roman}`
      const content = parts[i + 1] || ''

      // Find passage body (left column) until first question number at line start
      const firstQ = content.search(/\n\s*\d{1,2}[.)]\s/)
      const passageBody = firstQ !== -1 ? content.slice(0, firstQ) : ''
      const questionsText = firstQ !== -1 ? content.slice(firstQ) : content

      const cleanPassage = passageBody
        .replace(/\s+/g, ' ')
        .trim()

      // Extract question blocks within this passage by line-start numbers
      const qRegex = /(?:^|\n)\s*(\d{1,2})[.)]\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}[.)]\s)|$)/g
      let m: RegExpExecArray | null
      while ((m = qRegex.exec(questionsText)) !== null) {
        const qNum = Number(m[1])
        if (qNum < 1 || qNum > 75) continue
        const block = m[2]

        // Find the end of the question prompt - look for the first choice letter
        const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
        const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
        const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

        // Clean up the prompt - remove extra whitespace and line breaks
        const prompt = promptFragment
          .replace(/\s+/g, ' ')
          .trim()

        // Extract choices using a more robust approach
        const choices: string[] = []
        const choiceLetters: string[] = []
        if (choiceRegion) {
          // Split by choice letters and collect the text after each
          const choiceParts = choiceRegion.split(/([A-DFGHJ])[.)]\s*/)
          for (let i = 1; i < choiceParts.length; i += 2) {
            if (i + 1 < choiceParts.length) {
              const letter = choiceParts[i]
              let choiceText = choiceParts[i + 1]
              
              // Find where this choice ends by looking for the next choice letter
              const nextChoiceMatch = choiceText.match(/([A-DFGHJ])[.)]\s*/)
              if (nextChoiceMatch) {
                // Only cut off if we're not inside parentheses
                const beforeNextChoice = choiceText.slice(0, nextChoiceMatch.index)
                const parenCount = (beforeNextChoice.match(/\(/g) || []).length - (beforeNextChoice.match(/\)/g) || []).length
                
                if (parenCount <= 0) {
                  // We're not inside parentheses, safe to cut off
                  choiceText = beforeNextChoice
                } else {
                  // We're inside parentheses, look for the next choice after closing all parentheses
                  const searchText = choiceText
                  let parenLevel = 0
                  let cutIndex = -1
                  
                  for (let j = 0; j < searchText.length; j++) {
                    if (searchText[j] === '(') parenLevel++
                    else if (searchText[j] === ')') parenLevel--
                    else if (parenLevel === 0 && /[A-DFGHJ][.)]\s/.test(searchText.slice(j, j + 3))) {
                      cutIndex = j
                      break
                    }
                  }
                  
                  if (cutIndex !== -1) {
                    choiceText = searchText.slice(0, cutIndex)
                  }
                }
              }
              
              // Clean up the choice text
              choiceText = choiceText.replace(/\s+/g, ' ').trim()
              if (choiceText && choiceText.length > 1) {
                choices.push(choiceText)
                choiceLetters.push(letter)
              }
            }
          }
        }

        // Ensure we have exactly 4 choices
        const finalChoices = choices.slice(0, 4)
        const finalChoiceLetters = choiceLetters.slice(0, 4)
        while (finalChoices.length < 4) {
          finalChoices.push('') // Add empty choices if needed
          finalChoiceLetters.push('') // Add empty choice letters if needed
        }

        if (prompt.length < 5) continue

        questions.push({
          id: `english-${qNum}`,
          prompt,
          choices: finalChoices,
          choiceLetters: finalChoiceLetters,
          passageId,
          passage: cleanPassage,
        })
      }
    }

    // Note: Answer key assignment is handled in the main parsePdf function
    // to ensure consistency with Math and Reading sections
    
    return { section: 'english', questions }
  }

  function extractReading(readingText: string): Extracted {
    // Clean footers, page artifacts, and guidance lines
    const text = readingText
      .replace(/GO ON TO THE NEXT PAGE\.?/gi, ' ')
      .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n)/gi, ' ')
      .replace(/Page\s+\d+\s+of\s+\d+/gi, ' ')
      .replace(/QU[0-9A-Z.-]+/g, ' ')
      .replace(/\n\s*(?:\d+\s+){2,}\n/g, '\n') // sequences of numbers like 5 6 7 8...



    // Initialize 36 empty reading questions
    const questions: Extracted['questions'] = []
    for (let i = 1; i <= 36; i++) {
      questions.push({
        id: `reading-${i}`,
        prompt: `Question ${i} (not loaded)`,
        choices: ['', '', '', ''],
        choiceLetters: ['A', 'B', 'C', 'D']
      })
    }

    // Extract actual questions from the text
    const qRegex = /(?:^|\n)\s*(\d{1,2})\.\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}\.\s)|$)/g
    let m: RegExpExecArray | null

    
    while ((m = qRegex.exec(text)) !== null) {
      const qNum = Number(m[1])
      if (qNum < 1 || qNum > 36) {
        continue
      }
      const block = m[2]

      // Find the end of the question prompt - look for the first choice letter
      const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
      const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
      const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

   

      // Clean up the prompt - remove extra whitespace and line breaks
      const prompt = promptFragment
        .replace(/\s+/g, ' ')
        .trim()

      // Extract choices using a more robust approach
      const choices: string[] = []
      const choiceLetters: string[] = []
      if (choiceRegion) {
        // Split by choice letters and collect the text after each
        const choiceParts = choiceRegion.split(/([A-DFGHJ])[.)]\s*/)
        
        for (let i = 1; i < choiceParts.length; i += 2) {
          if (i + 1 < choiceParts.length) {
            const letter = choiceParts[i] // Extract the actual letter from the split
            let choiceText = choiceParts[i + 1]
            
            // Find where this choice ends by looking for the next choice letter
            const nextChoiceMatch = choiceText.match(/([A-DFGHJ])[.)]\s*/)
            if (nextChoiceMatch) {
              // Only cut off if we're not inside parentheses
              const beforeNextChoice = choiceText.slice(0, nextChoiceMatch.index)
              const parenCount = (beforeNextChoice.match(/\(/g) || []).length - (beforeNextChoice.match(/\)/g) || []).length
              
              if (parenCount <= 0) {
                // We're not inside parentheses, safe to cut off
                choiceText = beforeNextChoice
              } else {
                // We're inside parentheses, look for the next choice after closing all parentheses
                const searchText = choiceText
                let parenLevel = 0
                let cutIndex = -1
                
                for (let j = 0; j < searchText.length; j++) {
                  if (searchText[j] === '(') parenLevel++
                  else if (searchText[j] === ')') parenLevel--
                  else if (parenLevel === 0 && /[A-DFGHJ][.)]\s/.test(searchText.slice(j, j + 3))) {
                    cutIndex = j
                    break
                  }
                }
                
                if (cutIndex !== -1) {
                  choiceText = searchText.slice(0, cutIndex)
                }
              }
            }
            
            // Clean up the choice text
            choiceText = choiceText.replace(/\s+/g, ' ').trim()
            
            // Safe cutoff for last choice to prevent page overflow
            if (choiceText && choiceText.length > 0) {
              // Check if this choice contains page boundary indicators
              const pageBoundaryPatterns = [
                /\d+\s+\d+\s+passage\s+[IVX]+/i,  // "4 4 PASSAGE II"
                /passage\s+[IVX]+\s+informational/i,  // "PASSAGE II INFORMATIONAL"
                /go\s+on\s+to\s+the\s+next\s+page/i,  // "GO ON TO THE NEXT PAGE"
                /page\s+\d+\s+of\s+\d+/i,  // "Page X of Y"
                /©\d{4}\s+by\s+act/i,  // Copyright
                /qu[0-9a-z.-]+/i,  // Question codes
                /stop!?\s+do\s+not\s+turn\s+the\s+page/i,  // "STOP! DO NOT TURN THE PAGE"
                /do\s+not\s+return\s+to\s+a\s+previous\s+test/i  // "DO NOT RETURN TO A PREVIOUS TEST"
              ]
              
              let shouldCutoff = false
              let cutoffIndex = -1
              
                             for (const pattern of pageBoundaryPatterns) {
                 const match = choiceText.match(pattern)
                 if (match && match.index !== undefined) {
                   shouldCutoff = true
                   cutoffIndex = match.index
                   break
                 }
               }
              
              // Also limit choice length to prevent extremely long choices
              const maxChoiceLength = 500
              if (choiceText.length > maxChoiceLength) {
                shouldCutoff = true
                cutoffIndex = Math.min(cutoffIndex !== -1 ? cutoffIndex : maxChoiceLength, maxChoiceLength)
              }
              
              // Apply cutoff if needed
              if (shouldCutoff && cutoffIndex !== -1) {
                choiceText = choiceText.substring(0, cutoffIndex).trim()
                // Add ellipsis to indicate truncation
                if (choiceText.length > 0) {
                  choiceText += '...'
                }
              }
              
              if (choiceText && choiceText.length > 0) {
                choices.push(choiceText)
                choiceLetters.push(letter) // Add the actual letter
              }
            }
          }
        }
      }

      // Ensure we have exactly 4 choices
      const finalChoices = choices.slice(0, 4)
      const finalChoiceLetters = choiceLetters.slice(0, 4)
      while (finalChoices.length < 4) {
        finalChoices.push('') // Add empty choices if needed
      }
      while (finalChoiceLetters.length < 4) {
        finalChoiceLetters.push('') // Add empty choice letters if needed
      }

            // Update the question in the array
      if (qNum >= 1 && qNum <= 36) {
        questions[qNum - 1] = {
          id: `reading-${qNum}`,
          prompt,
          choices: finalChoices,
          choiceLetters: finalChoiceLetters,
        }
      }
    }

    const actualQuestions = questions.filter(q => {
      const num = Number(q.id.split('-')[1])
      return q.prompt !== `Question ${num} (not loaded)`
    })
    
    
    if (actualQuestions.length === 0) {
      
      // Look for any numbers that might be questions
      const numberMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]/g))
      console.log(`Found ${numberMatches.length} potential question numbers:`)
      numberMatches.slice(0, 10).forEach((match, index) => {
        const num = match[1]
        const context = text.substring(Math.max(0, match.index - 50), match.index + 100)
        console.log(`  ${index + 1}. Number ${num}: "${context}"`)
      })
    }

    return { section: 'reading', questions }
  }

  function extractAnswerKey(text: string, sectionName: string, searchPattern: RegExp, endPattern?: RegExp): Record<number, string> | null {
    console.log(`Looking for ${sectionName}...`)
    
    let sectionText: string
    if (endPattern) {
      // Use regex match with end pattern (for Math and Reading)
      const sectionMatch = text.match(searchPattern)
      if (!sectionMatch) {
        console.log(`No ${sectionName} found`)
        return null
      }
      sectionText = sectionMatch[0]
    } else {
      // Use simple search (for English)
      const startIdx = text.search(searchPattern)
      if (startIdx === -1) {
        // Section not found debug removed
        return null
      }
      sectionText = text.slice(startIdx, startIdx + 5000) // scan ahead
    }
    
    // Section found and text preview debug removed
    
    // Show the exact text being parsed for answers - debug removed
    
    const lines = sectionText.split('\n')
    // Lines count debug removed

    // Filter out empty lines and get only the data lines
    const dataLines = lines.map(line => line.trim()).filter(line => line.length > 0)
    // Data lines count debug removed
    
    // The data is in columns, so we need to reconstruct rows
    const map: Record<number, string> = {}
    
    for (let i = 0; i < dataLines.length - 2; i++) {
      const line1 = dataLines[i]      // Question number
      const line2 = dataLines[i + 1]  // Answer letter  
      // const line3 = dataLines[i + 2]  // Category - unused
      
      // Check if this looks like a question number
      if (/^\d{1,2}$/.test(line1)) {
        const questionNum = Number(line1)
        // Check if the next line is a valid answer letter
        if (/^[A-DFGHJ]$/.test(line2)) {
          const answerLetter = line2
          if (questionNum >= 1 && questionNum <= 60) {
            map[questionNum] = answerLetter
            // Found answer debug removed
          }
        }
      }
    }

    // Answer key found count and sample answers debug removed
    
    return Object.keys(map).length > 0 ? map : null
  }

  function extractEnglishAnswerKey(text: string): Record<number, string> | null {
    return extractAnswerKey(
      text,
      'English Scoring Key',
      /English Scoring Key[\s\S]*?(?=Mathematics Scoring Key|Math Scoring Key|Reading Scoring Key|Science Scoring Key|$)/i,
      /Mathematics Scoring Key|Math Scoring Key|Reading Scoring Key|Science Scoring Key|$/
    )
  }

  function extractMathAnswerKey(text: string): Record<number, string> | null {
    return extractAnswerKey(text, 'Mathematics Scoring Key', /Mathematics Scoring Key[\s\S]*?(?=Reading Scoring Key|Science Scoring Key|$)/i, /Reading Scoring Key|Science Scoring Key|$/)
  }

  function extractReadingAnswerKey(text: string): Record<number, string> | null {
    return extractAnswerKey(text, 'Reading Scoring Key', /Reading Scoring Key[\s\S]*?(?=Science Scoring Key|$)/i, /Science Scoring Key|$/)
  }



  function mapAnswerLetterToIndex(letter: string): number {
    const L = letter.toUpperCase()
    let index = 0
    if (L === 'A' || L === 'F') index = 0
    else if (L === 'B' || L === 'G') index = 1
    else if (L === 'C' || L === 'H') index = 2
    else if (L === 'D' || L === 'J') index = 3
    else index = 0
    
    return index
  }

  function sliceBetween(text: string, start: RegExp, end: RegExp): string | null {
    const s = text.search(start)
    if (s === -1) return null
    const tail = text.slice(s)
    const e = tail.search(end)
    return e === -1 ? tail : tail.slice(0, e)
  }

  // Safe base64 conversion for large files
  function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        const chunkSize = 8192 // Process in chunks to avoid stack overflow
        
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize)
          // Use a more efficient method that doesn't cause stack overflow
          for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j])
          }
        }
        
        const base64 = btoa(binary)
        resolve(base64)
      } catch (error) {
        reject(error)
      }
    })
  }



  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parsePdf(file).catch(err => setStatus(`Error: ${String(err)}`))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Import Practice Test
        </h2>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          Upload your ACT® practice test PDF and we'll automatically extract questions for Math, Reading, and English sections.
        </p>
      </div>

      <div className="card p-8 text-center">
        {isProcessing ? (
          <div className="py-8">
            <EngagingLoader 
              message={status} 
              size="lg"
              showThinking={true}
            />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Import?</h3>
              <p className="text-secondary">
                Simply upload your ACT® practice test PDF and we'll handle the rest
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <input ref={inputRef} type="file" accept="application/pdf" onChange={onFile} className="hidden" />
              <button 
                className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" 
                onClick={() => inputRef.current?.click()}
              >
                Choose PDF File
              </button>
            </div>
            <div className="mt-4 text-sm text-secondary">{status}</div>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="card p-5">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold text-lg mb-2">Test Successfully Imported!</div>
              <div className="text-secondary mb-4">
                Your test has been automatically saved to your library.
              </div>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/practice')}
              >
                Start Practicing
              </button>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="text-lg font-semibold mb-3">Extraction Summary</h3>
            {results.map((sec) => (
              <div key={sec.section} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <div>
                  <span className="font-medium capitalize">{sec.section}</span>
                  <span className="text-sm text-secondary ml-2">
                    {sec.questions.length} questions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}