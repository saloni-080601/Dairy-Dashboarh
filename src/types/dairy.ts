export type MilkSession = 'morning' | 'evening';

export type FormulaMode = 'chart' | 'fat_snf' | 'fat_only' | 'base_differential';

export type MilkType = 'cow' | 'buffalo' | 'auto';

export interface MilkEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  session: MilkSession;
  fat: number;
  clr: number;
  snf: number;
  quantity: number;
  rate_per_liter: number;
  amount: number;
  milk_type?: 'cow' | 'buffalo';
  notes?: string;
  batch_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MilkEntryInput {
  id?: string;
  entry_date: string;
  session: MilkSession;
  fat: number;
  clr: number;
  quantity: number;
  milk_type?: MilkType;
  notes?: string;
  rate_per_liter?: number;
  batch_label?: string;
}

export interface DailyRecord {
  date: string;
  entries: MilkEntry[];
  morningEntries: MilkEntry[];
  eveningEntries: MilkEntry[];
  morning?: MilkEntry;
  evening?: MilkEntry;
  morningQuantity: number;
  morningAmount: number;
  morningAvgRate: number;
  morningAvgFat: number;
  morningAvgClr: number;
  morningAvgSnf: number;
  eveningQuantity: number;
  eveningAmount: number;
  eveningAvgRate: number;
  eveningAvgFat: number;
  eveningAvgClr: number;
  eveningAvgSnf: number;
  totalQuantity: number;
  totalAmount: number;
  avgRate: number;
  avgFat: number;
  avgClr: number;
  avgSnf: number;
}

export interface TenDayPeriod {
  id: string;
  periodLabel: string; // e.g., "1st - 10th Nov 2026"
  cycleNumber: 1 | 2 | 3;
  startDate: string;
  endDate: string;
  entriesCount: number;
  daysWithEntries: number;
  morningQuantity: number;
  eveningQuantity: number;
  totalQuantity: number;
  morningAmount: number;
  eveningAmount: number;
  totalAmount: number;
  avgFat: number;
  avgClr: number;
  avgSnf: number;
  avgRate: number;
  records: DailyRecord[];
}

export interface RateSettings {
  id?: string;
  setting_name: string;
  formula_mode: FormulaMode;
  base_fat_rate: number;      // e.g. 7.50 ₹ per 1% Fat
  base_snf_rate: number;      // e.g. 4.20 ₹ per 1% SNF
  standard_fat: number;       // reference Fat (e.g. 4.0%)
  standard_clr: number;       // reference CLR (e.g. 28.0)
  standard_rate: number;      // base reference price (e.g. 42.00 ₹)
  min_rate: number;           // floor rate (e.g. 25.00 ₹)
  dairy_name: string;
  center_code: string;
  farmer_name: string;
  phone: string;
}

export type ExpenseCategoryType = 'cow' | 'dairy';

export type CowExpenseSubcategory =
  | 'feed_fodder'       // चारा / दाना / खली (Feed & Fodder)
  | 'medical_health'    // दवाई / डॉक्टर / टीका (Medical & Doctor)
  | 'breeding_ai'       // गर्भाधान / AI (Breeding & AI)
  | 'cow_purchase'      // पशु खरीद (Cow Purchase)
  | 'cow_other';        // अन्य पशु खर्च (Other Cow Expense)

export type DairyExpenseSubcategory =
  | 'labor_salary'      // मजदूरी / वेतन (Labor & Wages)
  | 'electricity_power' // बिजली / डीजल / बिल (Electricity & Power)
  | 'machinery_maint'   // मशीन / उपकरण / रिपेयर (Machinery & Maintenance)
  | 'transport_fuel'    // ट्रांसपोर्ट / किराया (Transport & Fuel)
  | 'shed_cleaning'     // शेड रखरखाव / सफाई (Shed & Cleaning)
  | 'dairy_other';      // अन्य डेयरी खर्च (Other Dairy Expense)

export type ExpenseSubcategory = CowExpenseSubcategory | DairyExpenseSubcategory;

export type PaymentMode = 'cash' | 'online_upi' | 'bank_transfer' | 'credit_udhar';

export interface DairyExpense {
  id: string;
  date: string; // YYYY-MM-DD
  category_type: ExpenseCategoryType;
  subcategory: ExpenseSubcategory;
  title: string;
  amount: number;
  target_cow?: string;
  payment_mode: PaymentMode;
  notes?: string;
  receipt_no?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DairyExpenseInput {
  id?: string;
  date: string;
  category_type: ExpenseCategoryType;
  subcategory: ExpenseSubcategory;
  title: string;
  amount: number;
  target_cow?: string;
  payment_mode?: PaymentMode;
  notes?: string;
  receipt_no?: string;
}

export type CalfGender = 'female' | 'male';
export type CalfStage = 'milk_fed' | 'weaned' | 'heifer' | 'bull_calf' | 'sold' | 'deceased';
export type CalfHealthStatus = 'healthy' | 'treatment' | 'vaccinated' | 'sick';
export type CalfFeedType = 'only_milk' | 'milk_and_starter' | 'concentrate_and_fodder' | 'grazing';

export interface CalfRecord {
  id: string;
  tag_number: string;
  name: string;
  mother_id: string;
  gender: CalfGender;
  breed: string;
  dob: string; // YYYY-MM-DD
  birth_weight?: number; // kg
  current_weight?: number; // kg
  sire_details?: string;
  stage: CalfStage;
  health_status: CalfHealthStatus;
  milk_intake_liters?: number;
  feed_type?: CalfFeedType;
  colostrum_fed?: boolean;
  deworming_date?: string;
  vaccines_given?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalfRecordInput {
  id?: string;
  tag_number: string;
  name?: string;
  mother_id: string;
  gender: CalfGender;
  breed: string;
  dob: string;
  birth_weight?: number;
  current_weight?: number;
  sire_details?: string;
  stage?: CalfStage;
  health_status?: CalfHealthStatus;
  milk_intake_liters?: number;
  feed_type?: CalfFeedType;
  colostrum_fed?: boolean;
  deworming_date?: string;
  vaccines_given?: string;
  notes?: string;
}

export type CowBreedingStatus =
  | 'resting'            // 0-50 days post-calving (Uterine Rest / रिकवरी पीरियड)
  | 'heat_ready'         // 50-90 days post-calving (मद / AI कराने का सही समय)
  | 'inseminated'        // AI Semen done, awaiting 21d heat check or 60d PD (AI हो गया)
  | 'confirmed_pregnant' // Confirmed Pregnant / ग्याभिन (Gestation 280 days)
  | 'dry_period'         // Dry off before delivery (दूध सुखाया हुआ)
  | 'problem';           // Repeat breeder / Reproductive issue (बार-बार फिरना)

export interface CowBreedingRecord {
  id: string;
  cow_id: string;
  last_calving_date: string; // YYYY-MM-DD
  status: CowBreedingStatus;
  last_heat_date?: string;
  ai_date?: string;
  ai_sire_code?: string;
  ai_technician?: string;
  pd_date?: string; // Pregnancy Diagnosis date
  is_pregnant?: boolean;
  expected_calving_date?: string; // ~280 days post AI
  expected_dry_date?: string; // ~60 days before calving
  next_heat_expected_date?: string; // Next expected estrus if not conceived
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CowBreedingInput {
  id?: string;
  cow_id: string;
  last_calving_date: string;
  status: CowBreedingStatus;
  last_heat_date?: string;
  ai_date?: string;
  ai_sire_code?: string;
  ai_technician?: string;
  pd_date?: string;
  is_pregnant?: boolean;
  expected_calving_date?: string;
  expected_dry_date?: string;
  next_heat_expected_date?: string;
  notes?: string;
}

export interface CowOffspringSummary {
  cow_id: string;
  cow_name: string;
  total_calves: number;
  female_calves: number;
  male_calves: number;
  active_calves: number;
  calves: CalfRecord[];
  last_calving_date?: string;
  breeding_record?: CowBreedingRecord;
}
