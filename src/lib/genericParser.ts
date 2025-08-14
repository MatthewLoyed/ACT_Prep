// Old ACT parser - for pre-2022 ACT tests
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist'

export type Extracted = {
  section: 'english' | 'math' | 'reading'
  questions: Array<{
    id: string
    prompt: string
    choices: string[]
    choiceLetters?: string[]
    answerIndex?: number
    passageId?: string
    passage?: string
    pageNumber?: number
  }>
  sectionPages?: Partial<Record<string, number>>
  pageQuestions?: Record<number, string[]>
}

export async function parseOldActPdf(file: File): Promise<Extracted[]> {
  const buf = await file.arrayBuffer()
  const pdf: PDFDocumentProxy = await getDocument({ data: buf }).promise

  // Detect section pages first
  const sectionPages = await detectSectionPages(pdf)
  console.log('Old ACT Parser: Detected section pages:', sectionPages)

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[])
      .map((it) => it.str)
      .join('\n')
    pages.push(text)
  }

  const combined = pages.join('\n')
  const sections: Extracted[] = []
  
  // Improved section slicing with better boundaries
  const englishText = sliceBetween(combined, /ENGLISH TEST\s+45\s+Minutes—75\s+Questions/i, /(MATH|MATHEMATICS) TEST/i)
  const mathText = sliceBetween(combined, /(MATH|MATHEMATICS) TEST\s+60\s+Minutes—60\s+Questions/i, /READING TEST/i)
  const readingText = sliceBetween(combined, /READING TEST\s+35\s+Minutes—40\s+Questions/i, /SCIENCE TEST/i)

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
  const sectionMap: Record<string, Extracted> = {}

  // English answer key and page mapping
  if (english.questions.length > 0) {
    const englishClone = { ...english, questions: cloneQuestions(english.questions) }
    
    // Map questions to pages
    const englishStartPage = sectionPages.english || 1
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, englishClone.questions, englishStartPage)
    englishClone.questions = questionsWithPages
    englishClone.pageQuestions = pageQuestions
    
    sectionMap.english = englishClone
    
    const englishKey = extractEnglishAnswerKey(combined)
    if (englishKey) {
      englishClone.questions.forEach(q => {
        const num = Number(q.id.split('-')[1])
        const letter = englishKey[num]
        if (letter) {
          q.answerIndex = mapAnswerLetterToIndex(letter)
        }
      })
    }
  }

  // Math answer key and page mapping
  if (math.questions.length > 0) {
    const mathClone = { ...math, questions: cloneQuestions(math.questions) }
    
    // Map questions to pages
    const mathStartPage = sectionPages.math || 1
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, mathClone.questions, mathStartPage)
    mathClone.questions = questionsWithPages
    mathClone.pageQuestions = pageQuestions
    
    sectionMap.math = mathClone
    
    const mathKey = extractMathAnswerKey(combined)
    if (mathKey) {
      mathClone.questions.forEach(q => {
        const num = Number(q.id.split('-')[1])
        const letter = mathKey[num]
        if (letter) {
          q.answerIndex = mapAnswerLetterToIndex(letter)
        }
      })
    }
  }

  // Reading answer key and page mapping
  if (reading.questions.length > 0) {
    const readingClone = { ...reading, questions: cloneQuestions(reading.questions) }
    
    // Map questions to pages
    const readingStartPage = sectionPages.reading || 1
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, readingClone.questions, readingStartPage)
    readingClone.questions = questionsWithPages
    readingClone.pageQuestions = pageQuestions
    
    sectionMap.reading = readingClone
    
    const readingKey = extractReadingAnswerKey(combined)
    if (readingKey) {
      readingClone.questions.forEach(q => {
        const num = Number(q.id.split('-')[1])
        const letter = readingKey[num]
        if (letter) {
          q.answerIndex = mapAnswerLetterToIndex(letter)
        }
      })
    }
  }

  // Add section pages to each section
  const sectionsWithPages = Object.values(sectionMap).map(section => ({
    ...section,
    sectionPages
  }))
  
  return sectionsWithPages
}

// Helper functions (copied from existing logic)
function cloneQuestions(questions: Extracted['questions']): Extracted['questions'] {
  return questions.map(q => ({ ...q }))
}

function extractEnglish(englishText: string): Extracted {
  const text = englishText
    .replace(/GO ON TO THE NEXT PAGE\.?/gi, ' ')
    .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n)/gi, ' ')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, ' ')
    .replace(/QU[0-9A-Z.-]+/g, ' ')
    .replace(/\n\s*(?:\d+\s+){2,}\n/g, '\n')
    .replace(/I understand that by registering[\s\S]*?authorities\./gi, ' ')
    .replace(/Terms and Conditions[\s\S]*?privacy\.html/gi, ' ')

  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices
  // Must have a period after the number (like 6.) and find answer choices before next question
  const questionMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
  const nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 75)
  
  // Ensure we only get unique question numbers and they're in order
  const uniqueNums = [...new Set(nums)].sort((a, b) => a - b)
  
  console.log(`Old ACT Parser: English section - Found ${uniqueNums.length} unique questions:`, uniqueNums)
  
  for (const qNum of uniqueNums) {
    // Find the question block
    const qRegex = new RegExp(`(?:^|\\n)\\s*${qNum}\\.\\s+([\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s)|$)`, 'g')
    const m = qRegex.exec(text)
    if (!m) {
      console.log(`Old ACT Parser: English question ${qNum} - No regex match found`)
      continue
    }
    
    const block = m[1]
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) {
      console.log(`Old ACT Parser: English question ${qNum} - Prompt too short: "${prompt}"`)
      continue
    }
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) {
      console.log(`Old ACT Parser: English question ${qNum} - Contains unwanted text`)
      continue
    }

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      const choiceParts = choiceRegion.split(/([A-DFGHJ])[.)]\s*/)
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          const nextChoiceMatch = choiceText.match(/([A-DFGHJ])[.)]\s*/)
          if (nextChoiceMatch) {
            const beforeNextChoice = choiceText.slice(0, nextChoiceMatch.index)
            const parenCount = (beforeNextChoice.match(/\(/g) || []).length - (beforeNextChoice.match(/\)/g) || []).length
            
            if (parenCount <= 0) {
              choiceText = beforeNextChoice
            } else {
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
          
          choiceText = choiceText.replace(/\s+/g, ' ').trim()
          if (choiceText && choiceText.length > 0) {
            choices.push(choiceText)
            choiceLetters.push(letter)
          }
        }
      }
    }

    if (choices.length >= 2) {
      questions.push({
        id: `english-${qNum}`,
        prompt,
        choices,
        choiceLetters
      })
    } else {
      console.log(`Old ACT Parser: English question ${qNum} - Not enough choices (${choices.length}):`, choices)
    }
  }

  return { section: 'english', questions }
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
    if (qNum < 1 || qNum > 60) continue // Old ACT Math has 60 questions
    const block = m[2]

    // Find the end of the question prompt - look for the first choice letter
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJK])[.)]\s+/)
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
      const choiceParts = choiceRegion.split(/([A-DFGHJK])[.)]\s*/)
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          // Find where this choice ends by looking for the next choice letter
          const nextChoiceMatch = choiceText.match(/([A-DFGHJK])[.)]\s*/)
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
                else if (parenLevel === 0 && /[A-DFGHJK][.)]\s/.test(searchText.slice(j, j + 3))) {
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

  console.log(`Old ACT Parser: Math section - Found ${questions.length} questions`)
  return { section: 'math', questions }
}

function extractReading(readingText: string): Extracted {
  const text = readingText
    .replace(/GO ON TO THE NEXT PAGE\.?/gi, ' ')
    .replace(/©\s?\d{4,}\s+by ACT[\s\S]*?(?=\n)/gi, ' ')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, ' ')
    .replace(/QU[0-9A-Z.-]+/g, ' ')
    .replace(/\n\s*(?:\d+\s+){2,}\n/g, '\n')
    .replace(/I understand that by registering[\s\S]*?authorities\./gi, ' ')
    .replace(/Terms and Conditions[\s\S]*?privacy\.html/gi, ' ')

  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices
  // Must have a period after the number (like 6.) and find answer choices before next question
  const questionMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
  const nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 40)
  
  // Ensure we only get unique question numbers and they're in order
  const uniqueNums = [...new Set(nums)].sort((a, b) => a - b)
  
  console.log(`Old ACT Parser: Reading section - Found ${uniqueNums.length} unique questions:`, uniqueNums)
  
  for (const qNum of uniqueNums) {
    // Find the question block
    const qRegex = new RegExp(`(?:^|\\n)\\s*${qNum}\\.\\s+([\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s)|$)`, 'g')
    const m = qRegex.exec(text)
    if (!m) {
      console.log(`Old ACT Parser: Reading question ${qNum} - No regex match found`)
      continue
    }
    
    const block = m[1]
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) {
      console.log(`Old ACT Parser: Reading question ${qNum} - Prompt too short: "${prompt}"`)
      continue
    }
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) {
      console.log(`Old ACT Parser: Reading question ${qNum} - Contains unwanted text`)
      continue
    }

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      const choiceParts = choiceRegion.split(/([A-DFGHJ])[.)]\s*/)
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          const nextChoiceMatch = choiceText.match(/([A-DFGHJ])[.)]\s*/)
          if (nextChoiceMatch) {
            const beforeNextChoice = choiceText.slice(0, nextChoiceMatch.index)
            const parenCount = (beforeNextChoice.match(/\(/g) || []).length - (beforeNextChoice.match(/\)/g) || []).length
            
            if (parenCount <= 0) {
              choiceText = beforeNextChoice
            } else {
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
          
          choiceText = choiceText.replace(/\s+/g, ' ').trim()
          if (choiceText && choiceText.length > 0) {
            choices.push(choiceText)
            choiceLetters.push(letter)
          }
        }
      }
    }

    if (choices.length >= 2) {
      questions.push({
        id: `reading-${qNum}`,
        prompt,
        choices,
        choiceLetters
      })
    } else {
      console.log(`Old ACT Parser: Reading question ${qNum} - Not enough choices (${choices.length}):`, choices)
    }
  }

  return { section: 'reading', questions }
}

function extractAnswerKey(text: string, sectionName: string, searchPattern: RegExp, endPattern?: RegExp): Record<number, string> | null {
  let sectionText: string
  if (endPattern) {
    const sectionMatch = text.match(searchPattern)
    if (!sectionMatch) {
      return null
    }
    sectionText = sectionMatch[0]
  } else {
    const startIdx = text.search(searchPattern)
    if (startIdx === -1) {
      return null
    }
    sectionText = text.slice(startIdx, startIdx + 5000)
  }
  
  const lines = sectionText.split('\n')
  const dataLines = lines.map(line => line.trim()).filter(line => line.length > 0)
  const map: Record<number, string> = {}
  
  // Set max question number based on section for Old ACT format
  let maxQuestions = 75 // default (English)
  if (sectionName.toLowerCase().includes('math')) {
    maxQuestions = 60
  } else if (sectionName.toLowerCase().includes('reading')) {
    maxQuestions = 40
  }
  // English stays at 75 for Old ACT
  
  for (let i = 0; i < dataLines.length - 2; i++) {
    const line1 = dataLines[i]
    const line2 = dataLines[i + 1]
    
    if (/^\d{1,2}$/.test(line1)) {
      const questionNum = Number(line1)
      // Old ACT Math uses ABCDE or FGHJK, other sections use A-DFGHJ
      const answerPattern = sectionName.toLowerCase().includes('math') ? /^[A-DFGHJK]$/ : /^[A-DFGHJ]$/
      if (answerPattern.test(line2)) {
        const answerLetter = line2
        if (questionNum >= 1 && questionNum <= maxQuestions) {
          map[questionNum] = answerLetter
        }
      }
    }
  }
  
  return Object.keys(map).length > 0 ? map : null
}

function extractEnglishAnswerKey(text: string): Record<number, string> | null {
  // Try old ACT format first: "Test 1: English—Scoring Key"
  const oldActPattern = /Test\s+1:\s*English[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+2:|Test\s+3:|Test\s+4:|$)/i
  const oldActMatch = text.match(oldActPattern)
  
  if (oldActMatch) {
    return extractOldActAnswerKey(oldActMatch[0])
  }
  
  // Fall back to enhanced ACT format
  return extractAnswerKey(
    text,
    'English Scoring Key',
    /English Scoring Key[\s\S]*?(?=Mathematics Scoring Key|Math Scoring Key|Reading Scoring Key|Science Scoring Key|$)/i,
    /Mathematics Scoring Key|Math Scoring Key|Reading Scoring Key|Science Scoring Key|$/
  )
}

function extractMathAnswerKey(text: string): Record<number, string> | null {
  // Try old ACT format first: "Test 2: Mathematics—Scoring Key"
  const oldActPattern = /Test\s+2:\s*Mathematics[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+3:|Test\s+4:|$)/i
  const oldActMatch = text.match(oldActPattern)
  
  if (oldActMatch) {
    return extractOldActAnswerKey(oldActMatch[0])
  }
  
  // Fall back to enhanced ACT format
  return extractAnswerKey(text, 'Mathematics Scoring Key', /Mathematics Scoring Key[\s\S]*?(?=Reading Scoring Key|Science Scoring Key|$)/i, /Reading Scoring Key|Science Scoring Key|$/)
}

function extractReadingAnswerKey(text: string): Record<number, string> | null {
  // Try old ACT format first: "Test 3: Reading—Scoring Key"
  const oldActPattern = /Test\s+3:\s*Reading[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+4:|$)/i
  const oldActMatch = text.match(oldActPattern)
  
  if (oldActMatch) {
    return extractOldActAnswerKey(oldActMatch[0])
  }
  
  // Fall back to enhanced ACT format
  return extractAnswerKey(text, 'Reading Scoring Key', /Reading Scoring Key[\s\S]*?(?=Science Scoring Key|$)/i, /Science Scoring Key|$/)
}

function extractOldActAnswerKey(scoringKeyText: string): Record<number, string> | null {
  const lines = scoringKeyText.split('\n')
  const map: Record<number, string> = {}
  
  // Look for the specific old ACT table structure
  // The table has 4 columns: Key | POW | KLA | CSE
  // The Key column contains "1. A", "2. G", etc.
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and header-like lines
    if (!line || line.length < 2) continue
    if (line.toLowerCase().includes('scoring key') || 
        line.toLowerCase().includes('reporting categories') ||
        line.toLowerCase().includes('number correct') ||
        line.toLowerCase().includes('production of writing') ||
        line.toLowerCase().includes('knowledge of language') ||
        line.toLowerCase().includes('conventions of standard english')) continue
    
    // Method 1: Look for the specific "Key" column pattern
    // The Key column is the first column and contains "1. A", "2. G", etc.
    // Updated to handle A-D, E-K pattern for old ACT math tests
    const keyMatch = line.match(/^(\d{1,2})\.\s*([A-DFGHJK])\s*$/)
    if (keyMatch) {
      const questionNum = Number(keyMatch[1])
      const answerLetter = keyMatch[2]
      if (questionNum >= 1 && questionNum <= 75) {
        map[questionNum] = answerLetter
      }
    }
    
    // Method 2: Look for the pattern in a multi-column table row
    // Split by whitespace and check if first column matches the pattern
    const parts = line.split(/\s+/)
    if (parts.length >= 1) {
      const firstPart = parts[0]
      // Updated to handle A-D, E-K pattern for old ACT math tests
      const keyColumnMatch = firstPart.match(/^(\d{1,2})\.\s*([A-DFGHJK])\s*$/)
      if (keyColumnMatch) {
        const questionNum = Number(keyColumnMatch[1])
        const answerLetter = keyColumnMatch[2]
        if (questionNum >= 1 && questionNum <= 75) {
          map[questionNum] = answerLetter
        }
      }
    }
    
    // Method 3: Look for patterns like "1A" (number immediately followed by letter)
    // This handles cases where the period might be missing
    // Updated to handle A-D, E-K pattern for old ACT math tests
    const combinedMatch = line.match(/(\d{1,2})([A-DFGHJK])/g)
    if (combinedMatch) {
      combinedMatch.forEach(match => {
        const numMatch = match.match(/(\d{1,2})([A-DFGHJK])/)
        if (numMatch) {
          const questionNum = Number(numMatch[1])
          const answerLetter = numMatch[2]
          if (questionNum >= 1 && questionNum <= 75) {
            map[questionNum] = answerLetter
          }
        }
      })
    }
  }
  
  return Object.keys(map).length > 0 ? map : null
}

function mapAnswerLetterToIndex(letter: string): number {
  const L = letter.toUpperCase()
  let index = 0
  if (L === 'A' || L === 'F') index = 0
  else if (L === 'B' || L === 'G') index = 1
  else if (L === 'C' || L === 'H') index = 2
  else if (L === 'D' || L === 'J') index = 3
  else if (L === 'E' || L === 'K') index = 4 // Handle E and K for old ACT math tests
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

// Detect section start pages for old ACT format
export async function detectSectionPages(pdf: PDFDocumentProxy): Promise<Partial<Record<string, number>>> {
  const detectedPages: Partial<Record<string, number>> = {}
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
    
    // Check for section headers with flexible patterns for old ACT
    const isEnglishSection = /ENGLISH TEST\s+45\s+Minutes—75\s+Questions/i.test(text)
    const isMathSection = /(MATH|MATHEMATICS) TEST\s+60\s+Minutes—60\s+Questions/i.test(text)
    const isReadingSection = /READING TEST\s+35\s+Minutes—40\s+Questions/i.test(text)
    
    // Store detected pages for all sections
    if (isEnglishSection) {
      detectedPages.english = i
      console.log(`Old ACT Parser: English section detected on page ${i}`)
    }
    if (isMathSection) {
      detectedPages.math = i
      console.log(`Old ACT Parser: Math section detected on page ${i}`)
    }
    if (isReadingSection) {
      detectedPages.reading = i
      console.log(`Old ACT Parser: Reading section detected on page ${i}`)
    }
  }
  
  return detectedPages
}

// Map questions to their page numbers for old ACT format
async function mapQuestionsToPages(pdf: PDFDocumentProxy, questions: Extracted['questions'], sectionStartPage: number): Promise<{
  questionsWithPages: Extracted['questions']
  pageQuestions: Record<number, string[]>
}> {
  const questionsWithPages: Extracted['questions'] = []
  const pageQuestions: Record<number, string[]> = {}
  const processedQuestions = new Set<string>() // Track which questions we've already processed

  // Start from the section start page and scan forward
  for (let pageNum = sectionStartPage; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')

    const pageQuestionIds: string[] = []

    // Enhanced question detection: look for numbers followed by answer choices
    // Must have a period after the number (like 6.) and find answer choices before next question
    const questionMatches = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJK][.)]\s+/g))
    const nums = questionMatches.map(m => Number(m[1])).filter(n => n >= 1 && n <= 75)
    const uniqueNums = [...new Set(nums)].sort((a, b) => a - b)

    // Find questions on this page by looking for question numbers
    questions.forEach(question => {
      const questionNum = question.id.split('-')[1]
      // Check if this question number is in the detected numbers on this page
      if (uniqueNums.includes(Number(questionNum)) && !processedQuestions.has(question.id)) {
        question.pageNumber = pageNum
        questionsWithPages.push(question)
        pageQuestionIds.push(question.id)
        processedQuestions.add(question.id) // Mark as processed
      }
    })

    if (pageQuestionIds.length > 0) {
      pageQuestions[pageNum] = pageQuestionIds
    }
  }

  // Add any questions that weren't found on pages (fallback)
  questions.forEach(question => {
    if (!processedQuestions.has(question.id)) {
      question.pageNumber = sectionStartPage
      questionsWithPages.push(question)
      if (!pageQuestions[sectionStartPage]) {
        pageQuestions[sectionStartPage] = []
      }
      pageQuestions[sectionStartPage].push(question.id)
      processedQuestions.add(question.id) // Mark as processed
    }
  })

  return { questionsWithPages, pageQuestions }
}
