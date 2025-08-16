// Test configuration for different ACT test types
export interface TestTypeConfig {
  id: string
  name: string
  description: string
  subjects: {
    english: SubjectConfig
    math: SubjectConfig
    reading: SubjectConfig
    science?: SubjectConfig
  }
  totalTime: string
  totalQuestions: number
}

export interface SubjectConfig {
  time: string
  questions: number
  description: string
}

// Old ACT Test Configuration (pre-2015)
export const OLD_ACT_CONFIG: TestTypeConfig = {
  id: 'old-act',
  name: 'Old ACT®',
  description: 'Pre-2015 ACT® format with different timing and question counts',
  subjects: {
    english: {
      time: '45 minutes',
      questions: 75,
      description: 'Grammar, usage, punctuation, and rhetorical skills.'
    },
    math: {
      time: '60 minutes', 
      questions: 60,
      description: 'Algebra, geometry, functions, and number sense.'
    },
    reading: {
      time: '35 minutes',
      questions: 40,
      description: 'Comprehension, inference, and author\'s purpose.'
    },
    science: {
      time: '35 minutes',
      questions: 40,
      description: 'Data interpretation and reasoning. (Coming Soon)'
    }
  },
  totalTime: '2 hours 20 minutes',
  totalQuestions: 175
}

// Enhanced ACT Test Configuration (post-2015)
export const ENHANCED_ACT_CONFIG: TestTypeConfig = {
  id: 'enhanced-act',
  name: 'Enhanced ACT®',
  description: 'Post-2015 ACT® format with updated timing and question counts',
  subjects: {
    english: {
      time: '35 minutes',
      questions: 50,
      description: 'Grammar, usage, punctuation, and rhetorical skills.'
    },
    math: {
      time: '50 minutes',
      questions: 45,
      description: 'Algebra, geometry, functions, and number sense.'
    },
    reading: {
      time: '40 minutes',
      questions: 36,
      description: 'Comprehension, inference, and author\'s purpose.'
    },
    science: {
      time: '40 minutes',
      questions: 40,
      description: 'Data interpretation and reasoning.'
    }
  },
  totalTime: '2 hours 45 minutes',
  totalQuestions: 171
}

// Function to determine test type based on test data
export function getTestTypeConfig(test: { name?: string }): TestTypeConfig {
  // Check if the test name contains "ENHANCED" to determine if it's enhanced
  const isEnhanced = test.name?.toUpperCase().includes('ENHANCED')
  
  if (isEnhanced) {
    return ENHANCED_ACT_CONFIG
  }
  
  // Default to Old ACT for all other tests
  return OLD_ACT_CONFIG
}

// Export all configs for easy access
export const TEST_CONFIGS = {
  'old-act': OLD_ACT_CONFIG,
  'enhanced-act': ENHANCED_ACT_CONFIG
}
