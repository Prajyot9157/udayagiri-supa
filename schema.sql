-- COMPLETE PROFESSIONAL EDTECH PLATFORM DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase SQL Editor to configure all tables, RLS policies, and Storage buckets.

-- 1. Users Profile Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    batch TEXT NOT NULL DEFAULT 'Class 12 Science',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'Physics', 'Chemistry', 'Mathematics', 'Biology'
    category TEXT NOT NULL, -- e.g., 'notes', 'tests', 'mindmaps'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Materials table (PDF notes / study materials)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('notes', 'formula', 'mindmaps', 'dpp', 'pyq', 'practice')),
    pdf_url TEXT NOT NULL,
    file_size_text TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Videos Table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    video_url TEXT NOT NULL, -- YouTube, Cloudinary, or uploaded MP4 url
    duration TEXT NOT NULL DEFAULT '45 mins',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tests Table
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    duration_mins INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 100,
    total_questions INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Individual Test Questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))
);

-- 7. Live Classes Table
CREATE TABLE IF NOT EXISTS live_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    class_date DATE NOT NULL,
    class_time TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    meeting_url TEXT NOT NULL, -- Zoom, Google Meet etc.
    meeting_id TEXT,
    meeting_passcode TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TEXT,
    type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('test', 'class', 'deadline', 'assignment')),
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'alert' CHECK (type IN ('material', 'test', 'class', 'alert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Saved Materials Table
CREATE TABLE IF NOT EXISTS saved_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    material_id UUID NOT NULL,
    material_type TEXT NOT NULL, -- 'material', 'video', 'test'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Practice Materials Table
CREATE TABLE IF NOT EXISTS practice_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    questions_count INTEGER NOT NULL DEFAULT 20,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Mind Maps Table
CREATE TABLE IF NOT EXISTS mind_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Formula Sheets Table
CREATE TABLE IF NOT EXISTS formula_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. PYQ Bank Table
CREATE TABLE IF NOT EXISTS pyq_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    year INTEGER NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Legacy Support Table
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
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

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS on All Tables; Giving all actions to general public / proto admins for easy deployment
-- =======================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Users Access" ON users;
CREATE POLICY "Public Users Access" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Users Insert" ON users;
CREATE POLICY "Public Users Insert" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Users Update" ON users;
CREATE POLICY "Public Users Update" ON users FOR UPDATE USING (true);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Subjects Access" ON subjects;
CREATE POLICY "Public Subjects Access" ON subjects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Subjects All" ON subjects;
CREATE POLICY "Admin Subjects All" ON subjects FOR ALL USING (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Materials Access" ON materials;
CREATE POLICY "Public Materials Access" ON materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Materials All" ON materials;
CREATE POLICY "Admin Materials All" ON materials FOR ALL USING (true);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Videos Access" ON videos;
CREATE POLICY "Public Videos Access" ON videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Videos All" ON videos;
CREATE POLICY "Admin Videos All" ON videos FOR ALL USING (true);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Tests Access" ON tests;
CREATE POLICY "Public Tests Access" ON tests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Tests All" ON tests;
CREATE POLICY "Admin Tests All" ON tests FOR ALL USING (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Questions Access" ON questions;
CREATE POLICY "Public Questions Access" ON questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Questions All" ON questions;
CREATE POLICY "Admin Questions All" ON questions FOR ALL USING (true);

ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Classes Access" ON live_classes;
CREATE POLICY "Public Classes Access" ON live_classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Classes All" ON live_classes;
CREATE POLICY "Admin Classes All" ON live_classes FOR ALL USING (true);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Events Access" ON timeline_events;
CREATE POLICY "Public Events Access" ON timeline_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Events All" ON timeline_events;
CREATE POLICY "Admin Events All" ON timeline_events FOR ALL USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Notifications Access" ON notifications;
CREATE POLICY "Public Notifications Access" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Notifications All" ON notifications;
CREATE POLICY "Admin Notifications All" ON notifications FOR ALL USING (true);

ALTER TABLE saved_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Saved Access" ON saved_materials;
CREATE POLICY "Public Saved Access" ON saved_materials FOR ALL USING (true);

ALTER TABLE practice_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Practice Access" ON practice_materials;
CREATE POLICY "Public Practice Access" ON practice_materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Practice All" ON practice_materials;
CREATE POLICY "Admin Practice All" ON practice_materials FOR ALL USING (true);

ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Mind Maps Access" ON mind_maps;
CREATE POLICY "Public Mind Maps Access" ON mind_maps FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Mind Maps All" ON mind_maps;
CREATE POLICY "Admin Mind Maps All" ON mind_maps FOR ALL USING (true);

ALTER TABLE formula_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Formula Access" ON formula_sheets;
CREATE POLICY "Public Formula Access" ON formula_sheets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Formula All" ON formula_sheets;
CREATE POLICY "Admin Formula All" ON formula_sheets FOR ALL USING (true);

ALTER TABLE pyq_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public PYQ Access" ON pyq_bank;
CREATE POLICY "Public PYQ Access" ON pyq_bank FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin PYQ All" ON pyq_bank;
CREATE POLICY "Admin PYQ All" ON pyq_bank FOR ALL USING (true);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Study Materials Select" ON study_materials;
CREATE POLICY "Public Study Materials Select" ON study_materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Study Materials All" ON study_materials;
CREATE POLICY "Admin Study Materials All" ON study_materials FOR ALL USING (true);


-- =======================================================
-- REALTIME ENABLEMENT
-- =======================================================

DO $$
BEGIN
  -- Enable realtime for specified tables if not already member
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'materials') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE materials;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_classes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_classes;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tests;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END If;
END $$;


-- =======================================================
-- STORAGE BUCKETS SETUP
-- Create buckets notes, videos, mindmaps, formula, pyq, practice, thumbnails
-- =======================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('mindmaps', 'mindmaps', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('formula', 'formula', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pyq', 'pyq', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('practice', 'practice', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
DROP POLICY IF EXISTS "Public Buckets Select" ON storage.objects;
CREATE POLICY "Public Buckets Select" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Buckets Insert" ON storage.objects;
CREATE POLICY "Public Buckets Insert" ON storage.objects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Buckets Update" ON storage.objects;
CREATE POLICY "Public Buckets Update" ON storage.objects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Buckets Delete" ON storage.objects;
CREATE POLICY "Public Buckets Delete" ON storage.objects FOR DELETE USING (true);
