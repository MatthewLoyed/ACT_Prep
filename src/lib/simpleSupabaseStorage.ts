// Simple Supabase-only storage system
// Stores everything on Supabase for simplicity and reliability

import { supabase } from './supabase'
import type { TestBundle } from './testStore'

export type SimpleTestData = {
  id: string
  name: string
  createdAt: string
  pdfData: string // Base64 encoded PDF
  sections: Partial<Record<string, unknown[]>>
  sectionPages?: Partial<Record<string, number>>
  pageQuestions?: Partial<Record<string, Record<number, string[]>>>
  answers: Record<string, number>
  progress: {
    currentSection: string
    currentQuestionIndex: number
    timeRemaining: number
    isCompleted: boolean
    lastAccessed: string
  }
}

// Save a test to Supabase (everything included)
export async function saveTestToSupabase(testData: Omit<TestBundle, 'id' | 'createdAt'>): Promise<SimpleTestData> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated to save tests')
  }
  
  const fullTestData: SimpleTestData = {
    id,
    name: testData.name,
    createdAt: now,
    pdfData: testData.pdfData || '',
    sections: testData.sections,
    sectionPages: testData.sectionPages,
    pageQuestions: testData.pageQuestions,
    answers: {},
    progress: {
      currentSection: 'english',
      currentQuestionIndex: 0,
      timeRemaining: 175 * 60, // 175 minutes
      isCompleted: false,
      lastAccessed: now
    }
  }
  
  console.log('💾 Saving test to Supabase:', testData.name)
  console.log('💾 PDF data length:', fullTestData.pdfData.length)
  console.log('💾 User ID:', user.id)
  
  const { error } = await supabase
    .from('tests')
    .insert({
      id: fullTestData.id,
      user_id: user.id, // 🔑 Add user_id for data isolation
      name: fullTestData.name,
      created_at: fullTestData.createdAt,
      pdf_data: fullTestData.pdfData,
      sections: fullTestData.sections,
      section_pages: fullTestData.sectionPages,
      page_questions: fullTestData.pageQuestions,
      answers: fullTestData.answers,
      progress: fullTestData.progress
    })
  
  if (error) {
    console.error('❌ Error saving test to Supabase:', error)
    throw new Error(`Failed to save test: ${error.message}`)
  }
  
  console.log('✅ Test saved to Supabase successfully')
  return fullTestData
}

// Load a test from Supabase
export async function loadTestFromSupabase(id: string): Promise<SimpleTestData | null> {
  
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('❌ Error loading test from Supabase:', error)
    return null
  }
  
  if (!data) {
    console.log('🔍 Test not found in Supabase:', id)
    return null
  }
  
  const testData: SimpleTestData = {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    pdfData: data.pdf_data || '',
    sections: data.sections || {},
    sectionPages: data.section_pages || {},
    pageQuestions: data.page_questions || {},
    answers: data.answers || {},
    progress: data.progress || {
      currentSection: 'english',
      currentQuestionIndex: 0,
      timeRemaining: 175 * 60,
      isCompleted: false,
      lastAccessed: data.created_at
    }
  }
  
  return testData
}

// List all tests from Supabase
export async function listTestsFromSupabase(): Promise<Array<{ id: string; name: string; createdAt: string; hasProgress: boolean }>> {
  const { data, error } = await supabase
    .from('tests')
    .select('id, name, created_at, answers, progress')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error listing tests from Supabase:', error)
    return []
  }
  
  const tests = data.map(test => ({
    id: test.id,
    name: test.name,
    createdAt: test.created_at,
    hasProgress: Object.keys(test.answers || {}).length > 0 || test.progress?.isCompleted
  }))
  
  return tests
}

// Update answers for a test
export async function updateTestAnswers(id: string, answers: Record<string, number>): Promise<void> {
  
  const { error } = await supabase
    .from('tests')
    .update({ 
      answers,
      progress: {
        lastAccessed: new Date().toISOString()
      }
    })
    .eq('id', id)
  
  if (error) {
    console.error('❌ Error updating answers in Supabase:', error)
    throw new Error(`Failed to update answers: ${error.message}`)
  }
}

// Update progress for a test
export async function updateTestProgress(id: string, progress: any): Promise<void> {
  console.log('📝 Updating progress in Supabase:', id)
  
  const { error } = await supabase
    .from('tests')
    .update({ 
      progress: {
        ...progress,
        lastAccessed: new Date().toISOString()
      }
    })
    .eq('id', id)
  
  if (error) {
    console.error('❌ Error updating progress in Supabase:', error)
    throw new Error(`Failed to update progress: ${error.message}`)
  }
  
  console.log('✅ Progress updated in Supabase successfully')
}

// Delete a test from Supabase
export async function deleteTestFromSupabase(id: string): Promise<void> {
  console.log('🗑️ Deleting test from Supabase:', id)
  
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('❌ Error deleting test from Supabase:', error)
    throw new Error(`Failed to delete test: ${error.message}`)
  }
  
  console.log('✅ Test deleted from Supabase successfully')
}

// Find the earliest unanswered question for a test
export function findEarliestUnansweredQuestion(testData: SimpleTestData, subject?: string): { section: string; questionIndex: number; questionId: string } | null {
  const answers = testData.answers || {}
  const sections = testData.sections || {}
  
  // If a specific subject is provided, only check that subject
  const subjectsToCheck = subject ? [subject] : ['english', 'math', 'reading', 'science']
  
  for (const sectionName of subjectsToCheck) {
    const sectionQuestions = sections[sectionName] as any[] || []
    
    if (sectionQuestions.length === 0) continue
    
    // Find the first unanswered question in this section
    for (let i = 0; i < sectionQuestions.length; i++) {
      const question = sectionQuestions[i]
      const questionId = question.id
      
      if (answers[questionId] === undefined) {
        return {
          section: sectionName,
          questionIndex: i,
          questionId: questionId
        }
      }
    }
  }
  
  return null
}

// Clear all tests from Supabase
export async function clearAllTestsFromSupabase(): Promise<void> {
  console.log('🧹 Clearing all tests from Supabase...')
  
  // First, get all test IDs
  const { data: tests, error: fetchError } = await supabase
    .from('tests')
    .select('id')
  
  if (fetchError) {
    console.error('❌ Error fetching tests for deletion:', fetchError)
    throw new Error(`Failed to fetch tests: ${fetchError.message}`)
  }
  
  if (!tests || tests.length === 0) {
    console.log('📋 No tests found to clear')
    return
  }
  
  console.log(`🗑️ Found ${tests.length} tests to delete`)
  
  // Delete each test individually (more reliable)
  for (const test of tests) {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', test.id)
    
    if (error) {
      console.error(`❌ Error deleting test ${test.id}:`, error)
      throw new Error(`Failed to delete test ${test.id}: ${error.message}`)
    }
  }
  
  console.log('✅ All tests cleared from Supabase successfully')
}
