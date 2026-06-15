-- Run this in your Supabase SQL Editor to setup the database

-- Main Table: study_materials
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL, -- 'pdf', 'youtube', 'zoom'
    pdf_url TEXT,
    youtube_url TEXT,
    meeting_id TEXT,
    meeting_passcode TEXT,
    thumbnail_url TEXT,
    file_size_bytes INTEGER,
    file_size_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Future Scaling Tables
CREATE TABLE IF NOT EXISTS tuitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_id UUID REFERENCES tuitions(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_id UUID REFERENCES tuitions(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    batch TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_id UUID REFERENCES tuitions(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_id UUID REFERENCES tuitions(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tuition_id UUID REFERENCES tuitions(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies For study_materials
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Public can SELECT
CREATE POLICY "Public can select study materials" ON study_materials FOR SELECT USING (true);

-- Admin can INSERT/UPDATE/DELETE (Allowing all for this prototype, usually restrict to authenticated admins)
CREATE POLICY "Admin can insert study materials" ON study_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update study materials" ON study_materials FOR UPDATE USING (true);
CREATE POLICY "Admin can delete study materials" ON study_materials FOR DELETE USING (true);

-- Enable realtime for study_materials
ALTER PUBLICATION supabase_realtime ADD TABLE study_materials;

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'pdfs');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs');
