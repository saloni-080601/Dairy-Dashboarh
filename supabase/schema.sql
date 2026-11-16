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

-- 5. Policies for full access (public / anon can read, insert, update, delete for personal dairy dashboard)
-- For single-user dairy or open collection desk:
DROP POLICY IF EXISTS "Allow anonymous all access on milk_entries" ON public.milk_entries;
CREATE POLICY "Allow anonymous all access on milk_entries"
    ON public.milk_entries
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all access on rate_settings" ON public.rate_settings;
CREATE POLICY "Allow anonymous all access on rate_settings"
    ON public.rate_settings
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

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
    'Gokul Dairy Collection Center'
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
