import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MilkEntry, MilkEntryInput, RateSettings } from '../types/dairy';
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

export type MilkRateCharts = {
  cow: Record<number, Record<string, number>>;
  buffalo: Record<number, Record<string, number>>;
};

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
  const rate_per_liter = calculateMilkRate(input.fat, input.clr, rateSettings, input.milk_type);
  const amount = calculateAmount(input.quantity, rate_per_liter);

  const entryPayload: Omit<MilkEntry, 'id'> = {
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();

  if (client) {
    try {
      let { data, error } = await client
        .from('milk_entries')
        .upsert(
          [entryPayload],
          { onConflict: 'entry_date,session' }
        )
        .select()
        .single();

      // If Supabase table does not yet have the milk_type column, retry without milk_type
      if (error && (error.message?.includes('milk_type') || error.code === '42703' || error.code === 'PGRST204' || error.code === '400' || error.message?.includes('column'))) {
        const { milk_type, ...payloadWithoutMilkType } = entryPayload;
        const retry = await client
          .from('milk_entries')
          .upsert(
            [payloadWithoutMilkType],
            { onConflict: 'entry_date,session' }
          )
          .select()
          .single();

        if (!retry.error && retry.data) {
          return { success: true, entry: { ...retry.data, milk_type: entryPayload.milk_type } as MilkEntry, isLocal: false };
        }
      }

      if (error) {
        console.warn('Supabase insert failed, saving locally:', error.message);
        const local = saveLocalEntry(entryPayload);
        return { success: true, entry: local, isLocal: true, error: error.message };
      }

      return { success: true, entry: data as MilkEntry, isLocal: false };
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
        return data as RateSettings;
      }
    } catch {
      // fallback to local
    }
  }

  return getLocalRateSettings();
}

export async function saveRateSettings(settings: RateSettings): Promise<{ success: boolean }> {
  saveLocalRateSettings(settings);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('rate_settings')
        .upsert([{ ...settings, updated_at: new Date().toISOString() }], { onConflict: 'setting_name' });
    } catch (err) {
      console.warn('Could not persist settings to Supabase:', err);
    }
  }

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

function saveLocalEntry(entry: Omit<MilkEntry, 'id'>): MilkEntry {
  const entries = getLocalEntries();
  const existingIdx = entries.findIndex(
    e => e.entry_date === entry.entry_date && e.session === entry.session
  );

  const newEntry: MilkEntry = {
    ...entry,
    id: existingIdx >= 0 ? entries[existingIdx].id : `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    entries[existingIdx] = newEntry;
  } else {
    entries.unshift(newEntry);
  }

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
    return { ...DEFAULT_RATE_SETTINGS, ...JSON.parse(stored) };
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
