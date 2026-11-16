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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="monthly-summary-heading">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><CalendarRange className="h-5 w-5" /></div>
        <div>
          <h2 id="monthly-summary-heading" className="text-sm font-bold text-slate-900">Monthly Collection Summary</h2>
          <p className="text-xs text-slate-500">Month-wise milk quantity, collection days and payable amount.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Days</th>
              <th className="px-4 py-3 text-right">Morning (L)</th>
              <th className="px-4 py-3 text-right">Evening (L)</th>
              <th className="px-4 py-3 text-right">Total Milk (L)</th>
              <th className="px-4 py-3 text-right">Avg Fat</th>
              <th className="px-4 py-3 text-right">Avg Rate</th>
              <th className="px-4 py-3 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {months.length ? months.map((month) => (
              <tr key={month.key} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{month.label}</td>
                <td className="px-4 py-3 text-right text-slate-600">{month.days}</td>
                <td className="px-4 py-3 text-right text-amber-800">{litres(month.morningLitres)}</td>
                <td className="px-4 py-3 text-right text-blue-800">{litres(month.eveningLitres)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{litres(month.totalLitres)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{month.totalLitres ? `${(month.weightedFat / month.totalLitres).toFixed(2)}%` : '—'}</td>
                <td className="px-4 py-3 text-right text-slate-600">{month.totalLitres ? money(month.amount / month.totalLitres) : '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{money(month.amount)}</td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No collection data available yet.</td></tr>
            )}
          </tbody>
          {months.length > 0 && <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-800">
            <tr>
              <td className="px-4 py-3">All Months</td>
              <td className="px-4 py-3 text-right">{totals.days}</td>
              <td className="px-4 py-3 text-right">{litres(totals.morningLitres)}</td>
              <td className="px-4 py-3 text-right">{litres(totals.eveningLitres)}</td>
              <td className="px-4 py-3 text-right">{litres(totals.totalLitres)}</td>
              <td className="px-4 py-3 text-right">{totals.totalLitres ? `${(totals.weightedFat / totals.totalLitres).toFixed(2)}%` : '—'}</td>
              <td className="px-4 py-3 text-right">{totals.totalLitres ? money(totals.amount / totals.totalLitres) : '—'}</td>
              <td className="px-4 py-3 text-right text-emerald-700">{money(totals.amount)}</td>
            </tr>
          </tfoot>}
        </table>
      </div>
    </section>
  );
};
