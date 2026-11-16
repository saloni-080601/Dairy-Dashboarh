import { MilkEntry, DailyRecord, RateSettings, TenDayPeriod, MilkType } from '../types/dairy';
import { format, getDaysInMonth } from 'date-fns';
import { lookupRateFromChart, calculateChartSNF } from './rateChartData';

export const DEFAULT_RATE_SETTINGS: RateSettings = {
  setting_name: 'Standard Gaay & Bhains Rate Chart',
  formula_mode: 'chart', // Default to User's provided Rate Chart!
  base_fat_rate: 6.50,   // ₹6.50 per Fat% unit
  base_snf_rate: 2.00,   // ₹2.00 per SNF% unit
  standard_fat: 4.0,     // 4.0% reference
  standard_clr: 28.0,    // 28 CLR reference
  standard_rate: 42.40,  // Base price at 4.0 Fat & 28 CLR
  min_rate: 15.00,       // Minimum floor price
  dairy_name: 'Gokul Dairy Collection Center',
  center_code: 'CTR-001',
  farmer_name: 'Kisan Milk Producer',
  phone: '+91 98765 43210'
};

/**
 * Calculates Solids-Not-Fat (SNF) from Fat and CLR (Corrected Lactometer Reading)
 * Formula from Dairy Rate Chart: SNF = (CLR / 4) + (0.2 * Fat) + 0.7
 */
export function calculateSNF(fat: number, clr: number): number {
  if (fat <= 0 || clr <= 0) return 0;
  return calculateChartSNF(fat, clr);
}

/**
 * Calculates Milk Rate per Litre based on Fat, CLR, and configurable pricing formula / chart
 */
export function calculateMilkRate(
  fat: number,
  clr: number,
  settings: RateSettings = DEFAULT_RATE_SETTINGS,
  milkType?: MilkType
): number {
  if (fat <= 0 || clr <= 0) return 0;

  // By default and as required, Rate is compared against the Rate Chart (e.g. 4.0 Fat & 26 CLR = 37.98)
  const chartResult = lookupRateFromChart(fat, clr, milkType);

  // If a specific alternate mathematical mode was intentionally requested, use it
  if (settings.formula_mode === 'fat_snf') {
    const snf = calculateSNF(fat, clr);
    const rate = (fat * settings.base_fat_rate) + (snf * settings.base_snf_rate);
    return Number(Math.max(settings.min_rate || 0, rate).toFixed(2));
  }

  if (settings.formula_mode === 'fat_only') {
    const rate = settings.standard_rate * (fat / (settings.standard_fat || 4.0));
    return Number(Math.max(settings.min_rate || 0, rate).toFixed(2));
  }

  if (settings.formula_mode === 'base_differential') {
    const fatDiff = (fat - (settings.standard_fat || 4.0)) * 3.5;
    const clrDiff = (clr - (settings.standard_clr || 28.0)) * 0.4;
    const rate = settings.standard_rate + fatDiff + clrDiff;
    return Number(Math.max(settings.min_rate || 0, rate).toFixed(2));
  }

  let rate = chartResult.rate;
  if (settings.min_rate && rate < settings.min_rate) {
    rate = settings.min_rate;
  }

  return Number(rate.toFixed(2));
}

/**
 * Calculates total Amount for a given Quantity and Rate
 */
export function calculateAmount(quantity: number, ratePerLiter: number): number {
  if (quantity <= 0 || ratePerLiter <= 0) return 0;
  return Number((quantity * ratePerLiter).toFixed(2));
}

/**
 * Group raw MilkEntry items into date-wise DailyRecord objects
 * Supports multiple dispatches/entries per day (e.g. morning 2-3 batches, evening batches)
 */
export function groupEntriesByDate(entries: MilkEntry[]): DailyRecord[] {
  const map = new Map<string, MilkEntry[]>();

  for (const entry of entries) {
    const date = entry.entry_date;
    if (!map.has(date)) {
      map.set(date, []);
    }
    const normalizedEntry: MilkEntry = {
      ...entry,
      fat: Number(entry.fat) || 0,
      clr: Number(entry.clr) || 0,
      snf: Number(entry.snf) || 0,
      quantity: Number(entry.quantity) || 0,
      rate_per_liter: Number(entry.rate_per_liter) || 0,
      amount: Number(entry.amount) || 0,
    };
    map.get(date)!.push(normalizedEntry);
  }

  const records: DailyRecord[] = [];

  for (const [date, dateEntries] of map.entries()) {
    const morningEntries = dateEntries.filter(e => e.session === 'morning');
    const eveningEntries = dateEntries.filter(e => e.session === 'evening');

    const mQty = morningEntries.reduce((sum, e) => sum + e.quantity, 0);
    const mAmount = morningEntries.reduce((sum, e) => sum + e.amount, 0);
    const mAvgRate = mQty > 0 ? Number((mAmount / mQty).toFixed(2)) : 0;
    const mAvgFat = mQty > 0 ? Number((morningEntries.reduce((sum, e) => sum + e.fat * e.quantity, 0) / mQty).toFixed(2)) : 0;
    const mAvgClr = mQty > 0 ? Number((morningEntries.reduce((sum, e) => sum + e.clr * e.quantity, 0) / mQty).toFixed(2)) : 0;
    const mAvgSnf = mQty > 0 ? Number((morningEntries.reduce((sum, e) => sum + e.snf * e.quantity, 0) / mQty).toFixed(2)) : 0;

    const eQty = eveningEntries.reduce((sum, e) => sum + e.quantity, 0);
    const eAmount = eveningEntries.reduce((sum, e) => sum + e.amount, 0);
    const eAvgRate = eQty > 0 ? Number((eAmount / eQty).toFixed(2)) : 0;
    const eAvgFat = eQty > 0 ? Number((eveningEntries.reduce((sum, e) => sum + e.fat * e.quantity, 0) / eQty).toFixed(2)) : 0;
    const eAvgClr = eQty > 0 ? Number((eveningEntries.reduce((sum, e) => sum + e.clr * e.quantity, 0) / eQty).toFixed(2)) : 0;
    const eAvgSnf = eQty > 0 ? Number((eveningEntries.reduce((sum, e) => sum + e.snf * e.quantity, 0) / eQty).toFixed(2)) : 0;

    const totalQuantity = Number((mQty + eQty).toFixed(2));
    const totalAmount = Number((mAmount + eAmount).toFixed(2));
    const avgRate = totalQuantity > 0 ? Number((totalAmount / totalQuantity).toFixed(2)) : 0;

    const avgFat = totalQuantity > 0 ? Number((dateEntries.reduce((sum, e) => sum + e.fat * e.quantity, 0) / totalQuantity).toFixed(2)) : 0;
    const avgClr = totalQuantity > 0 ? Number((dateEntries.reduce((sum, e) => sum + e.clr * e.quantity, 0) / totalQuantity).toFixed(2)) : 0;
    const avgSnf = totalQuantity > 0 ? Number((dateEntries.reduce((sum, e) => sum + e.snf * e.quantity, 0) / totalQuantity).toFixed(2)) : 0;

    // Backward-compatibility summary objects for components reading morning/evening single object
    const morning: MilkEntry | undefined = morningEntries.length > 0 ? {
      id: morningEntries[0].id,
      entry_date: date,
      session: 'morning',
      quantity: Number(mQty.toFixed(2)),
      amount: Number(mAmount.toFixed(2)),
      rate_per_liter: mAvgRate,
      fat: mAvgFat,
      clr: mAvgClr,
      snf: mAvgSnf,
      milk_type: morningEntries[0].milk_type,
      notes: morningEntries.map(e => e.notes).filter(Boolean).join(', ')
    } : undefined;

    const evening: MilkEntry | undefined = eveningEntries.length > 0 ? {
      id: eveningEntries[0].id,
      entry_date: date,
      session: 'evening',
      quantity: Number(eQty.toFixed(2)),
      amount: Number(eAmount.toFixed(2)),
      rate_per_liter: eAvgRate,
      fat: eAvgFat,
      clr: eAvgClr,
      snf: eAvgSnf,
      milk_type: eveningEntries[0].milk_type,
      notes: eveningEntries.map(e => e.notes).filter(Boolean).join(', ')
    } : undefined;

    records.push({
      date,
      entries: dateEntries,
      morningEntries,
      eveningEntries,
      morning,
      evening,
      morningQuantity: Number(mQty.toFixed(2)),
      morningAmount: Number(mAmount.toFixed(2)),
      morningAvgRate: mAvgRate,
      morningAvgFat: mAvgFat,
      morningAvgClr: mAvgClr,
      morningAvgSnf: mAvgSnf,
      eveningQuantity: Number(eQty.toFixed(2)),
      eveningAmount: Number(eAmount.toFixed(2)),
      eveningAvgRate: eAvgRate,
      eveningAvgFat: eAvgFat,
      eveningAvgClr: eAvgClr,
      eveningAvgSnf: eAvgSnf,
      totalQuantity,
      totalAmount,
      avgRate,
      avgFat,
      avgClr,
      avgSnf,
    });
  }

  // Sort descending by date (newest first)
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Calculates 10-Day Period totals (Indian Dairy standard billing periods: 1-10, 11-20, 21-end)
 * and rolling recent 10-day period.
 */
export function calculateTenDayPeriods(dailyRecords: DailyRecord[]): TenDayPeriod[] {
  if (dailyRecords.length === 0) return [];

  // Group daily records by Month (YYYY-MM)
  const monthMap = new Map<string, DailyRecord[]>();

  for (const record of dailyRecords) {
    const monthKey = record.date.substring(0, 7); // YYYY-MM
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(record);
  }

  const periods: TenDayPeriod[] = [];

  for (const [monthKey, records] of monthMap.entries()) {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const firstDay = new Date(year, monthIndex, 1);
    const totalDaysInMonth = getDaysInMonth(firstDay);

    // Cycle 1: 01 to 10
    const cycle1Start = `${monthKey}-01`;
    const cycle1End = `${monthKey}-10`;
    const cycle1Records = records.filter(r => r.date >= cycle1Start && r.date <= cycle1End);
    if (cycle1Records.length > 0) {
      periods.push(buildPeriodObject(
        `${monthKey}-c1`,
        `Cycle 1: 01 - 10 ${format(firstDay, 'MMM yyyy')}`,
        1,
        cycle1Start,
        cycle1End,
        cycle1Records
      ));
    }

    // Cycle 2: 11 to 20
    const cycle2Start = `${monthKey}-11`;
    const cycle2End = `${monthKey}-20`;
    const cycle2Records = records.filter(r => r.date >= cycle2Start && r.date <= cycle2End);
    if (cycle2Records.length > 0) {
      periods.push(buildPeriodObject(
        `${monthKey}-c2`,
        `Cycle 2: 11 - 20 ${format(firstDay, 'MMM yyyy')}`,
        2,
        cycle2Start,
        cycle2End,
        cycle2Records
      ));
    }

    // Cycle 3: 21 to End of Month
    const cycle3Start = `${monthKey}-21`;
    const cycle3End = `${monthKey}-${String(totalDaysInMonth).padStart(2, '0')}`;
    const cycle3Records = records.filter(r => r.date >= cycle3Start && r.date <= cycle3End);
    if (cycle3Records.length > 0) {
      periods.push(buildPeriodObject(
        `${monthKey}-c3`,
        `Cycle 3: 21 - ${totalDaysInMonth} ${format(firstDay, 'MMM yyyy')}`,
        3,
        cycle3Start,
        cycle3End,
        cycle3Records
      ));
    }
  }

  // Sort periods by start date descending
  return periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function buildPeriodObject(
  id: string,
  periodLabel: string,
  cycleNumber: 1 | 2 | 3,
  startDate: string,
  endDate: string,
  records: DailyRecord[]
): TenDayPeriod {
  let mQty = 0;
  let eQty = 0;
  let mAmount = 0;
  let eAmount = 0;
  let entriesCount = 0;
  let totalFatSum = 0;
  let totalClrSum = 0;
  let totalSnfSum = 0;

  for (const r of records) {
    if (r.morningEntries && r.morningEntries.length > 0) {
      entriesCount += r.morningEntries.length;
      mQty += r.morningQuantity;
      mAmount += r.morningAmount;
      for (const e of r.morningEntries) {
        totalFatSum += e.fat * e.quantity;
        totalClrSum += e.clr * e.quantity;
        totalSnfSum += e.snf * e.quantity;
      }
    } else if (r.morning) {
      entriesCount++;
      mQty += r.morning.quantity;
      mAmount += r.morning.amount;
      totalFatSum += r.morning.fat * r.morning.quantity;
      totalClrSum += r.morning.clr * r.morning.quantity;
      totalSnfSum += r.morning.snf * r.morning.quantity;
    }

    if (r.eveningEntries && r.eveningEntries.length > 0) {
      entriesCount += r.eveningEntries.length;
      eQty += r.eveningQuantity;
      eAmount += r.eveningAmount;
      for (const e of r.eveningEntries) {
        totalFatSum += e.fat * e.quantity;
        totalClrSum += e.clr * e.quantity;
        totalSnfSum += e.snf * e.quantity;
      }
    } else if (r.evening) {
      entriesCount++;
      eQty += r.evening.quantity;
      eAmount += r.evening.amount;
      totalFatSum += r.evening.fat * r.evening.quantity;
      totalClrSum += r.evening.clr * r.evening.quantity;
      totalSnfSum += r.evening.snf * r.evening.quantity;
    }
  }

  const totalQuantity = Number((mQty + eQty).toFixed(2));
  const totalAmount = Number((mAmount + eAmount).toFixed(2));
  const avgRate = totalQuantity > 0 ? Number((totalAmount / totalQuantity).toFixed(2)) : 0;
  const avgFat = totalQuantity > 0 ? Number((totalFatSum / totalQuantity).toFixed(2)) : 0;
  const avgClr = totalQuantity > 0 ? Number((totalClrSum / totalQuantity).toFixed(2)) : 0;
  const avgSnf = totalQuantity > 0 ? Number((totalSnfSum / totalQuantity).toFixed(2)) : 0;

  return {
    id,
    periodLabel,
    cycleNumber,
    startDate,
    endDate,
    entriesCount,
    daysWithEntries: records.length,
    morningQuantity: Number(mQty.toFixed(2)),
    eveningQuantity: Number(eQty.toFixed(2)),
    totalQuantity,
    morningAmount: Number(mAmount.toFixed(2)),
    eveningAmount: Number(eAmount.toFixed(2)),
    totalAmount,
    avgFat,
    avgClr,
    avgSnf,
    avgRate,
    records: [...records].sort((a, b) => a.date.localeCompare(b.date)) // chronological for period view
  };
}

/**
 * Calculates rolling last 10 days period
 */
export function calculateRollingTenDays(dailyRecords: DailyRecord[]): TenDayPeriod | null {
  return calculateCustomDaysPeriod(dailyRecords, 10, 'Recent 10 Days');
}

/**
 * Calculates custom N days period (e.g. 10 days, 15 days, 30 days, 50 days)
 */
export function calculateCustomDaysPeriod(
  dailyRecords: DailyRecord[],
  daysCount: number,
  customLabel?: string
): TenDayPeriod | null {
  if (dailyRecords.length === 0) return null;
  const sliced = dailyRecords.slice(0, daysCount);
  if (sliced.length === 0) return null;
  const startDate = sliced[sliced.length - 1].date;
  const endDate = sliced[0].date;

  return buildPeriodObject(
    `period-${daysCount}-days`,
    customLabel || `Recent ${daysCount} Days (${startDate} to ${endDate})`,
    1,
    startDate,
    endDate,
    sliced
  );
}

/**
 * Calculates period for arbitrary date range
 */
export function calculateDateRangePeriod(
  dailyRecords: DailyRecord[],
  startDate: string,
  endDate: string,
  label?: string
): TenDayPeriod | null {
  if (dailyRecords.length === 0) return null;
  const filtered = dailyRecords.filter(r => r.date >= startDate && r.date <= endDate);
  if (filtered.length === 0) return null;

  return buildPeriodObject(
    `range-${startDate}-${endDate}`,
    label || `Date Range (${startDate} to ${endDate})`,
    1,
    startDate,
    endDate,
    filtered
  );
}
