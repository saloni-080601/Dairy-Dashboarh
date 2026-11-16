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
