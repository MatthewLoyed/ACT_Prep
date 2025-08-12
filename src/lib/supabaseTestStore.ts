import { supabase, PDF_BUCKET, type TestRecord } from './supabase'

// Define types locally to avoid module resolution issues
type SectionId = 'english' | 'math' | 'reading' | 'science'

type TestBundle = {
  id: string
  name: string
  createdAt: string
  sections: Partial<Record<SectionId, unknown[]>>
  pdfData?: string // Base64 encoded PDF data
}

const ACTIVE_TEST_KEY = 'activeTestId'

export async function saveTestToSupabase(bundle: Omit<TestBundle, 'id' | 'createdAt'>): Promise<TestBundle> {
  const id = cryptoRandomId()
  const now = new Date().toISOString()
  
      // Supabase debug removed
  
  try {
    // 1. Upload PDF to Supabase Storage
    let pdfPath: string | undefined
    if (bundle.pdfData) {
      const fileName = `${id}.pdf`
             const { error: uploadError } = await supabase.storage
        .from(PDF_BUCKET)
        .upload(fileName, dataURLtoBlob(bundle.pdfData), {
          contentType: 'application/pdf'
        })
      
      if (uploadError) {
              console.error('PDF upload failed:', uploadError)
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }
      
      pdfPath = fileName
      // PDF upload success debug removed
    }
    
    // 2. Save test metadata to database
    const testRecord: Omit<TestRecord, 'id'> = {
      name: bundle.name,
      created_at: now,
      sections: bundle.sections,
      pdf_path: pdfPath
    }
    
         const { error: dbError } = await supabase
      .from('tests')
      .insert([{ id, ...testRecord }])
      .select()
      .single()
    
    if (dbError) {
      console.error('Database insert failed:', dbError)
      // If database insert fails, try to clean up the uploaded file
      if (pdfPath) {
        await supabase.storage.from(PDF_BUCKET).remove([pdfPath])
      }
      throw new Error(`Failed to save test: ${dbError.message}`)
    }
    
    // Test saved successfully debug removed
    
    // Return in the same format as the old TestBundle
    const result: TestBundle = {
      id,
      name: bundle.name,
      sections: bundle.sections,
      pdfData: bundle.pdfData, // Keep in memory for immediate use
      createdAt: now
    }
    
    return result
    
  } catch (error) {
    console.error('Save failed:', error)
    throw error
  }
}

export async function loadTestFromSupabase(id: string): Promise<TestBundle | null> {
  try {
    // 1. Get test metadata from database
    const { data: testRecord, error: dbError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (dbError || !testRecord) {
      console.error('Failed to load test metadata:', dbError)
      return null
    }
    
    // 2. Load PDF from storage if needed
    let pdfData: string | undefined
    if (testRecord.pdf_path) {
      const { data: pdfBlob, error: pdfError } = await supabase.storage
        .from(PDF_BUCKET)
        .download(testRecord.pdf_path)
      
      if (pdfError) {
        console.error('Failed to load PDF:', pdfError)
        // Continue without PDF data
      } else {
        pdfData = await blobToDataURL(pdfBlob)
        // PDF loaded successfully debug removed
      }
    }
    
    // Return in TestBundle format
    const result: TestBundle = {
      id: testRecord.id,
      name: testRecord.name,
      sections: testRecord.sections,
      pdfData,
      createdAt: testRecord.created_at
    }
    
    return result
    
  } catch (error) {
    console.error('Load failed:', error)
    return null
  }
}

export async function listTestsFromSupabase(): Promise<TestBundle[]> {
  try {
    const { data: testRecords, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to list tests:', error)
      return []
    }
    
    // Convert to TestBundle format (without PDF data for list view)
    const tests: TestBundle[] = testRecords.map(record => ({
      id: record.id,
      name: record.name,
      sections: record.sections,
      pdfData: undefined, // Don't load PDF data in list view
      createdAt: record.created_at
    }))
    
    return tests
    
  } catch (error) {
    console.error('List failed:', error)
    return []
  }
}

export async function deleteTestFromSupabase(id: string): Promise<void> {
  try {
    // 1. Get test record to find PDF path
    const { data: testRecord } = await supabase
      .from('tests')
      .select('pdf_path')
      .eq('id', id)
      .single()
    
    // 2. Delete PDF from storage if it exists
    if (testRecord?.pdf_path) {
      const { error: storageError } = await supabase.storage
        .from(PDF_BUCKET)
        .remove([testRecord.pdf_path])
      
      if (storageError) {
        console.error('Failed to delete PDF:', storageError)
      }
    }
    
    // 3. Delete test record from database
    const { error: dbError } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
    
    if (dbError) {
      console.error('Failed to delete test record:', dbError)
      throw new Error(`Failed to delete test: ${dbError.message}`)
    }
    
    // Test deleted successfully debug removed
    
  } catch (error) {
    console.error('Delete failed:', error)
    throw error
  }
}

// Helper functions
function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function dataURLtoBlob(dataURL: string): Blob {
  // Handle both data URL format and raw base64
  let base64Data: string
  let mimeType = 'application/pdf'
  
  if (dataURL.startsWith('data:')) {
    // Data URL format: data:application/pdf;base64,<base64-data>
    const arr = dataURL.split(',')
    mimeType = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf'
    base64Data = arr[1]
  } else {
    // Raw base64 format
    base64Data = dataURL
  }
  
  // Base64 conversion debug removed
  
  try {
    const bstr = atob(base64Data)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mimeType })
  } catch (error) {
    console.error('Base64 conversion failed:', error)
    console.error('Base64 data sample:', base64Data.substring(0, 200))
    throw error
  }
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Keep the same interface for localStorage functions
export function getActiveTestId(): string | null {
  return localStorage.getItem(ACTIVE_TEST_KEY)
}

export function setActiveTestId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_TEST_KEY, id)
  else localStorage.removeItem(ACTIVE_TEST_KEY)
}

export function clearTests(): void {
  localStorage.removeItem(ACTIVE_TEST_KEY)
}

export function getNextDefaultName(): string {
  // This will need to be updated to work with Supabase
  return `Practice Test #${Date.now()}`
}

export async function clearAllTestsFromSupabase(): Promise<void> {
  try {
    // Clearing all tests debug removed
    
    // 1. Get all test records to find their PDF paths and IDs
    const { data: testRecords, error: fetchError } = await supabase
      .from('tests')
      .select('id, pdf_path')
    
    if (fetchError) {
      console.error('Failed to fetch tests for deletion:', fetchError)
      throw new Error(`Failed to fetch tests: ${fetchError.message}`)
    }
    
    // 2. Delete all PDFs from storage
    const pdfPaths = testRecords?.map(record => record.pdf_path).filter(Boolean) || []
    if (pdfPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(PDF_BUCKET)
        .remove(pdfPaths)
      
      if (storageError) {
        console.error('Failed to delete PDFs:', storageError)
        // Continue with database deletion even if PDF deletion fails
      } else {
        // Deleted PDFs debug removed
      }
    }
    
    // 3. Delete all test records from database
    // Since Supabase requires a filter, we'll delete each record individually
    if (testRecords && testRecords.length > 0) {
      const testIds = testRecords.map(record => record.id || '').filter(Boolean)
      if (testIds.length > 0) {
        const { error: dbError } = await supabase
          .from('tests')
          .delete()
          .in('id', testIds)
        
        if (dbError) {
          console.error('Failed to delete test records:', dbError)
          throw new Error(`Failed to delete tests: ${dbError.message}`)
        }
      }
    }
    
    // Successfully cleared all tests debug removed
    
  } catch (error) {
    console.error('Clear all tests failed:', error)
    throw error
  }
}
