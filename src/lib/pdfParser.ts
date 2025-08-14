// Main PDF parser dispatcher
import { detectFormat, type TestFormat } from './formatDetector'
import { parseEnhancedActPdf, type Extracted as EnhancedActExtracted } from './actParser'
import { parseOldActPdf, type Extracted as OldActExtracted } from './genericParser'
import { parseOtherPdf, type Extracted as OtherExtracted } from './otherParser'

export type Extracted = EnhancedActExtracted | OldActExtracted | OtherExtracted

export async function parsePdf(file: File): Promise<{
  results: Extracted[]
  format: TestFormat
  reason: string
}> {
  // Detect format based on filename
  const detection = detectFormat(file.name)

  let results: Extracted[] = []

  try {
    if (detection.format === 'enhanced_act') {
      results = await parseEnhancedActPdf(file)
    } else if (detection.format === 'old_act') {
      results = await parseOldActPdf(file)
    } else {
      results = await parseOtherPdf(file)
    }
  } catch (error) {
    console.error('Parser error:', error)
    throw error
  }

  return {
    results,
    format: detection.format,
    reason: detection.reason
  }
}
