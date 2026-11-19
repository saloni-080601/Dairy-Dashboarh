import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DairyExpense,
  DairyExpenseInput,
  MilkEntry,
  MilkEntryInput,
  RateSettings,
  CalfRecord,
  CalfRecordInput,
  CowBreedingRecord,
  CowBreedingInput,
} from '../types/dairy';
import { calculateSNF, calculateMilkRate, calculateAmount, DEFAULT_RATE_SETTINGS } from './calculations';
import { generateSampleMilkEntries } from './mockData';
import {
  DEFAULT_COW_RATE_CHART,
  DEFAULT_BUFFALO_RATE_CHART,
  getStoredCowChart,
  getStoredBuffaloChart
} from './rateChartData';

const STORAGE_KEY_ENTRIES = 'dairyflow_milk_entries';
const STORAGE_KEY_SETTINGS = 'dairyflow_rate_settings';
const STORAGE_KEY_CONFIG = 'dairyflow_supabase_config';
const STORAGE_KEY_EXPENSES = 'dairyflow_expenses';
const STORAGE_KEY_CALVES = 'dairyflow_calves';
const STORAGE_KEY_BREEDING = 'dairyflow_cow_breeding';

export type MilkRateCharts = {
  cow: Record<number, Record<string, number>>;
  buffalo: Record<number, Record<string, number>>;
};

export interface CowProfileRecord {
  id: string;
  name: string;
}

export interface CowMilkRecord {
  id: string;
  cow_id: string;
  date: string;
  session: 'morning' | 'evening';
  quantity: number;
}

export async function fetchExpenses(): Promise<{ data: DairyExpense[]; isLocal: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: getLocalExpenses(), isLocal: true };

  try {
    const { data, error } = await client.from('expenses').select('*').order('date', { ascending: false });
    if (error) return { data: getLocalExpenses(), isLocal: true, error: error.message };
    return {
      data: (data ?? []).map(row => ({
        ...row,
        id: String(row.id),
        amount: Number(row.amount),
      })) as DairyExpense[],
      isLocal: false,
    };
  } catch (err) {
    return {
      data: getLocalExpenses(),
      isLocal: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function saveExpense(
  input: DairyExpenseInput
): Promise<{ success: boolean; data?: DairyExpense; error?: string }> {
  const now = new Date().toISOString();
  const existing = input.id ? getLocalExpenses().find(expense => expense.id === input.id) : undefined;
  const expense: DairyExpense = {
    ...input,
    id: input.id || `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payment_mode: input.payment_mode || 'cash',
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const client = getSupabaseClient();
  if (!client) {
    saveLocalExpense(expense);
    return { success: true, data: expense };
  }

  try {
    const { data, error } = await client.from('expenses').upsert(expense).select('*').single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: { ...data, amount: Number(data.amount) } as DairyExpense };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    saveLocalExpenses(getLocalExpenses().filter(expense => expense.id !== id));
    return { success: true };
  }

  try {
    const { error } = await client.from('expenses').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function getLocalExpenses(): DairyExpense[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EXPENSES);
    return stored ? JSON.parse(stored) as DairyExpense[] : [];
  } catch {
    return [];
  }
}

function saveLocalExpenses(expenses: DairyExpense[]): void {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
}

function saveLocalExpense(expense: DairyExpense): void {
  const expenses = getLocalExpenses();
  const existingIndex = expenses.findIndex(item => item.id === expense.id);
  if (existingIndex >= 0) expenses[existingIndex] = expense;
  else expenses.unshift(expense);
  saveLocalExpenses(expenses);
}

// -----------------------------------------------------------------------------
// Calf Records Persistence (Supabase + LocalStorage Fallback)
// -----------------------------------------------------------------------------

export function getLocalCalves(): CalfRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CALVES);
    const calves = stored ? JSON.parse(stored) as CalfRecord[] : [];
    const demoIds = new Set(['calf-g1-01', 'calf-g2-01', 'calf-g4-01', 'calf-g6-01', 'calf-g1-old']);
    const userCalves = calves.filter(calf => !demoIds.has(calf.id));
    if (userCalves.length !== calves.length) saveLocalCalves(userCalves);
    return userCalves;
  } catch {
    return [];
  }
}

export function saveLocalCalves(calves: CalfRecord[]): void {
  localStorage.setItem(STORAGE_KEY_CALVES, JSON.stringify(calves));
}

export async function fetchCalves(): Promise<{ data: CalfRecord[]; isLocal: boolean; error?: string }> {
  return { data: getLocalCalves(), isLocal: true };
}

export async function saveCalf(
  input: CalfRecordInput
): Promise<{ success: boolean; data?: CalfRecord; error?: string }> {
  const now = new Date().toISOString();
  const localList = getLocalCalves();
  const existing = input.id ? localList.find(c => c.id === input.id) : undefined;

  const calf: CalfRecord = {
    id: input.id || `calf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tag_number: input.tag_number.trim(),
    name: input.name?.trim() || input.tag_number.trim(),
    mother_id: input.mother_id,
    gender: input.gender,
    breed: input.breed,
    dob: input.dob,
    birth_weight: input.birth_weight,
    current_weight: input.current_weight,
    sire_details: input.sire_details,
    stage: input.stage || 'milk_fed',
    health_status: input.health_status || 'healthy',
    milk_intake_liters: input.milk_intake_liters,
    feed_type: input.feed_type || 'milk_and_starter',
    colostrum_fed: input.colostrum_fed !== false,
    deworming_date: input.deworming_date,
    vaccines_given: input.vaccines_given,
    notes: input.notes,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  // Always update local storage
  const existingIdx = localList.findIndex(c => c.id === calf.id);
  if (existingIdx >= 0) localList[existingIdx] = calf;
  else localList.unshift(calf);
  saveLocalCalves(localList);

  return { success: true, data: calf };
}

export async function deleteCalf(id: string): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalCalves().filter(c => c.id !== id);
  saveLocalCalves(localList);

  return { success: true };
}

// -----------------------------------------------------------------------------
// Cow Breeding & Pregnancy Records Persistence
// -----------------------------------------------------------------------------

export function getLocalBreedingRecords(): CowBreedingRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BREEDING);
    const records = stored ? JSON.parse(stored) as CowBreedingRecord[] : [];
    const userRecords = records.filter(record => !['breed-g1', 'breed-g2', 'breed-g3', 'breed-g4', 'breed-g6'].includes(record.id));
    if (userRecords.length !== records.length) saveLocalBreedingRecords(userRecords);
    return userRecords;
  } catch {
    return [];
  }
}

export function saveLocalBreedingRecords(records: CowBreedingRecord[]): void {
  localStorage.setItem(STORAGE_KEY_BREEDING, JSON.stringify(records));
}

export async function fetchBreedingRecords(): Promise<{ data: CowBreedingRecord[]; isLocal: boolean; error?: string }> {
  return { data: getLocalBreedingRecords(), isLocal: true };
}

export async function saveBreedingRecord(
  input: CowBreedingInput
): Promise<{ success: boolean; data?: CowBreedingRecord; error?: string }> {
  const now = new Date().toISOString();
  const localList = getLocalBreedingRecords();
  const existing = input.id ? localList.find(b => b.id === input.id) : localList.find(b => b.cow_id === input.cow_id);

  const record: CowBreedingRecord = {
    id: input.id || existing?.id || `breed-${input.cow_id}-${Date.now()}`,
    cow_id: input.cow_id,
    last_calving_date: input.last_calving_date,
    status: input.status,
    last_heat_date: input.last_heat_date,
    ai_date: input.ai_date,
    ai_sire_code: input.ai_sire_code,
    ai_technician: input.ai_technician,
    pd_date: input.pd_date,
    is_pregnant: input.is_pregnant ?? (input.status === 'confirmed_pregnant'),
    expected_calving_date: input.expected_calving_date,
    expected_dry_date: input.expected_dry_date,
    next_heat_expected_date: input.next_heat_expected_date,
    notes: input.notes,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  const existingIdx = localList.findIndex(b => b.id === record.id || b.cow_id === record.cow_id);
  if (existingIdx >= 0) localList[existingIdx] = record;
  else localList.unshift(record);
  saveLocalBreedingRecords(localList);

  return { success: true, data: record };
}

export async function deleteBreedingRecord(id: string): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalBreedingRecords().filter(b => b.id !== id);
  saveLocalBreedingRecords(localList);

  return { success: true };
}

export async function fetchCowCollection(): Promise<{ cows: CowProfileRecord[]; records: CowMilkRecord[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { cows: [], records: [], error: 'Supabase connection is required for cow data.' };

  try {
    const [cowsResult, recordsResult] = await Promise.all([
      client.from('cows').select('id, name').order('name'),
      client.from('cow_milk_records').select('id, cow_id, date, session, quantity').order('date', { ascending: false }),
    ]);
    if (cowsResult.error) return { cows: [], records: [], error: cowsResult.error.message };
    if (recordsResult.error) return { cows: [], records: [], error: recordsResult.error.message };

    return {
      cows: (cowsResult.data ?? []).map(row => ({ id: String(row.id), name: String(row.name) })),
      records: (recordsResult.data ?? []).map(row => ({
        id: String(row.id),
        cow_id: String(row.cow_id),
        date: String(row.date),
        session: row.session as 'morning' | 'evening',
        quantity: Number(row.quantity),
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { cows: [], records: [], error: message };
  }
}

export async function createCowProfile(name: string): Promise<{ cow?: CowProfileRecord; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase connection is required to add a cow.' };
  try {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `cow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await client.from('cows')
      .insert({ id, name: name.trim() })
      .select('id, name')
      .single();
    if (error) return { error: error.message };
    return { cow: { id: String(data.id), name: String(data.name) } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function saveCowMilkRecord(record: Omit<CowMilkRecord, 'id'>): Promise<{ record?: CowMilkRecord; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase connection is required to save cow milk.' };
  try {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `milk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await client.from('cow_milk_records')
      .upsert({ id, ...record }, { onConflict: 'cow_id,date,session' })
      .select('id, cow_id, date, session, quantity')
      .single();
    if (error) return { error: error.message };
    return { record: {
      id: String(data.id), cow_id: String(data.cow_id), date: String(data.date),
      session: data.session as 'morning' | 'evening', quantity: Number(data.quantity),
    } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchRateCharts(): Promise<{ charts: MilkRateCharts; error?: string }> {
  const client = getSupabaseClient();
  const localCharts = { cow: getStoredCowChart(), buffalo: getStoredBuffaloChart() };
  if (!client) return { charts: localCharts };

  const { data, error } = await client.from('rate_charts').select('milk_type, clr, fat, rate');
  if (error) return { charts: localCharts, error: error.message };

  const charts: MilkRateCharts = {
    cow: Object.fromEntries(Object.entries(DEFAULT_COW_RATE_CHART).map(([clr, fats]) => [clr, { ...fats }])),
    buffalo: Object.fromEntries(Object.entries(DEFAULT_BUFFALO_RATE_CHART).map(([clr, fats]) => [clr, { ...fats }]))
  };
  if (!data?.length) return { charts: localCharts };
  for (const row of data || []) {
    const milkType = row.milk_type as 'cow' | 'buffalo';
    charts[milkType][Number(row.clr)] ||= {};
    charts[milkType][Number(row.clr)][Number(row.fat).toFixed(1)] = Number(row.rate);
  }
  return { charts };
}

export async function saveRateCharts(charts: MilkRateCharts): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase is not connected. Connect Supabase to save the shared rate chart.' };

  const rows = (['cow', 'buffalo'] as const).flatMap(milk_type =>
    Object.entries(charts[milk_type]).flatMap(([clr, fats]) =>
      Object.entries(fats).map(([fat, rate]) => ({ milk_type, clr: Number(clr), fat: Number(fat), rate }))
    )
  );
  const { error } = await client.from('rate_charts').upsert(rows, { onConflict: 'milk_type,clr,fat' });
  return error ? { success: false, error: error.message } : { success: true };
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Retrieve configured credentials from environment or localStorage
export function getStoredSupabaseConfig(): SupabaseConfig {
  const localConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey || config.url.includes('your-project-id')) {
    supabaseInstance = null;
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(
    config.url &&
    config.anonKey &&
    !config.url.includes('your-project-id') &&
    config.url.startsWith('https://')
  );
}

// Test Supabase connection
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, anonKey);
    const { error } = await testClient.from('milk_entries').select('id').limit(1);
    if (error) {
      // If table does not exist or permission denied
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Notice: Table "milk_entries" not yet created. Run schema.sql in Supabase SQL editor)',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Connection failed: ${errMsg}` };
  }
}

// -----------------------------------------------------------------------------
// CRUD Operations (Supabase with LocalStorage seamless fallback)
// -----------------------------------------------------------------------------

export async function fetchMilkEntries(): Promise<{ data: MilkEntry[]; isLocal: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('milk_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, falling back to local storage:', error.message);
        return { data: getLocalEntries(), isLocal: true, error: error.message };
      }

      return { data: (data as MilkEntry[]) || [], isLocal: false };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Supabase error, using local fallback:', errMsg);
      return { data: getLocalEntries(), isLocal: true, error: errMsg };
    }
  }

  return { data: getLocalEntries(), isLocal: true };
}

export async function saveMilkEntry(
  input: MilkEntryInput,
  rateSettings: RateSettings
): Promise<{ success: boolean; entry?: MilkEntry; error?: string; isLocal: boolean }> {
  const snf = calculateSNF(input.fat, input.clr);
  // Strictly prioritize exact Rate from rate chart (e.g. 4.0 Fat & 26 CLR = 37.98)
  const rate_per_liter = (input.rate_per_liter !== undefined && input.rate_per_liter > 0)
    ? input.rate_per_liter
    : calculateMilkRate(input.fat, input.clr, rateSettings, input.milk_type);
  const amount = calculateAmount(input.quantity, rate_per_liter);

  const entryPayload: Omit<MilkEntry, 'id'> & { id?: string } = {
    ...(input.id ? { id: input.id } : {}),
    entry_date: input.entry_date,
    session: input.session,
    fat: input.fat,
    clr: input.clr,
    snf,
    quantity: input.quantity,
    rate_per_liter,
    amount,
    milk_type: input.milk_type === 'auto' || !input.milk_type ? (input.fat >= 6.5 ? 'buffalo' : 'cow') : input.milk_type,
    notes: input.notes || '',
    batch_label: input.batch_label || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();

  if (client) {
    try {
      if (input.id) {
        // Update specific existing batch
        const { data, error } = await client
          .from('milk_entries')
          .update(entryPayload)
          .eq('id', input.id)
          .select()
          .single();

        if (!error && data) {
          return { success: true, entry: data as MilkEntry, isLocal: false };
        }
      } else {
        // Insert new batch dispatch
        const { id, ...insertPayload } = entryPayload;
        let { data, error } = await client
          .from('milk_entries')
          .insert([insertPayload])
          .select()
          .single();

        // If insert failed due to column missing or legacy unique constraint, try local or fallback
        if (!error && data) {
          return { success: true, entry: data as MilkEntry, isLocal: false };
        }

        if (error) {
          console.warn('Supabase insert failed, saving locally:', error.message);
          const local = saveLocalEntry(entryPayload);
          return { success: true, entry: local, isLocal: true, error: error.message };
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Supabase exception, saving locally:', errMsg);
      const local = saveLocalEntry(entryPayload);
      return { success: true, entry: local, isLocal: true, error: errMsg };
    }
  }

  const local = saveLocalEntry(entryPayload);
  return { success: true, entry: local, isLocal: true };
}

export async function deleteMilkEntry(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client.from('milk_entries').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete failed, deleting locally:', error.message);
        deleteLocalEntry(id);
        return { success: true, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      deleteLocalEntry(id);
      return { success: true, error: errMsg };
    }
  }

  deleteLocalEntry(id);
  return { success: true };
}

export async function fetchRateSettings(): Promise<RateSettings> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('rate_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          ...DEFAULT_RATE_SETTINGS,
          ...(data as RateSettings),
          formula_mode: (data as RateSettings).formula_mode || 'chart',
        };
      }
    } catch {
      // fallback to local
    }
  }

  return getLocalRateSettings();
}

export async function saveRateSettings(settings: RateSettings): Promise<{ success: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const payload = { ...settings, updated_at: new Date().toISOString() };
      const result = settings.id
        ? await client.from('rate_settings').update(payload).eq('id', settings.id)
        : await client.from('rate_settings').insert(payload);

      if (result.error) {
        console.warn('Could not persist settings to Supabase:', result.error.message);
        return { success: false };
      }
    } catch (err) {
      console.warn('Could not persist settings to Supabase:', err);
      return { success: false };
    }
  }

  saveLocalRateSettings(settings);
  return { success: true };
}

// -----------------------------------------------------------------------------
// Local Storage Helper Methods
// -----------------------------------------------------------------------------

function getLocalEntries(): MilkEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY_ENTRIES);
  if (!stored) {
    const initial = generateSampleMilkEntries();
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalEntry(entry: Omit<MilkEntry, 'id'> & { id?: string }): MilkEntry {
  const entries = getLocalEntries();
  if (entry.id) {
    const existingIdx = entries.findIndex(e => e.id === entry.id);
    if (existingIdx >= 0) {
      const updated: MilkEntry = {
        ...entries[existingIdx],
        ...entry,
        id: entry.id,
        updated_at: new Date().toISOString(),
      };
      entries[existingIdx] = updated;
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
      return updated;
    }
  }

  const newEntry: MilkEntry = {
    ...entry,
    id: entry.id || `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  entries.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  return newEntry;
}

function deleteLocalEntry(id: string): void {
  const entries = getLocalEntries();
  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(filtered));
}

function getLocalRateSettings(): RateSettings {
  const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_RATE_SETTINGS));
    return DEFAULT_RATE_SETTINGS;
  }
  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_RATE_SETTINGS, ...parsed, formula_mode: parsed.formula_mode || 'chart' };
  } catch {
    return DEFAULT_RATE_SETTINGS;
  }
}

function saveLocalRateSettings(settings: RateSettings): void {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// Bulk sync local records to Supabase when user connects
export async function syncLocalToSupabase(): Promise<{ syncedCount: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { syncedCount: 0, error: 'Supabase client is not connected' };
  }

  const localEntries = getLocalEntries();
  if (localEntries.length === 0) {
    return { syncedCount: 0 };
  }

  try {
    // Format records for insertion
    const payloads = localEntries.map(e => ({
      entry_date: e.entry_date,
      session: e.session,
      fat: e.fat,
      clr: e.clr,
      snf: e.snf,
      quantity: e.quantity,
      rate_per_liter: e.rate_per_liter,
      amount: e.amount,
      notes: e.notes || ''
    }));

    const { error } = await client
      .from('milk_entries')
      .upsert(payloads, { onConflict: 'entry_date,session' });

    if (error) {
      return { syncedCount: 0, error: error.message };
    }

    return { syncedCount: payloads.length };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { syncedCount: 0, error: errMsg };
  }
}
