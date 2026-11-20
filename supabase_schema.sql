-- ========================================================
-- GulaMate - Skema Database Supabase Lengkap
-- Monitoring Asupan Gula Harian untuk Mencegah Diabetes
-- ========================================================

-- 1. Tabel Profil Pengguna, Antropometri & Preferensi Kuesioner
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male')),
  height_cm NUMERIC DEFAULT 160,
  weight_kg NUMERIC DEFAULT 52,
  bmi NUMERIC DEFAULT 20.3,
  bmi_category TEXT DEFAULT 'normal',
  has_diabetes_history BOOLEAN DEFAULT FALSE,
  has_personal_prediabetes BOOLEAN DEFAULT FALSE,
  exercise_freq TEXT NOT NULL CHECK (exercise_freq IN ('rare', 'moderate', 'active')),
  is_dieting BOOLEAN DEFAULT FALSE,
  sugar_habit TEXT DEFAULT 'frequent',
  health_goals JSONB DEFAULT '[]'::jsonb,
  daily_sugar_limit NUMERIC NOT NULL DEFAULT 50,
  current_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Log Asupan Makanan / Minuman Harian
CREATE TABLE IF NOT EXISTS public.sugar_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format YYYY-MM-DD
  name TEXT NOT NULL,
  sugar_grams NUMERIC NOT NULL,
  portion NUMERIC DEFAULT 1,
  category TEXT NOT NULL CHECK (category IN ('minuman', 'makanan', 'camilan', 'buah', 'lainnya')),
  time TEXT NOT NULL, -- Format HH:mm
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempercepat query berdasarkan tanggal & user
CREATE INDEX IF NOT EXISTS idx_sugar_logs_date ON public.sugar_logs(date);
CREATE INDEX IF NOT EXISTS idx_sugar_logs_user_date ON public.sugar_logs(user_id, date);

-- 3. Row Level Security (RLS) - Public read/write untuk pengujian prototype
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sugar_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public all access on sugar_logs"
  ON public.sugar_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Tabel Log Air Putih / Hidrasi
CREATE TABLE IF NOT EXISTS public.water_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  date TEXT NOT NULL,
  glasses INTEGER DEFAULT 1,
  total_ml NUMERIC DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on water_logs"
  ON public.water_logs FOR ALL
  USING (true)
  WITH CHECK (true);
