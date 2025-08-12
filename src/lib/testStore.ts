// Define types locally to avoid module resolution issues
export type SectionId = 'english' | 'math' | 'reading' | 'science'

export type TestBundle = {
  id: string
  name: string
  createdAt: string
  sections: Partial<Record<SectionId, unknown[]>>
  pdfData?: string // Base64 encoded PDF data
}

const TESTS_KEY = 'tests'
const ACTIVE_TEST_KEY = 'activeTestId'

export function listTests(): TestBundle[] {
  try {
    return JSON.parse(localStorage.getItem(TESTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveTest(bundle: Omit<TestBundle, 'id' | 'createdAt'>): TestBundle {
  const tests = listTests()
  const id = cryptoRandomId()
  const full: TestBundle = { 
    id, 
    name: bundle.name, 
    sections: bundle.sections, 
    pdfData: bundle.pdfData,
    createdAt: new Date().toISOString() 
  }
  
  console.log('TESTSTORE DEBUG: Saving test with ID:', id)
  console.log('TESTSTORE DEBUG: Test has PDF data:', !!full.pdfData)
  console.log('TESTSTORE DEBUG: PDF data length:', full.pdfData?.length || 0)
  
  tests.push(full)
  
  try {
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests))
    console.log('TESTSTORE DEBUG: Test saved successfully')
    return full
  } catch {
    console.error('TESTSTORE DEBUG: Storage quota exceeded, attempting to free space...')
    
    // Try to free space by removing old tests
    if (tests.length > 1) {
      // Remove the oldest test (excluding the one we're trying to save)
      const sortedTests = tests.slice(0, -1).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      if (sortedTests.length > 0) {
        const oldestTest = sortedTests[0]
        console.log(`TESTSTORE DEBUG: Removing oldest test: ${oldestTest.name} (${oldestTest.createdAt})`)
        
        // Remove the oldest test and try again
        const filteredTests = tests.filter(t => t.id !== oldestTest.id)
        filteredTests.push(full)
        
        try {
          localStorage.setItem(TESTS_KEY, JSON.stringify(filteredTests))
          console.log('TESTSTORE DEBUG: Test saved after removing oldest test')
          return full
        } catch {
          console.error('TESTSTORE DEBUG: Still quota exceeded after removing oldest test')
          throw new Error('Storage quota exceeded. Please clear some tests manually.')
        }
      }
    }
    
    throw new Error('Storage quota exceeded. Please clear some tests manually.')
  }
}

export function getActiveTestId(): string | null {
  return localStorage.getItem(ACTIVE_TEST_KEY)
}

export function setActiveTestId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_TEST_KEY, id)
  else localStorage.removeItem(ACTIVE_TEST_KEY)
}

export function getActiveTest(): TestBundle | null {
  const id = getActiveTestId()
  if (!id) return null
  return listTests().find(t => t.id === id) ?? null
}

export function getTest(id: string): TestBundle | null {
  return listTests().find(t => t.id === id) ?? null
}

export function getNextDefaultName(): string {
  const tests = listTests()
  let n = 1
  const names = new Set(tests.map(t => t.name))
  while (names.has(`Practice Test #${n}`)) n++
  return `Practice Test #${n}`
}

export function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function clearTests(): void {
  localStorage.removeItem(TESTS_KEY)
  localStorage.removeItem(ACTIVE_TEST_KEY)
}

export function deleteTest(id: string): void {
  const tests = listTests()
  const filteredTests = tests.filter(t => t.id !== id)
  localStorage.setItem(TESTS_KEY, JSON.stringify(filteredTests))
  
  // If the deleted test was the active test, clear the active test
  const activeTestId = getActiveTestId()
  if (activeTestId === id) {
    setActiveTestId(null)
  }
}

export function getStorageInfo(): { used: number; total: number; tests: number } {
  const tests = listTests()
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
}


