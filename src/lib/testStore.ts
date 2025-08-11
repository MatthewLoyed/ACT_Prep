export type SectionId = 'english' | 'math' | 'reading' | 'science'

export type TestBundle = {
  id: string
  name: string
  createdAt: string
  sections: Partial<Record<SectionId, any[]>>
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
  const full: TestBundle = { id, name: bundle.name, sections: bundle.sections, createdAt: new Date().toISOString() }
  tests.push(full)
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests))
  return full
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

export function getNextDefaultName(): string {
  const tests = listTests()
  let n = 1
  const names = new Set(tests.map(t => t.name))
  while (names.has(`Practice Test #${n}`)) n++
  return `Practice Test #${n}`
}

export function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function clearTests(): void {
  localStorage.removeItem(TESTS_KEY)
  localStorage.removeItem(ACTIVE_TEST_KEY)
}


