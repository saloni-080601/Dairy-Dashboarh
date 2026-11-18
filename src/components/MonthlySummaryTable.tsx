import React, { useMemo } from 'react';
import { useDairy } from '../context/DairyContext';
import { CalendarRange } from 'lucide-react';

interface MonthSummary {
  key: string;
  label: string;
  days: number;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
  amount: number;
  weightedFat: number;
}

const money = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const litres = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const MonthlySummaryTable: React.FC = () => {
  const { dailyRecords } = useDairy();

  const months = useMemo(() => {
    const grouped = new Map<string, MonthSummary>();
    dailyRecords.forEach((record) => {
      const key = record.date.slice(0, 7);
      let month = grouped.get(key);
      if (!month) {
        const [year, monthNumber] = key.split('-').map(Number);
        month = {
          key,
          label: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1)),
          days: 0,
          morningLitres: 0,
          eveningLitres: 0,
          totalLitres: 0,
          amount: 0,
          weightedFat: 0,
        };
        grouped.set(key, month);
      }
      month.days += 1;
      month.morningLitres += Number(record.morning?.quantity || 0);
      month.eveningLitres += Number(record.evening?.quantity || 0);
      month.totalLitres += Number(record.totalQuantity || 0);
      month.amount += Number(record.totalAmount || 0);
      month.weightedFat += Number(record.avgFat || 0) * Number(record.totalQuantity || 0);
    });
    return [...grouped.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [dailyRecords]);

  const totals = months.reduce((sum, month) => ({
    days: sum.days + month.days,
    morningLitres: sum.morningLitres + month.morningLitres,
    eveningLitres: sum.eveningLitres + month.eveningLitres,
    totalLitres: sum.totalLitres + month.totalLitres,
    amount: sum.amount + month.amount,
    weightedFat: sum.weightedFat + month.weightedFat,
  }), { days: 0, morningLitres: 0, eveningLitres: 0, totalLitres: 0, amount: 0, weightedFat: 0 });

  return (
    <section className="panel" aria-labelledby="monthly-summary-heading">
      <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-ink-50 p-2 text-forest-800"><CalendarRange className="h-5 w-5" /></div>
          <div>
            <h2 id="monthly-summary-heading" className="text-sm font-semibold text-ink-900">Monthly collection</h2>
            <p className="text-xs text-ink-400">Milk, collection days, and revenue by month.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg bg-forest-50 px-3 py-2 sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-700">Total Revenue</p>
            <p className="font-mono text-lg font-bold text-forest-900">{money(totals.amount)}</p>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2 sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Average Revenue / Day</p>
            <p className="font-mono text-lg font-bold text-ink-900">{money(totals.days ? totals.amount / totals.days : 0)}</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[980px] text-xs">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-right">Days</th>
              <th className="text-right">Morning (L)</th>
              <th className="text-right">Evening (L)</th>
              <th className="text-right">Total milk</th>
              <th className="text-right">Avg fat</th>
              <th className="text-right">Avg rate</th>
              <th className="text-right">Total Revenue</th>
              <th className="text-right">Avg Revenue / Day</th>
            </tr>
          </thead>
          <tbody>
            {months.length ? months.map((month) => (
              <tr key={month.key} className="hover:bg-ink-50">
                <td className="whitespace-nowrap font-semibold text-ink-800">{month.label}</td>
                <td className="text-right text-ink-600">{month.days}</td>
                <td className="text-right font-mono">{litres(month.morningLitres)}</td>
                <td className="text-right font-mono">{litres(month.eveningLitres)}</td>
                <td className="text-right font-mono font-semibold">{litres(month.totalLitres)}</td>
                <td className="text-right font-mono">{month.totalLitres ? `${(month.weightedFat / month.totalLitres).toFixed(2)}%` : '—'}</td>
                <td className="text-right font-mono">{month.totalLitres ? money(month.amount / month.totalLitres) : '—'}</td>
                <td className="text-right font-mono font-semibold text-forest-800">{money(month.amount)}</td>
                <td className="text-right font-mono">{money(month.days ? month.amount / month.days : 0)}</td>
              </tr>
            )) : (
              <tr><td colSpan={9} className="py-12 text-center text-ink-400">No collection data yet.</td></tr>
            )}
          </tbody>
          {months.length > 0 && <tfoot className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-800">
            <tr>
              <td>All months revenue</td>
              <td className="text-right">{totals.days}</td>
              <td className="text-right font-mono">{litres(totals.morningLitres)}</td>
              <td className="text-right font-mono">{litres(totals.eveningLitres)}</td>
              <td className="text-right font-mono">{litres(totals.totalLitres)}</td>
              <td className="text-right font-mono">{totals.totalLitres ? `${(totals.weightedFat / totals.totalLitres).toFixed(2)}%` : '—'}</td>
              <td className="text-right font-mono">{totals.totalLitres ? money(totals.amount / totals.totalLitres) : '—'}</td>
              <td className="text-right font-mono text-forest-800">{money(totals.amount)}</td>
              <td className="text-right font-mono">{money(totals.days ? totals.amount / totals.days : 0)}</td>
            </tr>
          </tfoot>}
        </table>
      </div>
    </section>
  );
};
