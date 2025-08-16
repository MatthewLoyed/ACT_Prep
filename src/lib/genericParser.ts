// Old ACT parser - for pre-2022 ACT tests
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'


// Set up the worker to match the API version
// Use local worker to avoid CDN issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

// Old ACT format constants
const numOfEnglishMinutes = 45
const numOfMathMinutes = 60
const numOfReadingMinutes = 35
const numOfEnglishQuestions = 75
const numOfMathQuestions = 60
const numOfReadingQuestions = 40

// Answer choice patterns for different sections
const A_THROUGH_K_ANSWER_CHOICES = /[A-K][.)]\s+/
const ABCD_FGHJ_ANSWER_CHOICES = /[A-DFGHJ][.)]\s+/

// Answer key patterns - use A-K for all sections to include E and K
const ANSWER_KEY_PATTERN = /[A-K]/

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
  const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: buf }).promise

  // Detect section pages first
  const sectionPages = await detectSectionPages(pdf)

  // Detect answer key pages
  const answerKeyPages = await detectAnswerKeyPages(pdf)

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

 
  // Extract English questions using page-based approach
  const english: Extracted = extractEnglishFromPages(pageTextMap, sectionPages.english || 13)
  if (english.questions.length) sections.push(english)

  // Extract Math questions using page-based approach
  console.log(`🔍 PARSER DEBUG: Extracting Math with file: ${!!file}, pdf: ${!!pdf}`)
  const math: Extracted = await extractMathFromPages(pageTextMap, sectionPages.math || 25)
  if (math.questions.length) sections.push(math)
  
  // Extract Reading questions using page-based approach
  const reading: Extracted = extractReadingFromPages(pageTextMap, sectionPages.reading || 33)
  if (reading.questions.length) sections.push(reading)
  

  // Extract and assign answer keys for each section separately
  const sectionMap: Record<string, Extracted> = {}

  // English answer key and page mapping
  if (english.questions.length > 0) {
    const englishClone = { ...english, questions: cloneQuestions(english.questions) }
    
    // Use existing page numbers from extraction instead of re-mapping
    const pageQuestions: Record<number, string[]> = {}
    englishClone.questions.forEach(question => {
      const pageNum = question.pageNumber || sectionPages.english || 1
      if (!pageQuestions[pageNum]) {
        pageQuestions[pageNum] = []
      }
      pageQuestions[pageNum].push(question.id)
    })
    
    englishClone.pageQuestions = pageQuestions
    
    sectionMap.english = englishClone
    
    // Extract answer key from specific page if found
    if (answerKeyPages.english && pageTextMap[answerKeyPages.english]) {
      const englishKey = extractAnswerKeyFromPage(pageTextMap[answerKeyPages.english], 'english')
      if (englishKey) {
        englishClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = englishKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
      }
    } else {
      // Fallback to old method
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
  }

  // Math answer key and page mapping
  if (math.questions.length > 0) {
    const mathClone = { ...math, questions: cloneQuestions(math.questions) }
    
    // Use existing page numbers from extraction instead of re-mapping
    const pageQuestions: Record<number, string[]> = {}
    mathClone.questions.forEach(question => {
      const pageNum = question.pageNumber || sectionPages.math || 1
      if (!pageQuestions[pageNum]) {
        pageQuestions[pageNum] = []
      }
      pageQuestions[pageNum].push(question.id)
    })
    
    mathClone.pageQuestions = pageQuestions
    console.log(`PARSER DEBUG: Math pageQuestions created:`, pageQuestions)
    
    sectionMap.math = mathClone
    
    // Extract answer key from specific page if found
    if (answerKeyPages.math && pageTextMap[answerKeyPages.math]) {
      const mathKey = extractAnswerKeyFromPage(pageTextMap[answerKeyPages.math], 'math')
      if (mathKey) {
        mathClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = mathKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
      }
    } else {
      // Fallback to old method
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
  }

  // Reading answer key and page mapping
  if (reading.questions.length > 0) {
    const readingClone = { ...reading, questions: cloneQuestions(reading.questions) }
    
    // Use existing pageQuestions from extraction
    readingClone.pageQuestions = reading.pageQuestions || {}
    console.log(`PARSER DEBUG: Reading pageQuestions created:`, readingClone.pageQuestions)
    
    sectionMap.reading = readingClone
    
    // Extract answer key from specific page if found
    if (answerKeyPages.reading && pageTextMap[answerKeyPages.reading]) {
      const readingKey = extractAnswerKeyFromPage(pageTextMap[answerKeyPages.reading], 'reading')
      if (readingKey) {
        readingClone.questions.forEach(q => {
          const num = Number(q.id.split('-')[1])
          const letter = readingKey[num]
          if (letter) {
            q.answerIndex = mapAnswerLetterToIndex(letter)
          }
        })
      }
    } else {
      // Fallback to old method
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
  
  
  // Add placeholder questions to fill in missing question numbers
  const sectionsWithPlaceholders = sectionsWithPages.map(section => {
    const sectionWithPlaceholders = { ...section }
    
    sectionWithPlaceholders.questions = addPlaceholderQuestions(section.questions, section.section)
    
    return sectionWithPlaceholders
  })
  
  return sectionsWithPlaceholders
}

// Helper functions (copied from existing logic)
function cloneQuestions(questions: Extracted['questions']): Extracted['questions'] {
  return questions.map(q => ({ ...q }))
}

// Add placeholder questions to fill in missing question numbers
function addPlaceholderQuestions(questions: Extracted['questions'], section: string): Extracted['questions'] {
  // Get the expected number of questions for this section
  const expectedQuestionCount = (() => {
    switch (section) {
      case 'english': return numOfEnglishQuestions // 75
      case 'math': return numOfMathQuestions // 60
      case 'reading': return numOfReadingQuestions // 40
      default: return 0
    }
  })()
  
  // Create a map of existing questions by their number
  const questionMap = new Map<number, Extracted['questions'][0]>()
  questions.forEach(q => {
    const questionNum = parseInt(q.id.split('-')[1])
    if (!isNaN(questionNum)) {
      questionMap.set(questionNum, q)
    }
  })
  
  // Fill in missing questions with placeholders
  const completeQuestions: Extracted['questions'] = []
  for (let i = 1; i <= expectedQuestionCount; i++) {
    if (questionMap.has(i)) {
      // Use existing question
      completeQuestions.push(questionMap.get(i)!)
    } else {
      // Create placeholder question
      const placeholderQuestion: Extracted['questions'][0] = {
        id: `${section}-${i}`,
        prompt: `Question ${i} - Not found in PDF`,
        choices: section === 'math' ? 
          (i % 2 === 1 ? ['A', 'B', 'C', 'D', 'E'] : ['F', 'G', 'H', 'J', 'K']) :
          ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J'],
        choiceLetters: section === 'math' ? 
          (i % 2 === 1 ? ['A', 'B', 'C', 'D', 'E'] : ['F', 'G', 'H', 'J', 'K']) :
          ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J'],
        answerIndex: undefined // No answer for placeholder questions
      }
      completeQuestions.push(placeholderQuestion)
    }
  }
  
  
  return completeQuestions
}

// Remove "ACT", "ENGLISH TEST", "PASSAGE" and everything after them from answer choices, and handle fractions
function cleanChoiceText(choiceText: string): string {
  let cleaned = choiceText
  
  // Remove "ACT" and everything after it
  const actIndex = cleaned.search(/\bACT\b/i)
  if (actIndex !== -1) {
    cleaned = cleaned.slice(0, actIndex).trim()
  }
  
  // Remove "ENGLISH TEST" and everything after it
  const englishTestIndex = cleaned.search(/\bENGLISH TEST\b/i)
  if (englishTestIndex !== -1) {
    cleaned = cleaned.slice(0, englishTestIndex).trim()
  }
  
  // Remove "PASSAGE" and everything after it
  const passageIndex = cleaned.search(/\bPASSAGE\b/i)
  if (passageIndex !== -1) {
    cleaned = cleaned.slice(0, passageIndex).trim()
  }
  
  // Remove "GO ON TO THE NEXT PAGE" and variations, and everything after it
  const goOnPatterns = [
    /\bGO ON TO THE NEXT PAGE\b/i,
    /\bGO ON TO NEXT PAGE\b/i,
    /\bGO TO THE NEXT PAGE\b/i,
    /\bGO TO NEXT PAGE\b/i,
    /\bCONTINUE TO NEXT PAGE\b/i,
    /\bTURN TO NEXT PAGE\b/i
  ]
  
  for (const pattern of goOnPatterns) {
    const goOnIndex = cleaned.search(pattern)
    if (goOnIndex !== -1) {
      cleaned = cleaned.slice(0, goOnIndex).trim()
      break // Stop at first match
    }
  }
  
  // Handle common fraction patterns and Unicode fractions
  cleaned = handleFractions(cleaned)
  
  return cleaned
}

// Handle various fraction formats that might appear in PDFs
function handleFractions(text: string): string {
  let processed = text
  
  // Handle Unicode fractions (like ½, ⅓, ⅔, ¼, ¾, etc.)
  const unicodeFractions: Record<string, string> = {
    '½': '1/2',
    '⅓': '1/3', 
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅐': '1/7',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
    '⅑': '1/9',
    '⅒': '1/10'
  }
  
  // Replace Unicode fractions
  Object.entries(unicodeFractions).forEach(([unicode, fraction]) => {
    processed = processed.replace(new RegExp(unicode, 'g'), fraction)
  })
  
  // Handle fractions that might be split across lines or have extra spaces
  // Pattern: number + optional spaces + / + optional spaces + number
  processed = processed.replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2')
  
  // Handle fractions that might be written as "number over number"
  processed = processed.replace(/(\d+)\s+over\s+(\d+)/gi, '$1/$2')
  
  // Handle mixed numbers (like "1 1/2")
  processed = processed.replace(/(\d+)\s+(\d+)\/(\d+)/g, '$1 $2/$3')
  
  // Handle decimal fractions that might be written as "point" instead of "."
  processed = processed.replace(/(\d+)\s+point\s+(\d+)/gi, '$1.$2')
  
  // Clean up any remaining extra whitespace around fractions
  processed = processed.replace(/\s*\/\s*/g, '/')
  
  // Handle square roots that might be written as "sqrt" or "√"
  processed = processed.replace(/sqrt\s*\(([^)]+)\)/gi, '√($1)')
  processed = processed.replace(/√\s*\(([^)]+)\)/g, '√($1)')
  
  // Handle exponents that might be written as "x^2" or "x squared"
  processed = processed.replace(/(\w+)\^(\d+)/g, '$1^$2')
  processed = processed.replace(/(\w+)\s+squared/gi, '$1^2')
  processed = processed.replace(/(\w+)\s+cubed/gi, '$1^3')
  
  // Handle negative numbers that might have extra spaces
  processed = processed.replace(/\s*-\s*(\d+)/g, '-$1')
  
  // Handle parentheses with extra spaces
  processed = processed.replace(/\s*\(\s*/g, '(')
  processed = processed.replace(/\s*\)\s*/g, ')')
  
  // Handle common mathematical symbols that might be mangled
  processed = processed.replace(/×/g, '*')  // multiplication symbol
  processed = processed.replace(/÷/g, '/')  // division symbol
  processed = processed.replace(/±/g, '±')  // plus-minus symbol
  processed = processed.replace(/≤/g, '<=') // less than or equal
  processed = processed.replace(/≥/g, '>=') // greater than or equal
  processed = processed.replace(/≠/g, '!=') // not equal
  
  return processed
}

// old act asnwer key is just different from enhanced act
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
  
  // Set max question number based on section
  let maxQuestions = numOfEnglishQuestions
  if (sectionName.toLowerCase().includes('math')) {
    maxQuestions = numOfMathQuestions
  } else if (sectionName.toLowerCase().includes('reading')) {
    maxQuestions = numOfReadingQuestions
  }
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    
    // Method 1: Look for "1. A" format (old ACT style)
    const periodMatch = line.match(new RegExp(`^(\\d{1,2})\\.\\s*(${ANSWER_KEY_PATTERN.source})\\s*$`))
    if (periodMatch) {
      const questionNum = Number(periodMatch[1])
      const answerLetter = periodMatch[2]
      if (questionNum >= 1 && questionNum <= maxQuestions) {
        map[questionNum] = answerLetter
        continue
      }
    }
    
    // Method 2: Look for "1 A" format (enhanced ACT style)
    if (i < dataLines.length - 1) {
      const line1 = dataLines[i]
      const line2 = dataLines[i + 1]
      
      if (/^\d{1,2}$/.test(line1)) {
        const questionNum = Number(line1)
        if (new RegExp(`^${ANSWER_KEY_PATTERN.source}$`).test(line2)) {
          const answerLetter = line2
          if (questionNum >= 1 && questionNum <= maxQuestions) {
            map[questionNum] = answerLetter
          }
        }
      }
    }
    
    // Method 3: Look for "1A" format (no spaces)
    const combinedMatch = line.match(new RegExp(`^(\\d{1,2})(${ANSWER_KEY_PATTERN.source})\\s*$`))
    if (combinedMatch) {
      const questionNum = Number(combinedMatch[1])
      const answerLetter = combinedMatch[2]
      if (questionNum >= 1 && questionNum <= maxQuestions) {
        map[questionNum] = answerLetter
      }
    }
  }
  
  return Object.keys(map).length > 0 ? map : null
}

// Detect answer key pages for old ACT format
async function detectAnswerKeyPages(pdf: PDFDocumentProxy): Promise<Partial<Record<string, number>>> {
  const answerKeyPages: Partial<Record<string, number>> = {}
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
    
    // Check for old ACT answer key headers
    const isEnglishKey = /Test\s+1:\s*English[—–-]\s*Scoring\s+Key/i.test(text)
    const isMathKey = /Test\s+2:\s*Mathematics[—–-]\s*Scoring\s+Key/i.test(text)
    const isReadingKey = /Test\s+3:\s*Reading[—–-]\s*Scoring\s+Key/i.test(text)
    
    if (isEnglishKey) {
      answerKeyPages.english = i
    }
    if (isMathKey) {
      answerKeyPages.math = i
    }
    if (isReadingKey) {
      answerKeyPages.reading = i
    }
  }
  
  return answerKeyPages
}

// Extract answer key from a specific page
function extractAnswerKeyFromPage(pageText: string, sectionName: string): Record<number, string> | null {
  
  const lines = pageText.split('\n')
  const dataLines = lines.map(line => line.trim()).filter(line => line.length > 0)
  const map: Record<number, string> = {}
  
  // Set max question number based on section
  let maxQuestions = numOfEnglishQuestions
  if (sectionName.toLowerCase().includes('math')) {
    maxQuestions = numOfMathQuestions
  } else if (sectionName.toLowerCase().includes('reading')) {
    maxQuestions = numOfReadingQuestions
  }
  
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    
    // Method 1: Look for "1. A ___" format (old ACT style with underscores)
    const periodUnderscoreMatch = line.match(new RegExp(`^(\\d{1,2})\\.\\s*(${ANSWER_KEY_PATTERN.source})\\s*_+$`))
    if (periodUnderscoreMatch) {
      const questionNum = Number(periodUnderscoreMatch[1])
      const answerLetter = periodUnderscoreMatch[2]
              if (questionNum >= 1 && questionNum <= maxQuestions) {
          map[questionNum] = answerLetter
          continue
        }
    }
    
    // Method 2: Look for "1. A" format (old ACT style without underscores)
    const periodMatch = line.match(new RegExp(`^(\\d{1,2})\\.\\s*(${ANSWER_KEY_PATTERN.source})\\s*$`))
    if (periodMatch) {
      const questionNum = Number(periodMatch[1])
      const answerLetter = periodMatch[2]
              if (questionNum >= 1 && questionNum <= maxQuestions) {
          map[questionNum] = answerLetter
          continue
        }
    }
    
    // Method 3: Look for "1 A" format (enhanced ACT style) - separate lines
    if (i < dataLines.length - 1) {
      const line1 = dataLines[i]
      const line2 = dataLines[i + 1]
      
      // Check if current line is a question number and next line is an answer letter
      if (/^\d{1,2}\.$/.test(line1)) {
        const questionNum = Number(line1.replace('.', ''))
        if (new RegExp(`^${ANSWER_KEY_PATTERN.source}$`).test(line2)) {
          const answerLetter = line2
          if (questionNum >= 1 && questionNum <= maxQuestions) {
            map[questionNum] = answerLetter
          }
        }
      }
    }
    
    // Method 4: Look for "1A" format (no spaces)
    const combinedMatch = line.match(new RegExp(`^(\\d{1,2})(${ANSWER_KEY_PATTERN.source})\\s*$`))
    if (combinedMatch) {
      const questionNum = Number(combinedMatch[1])
      const answerLetter = combinedMatch[2]
              if (questionNum >= 1 && questionNum <= maxQuestions) {
          map[questionNum] = answerLetter
        }
    }
    
    // Method 5: Look for "1. A" with any trailing content
    const periodAnyMatch = line.match(new RegExp(`^(\\d{1,2})\\.\\s*(${ANSWER_KEY_PATTERN.source})\\s*(.*)$`))
    if (periodAnyMatch) {
      const questionNum = Number(periodAnyMatch[1])
      const answerLetter = periodAnyMatch[2]
              if (questionNum >= 1 && questionNum <= maxQuestions) {
          map[questionNum] = answerLetter
          continue
        }
    }
  }
  
  return Object.keys(map).length > 0 ? map : null
}

function extractEnglishAnswerKey(text: string): Record<number, string> | null {
  return extractAnswerKey(
    text,
    'English Scoring Key',
    /Test\s+1:\s*English[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+2:|Test\s+3:|Test\s+4:|$)/i,
    /Test\s+2:|Test\s+3:|Test\s+4:|$/
  )
}

function extractMathAnswerKey(text: string): Record<number, string> | null {
  return extractAnswerKey(
    text, 
    'Mathematics Scoring Key', 
    /Test\s+2:\s*Mathematics[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+3:|Test\s+4:|$)/i, 
    /Test\s+3:|Test\s+4:|$/
  )
}

function extractReadingAnswerKey(text: string): Record<number, string> | null {
  return extractAnswerKey(
    text, 
    'Reading Scoring Key', 
    /Test\s+3:\s*Reading[—–-]\s*Scoring\s+Key[\s\S]*?(?=Test\s+4:|$)/i, 
    /Test\s+4:|$/
  )
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



// Detect section start pages for old ACT format
export async function detectSectionPages(pdf: PDFDocumentProxy): Promise<Partial<Record<string, number>>> {
  const detectedPages: Partial<Record<string, number>> = {}
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type PDFTextItem = { str: string }
    const text = (content.items as PDFTextItem[]).map((it) => it.str).join('\n')
    
    // Check for section headers with flexible patterns for old ACT using variables
    const isEnglishSection = new RegExp(`ENGLISH TEST\\s+${numOfEnglishMinutes}\\s+Minutes—${numOfEnglishQuestions}\\s+Questions`, 'i').test(text)
    const isMathSection = new RegExp(`MATHEMATICS TEST\\s+${numOfMathMinutes}\\s+Minutes—${numOfMathQuestions}\\s+Questions`, 'i').test(text)
    const isReadingSection = new RegExp(`READING TEST\\s+${numOfReadingMinutes}\\s+Minutes—${numOfReadingQuestions}\\s+Questions`, 'i').test(text)
    
    // Store detected pages for all sections
    if (isEnglishSection) {
      detectedPages.english = i
    }
    if (isMathSection) {
      detectedPages.math = i
    }
    if (isReadingSection) {
      detectedPages.reading = i
    }
  }
  
  return detectedPages
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
    const pageQuestions = extractQuestionsFromPageText(pageText, pageNum, 'english')
    questions.push(...pageQuestions)
    
    // Stop if we find "END OF TEST 1" or Math section
    if (pageText.includes('END OF TEST 1') || pageText.includes('MATHEMATICS TEST')) {
      break
    }
  }
  return { section: 'english', questions }
}

// Extract questions from a single page of text
function extractQuestionsFromPageText(pageText: string, pageNum: number, section: string = 'english'): Extracted['questions'] {
  const questions: Extracted['questions'] = []
  
  // Use section-specific answer choice patterns
  const choicePattern = section === 'math' ? A_THROUGH_K_ANSWER_CHOICES : ABCD_FGHJ_ANSWER_CHOICES
  
  // Enhanced question detection: look for numbers followed by answer choices
  const questionMatches = Array.from(pageText.matchAll(new RegExp(`(?:^|\\n)\\s*(\\d{1,2})\\.\\s+[^]*?${choicePattern.source}`, 'g')))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  
  // Set max question number based on section
  let maxQuestions = numOfEnglishQuestions // Default for English
  if (section === 'math') maxQuestions = numOfMathQuestions
  if (section === 'reading') maxQuestions = numOfReadingQuestions
  
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= maxQuestions) {
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
      // Check if there are actual answer choices within 500 characters
      const hasAnswerChoices = choicePattern.test(textAfterMatch)
      
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
    const choiceStart = block.search(new RegExp(`(?:^|\\s)(${choicePattern.source})`))
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    // Allow questions with no prompt (Old ACT format) or short prompts
    if (prompt.length > 0 && prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      const choiceParts = choiceRegion.split(new RegExp(`(${choicePattern.source})`))
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          const nextChoiceMatch = choiceText.match(new RegExp(`(${choicePattern.source})`))
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
                else if (parenLevel === 0 && choicePattern.test(searchText.slice(j, j + 3))) {
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
            // Clean up the choice letter - remove extra whitespace and periods
            const cleanLetter = letter.replace(/\s+/g, '').replace(/[.)]/g, '')
            choiceLetters.push(cleanLetter)
          }
        }
      }
    }

    if (choices.length >= 2) {
      questions.push({
        id: `${section}-${qNum}`,
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
async function extractMathFromPages(pageTextMap: Record<number, string>, startPage: number): Promise<Extracted> {
  const questions: Extracted['questions'] = []
  
  // Extract questions from each page starting from the Math start page
  for (let pageNum = startPage; pageNum <= startPage + 20; pageNum++) { // Check next 20 pages max
    if (!pageTextMap[pageNum]) {
      continue
    }
    
    const pageText = pageTextMap[pageNum]
    

    
    // Use text-based extraction for Math questions
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
  
      // Enhanced question detection: look for numbers followed by answer choices
    // Use Math-specific answer choice patterns
    const choicePattern = A_THROUGH_K_ANSWER_CHOICES
    const questionMatches = Array.from(pageText.matchAll(new RegExp(`(?:^|\\n)\\s*(\\d{1,2})\\.\\s+[^]*?${choicePattern.source}`, 'g')))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= numOfMathQuestions) { // Old ACT Math has 60 questions
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
              // Check if there are actual answer choices within 500 characters
        const hasAnswerChoices = choicePattern.test(textAfterMatch)
      
      
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
      continue
    }
    
    const block = m[1]
    
    // Special debug for question 2 - show full block text
    if (qNum === 2) {
      console.log(`🔍 MATH DEBUG: Question 2 FULL BLOCK TEXT:`)
      console.log(block)
      console.log(`🔍 MATH DEBUG: End of Question 2 block text`)
    }
    
    const choiceStart = block.search(new RegExp(`(?:^|\\s)(${choicePattern.source})`))
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      
      const choiceParts = choiceRegion.split(new RegExp(`(${choicePattern.source})`))
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          
          const nextChoiceMatch = choiceText.match(new RegExp(`(${choicePattern.source})`))
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
                else if (parenLevel === 0 && choicePattern.test(searchText.slice(j, j + 3))) {
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
          
          // Special debug for question 2 to see fraction patterns
          if (qNum === 2) {
            console.log(`🔍 MATH DEBUG: Question 2 raw choice ${letter}: "${choiceText}"`)
          }
          
          choiceText = cleanChoiceText(choiceText)
          
          // Special debug for question 2 to see fraction patterns
          if (qNum === 2) {
            console.log(`🔍 MATH DEBUG: Question 2 cleaned choice ${letter}: "${choiceText}"`)
          }
          
          if (choiceText && choiceText.length > 0) {
            choices.push(choiceText)
            // Clean up the choice letter - remove extra whitespace and newlines
            const cleanLetter = letter.replace(/\s+/g, '').replace(/[.)]/g, '')
            choiceLetters.push(cleanLetter)
            
            // Special debug for question 2
            if (qNum === 2) {
              console.log(`🔍 MATH DEBUG: Question 2 final choice ${cleanLetter}: "${choiceText}"`)
            }
          }
        }
      }
    }
    
    // Special debug for question 2
    if (qNum === 2) {
      console.log(`🔍 MATH DEBUG: Question 2 final choices:`, choices)
      console.log(`🔍 MATH DEBUG: Question 2 final choice letters:`, choiceLetters)
    }


    
    // For Math questions, enforce proper answer choice patterns
    if (choices.length > 0) {
      // Determine if this is an odd or even question
      const isOddQuestion = qNum % 2 === 1
      
      // Define the correct choice letters based on question number
      let correctChoiceLetters: string[]
      if (isOddQuestion) {
        // Odd questions: A, B, C, D, E
        correctChoiceLetters = ['A', 'B', 'C', 'D', 'E']
      } else {
        // Even questions: F, G, H, J, K
        correctChoiceLetters = ['F', 'G', 'H', 'J', 'K']
      }
      
      // Create a map of current choices by letter
      const choiceMap = new Map<string, string>()
      choiceLetters.forEach((letter, index) => {
        choiceMap.set(letter, choices[index])
      })
      
      // Build the final choices in the correct order
      const finalChoices: string[] = []
      const finalChoiceLetters: string[] = []
      
      for (const correctLetter of correctChoiceLetters) {
        const choiceText = choiceMap.get(correctLetter) || ''
        finalChoices.push(choiceText)
        finalChoiceLetters.push(correctLetter)
      }
      
      questions.push({
        id: `math-${qNum}`,
        prompt,
        choices: finalChoices,
        choiceLetters: finalChoiceLetters,
        pageNumber: pageNum
      })
    }
  }
  
  return questions
}









// Extract Reading questions from specific pages
function extractReadingFromPages(pageTextMap: Record<number, string>, startPage: number): Extracted {
  const questions: Extracted['questions'] = []
  const pageQuestions: Record<number, string[]> = {}
  
  // Extract questions from each page starting from the Reading start page
  for (let pageNum = startPage; pageNum <= startPage + 20; pageNum++) { // Check next 20 pages max
    if (!pageTextMap[pageNum]) {
      continue
    }
    
    const pageText = pageTextMap[pageNum]
    
    // Extract questions from this specific page
    const pageQuestionsList = extractReadingQuestionsFromPageText(pageText, pageNum)
    
    // Map questions to their page numbers
    pageQuestionsList.forEach(question => {
      question.pageNumber = pageNum
      questions.push(question)
      
      // Add to pageQuestions mapping
      if (!pageQuestions[pageNum]) {
        pageQuestions[pageNum] = []
      }
      pageQuestions[pageNum].push(question.id)
    })
    
    // Stop if we find "END OF TEST 3" or Science section
    if (pageText.includes('END OF TEST 3') || pageText.includes('SCIENCE TEST')) {
      break
    }
  }
  
  return { 
    section: 'reading', 
    questions,
    pageQuestions
  }
}

// Extract Reading questions from a single page of text
function extractReadingQuestionsFromPageText(pageText: string, pageNum: number): Extracted['questions'] {
  const questions: Extracted['questions'] = []
  
  // Enhanced question detection: look for numbers followed by answer choices
  const choicePattern = ABCD_FGHJ_ANSWER_CHOICES
  const questionMatches = Array.from(pageText.matchAll(new RegExp(`(?:^|\\n)\\s*(\\d{1,2})\\.\\s+[^]*?${choicePattern.source}`, 'g')))
  
  // Filter to only include numbers that actually have answer choices within 500 characters
  const validatedNums: number[] = []
  for (const match of questionMatches) {
    const questionNum = Number(match[1])
    if (questionNum >= 1 && questionNum <= numOfReadingQuestions) { // Old ACT Reading has 40 questions
      const matchIndex = match.index!
      const textAfterMatch = pageText.slice(matchIndex, matchIndex + 500)
      
      // Check if there are actual answer choices within 500 characters
      const hasAnswerChoices = choicePattern.test(textAfterMatch)
      
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
    const choiceStart = block.search(new RegExp(`(?:^|\\s)(${choicePattern.source})`))
    const promptFragment = choiceStart !== -1 ? block.slice(0, choiceStart) : block
    const choiceRegion = choiceStart !== -1 ? block.slice(choiceStart) : ''

    const prompt = promptFragment.replace(/\s+/g, ' ').trim()

    if (prompt.length < 10) continue
    if (prompt.includes('I understand') || prompt.includes('Terms and Conditions') || prompt.includes('ACT Privacy Policy')) continue

    const choices: string[] = []
    const choiceLetters: string[] = []
    if (choiceRegion) {
      const choiceParts = choiceRegion.split(new RegExp(`(${choicePattern.source})`))
      
      for (let i = 1; i < choiceParts.length; i += 2) {
        if (i + 1 < choiceParts.length) {
          const letter = choiceParts[i]
          let choiceText = choiceParts[i + 1]
          
          const nextChoiceMatch = choiceText.match(new RegExp(`(${choicePattern.source})`))
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
                else if (parenLevel === 0 && choicePattern.test(searchText.slice(j, j + 3))) {
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
            // Clean up the choice letter - remove extra whitespace and periods
            const cleanLetter = letter.replace(/\s+/g, '').replace(/[.)]/g, '')
            choiceLetters.push(cleanLetter)
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
