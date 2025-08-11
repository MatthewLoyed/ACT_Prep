import { useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import { getNextDefaultName, saveTest } from '../lib/testStore'

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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string>('Drop a PDF or choose a file to parse…')
  const [results, setResults] = useState<Extracted[]>([])

  async function parsePdf(file: File) {
    setStatus('Reading PDF…')
    const buf = await file.arrayBuffer()
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
    
    console.log('Section detection:')
    console.log(`  English: ${englishText ? 'Found' : 'Not found'}`)
    console.log(`  Math: ${mathText ? 'Found' : 'Not found'}`)
    console.log(`  Reading: ${readingText ? 'Found' : 'Not found'}`)

    const english: Extracted = englishText
      ? extractEnglish(englishText, combined)
      : { section: 'english', questions: [] as Extracted['questions'] }
    if (english.questions.length) sections.push(english)

    const math = mathText ? extractMath(mathText) : { section: 'math' as const, questions: [] as Extracted['questions'] }
    if (math.questions.length) sections.push(math)
    

    
    const reading = readingText ? extractReading(readingText) : extractReading(combined)
    if (reading.questions.length) sections.push(reading)

    // Extract and assign answer keys for each section separately
    console.log('Extracting answer keys for each section...')
    
    // English answer key
    if (english.questions.length > 0) {
      const englishKey = extractEnglishAnswerKey(combined)
      if (englishKey) {
        console.log(`Attaching ${Object.keys(englishKey).length} English answers`)
        english.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = englishKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
            console.log(`English Question ${num}: ${letter} → index ${q.answerIndex}`)
          }
        })
      }
    }

    // Math answer key
    if (math.questions.length > 0) {
      const mathKey = extractMathAnswerKey(combined)
      if (mathKey) {
        console.log(`Attaching ${Object.keys(mathKey).length} Math answers`)
        math.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = mathKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
            console.log(`Math Question ${num}: ${letter} → index ${q.answerIndex}`)
          }
        })
      }
    }

    // Reading answer key
    if (reading.questions.length > 0) {
      const readingKey = extractReadingAnswerKey(combined)
      if (readingKey) {
        console.log(`Attaching ${Object.keys(readingKey).length} Reading answers`)
        reading.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = readingKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
            console.log(`Reading Question ${num}: ${letter} → index ${q.answerIndex}`)
          }
        })
      }
      
      // Debug: Show all reading questions and their content
      console.log(`READING QUESTION DEBUG: Questions with answers:`)
      reading.questions.forEach((q, index) => {
        const num = Number(q.id.split('-')[1])
        const hasAnswer = q.answerIndex !== undefined
        const isLoaded = q.prompt !== `Question ${num} (not loaded)`
        console.log(`  Question ${num} (index ${index}):`)
        console.log(`    ID: ${q.id}`)
        console.log(`    Has Answer: ${hasAnswer}`)
        console.log(`    Is Loaded: ${isLoaded}`)
        console.log(`    Prompt: "${q.prompt}"`)
        console.log(`    Choices: [${q.choices.map((c) => `"${c}"`).join(', ')}]`)
        console.log(`    Choice Letters: [${q.choiceLetters?.join(', ') || 'none'}]`)
        console.log(`    Answer Index: ${q.answerIndex !== undefined ? q.answerIndex : 'none'}`)
        console.log(`    ---`)
      })
      
      // Count loaded vs unloaded questions
      const loadedQuestions = reading.questions.filter(q => {
        const num = Number(q.id.split('-')[1])
        return q.prompt !== `Question ${num} (not loaded)`
      })
      console.log(`READING QUESTION DEBUG: Summary:`)
      console.log(`  Total questions: ${reading.questions.length}`)
      console.log(`  Loaded questions: ${loadedQuestions.length}`)
      console.log(`  Unloaded questions: ${reading.questions.length - loadedQuestions.length}`)
      console.log(`  Questions with answers: ${reading.questions.filter(q => q.answerIndex !== undefined).length}`)
    }

    setResults(sections)
    setStatus('Parsed. Review and export JSON.')
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

    console.log(`Extracted ${questions.length} Math questions`)
    return { section: 'math', questions }
  }

  function extractEnglish(englishText: string, fullText: string): Extracted {
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

    // Parse scoring key to attach answerIndex
    const key = extractEnglishAnswerKey(fullText)
    if (key) {
      for (const q of questions) {
        const num = Number(q.id.split('-')[1])
        const letter = key[num]
        if (letter) q.answerIndex = mapAnswerLetterToIndex(letter)
      }
    }

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

    console.log(`READING TEST ALL QUESTIONS TEXT:`)
    console.log(`Text length: ${text.length}`)
    console.log(`Text preview: "${text.substring(0, 500)}..."`)
    
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

      console.log(`QUESTION ${qNum}:`)
      console.log(`"${block}"`)
      console.log(`Choice region: "${choiceRegion}"`)
      console.log(`---`)

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
    
    console.log(`READING QUESTIONS SUMMARY:`)
    console.log(`Total questions: ${questions.length}`)
    console.log(`Loaded questions: ${actualQuestions.length}`)
    console.log(`Unloaded questions: ${questions.length - actualQuestions.length}`)
    
    if (actualQuestions.length === 0) {
      console.log(`NO READING QUESTIONS FOUND!`)
      console.log(`Checking for any numbers that might be questions:`)
      
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

  function extractEnglishAnswerKey(text: string): Record<number, string> | null {
    const startIdx = text.search(/English Scoring Key/i)
    if (startIdx === -1) return null
    const tail = text.slice(startIdx, startIdx + 5000) // scan ahead
    const map: Record<number, string> = {}
    const lineRegex = /(\d{1,3})\s+([A-DFGHJ])/g
    let m: RegExpExecArray | null
    while ((m = lineRegex.exec(tail)) !== null) {
      const n = Number(m[1])
      const letter = m[2]
      map[n] = letter
    }
    return Object.keys(map).length ? map : null
  }

  function extractMathAnswerKey(text: string): Record<number, string> | null {
    const mathKeyMatch = text.match(/Mathematics Scoring Key[\s\S]*?(?=Reading Scoring Key|Science Scoring Key|$)/i)
    if (!mathKeyMatch) {
      console.log('No Mathematics Scoring Key found')
      return null
    }

    const tail = mathKeyMatch[0]
    const lines = tail.split('\n')
    console.log(`Found ${lines.length} lines in answer key section`)

    // Filter out empty lines and get only the data lines
    const dataLines = lines.map(line => line.trim()).filter(line => line.length > 0)
    console.log(`Found ${dataLines.length} non-empty data lines`)
    
    // Debug: show the first 30 data lines to see the pattern
    console.log('First 30 data lines:')
    for (let i = 0; i < Math.min(30, dataLines.length); i++) {
      console.log(`Data line ${i}: "${dataLines[i]}"`)
    }
    
    // The data is in columns, so we need to reconstruct rows
    // Look for the pattern: number, letter, category (repeating)
    const map: Record<number, string> = {}
    
    for (let i = 0; i < dataLines.length - 2; i++) {
      const line1 = dataLines[i]      // Question number
      const line2 = dataLines[i + 1]  // Answer letter  
      const line3 = dataLines[i + 2]  // Category
      
      // Check if this looks like a question number
      if (/^\d{1,2}$/.test(line1)) {
        const questionNum = Number(line1)
        // Check if the next line is a valid answer letter
        if (/^[A-DFGHJ]$/.test(line2)) {
          const answerLetter = line2
          if (questionNum >= 1 && questionNum <= 60) {
            map[questionNum] = answerLetter
            console.log(`Found answer: Question ${questionNum} = ${answerLetter} (category: ${line3}) at data lines ${i}-${i+2}`)
          }
        }
      }
    }

    console.log(`Math Answer Key: Found ${Object.keys(map).length} answers`)
    const sampleAnswers = Object.entries(map).slice(0, 10).map(([q, a]) => `${q}:${a}`).join(', ')
    console.log(`Sample answers: ${sampleAnswers}`)
    
    return Object.keys(map).length > 0 ? map : null
  }

  function extractReadingAnswerKey(text: string): Record<number, string> | null {
    const readingKeyMatch = text.match(/Reading Scoring Key[\s\S]*?(?=Science Scoring Key|$)/i)
    if (!readingKeyMatch) {
      console.log('No Reading Scoring Key found')
      return null
    }

    const tail = readingKeyMatch[0]
    const lines = tail.split('\n')
    console.log(`Found ${lines.length} lines in Reading answer key section`)

    // Filter out empty lines and get only the data lines
    const dataLines = lines.map(line => line.trim()).filter(line => line.length > 0)
    console.log(`Found ${dataLines.length} non-empty Reading data lines`)
    
    // The data is in columns, so we need to reconstruct rows
    const map: Record<number, string> = {}
    
    for (let i = 0; i < dataLines.length - 2; i++) {
      const line1 = dataLines[i]      // Question number
      const line2 = dataLines[i + 1]  // Answer letter  
      const line3 = dataLines[i + 2]  // Category
      
      // Check if this looks like a question number
      if (/^\d{1,2}$/.test(line1)) {
        const questionNum = Number(line1)
        // Check if the next line is a valid answer letter
        if (/^[A-DFGHJ]$/.test(line2)) {
          const answerLetter = line2
          if (questionNum >= 1 && questionNum <= 60) {
            map[questionNum] = answerLetter
            console.log(`Found Reading answer: Question ${questionNum} = ${answerLetter} (category: ${line3}) at data lines ${i}-${i+2}`)
          }
        }
      }
    }

    console.log(`Reading Answer Key: Found ${Object.keys(map).length} answers`)
    const sampleAnswers = Object.entries(map).slice(0, 10).map(([q, a]) => `${q}:${a}`).join(', ')
    console.log(`Sample Reading answers: ${sampleAnswers}`)
    
    return Object.keys(map).length > 0 ? map : null
  }



  function mapAnswerLetterToIndex(letter: string): number {
    const L = letter.toUpperCase()
    let index = 0
    if (L === 'A' || L === 'F') index = 0
    else if (L === 'B' || L === 'G') index = 1
    else if (L === 'C' || L === 'H') index = 2
    else if (L === 'D' || L === 'J') index = 3
    else index = 0
    
    console.log(`Mapping letter ${L} to index ${index}`)
    return index
  }

  function sliceBetween(text: string, start: RegExp, end: RegExp): string | null {
    const s = text.search(start)
    if (s === -1) return null
    const tail = text.slice(s)
    const e = tail.search(end)
    return e === -1 ? tail : tail.slice(0, e)
  }

  function download(section: Extracted) {
    const blob = new Blob([JSON.stringify(section.questions, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${section.section}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parsePdf(file).catch(err => setStatus(`Error: ${String(err)}`))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold">Import practice test (PDF)</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-4">Start with Math/Reading/English. Science can be added later with images.</p>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <input ref={inputRef} type="file" accept="application/pdf" onChange={onFile} className="hidden" />
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>Choose PDF</button>
          <div className="text-sm text-slate-600 dark:text-slate-400">{status}</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="card p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Ready to save</div>
              <div className="font-semibold">{getNextDefaultName()}</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                const name = getNextDefaultName()
                const sections: Record<string, Extracted['questions']> = {}
                for (const sec of results) sections[sec.section] = sec.questions
                const saved = saveTest({ name, sections })
                setStatus(`Saved as ${saved.name}. You can now select it from the Choose Test page.`)
              }}
            >
              Save to Library
            </button>
          </div>
          {results.map((sec) => (
            <div key={sec.section} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{sec.section}</h3>
                <button className="btn btn-ghost" onClick={() => download(sec)}>Download {sec.section}.json</button>
              </div>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">Extracted {sec.questions.length} questions</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}