import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { MilkEntry, MilkEntryInput, DailyRecord, TenDayPeriod, RateSettings } from '../types/dairy';
import {
  fetchMilkEntries,
  saveMilkEntry,
  deleteMilkEntry,
  fetchRateSettings,
  saveRateSettings,
  isSupabaseConfigured,
  syncLocalToSupabase
} from '../lib/supabase';
import {
  groupEntriesByDate,
  calculateTenDayPeriods,
  calculateRollingTenDays,
  DEFAULT_RATE_SETTINGS
} from '../lib/calculations';
import { format } from 'date-fns';

interface DairyContextType {
  entries: MilkEntry[];
  dailyRecords: DailyRecord[];
  tenDayPeriods: TenDayPeriod[];
  rollingTenDays: TenDayPeriod | null;
  rateSettings: RateSettings;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  supabaseError: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addOrUpdateEntry: (input: MilkEntryInput) => Promise<boolean>;
  removeEntry: (id: string) => Promise<boolean>;
  updateSettings: (settings: RateSettings) => Promise<boolean>;
  refreshData: () => Promise<void>;
  syncDataToSupabase: () => Promise<{ success: boolean; count: number; message?: string }>;
  selectedDayRecord: DailyRecord | undefined;
}

const DairyContext = createContext<DairyContextType | undefined>(undefined);

export const DairyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [rateSettings, setRateSettings] = useState<RateSettings>(DEFAULT_RATE_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setSupabaseError(null);

    const configured = isSupabaseConfigured();
    setIsSupabaseConnected(configured);

    try {
      const [entriesRes, settingsRes] = await Promise.all([
        fetchMilkEntries(),
        fetchRateSettings()
      ]);

      setEntries(entriesRes.data);
      setRateSettings(settingsRes);

      if (entriesRes.error) {
        setSupabaseError(entriesRes.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSupabaseError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Group entries by date
  const dailyRecords = useMemo(() => {
    return groupEntriesByDate(entries);
  }, [entries]);

  // Calculate 10-day cycles
  const tenDayPeriods = useMemo(() => {
    return calculateTenDayPeriods(dailyRecords);
  }, [dailyRecords]);

  // Calculate rolling 10-day period
  const rollingTenDays = useMemo(() => {
    return calculateRollingTenDays(dailyRecords);
  }, [dailyRecords]);

  // Selected date record
  const selectedDayRecord = useMemo(() => {
    return dailyRecords.find(r => r.date === selectedDate);
  }, [dailyRecords, selectedDate]);

  const addOrUpdateEntry = async (input: MilkEntryInput): Promise<boolean> => {
    const result = await saveMilkEntry(input, rateSettings);
    if (result.success && result.entry) {
      setEntries(prev => {
        if (input.id) {
          return prev.map(e => (e.id === input.id ? result.entry! : e));
        }
        return [result.entry!, ...prev];
      });
      return true;
    }
    return false;
  };

  const removeEntry = async (id: string): Promise<boolean> => {
    const result = await deleteMilkEntry(id);
    if (result.success) {
      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    }
    return false;
  };

  const updateSettings = async (settings: RateSettings): Promise<boolean> => {
    const result = await saveRateSettings(settings);
    if (result.success) {
      setRateSettings(settings);
      // Recalculate entries if user wants or refresh
      return true;
    }
    return false;
  };

  const syncDataToSupabase = async () => {
    const result = await syncLocalToSupabase();
    if (result.error) {
      return { success: false, count: 0, message: result.error };
    }
    await refreshData();
    return { success: true, count: result.syncedCount };
  };

  return (
    <DairyContext.Provider
      value={{
        entries,
        dailyRecords,
        tenDayPeriods,
        rollingTenDays,
        rateSettings,
        isLoading,
        isSupabaseConnected,
        supabaseError,
        selectedDate,
        setSelectedDate,
        addOrUpdateEntry,
        removeEntry,
        updateSettings,
        refreshData,
        syncDataToSupabase,
        selectedDayRecord,
      }}
    >
      {children}
    </DairyContext.Provider>
  );
};

export function useDairy() {
  const context = useContext(DairyContext);
  if (!context) {
    throw new Error('useDairy must be used within a DairyProvider');
  }
  return context;
}
