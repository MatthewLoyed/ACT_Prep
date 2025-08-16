// Format detection based on filename and content analysis
export type TestFormat = 'enhanced_act' | 'old_act'

export interface FormatDetectionResult {
  format: TestFormat
  confidence: number
  reason: string
}

export function detectFormat(filename: string): FormatDetectionResult {
  const lowerFilename = filename.toLowerCase()
  
  // Enhanced ACT format detection - ONLY look for "Preparing" in filename
  if (lowerFilename.includes('preparing')) {
    return {
      format: 'enhanced_act',
      confidence: 0.9,
      reason: 'Filename contains "Preparing" - likely enhanced ACT® official guide'
    }
  }
  
  // Old ACT tests - look for common old ACT patterns
  if (lowerFilename.includes('act') && (lowerFilename.includes('2005') || lowerFilename.includes('2006') || lowerFilename.includes('2007') || lowerFilename.includes('2008') || lowerFilename.includes('2009') || lowerFilename.includes('2010') || lowerFilename.includes('2011') || lowerFilename.includes('2012') || lowerFilename.includes('2013') || lowerFilename.includes('2014') || lowerFilename.includes('2015') || lowerFilename.includes('2016') || lowerFilename.includes('2017') || lowerFilename.includes('2018') || lowerFilename.includes('2019') || lowerFilename.includes('2020') || lowerFilename.includes('2021'))) {
    return {
      format: 'old_act',
      confidence: 0.8,
      reason: 'Filename contains ACT and year - likely old ACT® test'
    }
  }
  
  // All other files use generic (old ACT) parser
  return {
    format: 'old_act',
    confidence: 0.7,
    reason: 'Using generic parser for non-enhanced ACT format tests'
  }
}
