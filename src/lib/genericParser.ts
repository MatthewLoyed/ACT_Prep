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

  // Create page text mapping for accessing text from specific pages
  const pageTextMap: Record<number, string> = {}
  const pages: string[] = []
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[])
      .map((it) => it.str)
      .join('\n')
    pageTextMap[i] = text  // Store text mapped to page number
    pages.push(text)
  }

  const combined = pages.join('\n')
  

  const sections: Extracted[] = []
  
  // Improved section slicing with better boundaries
  // Use "DO NOT OPEN THIS BOOKLET" as start marker for English section
  let englishText = sliceBetween(combined, /DO\s+NOT\s+OPEN\s+THIS\s+BOOKLET\s+UNTIL\s+TOLD\s+TO\s+DO\s+SO\./i, /END\s+OF\s+TEST\s+1/i)
  if (!englishText) {
    // Fallback: try Math section header patterns
    englishText = sliceBetween(combined, /DO\s+NOT\s+OPEN\s+THIS\s+BOOKLET\s+UNTIL\s+TOLD\s+TO\s+DO\s+SO\./i, /(MATH|MATHEMATICS)\s+TEST/i)
  }
  if (!englishText) {
    // Fallback: try different Math section header formats
    englishText = sliceBetween(combined, /DO\s+NOT\s+OPEN\s+THIS\s+BOOKLET\s+UNTIL\s+TOLD\s+TO\s+DO\s+SO\./i, /MATH\s+TEST/i)
  }
  if (!englishText) {
    // Fallback: try even more flexible pattern
    englishText = sliceBetween(combined, /DO\s+NOT\s+OPEN\s+THIS\s+BOOKLET\s+UNTIL\s+TOLD\s+TO\s+DO\s+SO\./i, /MATHEMATICS\s+TEST/i)
  }
  
  // Use "END OF TEST" boundaries for Math and Reading sections
  let mathText = sliceBetween(combined, /(MATH|MATHEMATICS)\s+TEST\s+60\s+Minutes—60\s+Questions/i, /END\s+OF\s+TEST\s+2/i)
  if (!mathText) {
    // Fallback: try Reading section header
    mathText = sliceBetween(combined, /(MATH|MATHEMATICS)\s+TEST\s+60\s+Minutes—60\s+Questions/i, /READING\s+TEST/i)
  }
  
  let readingText = sliceBetween(combined, /READING\s+TEST\s+35\s+Minutes—40\s+Questions/i, /END\s+OF\s+TEST\s+3/i)
  if (!readingText) {
    // Fallback: try Science section header
    readingText = sliceBetween(combined, /READING\s+TEST\s+35\s+Minutes—40\s+Questions/i, /SCIENCE\s+TEST/i)
  }

 

  // Extract English questions using page-based approach
  const english: Extracted = extractEnglishFromPages(pageTextMap, sectionPages.english || 13)
  if (english.questions.length) sections.push(english)

  // Extract Math questions using page-based approach
  const math: Extracted = extractMathFromPages(pageTextMap, sectionPages.math || 25)
  if (math.questions.length) sections.push(math)
  
  // Debug: Show full text of first Math page
  const mathStartPage = sectionPages.math || 25
  console.log('🔍 DEBUG MATH FIRST PAGE:')
  console.log('Math test starts on page:', mathStartPage)
  console.log('=== FIRST MATH PAGE CONTENT START ===')
  console.log(pageTextMap[mathStartPage] || 'Math start page not found')
  console.log('=== FIRST MATH PAGE CONTENT END ===')
  
  // Extract Reading questions using page-based approach
  const reading: Extracted = extractReadingFromPages(pageTextMap, sectionPages.reading || 33)
  if (reading.questions.length) sections.push(reading)

  // DEBUG: Check extracted questions by section
  console.log('🔍 DEBUG EXTRACTED QUESTIONS:')
  console.log('English questions found:', english.questions.length)
  console.log('Math questions found:', math.questions.length)
  console.log('Reading questions found:', reading.questions.length)
  
  if (math.questions.length > 0) {
    console.log('First 3 Math questions:')
    math.questions.slice(0, 3).forEach((q, i) => {
      console.log(`  Math ${i+1}: ID=${q.id}, Prompt="${q.prompt.substring(0, 50)}...", Choices=${q.choiceLetters?.join(',') || 'none'}`)
    })
  }

  // Extract and assign answer keys for each section separately
  const sectionMap: Record<string, Extracted> = {}

  // English answer key and page mapping
  if (english.questions.length > 0) {
    const englishClone = { ...english, questions: cloneQuestions(english.questions) }
    
    // Map questions to pages
    const englishStartPage = sectionPages.english || 1
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, englishClone.questions, englishStartPage, 'english')
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
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, mathClone.questions, mathStartPage, 'math')
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
    const { questionsWithPages, pageQuestions } = await mapQuestionsToPages(pdf, readingClone.questions, readingStartPage, 'reading')
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

  // Add section pages to each section in correct order
  const sectionsWithPages = []
  if (sectionMap.english) {
    sectionsWithPages.push({ ...sectionMap.english, sectionPages })
  }
  if (sectionMap.math) {
    sectionsWithPages.push({ ...sectionMap.math, sectionPages })
  }
  if (sectionMap.reading) {
    sectionsWithPages.push({ ...sectionMap.reading, sectionPages })
  }
  
  
  return sectionsWithPages
}

// Helper functions (copied from existing logic)
function cloneQuestions(questions: Extracted['questions']): Extracted['questions'] {
  return questions.map(q => ({ ...q }))
}

// Remove "ACT" and everything after it from answer choices
function cleanChoiceText(choiceText: string): string {
  const actIndex = choiceText.search(/\bACT\b/i)
  if (actIndex !== -1) {
    return choiceText.slice(0, actIndex).trim()
  }
  return choiceText
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
async function mapQuestionsToPages(pdf: PDFDocumentProxy, questions: Extracted['questions'], sectionStartPage: number, section?: string): Promise<{
  questionsWithPages: Extracted['questions']
  pageQuestions: Record<number, string[]>
}> {
  const questionsWithPages: Extracted['questions'] = []
  const pageQuestions: Record<number, string[]> = {}
  const processedQuestions = new Set<string>() // Track which questions we've already processed

  // Determine the answer choice pattern based on section
  // Math section uses ABCDE/FGHJK format, others use A-DFGHJ format
  const isMathSection = section === 'math' || questions.some(q => q.id.startsWith('math-'))
  const choicePattern = isMathSection ? '[A-DFGHJK]' : '[A-DFGHJ]'

  // Start from the section start page and scan forward
  for (let pageNum = sectionStartPage; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')

    const pageQuestionIds: string[] = []

    // Enhanced question detection: look for numbers followed by answer choices
    // Must have a period after the number (like 6.) and find answer choices before next question
    const questionRegex = new RegExp(`(?:^|\\n)\\s*(\\d{1,2})\\.\\s+[^]*?${choicePattern}[.)]\\s+`, 'g')
    const questionMatches = Array.from(text.matchAll(questionRegex))
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

// Extract English questions from specific pages
function extractEnglishFromPages(pageTextMap: Record<number, string>, startPage: number): Extracted {
  const questions: Extracted['questions'] = []
  
  // Extract questions from each page starting from the English start page
  for (let pageNum = startPage; pageNum <= startPage + 20; pageNum++) { // Check next 20 pages max
    if (!pageTextMap[pageNum]) {
      continue
    }
    
    const pageText = pageTextMap[pageNum]
    
    // Extract questions from this specific page
    const pageQuestions = extractQuestionsFromPageText(pageText, pageNum)
    questions.push(...pageQuestions)
    
    // Stop if we find "END OF TEST 1" or Math section
    if (pageText.includes('END OF TEST 1') || pageText.includes('MATH TEST') || pageText.includes('MATHEMATICS TEST')) {
      break
    }
  }
  return { section: 'english', questions }
}

// Extract questions from a single page of text
function extractQuestionsFromPageText(pageText: string, pageNum: number): Extracted['questions'] {
  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices
  const questionMatches = Array.from(pageText.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= 75) {
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
      // Check if there are actual answer choices (A, B, C, D, F, G, H, J) within 500 characters
      const hasAnswerChoices = /[A-DFGHJ][.)]\s+/.test(textAfterMatch)
      
      if (hasAnswerChoices) {
        validatedNums.push(questionNum)
      }
    }
  }
  
  // Ensure we only get unique question numbers and they're in order
  const uniqueNums = [...new Set(validatedNums)].sort((a, b) => a - b)
  
  for (const qNum of uniqueNums) {
    // Find the question block
    const qRegex = new RegExp(`(?:^|\\n)\\s*${qNum}\\.\\s+([\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s)|$)`, 'g')
    const m = qRegex.exec(pageText)
    if (!m) continue
    
    const block = m[1]
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    // Allow questions with no prompt (Old ACT format) or short prompts
    if (prompt.length > 0 && prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

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
          choiceText = cleanChoiceText(choiceText)
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
        choiceLetters,
        pageNumber: pageNum
      })
    }
  }
  
  return questions
}

// Extract Math questions from specific pages
function extractMathFromPages(pageTextMap: Record<number, string>, startPage: number): Extracted {
  const questions: Extracted['questions'] = []
  
  // Extract questions from each page starting from the Math start page
  for (let pageNum = startPage; pageNum <= startPage + 20; pageNum++) { // Check next 20 pages max
    if (!pageTextMap[pageNum]) {
      continue
    }
    
    const pageText = pageTextMap[pageNum]
    
    // Extract questions from this specific page
    const pageQuestions = extractMathQuestionsFromPageText(pageText, pageNum)
    questions.push(...pageQuestions)
    
    // Stop if we find "END OF TEST 2" or Reading section
    if (pageText.includes('END OF TEST 2') || pageText.includes('READING TEST')) {
      break
    }
  }
  return { section: 'math', questions }
}

// Extract Math questions from a single page of text
function extractMathQuestionsFromPageText(pageText: string, pageNum: number): Extracted['questions'] {
  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices (including E and K for Math)
  const questionMatches = Array.from(pageText.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJK][.)]\s+/g))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= 60) { // Old ACT Math has 60 questions
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
      // Check if there are actual answer choices (A, B, C, D, E, F, G, H, J, K) within 500 characters
      const hasAnswerChoices = /[A-DFGHJK][.)]\s+/.test(textAfterMatch)
      
      // Debug: Check question 2 specifically
      if (questionNum === 2) {
        console.log('🔍 DEBUG QUESTION 2 VALIDATION:')
        console.log('Match index:', matchIndex)
        console.log('Text after match (first 200 chars):', textAfterMatch.substring(0, 200))
        console.log('Has answer choices:', hasAnswerChoices)
        console.log('Answer choice pattern found:', textAfterMatch.match(/[A-DFGHJK][.)]\s+/)?.[0] || 'none')
      }
      
      if (hasAnswerChoices) {
        validatedNums.push(questionNum)
      }
    }
  }
  
  // Ensure we only get unique question numbers and they're in order
  const uniqueNums = [...new Set(validatedNums)].sort((a, b) => a - b)
  
  for (const qNum of uniqueNums) {
    // Find the question block
    const qRegex = new RegExp(`(?:^|\\n)\\s*${qNum}\\.\\s+([\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s)|$)`, 'g')
    const m = qRegex.exec(pageText)
    if (!m) {
      // Debug: Check why question block wasn't found
      if (qNum === 2) {
        console.log('🔍 DEBUG QUESTION 2 BLOCK: No regex match found for question block')
      }
      continue
    }
    
    const block = m[1]
    
    // Debug: Check question 2 block extraction
    if (qNum === 2) {
      console.log('🔍 DEBUG QUESTION 2 BLOCK:')
      console.log('Block found, length:', block?.length || 0)
      console.log('Block content (first 200 chars):', block?.substring(0, 200) || 'no content')
    }
    
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJK])[.)]\s+/)
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      const choiceParts = choiceRegion.split(/([A-DFGHJK])[.)]\s*/)
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          const nextChoiceMatch = choiceText.match(/([A-DFGHJK])[.)]\s*/)
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
          
          choiceText = choiceText.replace(/\s+/g, ' ').trim()
          choiceText = cleanChoiceText(choiceText)
          if (choiceText && choiceText.length > 0) {
            choices.push(choiceText)
            choiceLetters.push(letter)
          }
        }
      }
    }

    // Debug: Check why question 2 is not being added
    if (qNum === 2) {
      console.log('🔍 DEBUG QUESTION 2 FINAL VALIDATION:')
      console.log('Prompt length:', prompt.length)
      console.log('Choices length:', choices.length)
      console.log('Choice letters:', choiceLetters)
      console.log('Will be added:', choices.length >= 2)
    }
    
    // For Math questions, ensure we have 5 choices (A-E or F-K)
    if (choices.length > 0) {
      // Ensure we have exactly 5 choices for Math
      const finalChoices = [...choices]
      const finalChoiceLetters = [...choiceLetters]
      
      // Fill up to 5 choices if needed
      while (finalChoices.length < 5) {
        finalChoices.push('')
        finalChoiceLetters.push('')
      }
      
      // Ensure we have exactly 5 choices
      const mathChoices = finalChoices.slice(0, 5)
      const mathChoiceLetters = finalChoiceLetters.slice(0, 5)
      
      questions.push({
        id: `math-${qNum}`,
        prompt,
        choices: mathChoices,
        choiceLetters: mathChoiceLetters,
        pageNumber: pageNum
      })
    }
  }
  
  return questions
}

// Extract Reading questions from specific pages
function extractReadingFromPages(pageTextMap: Record<number, string>, startPage: number): Extracted {
  const questions: Extracted['questions'] = []
  
  // Extract questions from each page starting from the Reading start page
  for (let pageNum = startPage; pageNum <= startPage + 20; pageNum++) { // Check next 20 pages max
    if (!pageTextMap[pageNum]) {
      continue
    }
    
    const pageText = pageTextMap[pageNum]
    
    // Extract questions from this specific page
    const pageQuestions = extractReadingQuestionsFromPageText(pageText, pageNum)
    questions.push(...pageQuestions)
    
    // Stop if we find "END OF TEST 3" or Science section
    if (pageText.includes('END OF TEST 3') || pageText.includes('SCIENCE TEST')) {
      break
    }
  }
  return { section: 'reading', questions }
}

// Extract Reading questions from a single page of text
function extractReadingQuestionsFromPageText(pageText: string, pageNum: number): Extracted['questions'] {
  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices
  const questionMatches = Array.from(pageText.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+[^]*?[A-DFGHJ][.)]\s+/g))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= 40) { // Old ACT Reading has 40 questions
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
      // Check if there are actual answer choices (A, B, C, D, F, G, H, J) within 500 characters
      const hasAnswerChoices = /[A-DFGHJ][.)]\s+/.test(textAfterMatch)
      
      if (hasAnswerChoices) {
        validatedNums.push(questionNum)
      }
    }
  }
  
  // Ensure we only get unique question numbers and they're in order
  const uniqueNums = [...new Set(validatedNums)].sort((a, b) => a - b)
  
  for (const qNum of uniqueNums) {
    // Find the question block
    const qRegex = new RegExp(`(?:^|\\n)\\s*${qNum}\\.\\s+([\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s)|$)`, 'g')
    const m = qRegex.exec(pageText)
    if (!m) continue
    
    const block = m[1]
    const choiceStart = block.search(/(?:^|\s)([A-DFGHJ])[.)]\s+/)
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

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
          choiceText = cleanChoiceText(choiceText)
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
        choiceLetters,
        pageNumber: pageNum
      })
    }
  }
  
  return questions
}

// Helper function to get text from specific pages
export function getTextFromPages(pageTextMap: Record<number, string>, startPage: number, endPage?: number): string {
  const pages: string[] = []
  const end = endPage || startPage
  
  for (let i = startPage; i <= end; i++) {
    if (pageTextMap[i]) {
      pages.push(pageTextMap[i])
    }
  }
  
  return pages.join('\n')
}

// Helper function to get text from a single page
export function getTextFromPage(pageTextMap: Record<number, string>, pageNum: number): string {
  return pageTextMap[pageNum] || ''
}
