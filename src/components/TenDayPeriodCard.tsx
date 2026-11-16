import React, { useState } from 'react';
import { useDairy } from '../context/DairyContext';
import { TenDayPeriod } from '../types/dairy';
import {
  CalendarDays,
  Printer,
  ChevronDown,
  Droplets,
  Coins,
  Percent,
  Gauge,
  Layers
} from 'lucide-react';

interface TenDayPeriodCardProps {
  onOpenBillForPeriod: (period: TenDayPeriod) => void;
}

export const TenDayPeriodCard: React.FC<TenDayPeriodCardProps> = ({ onOpenBillForPeriod }) => {
  const { tenDayPeriods, rollingTenDays } = useDairy();

  // Combine rolling ten days and cycle periods
  const allAvailablePeriods: TenDayPeriod[] = [
    ...(rollingTenDays ? [rollingTenDays] : []),
    ...tenDayPeriods,
  ];

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    allAvailablePeriods[0]?.id || ''
  );

  const activePeriod = allAvailablePeriods.find(p => p.id === selectedPeriodId) || allAvailablePeriods[0];

  if (!activePeriod) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
        <Layers className="h-8 w-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold">No 10-day period records available yet.</p>
        <p className="text-xs text-slate-400 mt-1">Start entering daily milk collection to see 10-day totals.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Period Switcher */}
      <div className="px-5 py-4 bg-gradient-to-r from-sky-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
            <CalendarDays className="h-5 w-5 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight">10-Day Period Cumulative Total</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/30 uppercase">
                Billing Cycle
              </span>
            </div>
            <p className="text-xs text-sky-200/80">
              {activePeriod.periodLabel} ({activePeriod.startDate} to {activePeriod.endDate})
            </p>
          </div>
        </div>

        {/* Period Dropdown Selector & Print Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activePeriod.id}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="appearance-none bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3 py-1.5 pr-8 rounded-xl outline-none cursor-pointer transition-colors"
            >
              {allAvailablePeriods.map(p => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.periodLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2.5 pointer-events-none text-white/70" />
          </div>

          <button
            onClick={() => onOpenBillForPeriod(activePeriod)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-xs font-bold shadow-sm transition-colors"
            title="Print or view detailed bill slip for this period"
          >
            <Printer className="h-3.5 w-3.5 text-sky-700" />
            <span>Print Bill</span>
          </button>
        </div>
      </div>

      {/* 10-Day Aggregation Metrics Grid */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">

          {/* 10-Day Total Milk Litres */}
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-sky-600" />
              10-Day Total Milk
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-950">
                {activePeriod.totalQuantity.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-sky-700">Litres</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-sky-200/50">
              <span>M: {activePeriod.morningQuantity} L</span>
              <span>E: {activePeriod.eveningQuantity} L</span>
            </div>
          </div>

          {/* 10-Day Total Amount */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              10-Day Total Amount
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-950">
                ₹{activePeriod.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-emerald-200/50">
              <span>M: ₹{activePeriod.morningAmount.toLocaleString('en-IN')}</span>
              <span>E: ₹{activePeriod.eveningAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Average Fat & CLR */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 text-amber-600" />
              10-Day Avg Quality
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">
                {activePeriod.avgFat}% Fat
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-amber-200/50">
              <span>Avg CLR: {activePeriod.avgClr}</span>
              <span>Avg SNF: {activePeriod.avgSnf}%</span>
            </div>
          </div>

          {/* Weighted Average Rate / Litre */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-purple-600" />
              10-Day Avg Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-purple-950">
                ₹{activePeriod.avgRate.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-purple-700">/ Ltr</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-purple-200/50">
              <span>{activePeriod.daysWithEntries} active collection days</span>
            </div>
          </div>

        </div>

        {/* Mini Daily Itemized Table for this 10-day period */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Daily Breakdown in this 10-Day Period ({activePeriod.records.length} days)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Period Total: ₹{activePeriod.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-amber-800">Morning (Ltr/Rate)</th>
                  <th className="py-2 px-3 text-amber-800 text-right">M. Amount</th>
                  <th className="py-2 px-3 text-blue-800">Evening (Ltr/Rate)</th>
                  <th className="py-2 px-3 text-blue-800 text-right">E. Amount</th>
                  <th className="py-2 px-3 text-right">Day Litres</th>
                  <th className="py-2 px-3 text-right font-bold text-emerald-800">Day Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePeriod.records.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-800">{r.date}</td>

                    <td className="py-2 px-3 text-slate-700">
                      {r.morning ? (
                        <span>
                          {r.morning.quantity}L @ ₹{r.morning.rate_per_liter}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-amber-900">
                      {r.morning ? `₹${r.morning.amount.toLocaleString('en-IN')}` : '--'}
                    </td>

                    <td className="py-2 px-3 text-slate-700">
                      {r.evening ? (
                        <span>
                          {r.evening.quantity}L @ ₹{r.evening.rate_per_liter}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-blue-900">
                      {r.evening ? `₹${r.evening.amount.toLocaleString('en-IN')}` : '--'}
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {r.totalQuantity} L
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-emerald-700">
                      ₹{r.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
