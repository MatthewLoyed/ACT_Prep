// Main PDF parser dispatcher
import { detectFormat, type TestFormat } from './formatDetector'
import { parseEnhancedActPdf, type Extracted as EnhancedActExtracted } from './actParser'
import { parseOldActPdf, type Extracted as OldActExtracted } from './genericParser'
import { parseOtherPdf, type Extracted as OtherExtracted } from './otherParser'

export type Extracted = EnhancedActExtracted | OldActExtracted | OtherExtracted

export async function parsePdf(file: File, testType?: 'enhanced' | 'old'): Promise<{
  results: Extracted[]
  format: TestFormat
  reason: string
}> {
  let results: Extracted[] = []
  let format: TestFormat
  let reason: string

  try {
    if (testType === 'enhanced') {
      results = await parseEnhancedActPdf(file)
      format = 'enhanced_act'
      reason = 'User selected Enhanced ACT format'
    } else if (testType === 'old') {
      results = await parseOldActPdf(file)
      format = 'old_act'
      reason = 'User selected Old ACT format'
    } else {
      // Fallback to auto-detection if no test type provided
      const detection = detectFormat(file.name)
      
      if (detection.format === 'enhanced_act') {
        results = await parseEnhancedActPdf(file)
      } else if (detection.format === 'old_act') {
        results = await parseOldActPdf(file)
      } else {
        results = await parseOtherPdf(file)
      }
      
      format = detection.format
      reason = detection.reason
    }
  } catch (error) {
    console.error('Parser error:', error)
    throw error
  }

  return {
    results,
    format,
    reason
  }
}
