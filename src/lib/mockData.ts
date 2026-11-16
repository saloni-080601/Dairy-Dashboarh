import { MilkEntry } from '../types/dairy';
import { calculateSNF, calculateMilkRate, calculateAmount, DEFAULT_RATE_SETTINGS } from './calculations';
import { subDays, format } from 'date-fns';

export function generateSampleMilkEntries(): MilkEntry[] {
  const entries: MilkEntry[] = [];
  const today = new Date();

  // Generate 12 days of realistic dairy collection data
  const sampleParams = [
    { mFat: 4.2, mClr: 28.5, mQty: 25.5, eFat: 4.4, eClr: 28.0, eQty: 23.0 },
    { mFat: 4.1, mClr: 28.0, mQty: 26.0, eFat: 4.3, eClr: 28.5, eQty: 24.5 },
    { mFat: 4.3, mClr: 29.0, mQty: 27.2, eFat: 4.5, eClr: 28.5, eQty: 25.0 },
    { mFat: 4.0, mClr: 27.5, mQty: 24.8, eFat: 4.2, eClr: 28.0, eQty: 22.8 },
    { mFat: 4.4, mClr: 28.5, mQty: 28.0, eFat: 4.6, eClr: 29.0, eQty: 26.0 },
    { mFat: 4.2, mClr: 28.0, mQty: 25.0, eFat: 4.3, eClr: 28.0, eQty: 24.0 },
    { mFat: 4.5, mClr: 29.5, mQty: 29.5, eFat: 4.7, eClr: 29.0, eQty: 27.0 },
    { mFat: 4.1, mClr: 28.0, mQty: 26.5, eFat: 4.4, eClr: 28.5, eQty: 24.5 },
    { mFat: 4.3, mClr: 28.5, mQty: 27.0, eFat: 4.5, eClr: 28.0, eQty: 25.5 },
    { mFat: 4.2, mClr: 28.0, mQty: 26.0, eFat: 4.4, eClr: 28.5, eQty: 24.0 },
    { mFat: 4.4, mClr: 29.0, mQty: 28.5, eFat: 4.6, eClr: 29.0, eQty: 26.5 },
    { mFat: 4.3, mClr: 28.5, mQty: 27.5, eFat: 4.5, eClr: 28.5, eQty: 25.0 },
  ];

  sampleParams.forEach((item, idx) => {
    const entryDate = format(subDays(today, idx), 'yyyy-MM-dd');

    // Morning Entry
    const mSnf = calculateSNF(item.mFat, item.mClr);
    const mRate = calculateMilkRate(item.mFat, item.mClr, DEFAULT_RATE_SETTINGS);
    const mAmount = calculateAmount(item.mQty, mRate);

    entries.push({
      id: `sample-m-${idx}`,
      entry_date: entryDate,
      session: 'morning',
      fat: item.mFat,
      clr: item.mClr,
      snf: mSnf,
      quantity: item.mQty,
      rate_per_liter: mRate,
      amount: mAmount,
      notes: 'Fresh cow milk collection',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Evening Entry (omit evening for today to let user enter it!)
    if (idx > 0) {
      const eSnf = calculateSNF(item.eFat, item.eClr);
      const eRate = calculateMilkRate(item.eFat, item.eClr, DEFAULT_RATE_SETTINGS);
      const eAmount = calculateAmount(item.eQty, eRate);

      entries.push({
        id: `sample-e-${idx}`,
        entry_date: entryDate,
        session: 'evening',
        fat: item.eFat,
        clr: item.eClr,
        snf: eSnf,
        quantity: item.eQty,
        rate_per_liter: eRate,
        amount: eAmount,
        notes: 'Evening batch milk',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  });

  return entries;
}
