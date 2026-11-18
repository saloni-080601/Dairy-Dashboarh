-- ==============================================================================
-- DAIRY MANAGEMENT DASHBOARD - SUPABASE DATABASE SCHEMA
-- PostgreSQL schema for Milk Collection, Rates, and 10-Day Billing Cycles
-- ==============================================================================

-- 1. Create milk_entries table
CREATE TABLE IF NOT EXISTS public.milk_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    session VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
    fat NUMERIC(4, 2) NOT NULL CHECK (fat >= 0 AND fat <= 20),
    clr NUMERIC(4, 2) NOT NULL CHECK (clr >= 0 AND clr <= 50),
    snf NUMERIC(4, 2) NOT NULL CHECK (snf >= 0 AND snf <= 20),
    quantity NUMERIC(8, 2) NOT NULL CHECK (quantity > 0),
    rate_per_liter NUMERIC(8, 2) NOT NULL CHECK (rate_per_liter >= 0),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    milk_type VARCHAR(20) DEFAULT 'cow',
    batch_label VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure multiple entries per day and session are allowed (drop old unique constraint if present)
ALTER TABLE IF EXISTS public.milk_entries DROP CONSTRAINT IF EXISTS unique_date_session;
ALTER TABLE IF EXISTS public.milk_entries ADD COLUMN IF NOT EXISTS milk_type VARCHAR(20) DEFAULT 'cow';
ALTER TABLE IF EXISTS public.milk_entries ADD COLUMN IF NOT EXISTS batch_label VARCHAR(100);

-- 2. Create rate_settings table (stores pricing configuration)
CREATE TABLE IF NOT EXISTS public.rate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(50) NOT NULL DEFAULT 'default',
    formula_mode VARCHAR(30) NOT NULL DEFAULT 'chart', -- 'chart', 'fat_snf', 'fat_only', 'base_differential'
    base_fat_rate NUMERIC(6, 2) NOT NULL DEFAULT 7.50,     -- Rate multiplier per 1% Fat
    base_snf_rate NUMERIC(6, 2) NOT NULL DEFAULT 4.20,     -- Rate multiplier per 1% SNF
    standard_fat NUMERIC(4, 2) NOT NULL DEFAULT 4.0,       -- Reference standard Fat %
    standard_clr NUMERIC(4, 2) NOT NULL DEFAULT 28.0,      -- Reference standard CLR
    standard_rate NUMERIC(6, 2) NOT NULL DEFAULT 42.00,    -- Base price for standard milk
    min_rate NUMERIC(6, 2) NOT NULL DEFAULT 25.00,         -- Floor price
    dairy_name VARCHAR(100) DEFAULT 'Green Pastures Dairy Farm',
    center_code VARCHAR(50) DEFAULT 'CTR-001',
    farmer_name VARCHAR(100) DEFAULT 'Kisan Milk Producer',
    phone VARCHAR(20) DEFAULT '+91 98765 43210',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create indices for high-performance date range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_milk_entries_date ON public.milk_entries (entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_milk_entries_session ON public.milk_entries (session);
CREATE INDEX IF NOT EXISTS idx_milk_entries_date_session ON public.milk_entries (entry_date, session);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.milk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all access on milk_entries" ON public.milk_entries;
DROP POLICY IF EXISTS "Authenticated staff can manage milk entries" ON public.milk_entries;
CREATE POLICY "Authenticated staff can manage milk entries"
    ON public.milk_entries
    FOR ALL
    TO authenticated
    USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'))
    WITH CHECK (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'));

DROP POLICY IF EXISTS "Allow anonymous all access on rate_settings" ON public.rate_settings;
DROP POLICY IF EXISTS "Authenticated staff can read rate settings" ON public.rate_settings;
DROP POLICY IF EXISTS "Admins can manage rate settings" ON public.rate_settings;
CREATE POLICY "Authenticated staff can read rate settings"
    ON public.rate_settings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage rate settings"
    ON public.rate_settings
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 6. Insert default rate configuration if not exists
INSERT INTO public.rate_settings (id, setting_name, formula_mode, base_fat_rate, base_snf_rate, standard_fat, standard_clr, standard_rate, min_rate, dairy_name)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'default',
    'fat_snf',
    7.50,
    4.20,
    4.0,
    28.0,
    42.00,
    25.00,
    'Piyush''s Farm'
)
ON CONFLICT (id) DO NOTHING;

-- 7. SQL View: Daily Aggregations (combining Morning & Evening)
CREATE OR REPLACE VIEW public.v_daily_milk_summary AS
SELECT
    entry_date,
    MAX(CASE WHEN session = 'morning' THEN quantity ELSE 0 END) AS morning_quantity,
    MAX(CASE WHEN session = 'morning' THEN fat ELSE NULL END) AS morning_fat,
    MAX(CASE WHEN session = 'morning' THEN clr ELSE NULL END) AS morning_clr,
    MAX(CASE WHEN session = 'morning' THEN snf ELSE NULL END) AS morning_snf,
    MAX(CASE WHEN session = 'morning' THEN rate_per_liter ELSE 0 END) AS morning_rate,
    MAX(CASE WHEN session = 'morning' THEN amount ELSE 0 END) AS morning_amount,

    MAX(CASE WHEN session = 'evening' THEN quantity ELSE 0 END) AS evening_quantity,
    MAX(CASE WHEN session = 'evening' THEN fat ELSE NULL END) AS evening_fat,
    MAX(CASE WHEN session = 'evening' THEN clr ELSE NULL END) AS evening_clr,
    MAX(CASE WHEN session = 'evening' THEN snf ELSE NULL END) AS evening_snf,
    MAX(CASE WHEN session = 'evening' THEN rate_per_liter ELSE 0 END) AS evening_rate,
    MAX(CASE WHEN session = 'evening' THEN amount ELSE 0 END) AS evening_amount,

    SUM(quantity) AS daily_total_quantity,
    SUM(amount) AS daily_total_amount,
    CASE WHEN SUM(quantity) > 0 THEN ROUND(SUM(amount) / SUM(quantity), 2) ELSE 0 END AS daily_avg_rate,
    CASE WHEN SUM(quantity) > 0 THEN ROUND(SUM(fat * quantity) / SUM(quantity), 2) ELSE 0 END AS daily_weighted_fat,
    CASE WHEN SUM(quantity) > 0 THEN ROUND(SUM(clr * quantity) / SUM(quantity), 2) ELSE 0 END AS daily_weighted_clr
FROM public.milk_entries
GROUP BY entry_date
ORDER BY entry_date DESC;

-- 8. Create cows table (Cow Profiles & Groups)
CREATE TABLE IF NOT EXISTS public.cows (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tag VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Create cow_milk_records table
CREATE TABLE IF NOT EXISTS public.cow_milk_records (
    id TEXT PRIMARY KEY,
    cow_id TEXT NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    session VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
    quantity NUMERIC(6, 2) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_cow_date_session UNIQUE (cow_id, date, session)
);

CREATE INDEX IF NOT EXISTS idx_cow_milk_records_date ON public.cow_milk_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_cow_milk_records_cow ON public.cow_milk_records (cow_id);

-- Enable RLS & policies
ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cow_milk_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all access on cows" ON public.cows;
DROP POLICY IF EXISTS "Admins can manage cows" ON public.cows;
DROP POLICY IF EXISTS "Authenticated staff can manage cows" ON public.cows;
CREATE POLICY "Authenticated staff can manage cows"
    ON public.cows
    FOR ALL
    TO authenticated
    USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'))
    WITH CHECK (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'));

DROP POLICY IF EXISTS "Allow anonymous all access on cow_milk_records" ON public.cow_milk_records;
DROP POLICY IF EXISTS "Admins can manage cow milk records" ON public.cow_milk_records;
DROP POLICY IF EXISTS "Authenticated staff can manage cow milk records" ON public.cow_milk_records;
CREATE POLICY "Authenticated staff can manage cow milk records"
    ON public.cow_milk_records
    FOR ALL
    TO authenticated
    USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'))
    WITH CHECK (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'entry') IN ('admin', 'entry'));

-- 10. Create expenses table (Cow Feeds, Healthcare & Dairy Operations)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('cow', 'dairy')),
    subcategory VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    target_cow VARCHAR(100),
    payment_mode VARCHAR(30) DEFAULT 'cash',
    receipt_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category_type ON public.expenses (category_type);
CREATE INDEX IF NOT EXISTS idx_expenses_subcategory ON public.expenses (subcategory);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all access on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can manage expenses"
    ON public.expenses
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 11. Create calves table (Calves & Youngstock Management)
CREATE TABLE IF NOT EXISTS public.calves (
    id TEXT PRIMARY KEY,
    tag_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    mother_id VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('female', 'male')),
    breed VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    birth_weight NUMERIC(5, 2),
    current_weight NUMERIC(5, 2),
    sire_details TEXT,
    stage VARCHAR(30) NOT NULL DEFAULT 'milk_fed' CHECK (stage IN ('milk_fed', 'weaned', 'heifer', 'bull_calf', 'sold', 'deceased')),
    health_status VARCHAR(30) NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'treatment', 'vaccinated', 'sick')),
    milk_intake_liters NUMERIC(4, 2) DEFAULT 0,
    feed_type VARCHAR(50) DEFAULT 'milk_and_starter',
    colostrum_fed BOOLEAN DEFAULT TRUE,
    deworming_date DATE,
    vaccines_given TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calves_mother_id ON public.calves (mother_id);
CREATE INDEX IF NOT EXISTS idx_calves_dob ON public.calves (dob DESC);
CREATE INDEX IF NOT EXISTS idx_calves_stage ON public.calves (stage);

ALTER TABLE public.calves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all access on calves" ON public.calves;
DROP POLICY IF EXISTS "Admins can manage calves" ON public.calves;
CREATE POLICY "Admins can manage calves"
    ON public.calves
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 12. Create cow_breeding table (Reproduction & Next Pregnancy Tracking)
CREATE TABLE IF NOT EXISTS public.cow_breeding (
    id TEXT PRIMARY KEY,
    cow_id VARCHAR(50) NOT NULL UNIQUE,
    last_calving_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'resting' CHECK (status IN ('resting', 'heat_ready', 'inseminated', 'confirmed_pregnant', 'dry_period', 'problem')),
    last_heat_date DATE,
    ai_date DATE,
    ai_sire_code VARCHAR(100),
    ai_technician VARCHAR(100),
    pd_date DATE,
    is_pregnant BOOLEAN DEFAULT FALSE,
    expected_calving_date DATE,
    expected_dry_date DATE,
    next_heat_expected_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cow_breeding_cow_id ON public.cow_breeding (cow_id);
CREATE INDEX IF NOT EXISTS idx_cow_breeding_status ON public.cow_breeding (status);
CREATE INDEX IF NOT EXISTS idx_cow_breeding_next_calving ON public.cow_breeding (expected_calving_date);

ALTER TABLE public.cow_breeding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all access on cow_breeding" ON public.cow_breeding;
DROP POLICY IF EXISTS "Admins can manage breeding records" ON public.cow_breeding;
CREATE POLICY "Admins can manage breeding records"
    ON public.cow_breeding
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Assign trusted roles through Supabase Auth app_metadata (never user_metadata):
-- {"role":"admin"} for administrators and {"role":"entry"} for collection staff.
-- Entry staff can use daily collection and cow group records; other data remains admin-only.
