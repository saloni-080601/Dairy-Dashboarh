# DairyFlow – Smart Dairy Management Dashboard

A modern, responsive, and full-featured **Dairy Management Dashboard** built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

---

## 🚀 Key Features

### 1. Daily Milk Collection Data Entry
- **Separate Morning & Evening Entries**: Track milk collection twice a day for any selected date.
- **Key Measured Parameters**:
  - **Fat (%)**: Range typically 3.0% – 10.0% (supports Cow, Buffalo, and Mixed milk)
  - **CLR (Corrected Lactometer Reading)**: Standard range 24 – 32
  - **Quantity (Litres)**: Direct session collection volume
- **Instant Live Calculations**: Automatically calculates SNF%, Rate per Litre, and Session Amount as you type.

### 2. Automatic Calculations & Formulas
- **SNF (Solids-Not-Fat)**: Standard ISI / Indian Dairy Formula:
  $$\text{SNF} = \left(\frac{\text{CLR}}{4}\right) + (0.21 \times \text{Fat}) + 0.36$$
- **Milk Rate / Litre**:
  $$\text{Rate} = (\text{Fat} \times \text{Base Fat Rate}) + (\text{SNF} \times \text{Base SNF Rate})$$
  *(Supports multiple formula modes: Fat + SNF, Fat-scaled, or Step Differential with minimum floor rate guarantee).*
- **Session Amounts**:
  - $\text{Morning Amount} = \text{Morning Quantity} \times \text{Morning Rate/Ltr}$
  - $\text{Evening Amount} = \text{Evening Quantity} \times \text{Evening Rate/Ltr}$
- **Daily Combined Total**:
  - $\text{Daily Litres} = \text{Morning Litres} + \text{Evening Litres}$
  - $\text{Daily Amount} = \text{Morning Amount} + \text{Evening Amount}$
  - Weighted Average Fat, CLR, and Average Rate per Litre.

### 3. 10-Day Period Cumulative Totals & Billing Cycles
- Follows the dairy industry 10-day payment cycle standard:
  - **Cycle 1**: 1st to 10th of each month
  - **Cycle 2**: 11th to 20th of each month
  - **Cycle 3**: 21st to end of month (28th/30th/31st)
  - **Rolling 10-Day**: Immediate rolling snapshot of the last 10 recorded dates.
- Generates official **10-Day Printable Milk Bills & Collection Statements** with dairy letterhead, itemized day breakdown, net payable amount, and signature blocks.

### 4. Interactive Analytics & Historical Records
- **Interactive Visual Charts**: Litres collected trend (Morning vs. Evening area chart) and Daily Revenue bar charts.
- **Date-Wise Records Table**: Filter by date or session (All, Both, Morning only, Evening only), sort order, and 1-click **Export to CSV**.

### 5. Backend & Supabase Database Architecture
- Built with Supabase PostgreSQL client (`@supabase/supabase-js`).
- **Offline / Local Fallback**: The app works out-of-the-box in local mode (with realistic sample data) and lets you connect Supabase credentials whenever you're ready.
- **One-Click Local Sync**: Upload all offline entries directly to Supabase with the "Upload Local Data" feature.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Date-fns
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and views

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Visit the displayed local URL (e.g., `http://localhost:5173`).

---

## 🗄️ Supabase Setup (PostgreSQL)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/schema.sql`, paste it into the SQL Editor, and click **Run**.
4. Open `supabase/seed_rate_charts.sql`, paste it into the SQL Editor, and click **Run**. This creates the `rate_charts` table and loads the 270 cow and buffalo rates. The app reads and saves chart edits in this table.
5. Copy your **Project URL** and **Anon Public API Key** from:
   `Project Settings -> API`
6. Enter them either into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   *or* directly in the dashboard UI by clicking the **"Supabase Connection"** pill in the top header!
# Dairy-Dashboarh
