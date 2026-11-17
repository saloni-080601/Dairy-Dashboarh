import React from 'react';
import { useDairy } from '../context/DairyContext';
import { TenDayPeriod } from '../types/dairy';
import { Printer, X, Milk } from 'lucide-react';

interface PrintableBillModalProps {
  period: TenDayPeriod | null;
  onClose: () => void;
}

export const PrintableBillModal: React.FC<PrintableBillModalProps> = ({ period, onClose }) => {
  const { rateSettings } = useDairy();

  if (!period) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">

        {/* Modal Action Header (Excluded from print via .no-print) */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              10-Day Milk Collection Statement & Bill Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              aria-label="Close bill and go back"
              title="Close and go back"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Slip Container */}
        <div id="printable-bill-area" className="p-8 space-y-6 text-slate-900 bg-white">

          {/* Dairy Header / Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Milk className="h-6 w-6 text-sky-700" />
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {rateSettings.dairy_name || 'DAIRY MILK COLLECTION CENTER'}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Center Code: <span className="font-bold">{rateSettings.center_code || 'CTR-001'}</span>
              {rateSettings.phone && <span> • Contact: {rateSettings.phone}</span>}
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800 border border-slate-300">
              10-DAY PERIOD PAYMENT STATEMENT: {period.periodLabel}
            </div>
          </div>

          {/* Farmer & Period Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-500 font-medium">Producer / Farmer Name:</p>
              <p className="font-bold text-sm text-slate-900">{rateSettings.farmer_name || 'Milk Producer'}</p>
              <p className="text-slate-500 mt-1">Period Range: <span className="font-semibold text-slate-800">{period.startDate} to {period.endDate}</span></p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Total Days Recorded:</p>
              <p className="font-bold text-sm text-slate-900">{period.daysWithEntries} Days ({period.entriesCount} Sessions)</p>
              <p className="text-slate-500 mt-1">Print Date: <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-IN')}</span></p>
            </div>
          </div>

          {/* 10-Day Itemized Collection Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2 border-r border-slate-200" rowSpan={2}>Date</th>
                  <th className="p-2 text-center border-r border-slate-200" colSpan={4}>Morning (AM)</th>
                  <th className="p-2 text-center border-r border-slate-200" colSpan={4}>Evening (PM)</th>
                  <th className="p-2 text-right border-r border-slate-200" rowSpan={2}>Total Qty (L)</th>
                  <th className="p-2 text-right" rowSpan={2}>Total Amt (₹)</th>
                </tr>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <th className="p-1.5 text-right border-r border-slate-200">Qty</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Fat</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Rate</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Amt</th>

                  <th className="p-1.5 text-right border-r border-slate-200">Qty</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Fat</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Rate</th>
                  <th className="p-1.5 text-right border-r border-slate-200">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {period.records.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-50">
                    <td className="p-2 font-semibold border-r border-slate-200">{r.date}</td>

                    {/* Morning */}
                    <td className="p-1.5 text-right border-r border-slate-200">{r.morning?.quantity ?? '--'}</td>
                    <td className="p-1.5 text-right border-r border-slate-200">{r.morning?.fat ?? '--'}</td>
                    <td className="p-1.5 text-right border-r border-slate-200">{r.morning?.rate_per_liter ? `₹${r.morning.rate_per_liter.toFixed(2)}` : '--'}</td>
                    <td className="p-1.5 text-right font-medium border-r border-slate-200">{r.morning?.amount ? `₹${r.morning.amount.toFixed(2)}` : '--'}</td>

                    {/* Evening */}
                    <td className="p-1.5 text-right border-r border-slate-200">{r.evening?.quantity ?? '--'}</td>
                    <td className="p-1.5 text-right border-r border-slate-200">{r.evening?.fat ?? '--'}</td>
                    <td className="p-1.5 text-right border-r border-slate-200">{r.evening?.rate_per_liter ? `₹${r.evening.rate_per_liter.toFixed(2)}` : '--'}</td>
                    <td className="p-1.5 text-right font-medium border-r border-slate-200">{r.evening?.amount ? `₹${r.evening.amount.toFixed(2)}` : '--'}</td>

                    {/* Day Totals */}
                    <td className="p-2 text-right font-bold border-r border-slate-200">{r.totalQuantity} L</td>
                    <td className="p-2 text-right font-black text-slate-900">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-xs text-slate-900">
                <tr>
                  <td className="p-2 border-r border-slate-200">GRAND TOTAL</td>
                  <td className="p-1.5 text-right border-r border-slate-200">{period.morningQuantity} L</td>
                  <td className="p-1.5 text-right border-r border-slate-200" colSpan={2}>₹{period.morningAmount.toLocaleString('en-IN')}</td>
                  <td className="p-1.5 text-right border-r border-slate-200">{period.eveningQuantity} L</td>
                  <td className="p-1.5 text-right border-r border-slate-200" colSpan={2}>₹{period.eveningAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-sm font-black">{period.totalQuantity} L</td>
                  <td className="p-2 text-right text-base font-black text-emerald-800">₹{period.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary Totals & Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300">
            <div className="space-y-1 text-xs text-slate-700">
              <p>• Average Milk Fat: <span className="font-bold">{period.avgFat}%</span></p>
              <p>• Average CLR Reading: <span className="font-bold">{period.avgClr}</span></p>
              <p>• Average Solids-Not-Fat (SNF): <span className="font-bold">{period.avgSnf}%</span></p>
              <p>• Average Rate per Litre: <span className="font-bold">₹{period.avgRate.toFixed(2)}</span></p>
              <p className="pt-2 text-sm font-black text-emerald-800">
                NET PAYABLE AMOUNT: ₹{period.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex flex-col justify-end text-xs text-center space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-medium text-slate-600">Farmer's Signature</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-medium text-slate-600">Dairy Manager / In-Charge</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
