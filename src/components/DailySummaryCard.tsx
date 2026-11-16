import React from 'react';
import { useDairy } from '../context/DairyContext';
import {
  Sun,
  Moon,
  Coins,
  Sparkles
} from 'lucide-react';

export const DailySummaryCard: React.FC = () => {
  const { selectedDate, selectedDayRecord } = useDairy();

  const morning = selectedDayRecord?.morning;
  const evening = selectedDayRecord?.evening;

  const mQty = morning?.quantity || 0;
  const mRate = morning?.rate_per_liter || 0;
  const mAmount = morning?.amount || 0;
  const mFat = morning?.fat || 0;
  const mClr = morning?.clr || 0;

  const eQty = evening?.quantity || 0;
  const eRate = evening?.rate_per_liter || 0;
  const eAmount = evening?.amount || 0;
  const eFat = evening?.fat || 0;
  const eClr = evening?.clr || 0;

  const totalQty = selectedDayRecord?.totalQuantity || 0;
  const totalAmount = selectedDayRecord?.totalAmount || 0;
  const avgRate = selectedDayRecord?.avgRate || 0;
  const avgFat = selectedDayRecord?.avgFat || 0;
  const avgClr = selectedDayRecord?.avgClr || 0;

  const morningPercent = totalQty > 0 ? Math.round((mQty / totalQty) * 100) : 0;
  const eveningPercent = totalQty > 0 ? 100 - morningPercent : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Daily Summary & Combined Total
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
              {selectedDate}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Combined metrics for Morning + Evening milk collection
          </p>
        </div>

        {totalQty > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Combined Day Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Grid of Key Calculations: Morning vs Evening vs Daily Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Morning Breakdown Card */}
        <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Morning Session</span>
            </div>
            {mQty > 0 ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {mQty} Ltr
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">No Entry</span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Morning Rate / Ltr:</span>
              <span className="font-bold text-slate-900">
                {mRate > 0 ? `₹${mRate.toFixed(2)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Fat / CLR:</span>
              <span className="font-medium text-slate-800">
                {mFat > 0 ? `${mFat}% / ${mClr}` : '--'}
              </span>
            </div>
            <div className="pt-2 border-t border-amber-200/70 flex justify-between items-center">
              <span className="font-semibold text-amber-900">Morning Amount:</span>
              <span className="text-sm font-extrabold text-amber-800">
                ₹{mAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Evening Breakdown Card */}
        <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Moon className="h-4 w-4 text-blue-600" />
              <span>Evening Session</span>
            </div>
            {eQty > 0 ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                {eQty} Ltr
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">No Entry</span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Evening Rate / Ltr:</span>
              <span className="font-bold text-slate-900">
                {eRate > 0 ? `₹${eRate.toFixed(2)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Fat / CLR:</span>
              <span className="font-medium text-slate-800">
                {eFat > 0 ? `${eFat}% / ${eClr}` : '--'}
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200/70 flex justify-between items-center">
              <span className="font-semibold text-blue-900">Evening Amount:</span>
              <span className="text-sm font-extrabold text-blue-800">
                ₹{eAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Combined Total Card */}
        <div className="p-4 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/10 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-200" />
                Daily Total Amount
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Combined
              </span>
            </div>

            <div className="mt-2">
              <div className="text-2xl font-black tracking-tight text-white">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Total Collection: <span className="font-bold text-white">{totalQty} Litres</span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="opacity-80 block">Avg Rate:</span>
              <span className="font-bold text-white">₹{avgRate.toFixed(2)}/L</span>
            </div>
            <div>
              <span className="opacity-80 block">Avg Quality:</span>
              <span className="font-bold text-white">{avgFat}% Fat | {avgClr} CLR</span>
            </div>
          </div>
        </div>

      </div>

      {/* Session Proportion Bar */}
      {totalQty > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Morning: {mQty} L ({morningPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              Evening: {eQty} L ({eveningPercent}%)
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${morningPercent}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Morning: ${mQty} L`}
            />
            <div
              style={{ width: `${eveningPercent}%` }}
              className="bg-blue-600 h-full transition-all duration-500"
              title={`Evening: ${eQty} L`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
