-- Create the tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sections JSONB NOT NULL,
  pdf_path TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now - you can restrict this later)
CREATE POLICY "Allow all operations" ON tests
  FOR ALL USING (true);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload/download
CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Allow authenticated users to download PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');

CREATE POLICY "Allow authenticated users to delete PDFs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs');
