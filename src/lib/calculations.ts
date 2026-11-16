import { MilkEntry, DailyRecord, RateSettings, TenDayPeriod, FormulaMode, MilkType } from '../types/dairy';
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

  let rate = 0;

  switch (settings.formula_mode as FormulaMode) {
    case 'chart': {
      // Look up directly from user's exact GAAY & BHAINS Rate Chart
      const chartResult = lookupRateFromChart(fat, clr, milkType);
      rate = chartResult.rate;
      break;
    }

    case 'fat_snf': {
      const snf = calculateSNF(fat, clr);
      rate = (fat * settings.base_fat_rate) + (snf * settings.base_snf_rate);
      break;
    }

    case 'fat_only': {
      rate = settings.standard_rate * (fat / (settings.standard_fat || 4.0));
      break;
    }

    case 'base_differential': {
      const fatDiff = (fat - (settings.standard_fat || 4.0)) * 3.5;
      const clrDiff = (clr - (settings.standard_clr || 28.0)) * 0.4;
      rate = settings.standard_rate + fatDiff + clrDiff;
      break;
    }

    default: {
      const chartResult = lookupRateFromChart(fat, clr, milkType);
      rate = chartResult.rate;
    }
  }

  // Apply floor minimum rate if configured
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
 */
export function groupEntriesByDate(entries: MilkEntry[]): DailyRecord[] {
  const map = new Map<string, { morning?: MilkEntry; evening?: MilkEntry }>();

  for (const entry of entries) {
    const date = entry.entry_date;
    if (!map.has(date)) {
      map.set(date, {});
    }
    const current = map.get(date)!;
    if (entry.session === 'morning') {
      current.morning = entry;
    } else {
      current.evening = entry;
    }
  }

  const records: DailyRecord[] = [];

  for (const [date, sessions] of map.entries()) {
    const morning = sessions.morning;
    const evening = sessions.evening;

    const mQty = morning ? morning.quantity : 0;
    const eQty = evening ? evening.quantity : 0;
    const totalQuantity = Number((mQty + eQty).toFixed(2));

    const mAmount = morning ? morning.amount : 0;
    const eAmount = evening ? evening.amount : 0;
    const totalAmount = Number((mAmount + eAmount).toFixed(2));

    const avgRate = totalQuantity > 0 ? Number((totalAmount / totalQuantity).toFixed(2)) : 0;

    // Weighted averages for Fat, CLR, SNF
    let weightedFat = 0;
    let weightedClr = 0;
    let weightedSnf = 0;

    if (totalQuantity > 0) {
      if (morning) {
        weightedFat += morning.fat * morning.quantity;
        weightedClr += morning.clr * morning.quantity;
        weightedSnf += morning.snf * morning.quantity;
      }
      if (evening) {
        weightedFat += evening.fat * evening.quantity;
        weightedClr += evening.clr * evening.quantity;
        weightedSnf += evening.snf * evening.quantity;
      }
      weightedFat = Number((weightedFat / totalQuantity).toFixed(2));
      weightedClr = Number((weightedClr / totalQuantity).toFixed(2));
      weightedSnf = Number((weightedSnf / totalQuantity).toFixed(2));
    }

    records.push({
      date,
      morning,
      evening,
      totalQuantity,
      totalAmount,
      avgRate,
      avgFat: weightedFat,
      avgClr: weightedClr,
      avgSnf: weightedSnf,
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

function buildPeriodObject(
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
    if (r.morning) {
      entriesCount++;
      mQty += r.morning.quantity;
      mAmount += r.morning.amount;
      totalFatSum += r.morning.fat * r.morning.quantity;
      totalClrSum += r.morning.clr * r.morning.quantity;
      totalSnfSum += r.morning.snf * r.morning.quantity;
    }
    if (r.evening) {
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
  if (dailyRecords.length === 0) return null;
  const lastTen = dailyRecords.slice(0, 10);
  const startDate = lastTen[lastTen.length - 1].date;
  const endDate = lastTen[0].date;

  return buildPeriodObject(
    'rolling-10-days',
    `Recent 10 Days (${startDate} to ${endDate})`,
    1,
    startDate,
    endDate,
    lastTen
  );
}
