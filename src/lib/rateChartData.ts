/**
 * Dairy Rate Chart Data for GAAY (Cow) and BHAINS (Buffalo)
 * Fat rounded to 1 decimal (e.g. 3.2 to 5.5 for cow, 8.0 to 10.0 for buffalo)
 * CLR whole number (25 to 30)
 */

export interface RateChartLookupResult {
  rate: number;
  snf: number;
  milkType: 'cow' | 'buffalo';
  matchedInChart: boolean;
  notes?: string;
}

// -----------------------------------------------------------------------------
// GAAY (Cow) Rate Chart: CLR (25-30) x Fat (3.2-5.5)
// -----------------------------------------------------------------------------
export const DEFAULT_COW_RATE_CHART: Record<number, Record<string, number>> = {
  25: {
    '3.2': 17.48, '3.3': 17.67, '3.4': 17.87, '3.5': 18.06, '3.6': 18.26,
    '3.7': 18.45, '3.8': 18.65, '3.9': 18.84, '4.0': 19.04, '4.1': 19.23,
    '4.2': 19.42, '4.3': 38.74, '4.4': 39.19, '4.5': 39.65, '4.6': 41.11,
    '4.7': 41.58, '4.8': 42.04, '4.9': 42.51, '5.0': 42.98, '5.1': 43.45,
    '5.2': 43.92, '5.3': 44.38, '5.4': 44.85, '5.5': 45.32
  },
  26: {
    '3.2': 34.39, '3.3': 34.84, '3.4': 35.29, '3.5': 35.74, '3.6': 36.18,
    '3.7': 36.63, '3.8': 37.08, '3.9': 37.53, '4.0': 37.98, '4.1': 39.40,
    '4.2': 39.86, '4.3': 40.32, '4.4': 40.77, '4.5': 41.23, '4.6': 42.71,
    '4.7': 43.18, '4.8': 43.64, '4.9': 44.11, '5.0': 44.58, '5.1': 45.05,
    '5.2': 45.52, '5.3': 45.98, '5.4': 46.45, '5.5': 46.92
  },
  27: {
    '3.2': 35.95, '3.3': 36.40, '3.4': 36.85, '3.5': 37.30, '3.6': 37.74,
    '3.7': 38.19, '3.8': 38.64, '3.9': 39.09, '4.0': 39.54, '4.1': 40.98,
    '4.2': 41.44, '4.3': 41.87, '4.4': 42.26, '4.5': 42.66, '4.6': 44.10,
    '4.7': 44.51, '4.8': 44.91, '4.9': 45.32, '5.0': 45.73, '5.1': 46.14,
    '5.2': 46.55, '5.3': 48.06, '5.4': 48.48, '5.5': 48.89
  },
  28: {
    '3.2': 37.39, '3.3': 37.78, '3.4': 38.17, '3.5': 38.56, '3.6': 39.91,
    '3.7': 40.30, '3.8': 40.70, '3.9': 41.10, '4.0': 41.50, '4.1': 42.91,
    '4.2': 43.32, '4.3': 43.72, '4.4': 44.13, '4.5': 44.54, '4.6': 46.01,
    '4.7': 46.42, '4.8': 46.84, '4.9': 47.26, '5.0': 47.68, '5.1': 48.09,
    '5.2': 48.51, '5.3': 48.93, '5.4': 49.35, '5.5': 49.76
  },
  29: {
    '3.2': 38.20, '3.3': 38.59, '3.4': 38.98, '3.5': 39.37, '3.6': 40.74,
    '3.7': 41.13, '3.8': 41.53, '3.9': 41.93, '4.0': 42.33, '4.1': 43.76,
    '4.2': 44.17, '4.3': 44.57, '4.4': 44.98, '4.5': 45.39, '4.6': 46.88,
    '4.7': 47.29, '4.8': 47.71, '4.9': 48.13, '5.0': 48.55, '5.1': 48.96,
    '5.2': 49.38, '5.3': 49.76, '5.4': 50.11, '5.5': 50.46
  },
  30: {
    '3.2': 39.01, '3.3': 39.40, '3.4': 39.79, '3.5': 40.18, '3.6': 41.57,
    '3.7': 41.96, '3.8': 42.36, '3.9': 42.76, '4.0': 43.16, '4.1': 44.54,
    '4.2': 44.88, '4.3': 45.22, '4.4': 45.56, '4.5': 45.90, '4.6': 47.33,
    '4.7': 47.68, '4.8': 48.02, '4.9': 48.37, '5.0': 48.72, '5.1': 49.07,
    '5.2': 49.42, '5.3': 49.76, '5.4': 50.11, '5.5': 50.46
  }
};

// -----------------------------------------------------------------------------
// BHAINS (Buffalo) Rate Chart: CLR (25-30) x Fat (8.0-10.0)
// -----------------------------------------------------------------------------
export const DEFAULT_BUFFALO_RATE_CHART: Record<number, Record<string, number>> = {
  25: {
    '8.0': 69.60, '8.1': 70.47, '8.2': 71.34, '8.3': 72.21, '8.4': 73.08,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  },
  26: {
    '8.0': 71.20, '8.1': 72.09, '8.2': 72.98, '8.3': 73.87, '8.4': 74.76,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  },
  27: {
    '8.0': 71.20, '8.1': 72.09, '8.2': 72.98, '8.3': 73.87, '8.4': 74.76,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  },
  28: {
    '8.0': 71.20, '8.1': 72.09, '8.2': 72.98, '8.3': 73.87, '8.4': 74.76,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  },
  29: {
    '8.0': 71.20, '8.1': 72.09, '8.2': 72.98, '8.3': 73.87, '8.4': 74.76,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  },
  30: {
    '8.0': 71.20, '8.1': 72.09, '8.2': 72.98, '8.3': 73.87, '8.4': 74.76,
    '8.5': 75.65, '8.6': 76.54, '8.7': 77.43, '8.8': 78.32, '8.9': 79.21,
    '9.0': 80.10, '9.1': 80.99, '9.2': 81.88, '9.3': 82.77, '9.4': 83.66,
    '9.5': 84.55, '9.6': 85.44, '9.7': 86.33, '9.8': 87.22, '9.9': 88.11,
    '10.0': 89.00
  }
};

const STORAGE_KEY_CUSTOM_COW = 'dairyflow_chart_cow';
const STORAGE_KEY_CUSTOM_BUFFALO = 'dairyflow_chart_buffalo';

export function getStoredCowChart(): Record<number, Record<string, number>> {
  const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_COW);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_COW_RATE_CHART;
}

export function saveStoredCowChart(chart: Record<number, Record<string, number>>): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_COW, JSON.stringify(chart));
}

export function getStoredBuffaloChart(): Record<number, Record<string, number>> {
  const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_BUFFALO);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_BUFFALO_RATE_CHART;
}

export function saveStoredBuffaloChart(chart: Record<number, Record<string, number>>): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_BUFFALO, JSON.stringify(chart));
}

/**
 * Formula as noted in user rate chart notes:
 * SNF = (CLR / 4) + (0.2 * Fat) + 0.7
 */
export function calculateChartSNF(fat: number, clr: number): number {
  if (fat <= 0 || clr <= 0) return 0;
  const snf = (clr / 4) + (0.2 * fat) + 0.7;
  return Number(snf.toFixed(2));
}

/**
 * Look up exact Rate per Litre from the provided Chart
 * - Fat is rounded to 1 decimal place (e.g. 4.8)
 * - CLR is rounded to whole integer (e.g. 28)
 */
export function lookupRateFromChart(
  fat: number,
  clr: number,
  forcedMilkType?: 'cow' | 'buffalo' | 'auto'
): RateChartLookupResult {
  if (fat <= 0 || clr <= 0) {
    return { rate: 0, snf: 0, milkType: 'cow', matchedInChart: false };
  }

  const snf = calculateChartSNF(fat, clr);

  // Normalize inputs: Fat to 1 decimal, CLR to integer
  const fatKey = fat.toFixed(1);
  const roundedClr = Math.round(clr);
  // Clamped CLR between 25 and 30 for chart lookup
  const clampedClr = Math.min(Math.max(roundedClr, 25), 30);

  // Determine Milk Type:
  // If forced is specified use it; otherwise auto-detect based on Fat:
  // Buffalo milk typically has Fat >= 6.0, Cow milk has Fat < 6.0
  const milkType: 'cow' | 'buffalo' =
    forcedMilkType && forcedMilkType !== 'auto'
      ? forcedMilkType
      : fat >= 6.5 ? 'buffalo' : 'cow';

  if (milkType === 'cow') {
    const cowChart = getStoredCowChart();
    const clrRow = cowChart[clampedClr];
    if (clrRow && clrRow[fatKey] !== undefined) {
      return {
        rate: clrRow[fatKey],
        snf,
        milkType: 'cow',
        matchedInChart: true
      };
    }

    // If Fat is between 3.2 and 5.5 but out of exact key, clamp or interpolate
    const numFat = parseFloat(fatKey);
    if (numFat < 3.2) {
      const base = clrRow?.['3.2'] || 17.48;
      const rate = Math.max(15, base - (3.2 - numFat) * 1.5);
      return { rate: Number(rate.toFixed(2)), snf, milkType: 'cow', matchedInChart: false, notes: 'Extrapolated (< 3.2 Fat)' };
    } else if (numFat > 5.5 && numFat < 6.5) {
      const base = clrRow?.['5.5'] || 50.46;
      const rate = base + (numFat - 5.5) * 4.0;
      return { rate: Number(rate.toFixed(2)), snf, milkType: 'cow', matchedInChart: false, notes: 'Extrapolated (> 5.5 Fat)' };
    }
  } else {
    // Buffalo (Bhains)
    const buffaloChart = getStoredBuffaloChart();
    const clrRow = buffaloChart[clampedClr];
    if (clrRow && clrRow[fatKey] !== undefined) {
      return {
        rate: clrRow[fatKey],
        snf,
        milkType: 'buffalo',
        matchedInChart: true
      };
    }

    const numFat = parseFloat(fatKey);
    if (numFat < 8.0) {
      const base = clrRow?.['8.0'] || 71.20;
      const rate = Math.max(50, base - (8.0 - numFat) * 8.5);
      return { rate: Number(rate.toFixed(2)), snf, milkType: 'buffalo', matchedInChart: false, notes: 'Extrapolated (< 8.0 Fat)' };
    } else if (numFat > 10.0) {
      const base = clrRow?.['10.0'] || 89.00;
      const rate = base + (numFat - 10.0) * 8.9;
      return { rate: Number(rate.toFixed(2)), snf, milkType: 'buffalo', matchedInChart: false, notes: 'Extrapolated (> 10.0 Fat)' };
    }
  }

  // Fallback formula if completely outside
  const fallbackRate = (fat * 7.5) + (snf * 2.0);
  return {
    rate: Number(fallbackRate.toFixed(2)),
    snf,
    milkType,
    matchedInChart: false
  };
}
