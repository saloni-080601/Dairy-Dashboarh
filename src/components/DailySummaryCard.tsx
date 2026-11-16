import React from 'react';
import { useDairy } from '../context/DairyContext';
import { Sun, Moon } from 'lucide-react';

const formatRupees = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const DailySummaryCard: React.FC = () => {
  const { selectedDate, selectedDayRecord } = useDairy();

  const morningEntries = selectedDayRecord?.morningEntries || [];
  const eveningEntries = selectedDayRecord?.eveningEntries || [];
  const allEntries = selectedDayRecord?.entries || [];

  const mQty = selectedDayRecord?.morningQuantity || 0;
  const mAmount = selectedDayRecord?.morningAmount || 0;
  const mAvgRate = selectedDayRecord?.morningAvgRate || 0;
  const mAvgFat = selectedDayRecord?.morningAvgFat || 0;
  const mAvgClr = selectedDayRecord?.morningAvgClr || 0;

  const eQty = selectedDayRecord?.eveningQuantity || 0;
  const eAmount = selectedDayRecord?.eveningAmount || 0;
  const eAvgRate = selectedDayRecord?.eveningAvgRate || 0;
  const eAvgFat = selectedDayRecord?.eveningAvgFat || 0;
  const eAvgClr = selectedDayRecord?.eveningAvgClr || 0;

  const totalQty = selectedDayRecord?.totalQuantity || 0;
  const totalAmount = selectedDayRecord?.totalAmount || 0;
  const avgRate = selectedDayRecord?.avgRate || 0;
  const avgFat = selectedDayRecord?.avgFat || 0;
  const avgClr = selectedDayRecord?.avgClr || 0;

  const morningPercent = totalQty > 0 ? Math.round((mQty / totalQty) * 100) : 0;
  const eveningPercent = totalQty > 0 ? 100 - morningPercent : 0;

  const sessions = [
    {
      title: 'Morning',
      icon: Sun,
      qty: mQty,
      amount: mAmount,
      rate: mAvgRate,
      fat: mAvgFat,
      clr: mAvgClr,
      batches: morningEntries.length,
    },
    {
      title: 'Evening',
      icon: Moon,
      qty: eQty,
      amount: eAmount,
      rate: eAvgRate,
      fat: eAvgFat,
      clr: eAvgClr,
      batches: eveningEntries.length,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {sessions.map((session) => {
          const Icon = session.icon;
          return (
            <div key={session.title} className="panel p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  <Icon className="h-3.5 w-3.5" />
                  {session.title}
                </p>
                <span className="text-xs text-ink-400">{session.batches} batches</span>
              </div>
              <p className="mt-3 font-mono text-xl font-semibold text-ink-900">{formatRupees(session.amount)}</p>
              <p className="mt-1 text-sm text-ink-500">
                {session.qty} L · {session.rate > 0 ? `₹${session.rate.toFixed(2)}/L` : '—'} · Fat {session.fat || 0}% · CLR {session.clr || 0}
              </p>
            </div>
          );
        })}
        <div className="panel bg-forest-800 p-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-100">Day total · {selectedDate}</p>
          <p className="mt-3 font-mono text-xl font-semibold">{formatRupees(totalAmount)}</p>
          <p className="mt-1 text-sm text-forest-100">
            {totalQty} L · ₹{avgRate.toFixed(2)}/L · Fat {avgFat}% · CLR {avgClr}
          </p>
        </div>
      </div>

      {allEntries.length > 0 && (
        <div className="panel">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-ink-900">All dispatches</h3>
            <span className="text-xs text-ink-400">{allEntries.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Type</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Fat</th>
                  <th className="text-right">CLR</th>
                  <th className="text-right">SNF</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allEntries.map((e, index) => (
                  <tr key={e.id || index}>
                    <td className="font-semibold text-ink-900">
                      {e.session === 'morning' ? 'Morning' : 'Evening'} {e.batch_label ? `· ${e.batch_label}` : ''}
                    </td>
                    <td className="text-ink-500">{e.milk_type === 'buffalo' ? 'Buffalo' : 'Cow'}</td>
                    <td className="text-right font-mono">{e.quantity} L</td>
                    <td className="text-right font-mono">{e.fat}%</td>
                    <td className="text-right font-mono">{e.clr}</td>
                    <td className="text-right font-mono text-ink-500">{e.snf}%</td>
                    <td className="text-right font-mono">₹{Number(e.rate_per_liter).toFixed(2)}</td>
                    <td className="text-right font-mono font-semibold">{formatRupees(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900">
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className="text-right font-mono">{totalQty} L</td>
                  <td className="text-right font-mono">{avgFat}%</td>
                  <td className="text-right font-mono">{avgClr}</td>
                  <td className="text-right font-mono">{selectedDayRecord?.avgSnf || 0}%</td>
                  <td className="text-right font-mono">₹{avgRate.toFixed(2)}</td>
                  <td className="text-right font-mono">{formatRupees(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {totalQty > 0 && (
        <div className="panel p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-500">
            <span>Morning {mQty} L ({morningPercent}%)</span>
            <span>Evening {eQty} L ({eveningPercent}%)</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div style={{ width: `${morningPercent}%` }} className="bg-ink-400" />
            <div style={{ width: `${eveningPercent}%` }} className="bg-forest-700" />
          </div>
        </div>
      )}
    </div>
  );
};
