// Other parser - for off-brand or non-ACT practice tests
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist'

export type Extracted = {
  section: 'english' | 'math' | 'reading' | 'science' | 'other'
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

export async function parseOtherPdf(file: File): Promise<Extracted[]> {
  const buf = await file.arrayBuffer()
  const pdf: PDFDocumentProxy = await getDocument({ data: buf }).promise

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
  
  // Debug: Look for any section patterns
  console.log('OTHER DEBUG: Looking for section patterns...')
  const sectionMatches = combined.match(/([A-Z][a-z]+)\s+(?:Test|Section|Part)/gi)
  if (sectionMatches) {
    console.log('OTHER DEBUG: Found sections:', sectionMatches)
  }

  // Try to find any numbered questions
  const questionMatches = combined.match(/(?:^|\n)\s*(\d{1,2})[.)]/g)
  console.log('OTHER DEBUG: Found numbered items:', questionMatches?.length || 0)

  // For now, return empty array - this parser needs to be customized based on actual test formats
  return []
}



