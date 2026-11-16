import React from 'react';
import { useDairy } from '../context/DairyContext';
import {
  Sun,
  Moon,
  Coins,
  Sparkles,
  Layers,
  Percent,
  Gauge,
  Droplets,
  Table
} from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Daily Summary & Combined Total
            </h3>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              {selectedDate}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
              {allEntries.length} {allEntries.length === 1 ? 'Dispatch Recorded' : 'Dispatches Recorded'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fat aur CLR ke hisaab se Rate Chart se nikala gaya exact Rate per Litre aur kul aamdani.
          </p>
        </div>

        {totalQty > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs self-start sm:self-auto">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Kul Day Total: {formatRupees(totalAmount)}</span>
          </div>
        )}
      </div>

      {/* Grid of Key Calculations: Morning vs Evening vs Daily Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Morning Breakdown Card */}
        <div className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-amber-50/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Morning Session</span>
            </div>
            {mQty > 0 ? (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                {mQty} L ({morningEntries.length} {morningEntries.length === 1 ? 'Batch' : 'Batches'})
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">No Entry</span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Avg Rate / Ltr:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {mAvgRate > 0 ? `₹${mAvgRate.toFixed(2)}` : '--'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Avg Fat / CLR:</span>
              <span className="font-semibold text-slate-800">
                {mAvgFat > 0 ? `${mAvgFat}% Fat | ${mAvgClr} CLR` : '--'}
              </span>
            </div>

            {morningEntries.length > 1 && (
              <div className="text-[10px] text-amber-900 bg-amber-100/60 p-1.5 rounded-lg space-y-1">
                <span className="font-bold block">Morning Batches Breakdown:</span>
                {morningEntries.map((b, i) => (
                  <div key={b.id || i} className="flex justify-between text-slate-700">
                    <span>{b.batch_label || `#${i + 1}`}: {b.quantity}L (F:{b.fat}% / C:{b.clr})</span>
                    <strong className="text-amber-800">₹{Number(b.rate_per_liter).toFixed(2)}/L</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-amber-200/70 flex justify-between items-center">
              <span className="font-semibold text-amber-900">Morning Total:</span>
              <span className="text-base font-black text-amber-900">
                {formatRupees(mAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Evening Breakdown Card */}
        <div className="space-y-3 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
              <Moon className="h-4 w-4 text-emerald-700" />
              <span>Evening Session</span>
            </div>
            {eQty > 0 ? (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-950">
                {eQty} L ({eveningEntries.length} {eveningEntries.length === 1 ? 'Batch' : 'Batches'})
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">No Entry</span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Avg Rate / Ltr:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {eAvgRate > 0 ? `₹${eAvgRate.toFixed(2)}` : '--'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Avg Fat / CLR:</span>
              <span className="font-semibold text-slate-800">
                {eAvgFat > 0 ? `${eAvgFat}% Fat | ${eAvgClr} CLR` : '--'}
              </span>
            </div>

            {eveningEntries.length > 1 && (
              <div className="space-y-1 rounded-lg bg-emerald-100/70 p-1.5 text-[10px] text-emerald-950">
                <span className="font-bold block">Evening Batches Breakdown:</span>
                {eveningEntries.map((b, i) => (
                  <div key={b.id || i} className="flex justify-between text-slate-700">
                    <span>{b.batch_label || `#${i + 1}`}: {b.quantity}L (F:{b.fat}% / C:{b.clr})</span>
                    <strong className="text-emerald-900">₹{Number(b.rate_per_liter).toFixed(2)}/L</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-emerald-200/70 pt-2">
              <span className="font-semibold text-emerald-950">Evening Total:</span>
              <span className="text-base font-black text-emerald-950">
                {formatRupees(eAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Combined Total Card */}
        <div className="flex flex-col justify-between space-y-3 rounded-xl border border-emerald-800 bg-emerald-900 p-4 text-white shadow-lg shadow-emerald-950/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-200" />
                Combined Day Total
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                AM + PM
              </span>
            </div>

            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {formatRupees(totalAmount)}
              </div>
              <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5" />
                <span>Kul Milk Collection: <strong className="text-white text-sm">{totalQty} Litres</strong></span>
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="opacity-80 block text-[10px]">Avg Rate Per Litre:</span>
              <span className="font-black text-white text-sm">
                ₹{avgRate.toFixed(2)}/L
              </span>
            </div>
            <div>
              <span className="opacity-80 block text-[10px]">Weighted Quality:</span>
              <span className="font-bold text-white text-xs">
                {avgFat}% F | {avgClr} CLR
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Itemized Dispatches Table for the Selected Day */}
      {allEntries.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Table className="h-3.5 w-3.5 text-sky-600" />
              <span>Aaj Ke Sabhi Milk Dispatches ({allEntries.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Sabhi rates Fat aur CLR ko Rate Chart se compare karke nikale gaye hain.
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-left min-w-[640px]">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Session / Batch</th>
                  <th className="px-3 py-2.5">Prakaar</th>
                  <th className="px-3 py-2.5 text-right">Quantity</th>
                  <th className="px-3 py-2.5 text-right">Fat %</th>
                  <th className="px-3 py-2.5 text-right">CLR</th>
                  <th className="px-3 py-2.5 text-right">SNF %</th>
                  <th className="px-3 py-2.5 text-right">Rate / Litre</th>
                  <th className="px-3 py-2.5 text-right">Batch Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allEntries.map((e, index) => (
                  <tr key={e.id || index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                      {e.session === 'morning' ? (
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Moon className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                      <span>{e.batch_label || `${e.session === 'morning' ? 'Morning' : 'Evening'} #${index + 1}`}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          e.milk_type === 'buffalo'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.milk_type === 'buffalo' ? '🐃 Bhains' : '🐄 Gaay'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-slate-900 font-mono">
                      {e.quantity} L
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 font-mono">
                      {e.fat}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 font-mono">
                      {e.clr}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                      {e.snf}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 font-mono">
                      ₹{Number(e.rate_per_liter).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-slate-900 font-mono">
                      {formatRupees(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td className="px-3 py-2.5" colSpan={2}>Kul Daily Total</td>
                  <td className="px-3 py-2.5 text-right font-mono">{totalQty} L</td>
                  <td className="px-3 py-2.5 text-right font-mono">{avgFat}%</td>
                  <td className="px-3 py-2.5 text-right font-mono">{avgClr}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{selectedDayRecord?.avgSnf || 0}%</td>
                  <td className="px-3 py-2.5 text-right text-emerald-800 font-mono">₹{avgRate.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-800 font-mono">{formatRupees(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Session Proportion Bar */}
      {totalQty > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Morning: {mQty} L ({morningPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-700"></span>
              Evening: {eQty} L ({eveningPercent}%)
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${morningPercent}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${eveningPercent}%` }}
              className="bg-emerald-700 h-full transition-all duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
