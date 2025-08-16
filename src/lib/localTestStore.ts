// localStorage-based test store for private, local test storage
// Mirrors the functionality of supabaseTestStore.ts but uses localStorage instead

type SectionId = 'english' | 'math' | 'reading' | 'science'

export type TestBundle = {
  id: string
  name: string
  createdAt: string
  sections: Partial<Record<SectionId, unknown[]>>
  pdfData?: string // Base64 encoded PDF data
  sectionPages?: Partial<Record<SectionId, number>> // Store the page number where each section starts
  pageQuestions?: Partial<Record<SectionId, Record<number, string[]>>> // Store which questions are on which pages
}

const TESTS_KEY = 'localTests'
const ACTIVE_TEST_KEY = 'activeTestId'

// Generate a random ID for tests
function cryptoRandomId(): string {
  return crypto.randomUUID()
}



// Load tests from localStorage
function loadTestsFromStorage(): TestBundle[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('❌ localStorage is not available')
      return []
    }
    
    const savedTests = localStorage.getItem(TESTS_KEY)
    if (savedTests) {
      const parsedTests = JSON.parse(savedTests)
      return parsedTests
    } else {
      return []
    }
  } catch (error) {
    console.error('❌ Error loading tests from localStorage:', error)
    return []
  }
}

// Save tests to localStorage
function saveTestsToStorage(tests: TestBundle[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('❌ localStorage is not available for saving')
      return
    }
    
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests))
  } catch (error) {
    console.error('❌ Error saving tests to localStorage:', error)
    throw new Error('Failed to save tests to localStorage')
  }
}

// Save a new test to localStorage
export function saveTest(bundle: Omit<TestBundle, 'id' | 'createdAt'>): TestBundle {
  const id = cryptoRandomId()
  const now = new Date().toISOString()
  
  const full: TestBundle = { 
    id, 
    name: bundle.name, 
    sections: bundle.sections, 
    pdfData: bundle.pdfData,
    sectionPages: bundle.sectionPages,
    pageQuestions: bundle.pageQuestions,
    createdAt: now
  }
  
  console.log('💾 Saving test to localStorage with ID:', id)
  console.log('💾 Test has PDF data:', !!full.pdfData)
  console.log('💾 PDF data length:', full.pdfData?.length || 0)
  
  const tests = loadTestsFromStorage()
  tests.push(full)
  
  try {
    saveTestsToStorage(tests)
    console.log('✅ Test saved successfully to localStorage')
    return full
  } catch (error) {
    console.error('❌ Failed to save test to localStorage:', error)
    throw error
  }
}

// Load a specific test from localStorage
export function loadTest(id: string): TestBundle | null {
  try {
    const tests = loadTestsFromStorage()
    const test = tests.find(t => t.id === id)
    
    if (test) {
      console.log('🔍 Loaded test from localStorage:', test.name)
      return test
    } else {
      console.log('🔍 Test not found in localStorage:', id)
      return null
    }
  } catch (error) {
    console.error('❌ Error loading test from localStorage:', error)
    return null
  }
}

// List all tests from localStorage (without PDF data for performance)
export function listTests(): TestBundle[] {
  try {
    const tests = loadTestsFromStorage()
    
    // Return tests without PDF data for list view (performance)
    const testsWithoutPdf = tests.map(test => ({
      ...test,
      pdfData: undefined
    }))
    
    console.log('📋 Listed tests from localStorage:', testsWithoutPdf.length, 'tests')
    return testsWithoutPdf
  } catch (error) {
    console.error('❌ Error listing tests from localStorage:', error)
    return []
  }
}

// Delete a test from localStorage
export function deleteTest(id: string): void {
  try {
    const tests = loadTestsFromStorage()
    const filteredTests = tests.filter(t => t.id !== id)
    
    saveTestsToStorage(filteredTests)
    console.log('🗑️ Deleted test from localStorage:', id)
    
    // If the deleted test was the active test, clear the active test
    const activeTestId = getActiveTestId()
    if (activeTestId === id) {
      setActiveTestId(null)
    }
  } catch (error) {
    console.error('❌ Error deleting test from localStorage:', error)
    throw error
  }
}

// Clear all tests from localStorage
export function clearAllTests(): void {
  try {
    localStorage.removeItem(TESTS_KEY)
    localStorage.removeItem(ACTIVE_TEST_KEY)
    console.log('🧹 Cleared all tests from localStorage')
  } catch (error) {
    console.error('❌ Error clearing tests from localStorage:', error)
    throw error
  }
}

// Get storage info
export function getStorageInfo(): { used: number; total: number; tests: number } {
  try {
    const tests = loadTestsFromStorage()
    let totalSize = 0
    
    // Calculate size of all tests
    tests.forEach(test => {
      const testSize = JSON.stringify(test).length
      totalSize += testSize
    })
    
    // Estimate total storage (rough calculation)
    const totalStorage = 5 * 1024 * 1024 // 5MB typical localStorage limit
    
    return {
      used: totalSize,
      total: totalStorage,
      tests: tests.length
    }
  } catch (error) {
    console.error('❌ Error getting storage info:', error)
    return { used: 0, total: 0, tests: 0 }
  }
}

// Active test management
export function getActiveTestId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TEST_KEY)
  } catch (error) {
    console.error('❌ Error getting active test ID:', error)
    return null
  }
}

export function setActiveTestId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_TEST_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_TEST_KEY)
    }
    console.log('🎯 Set active test ID:', id)
  } catch (error) {
    console.error('❌ Error setting active test ID:', error)
  }
}

export function getActiveTest(): TestBundle | null {
  const id = getActiveTestId()
  if (!id) return null
  return loadTest(id)
}

// Get next default test name
export function getNextDefaultName(): string {
  const tests = listTests()
  const testCount = tests.length + 1
  return `Practice Test #${testCount}`
}

// Update test section pages
export function updateTestSectionPages(id: string, sectionPages: Partial<Record<SectionId, number>>): void {
  try {
    const tests = loadTestsFromStorage()
    const testIndex = tests.findIndex(t => t.id === id)
    
    if (testIndex !== -1) {
      tests[testIndex].sectionPages = {
        ...tests[testIndex].sectionPages,
        ...sectionPages
      }
      saveTestsToStorage(tests)
      console.log('📄 Updated section pages for test:', id)
    } else {
      console.error('❌ Test not found for section pages update:', id)
    }
  } catch (error) {
    console.error('❌ Error updating test section pages:', error)
    throw error
  }
}

// Rename a test
export function renameTest(id: string, newName: string): void {
  try {
    const tests = loadTestsFromStorage()
    const testIndex = tests.findIndex(t => t.id === id)
    
    if (testIndex !== -1) {
      tests[testIndex].name = newName
      saveTestsToStorage(tests)
      console.log('✏️ Renamed test:', id, 'to:', newName)
    } else {
      console.error('❌ Test not found for rename:', id)
      throw new Error('Test not found')
    }
  } catch (error) {
    console.error('❌ Error renaming test:', error)
    throw error
  }
}

// Async wrapper functions to maintain compatibility with existing code
export async function saveTestToLocalStorage(bundle: Omit<TestBundle, 'id' | 'createdAt'>): Promise<TestBundle> {
  return saveTest(bundle)
}

export async function loadTestFromLocalStorage(id: string): Promise<TestBundle | null> {
  return loadTest(id)
}

export async function listTestsFromLocalStorage(): Promise<TestBundle[]> {
  return listTests()
}

export async function deleteTestFromLocalStorage(id: string): Promise<void> {
  return deleteTest(id)
}

export async function clearAllTestsFromLocalStorage(): Promise<void> {
  return clearAllTests()
}

export async function renameTestFromLocalStorage(id: string, newName: string): Promise<void> {
  return renameTest(id, newName)
}
