import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tkpnogiaaqllzabkfdfl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcG5vZ2lhYXFsbHphYmtmZGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTc2NTUsImV4cCI6MjA3MDUzMzY1NX0.b-VmGhDlUCaB6y2baVMygQ3_ZWmFEXXaYU4-bZEXiHg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface TestRecord {
  id: string
  name: string
  created_at: string
  sections: Record<string, any[]>
  section_pages?: Record<string, number> // Store page numbers for each section
  page_questions?: Record<string, Record<number, string[]>> // Store which questions are on which pages
  pdf_path?: string
  user_id?: string
}

// Storage bucket name
export const PDF_BUCKET = 'pdfs'
