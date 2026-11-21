import React from 'react';
import { TenDayPeriod } from '../types/dairy';
import { CalendarDays, Printer } from 'lucide-react';

interface TenDayStatCardProps {
  periods: TenDayPeriod[];
  selectedCycle: 1 | 2 | 3;
  onSelectCycle: (cycle: 1 | 2 | 3) => void;
  daysInMonth: number;
  monthShort: string;
  activeCycle: 1 | 2 | 3;
}

export const TenDayStatCard: React.FC<TenDayStatCardProps> = ({
  periods,
  selectedCycle,
  onSelectCycle,
  daysInMonth,
  monthShort,
  activeCycle,
}) => {
  const currentPeriod = periods.find(p => p.cycleNumber === selectedCycle) || periods[0];
  const rangeLabel =
    selectedCycle === 1 ? '01 - 10' : selectedCycle === 2 ? '11 - 20' : `21 - ${daysInMonth}`;

  return (
    <div className="panel p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          10-Day Cycle
        </span>
        <div className="flex items-center gap-0.5 rounded-md bg-ink-100 p-0.5">
          {([1, 2, 3] as const).map(c => {
            const isSel = selectedCycle === c;
            const label = c === 1 ? '1-10' : c === 2 ? '11-20' : '21-End';
            return (
              <button
                key={c}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCycle(c);
                }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  isSel
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
                title={`Cycle ${c}: ${c === 1 ? '1-10' : c === 2 ? '11-20' : `21-${daysInMonth}`} ${monthShort}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tracking-tight text-ink-900">
          ₹{currentPeriod.totalAmount.toLocaleString('en-IN')}
        </span>
        <span className="text-xs font-medium text-ink-400">
          ({currentPeriod.totalQuantity.toLocaleString('en-IN')} L)
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-ink-500">
        <span className="truncate">
          Cycle {selectedCycle} · {rangeLabel} {monthShort}
          {selectedCycle === activeCycle ? ' (Active)' : ''}
        </span>
        {currentPeriod.avgRate > 0 && (
          <span className="font-mono text-[11px] font-medium text-ink-600">
            ₹{currentPeriod.avgRate.toFixed(2)}/L
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-ink-100 pt-1.5 text-[10px] text-ink-500 font-mono">
        {periods.map(p => {
          const isSel = p.cycleNumber === selectedCycle;
          const label = p.cycleNumber === 1 ? '1-10' : p.cycleNumber === 2 ? '11-20' : '21+';
          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCycle(p.cycleNumber);
              }}
              className={`hover:text-forest-800 transition ${
                isSel ? 'font-bold text-forest-800' : 'text-ink-500'
              }`}
            >
              {label}: ₹{p.totalAmount >= 1000 ? `${(p.totalAmount / 1000).toFixed(1)}k` : p.totalAmount.toLocaleString('en-IN')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface OverviewTenDayGroupsProps {
  periods: TenDayPeriod[];
  selectedCycle: 1 | 2 | 3;
  onSelectCycle: (cycle: 1 | 2 | 3) => void;
  daysInMonth: number;
  monthLabel: string;
  monthShort: string;
  activeCycle: 1 | 2 | 3;
  onOpenBillForPeriod?: (period: TenDayPeriod) => void;
}

export const OverviewTenDayGroups: React.FC<OverviewTenDayGroupsProps> = ({
  periods,
  selectedCycle,
  onSelectCycle,
  daysInMonth,
  monthLabel,
  monthShort,
  activeCycle,
  onOpenBillForPeriod,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 px-0.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-forest-800" />
          <h3 className="text-sm font-semibold tracking-tight text-ink-900">
            Billing cycles · {monthLabel}
          </h3>
        </div>
        <p className="text-xs text-ink-400">
          Select a cycle to highlight it. The printer opens that cycle’s bill.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {periods.map((period) => {
          const isCurrent = period.cycleNumber === activeCycle;
          const isSelected = period.cycleNumber === selectedCycle;
          const rangeLabel =
            period.cycleNumber === 1
              ? '01 - 10'
              : period.cycleNumber === 2
              ? '11 - 20'
              : `21 - ${daysInMonth}`;

          return (
            <div
              key={period.id}
              onClick={() => onSelectCycle(period.cycleNumber)}
              className={`panel cursor-pointer p-4 transition-all hover:border-forest-700/50 hover:shadow-sm ${
                isSelected
                  ? 'border-forest-700 ring-2 ring-forest-800/15 bg-forest-50/20'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900 text-sm">
                    Cycle {period.cycleNumber}
                  </span>
                  <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                    {rangeLabel} {monthShort}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isCurrent && (
                    <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-800">
                      Active
                    </span>
                  )}
                  {onOpenBillForPeriod && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBillForPeriod(period);
                      }}
                      disabled={period.daysWithEntries === 0}
                      className="rounded-md p-1 text-ink-400 hover:bg-forest-100 hover:text-forest-800 disabled:opacity-30 disabled:pointer-events-none"
                      title="Print or view bill slip"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="font-mono text-xl font-bold tracking-tight text-ink-900">
                    ₹{period.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-semibold text-ink-800">
                    {period.totalQuantity.toLocaleString('en-IN')} L
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-ink-100 pt-2 text-[11px] text-ink-500">
                <span>AM ₹{period.morningAmount.toLocaleString('en-IN')} ({period.morningQuantity} L)</span>
                <span>PM ₹{period.eveningAmount.toLocaleString('en-IN')} ({period.eveningQuantity} L)</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-400">
                <span>{period.daysWithEntries} collection days</span>
                <span>{period.avgRate > 0 ? `Avg ₹${period.avgRate.toFixed(2)}/L` : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
