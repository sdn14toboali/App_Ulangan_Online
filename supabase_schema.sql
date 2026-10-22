-- ==============================================================================
-- ZettCBT Pro: SQL Database Schema untuk Supabase (PostgreSQL)
-- Kapasitas: 300 - 1.000+ Siswa Ujian Serentak (Anti-Deadlock & High Performance)
-- Cara pakai: Buka dashboard Supabase -> Menu SQL Editor -> Paste & Klik RUN.
-- ==============================================================================

-- 1. Tabel Sesi Ujian (Exam Sessions)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    token VARCHAR(10) NOT NULL UNIQUE,
    duration_minutes INT NOT NULL DEFAULT 90,
    is_active BOOLEAN NOT NULL DEFAULT true,
    show_score BOOLEAN NOT NULL DEFAULT false,
    randomize_questions BOOLEAN NOT NULL DEFAULT true,
    randomize_options BOOLEAN NOT NULL DEFAULT false,
    max_warnings INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Bank Soal (Questions)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    image_url TEXT,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    option_e TEXT,
    correct_key VARCHAR(2) NOT NULL,
    score_weight INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Peserta / Pengerjaan Siswa (Student Attempts)
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    participant_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, locked
    warning_count INT NOT NULL DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_session UNIQUE (session_id, participant_number)
);

-- 4. Tabel Jawaban Siswa per Soal (Student Answers - Auto Save Engine)
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES student_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(2), -- A, B, C, D, E atau NULL
    is_doubt BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- Indexing Cepat untuk Menangani 300 Request Serentak dalam Hitungan Milidetik
CREATE INDEX IF NOT EXISTS idx_attempts_session ON student_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);

-- Aktifkan Row Level Security (RLS) dengan Kebijakan Publik Akses Cepat untuk Ujian
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read active sessions" ON exam_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public all sessions for admin" ON exam_sessions FOR ALL USING (true);

CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow admin all questions" ON questions FOR ALL USING (true);

CREATE POLICY "Allow public manage attempts" ON student_attempts FOR ALL USING (true);
CREATE POLICY "Allow public manage answers" ON student_answers FOR ALL USING (true);
