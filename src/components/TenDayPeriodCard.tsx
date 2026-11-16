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
      <div className="panel p-8 text-center text-ink-500">
        <Layers className="mx-auto mb-2 h-8 w-8 text-ink-300" />
        <p className="text-sm font-semibold">No 10-day records yet.</p>
        <p className="mt-1 text-xs text-ink-400">Save daily collection to build a billing cycle.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="flex flex-col justify-between gap-3 border-b border-ink-100 bg-forest-800 px-5 py-4 text-white sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/10 p-2">
            <CalendarDays className="h-5 w-5 text-forest-100" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">10-day billing cycle</h3>
            <p className="text-xs text-forest-100">
              {activePeriod.periodLabel} ({activePeriod.startDate} to {activePeriod.endDate})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activePeriod.id}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="appearance-none cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 pr-8 text-xs font-semibold text-white outline-none hover:bg-white/20"
            >
              {allAvailablePeriods.map(p => (
                <option key={p.id} value={p.id} className="text-ink-900">
                  {p.periodLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-white/70" />
          </div>

          <button
            onClick={() => onOpenBillForPeriod(activePeriod)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-forest-900 hover:bg-forest-50"
            title="Print or view detailed bill slip for this period"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print bill</span>
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              <Droplets className="h-3.5 w-3.5" />
              Total milk
            </span>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink-900">
              {activePeriod.totalQuantity.toLocaleString('en-IN')} <span className="text-xs font-medium text-ink-400">L</span>
            </p>
            <p className="mt-1 flex justify-between border-t border-ink-100 pt-1 text-[11px] text-ink-500">
              <span>AM {activePeriod.morningQuantity} L</span>
              <span>PM {activePeriod.eveningQuantity} L</span>
            </p>
          </div>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              <Coins className="h-3.5 w-3.5" />
              Amount
            </span>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink-900">
              ₹{activePeriod.totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 flex justify-between border-t border-ink-100 pt-1 text-[11px] text-ink-500">
              <span>AM ₹{activePeriod.morningAmount.toLocaleString('en-IN')}</span>
              <span>PM ₹{activePeriod.eveningAmount.toLocaleString('en-IN')}</span>
            </p>
          </div>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              <Percent className="h-3.5 w-3.5" />
              Quality
            </span>
            <p className="mt-2 font-mono text-xl font-semibold text-ink-900">{activePeriod.avgFat}% fat</p>
            <p className="mt-1 flex justify-between border-t border-ink-100 pt-1 text-[11px] text-ink-500">
              <span>CLR {activePeriod.avgClr}</span>
              <span>SNF {activePeriod.avgSnf}%</span>
            </p>
          </div>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              <Gauge className="h-3.5 w-3.5" />
              Avg rate
            </span>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink-900">
              ₹{activePeriod.avgRate.toFixed(2)} <span className="text-xs font-medium text-ink-400">/ L</span>
            </p>
            <p className="mt-1 border-t border-ink-100 pt-1 text-[11px] text-ink-500">
              {activePeriod.daysWithEntries} collection days
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-100">
          <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-2.5">
            <span className="text-xs font-semibold text-ink-700">
              Daily breakdown ({activePeriod.records.length} days)
            </span>
            <span className="text-xs text-ink-400">
              ₹{activePeriod.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="max-h-64 overflow-x-auto">
            <table className="data-table text-xs">
              <thead className="sticky top-0">
                <tr>
                  <th>Date</th>
                  <th>Morning</th>
                  <th className="text-right">AM amount</th>
                  <th>Evening</th>
                  <th className="text-right">PM amount</th>
                  <th className="text-right">Litres</th>
                  <th className="text-right">Day total</th>
                </tr>
              </thead>
              <tbody>
                {activePeriod.records.map((r) => (
                  <tr key={r.date} className="hover:bg-ink-50">
                    <td className="font-semibold text-ink-800">{r.date}</td>
                    <td>{r.morning ? `${r.morning.quantity}L @ ₹${r.morning.rate_per_liter}` : '—'}</td>
                    <td className="text-right font-mono">{r.morning ? `₹${r.morning.amount.toLocaleString('en-IN')}` : '—'}</td>
                    <td>{r.evening ? `${r.evening.quantity}L @ ₹${r.evening.rate_per_liter}` : '—'}</td>
                    <td className="text-right font-mono">{r.evening ? `₹${r.evening.amount.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="text-right font-mono font-semibold">{r.totalQuantity} L</td>
                    <td className="text-right font-mono font-semibold text-forest-800">₹{r.totalAmount.toLocaleString('en-IN')}</td>
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
