import React, { useState, useMemo } from 'react';
import { useDairy } from '../context/DairyContext';
import {
  Search,
  Download,
  Sun,
  Moon,
  Edit2,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface RecordsTableProps {
  onSelectDateForEdit: (date: string) => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({ onSelectDateForEdit }) => {
  const { dailyRecords, removeEntry } = useDairy();

  const [searchDate, setSearchDate] = useState<string>('');
  const [filterSession, setFilterSession] = useState<'all' | 'both' | 'morning_only' | 'evening_only'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredRecords = useMemo(() => {
    let result = [...dailyRecords];

    if (searchDate.trim()) {
      result = result.filter(r => r.date.includes(searchDate.trim()));
    }

    if (filterSession === 'both') {
      result = result.filter(r => r.morning && r.evening);
    } else if (filterSession === 'morning_only') {
      result = result.filter(r => r.morning && !r.evening);
    } else if (filterSession === 'evening_only') {
      result = result.filter(r => !r.morning && r.evening);
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      result.sort((a, b) => b.date.localeCompare(a.date));
    }

    return result;
  }, [dailyRecords, searchDate, filterSession, sortOrder]);

  const handleExportCSV = () => {
    if (dailyRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Date',
      'Morning Qty (L)',
      'Morning Fat (%)',
      'Morning CLR',
      'Morning SNF (%)',
      'Morning Rate (₹)',
      'Morning Amount (₹)',
      'Evening Qty (L)',
      'Evening Fat (%)',
      'Evening CLR',
      'Evening SNF (%)',
      'Evening Rate (₹)',
      'Evening Amount (₹)',
      'Total Litres (L)',
      'Total Amount (₹)',
      'Avg Rate (₹)',
      'Weighted Fat (%)'
    ];

    const rows = dailyRecords.map(r => [
      r.date,
      r.morning?.quantity ?? 0,
      r.morning?.fat ?? '',
      r.morning?.clr ?? '',
      r.morning?.snf ?? '',
      r.morning?.rate_per_liter ?? '',
      r.morning?.amount ?? 0,
      r.evening?.quantity ?? 0,
      r.evening?.fat ?? '',
      r.evening?.clr ?? '',
      r.evening?.snf ?? '',
      r.evening?.rate_per_liter ?? '',
      r.evening?.amount ?? 0,
      r.totalQuantity,
      r.totalAmount,
      r.avgRate,
      r.avgFat
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dairy_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSession = async (entryId?: string, sessionName?: string, date?: string) => {
    if (!entryId) return;
    if (confirm(`Delete ${sessionName} entry for ${date}?`)) {
      await removeEntry(entryId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
            <span>Date-Wise Milk Collection History</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredRecords.length} Days
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            View, edit, filter, and export past Morning and Evening milk records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Date Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by date (YYYY-MM)..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-48 sm:w-56"
            />
          </div>

          {/* Session Filter */}
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value as any)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Sessions</option>
            <option value="both">Both AM & PM</option>
            <option value="morning_only">Morning Only</option>
            <option value="evening_only">Evening Only</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Toggle Date Sort Order"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-amber-900 bg-amber-50/50">Morning (AM)</th>
              <th className="py-3 px-4 text-amber-900 bg-amber-50/50">Morning Rate</th>
              <th className="py-3 px-4 text-amber-900 bg-amber-50/50 text-right">Morning Amt</th>
              <th className="py-3 px-4 text-blue-900 bg-blue-50/50">Evening (PM)</th>
              <th className="py-3 px-4 text-blue-900 bg-blue-50/50">Evening Rate</th>
              <th className="py-3 px-4 text-blue-900 bg-blue-50/50 text-right">Evening Amt</th>
              <th className="py-3 px-4 text-right">Total Litres</th>
              <th className="py-3 px-4 text-right font-bold text-emerald-800">Daily Total</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  <Layers className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  No matching records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.date} className="hover:bg-slate-50/80 transition-colors">

                  {/* Date Column */}
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {r.date}
                  </td>

                  {/* Morning Data */}
                  <td className="py-3 px-4 bg-amber-50/20 whitespace-nowrap">
                    {r.morning ? (
                      <div>
                        <span className="font-bold text-slate-900">{r.morning.quantity} L</span>
                        <span className="text-[10px] text-slate-500 block">
                          Fat: {r.morning.fat}% | CLR: {r.morning.clr}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">--</span>
                    )}
                  </td>

                  {/* Morning Rate */}
                  <td className="py-3 px-4 bg-amber-50/20 whitespace-nowrap">
                    {r.morning ? (
                      <span className="font-semibold text-amber-800">
                        ₹{r.morning.rate_per_liter.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>

                  {/* Morning Amount */}
                  <td className="py-3 px-4 bg-amber-50/20 text-right font-bold text-amber-900 whitespace-nowrap">
                    {r.morning ? `₹${r.morning.amount.toLocaleString('en-IN')}` : '--'}
                  </td>

                  {/* Evening Data */}
                  <td className="py-3 px-4 bg-blue-50/20 whitespace-nowrap">
                    {r.evening ? (
                      <div>
                        <span className="font-bold text-slate-900">{r.evening.quantity} L</span>
                        <span className="text-[10px] text-slate-500 block">
                          Fat: {r.evening.fat}% | CLR: {r.evening.clr}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">--</span>
                    )}
                  </td>

                  {/* Evening Rate */}
                  <td className="py-3 px-4 bg-blue-50/20 whitespace-nowrap">
                    {r.evening ? (
                      <span className="font-semibold text-blue-800">
                        ₹{r.evening.rate_per_liter.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>

                  {/* Evening Amount */}
                  <td className="py-3 px-4 bg-blue-50/20 text-right font-bold text-blue-900 whitespace-nowrap">
                    {r.evening ? `₹${r.evening.amount.toLocaleString('en-IN')}` : '--'}
                  </td>

                  {/* Total Litres */}
                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {r.totalQuantity} L
                  </td>

                  {/* Daily Total Amount */}
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                    ₹{r.totalAmount.toLocaleString('en-IN')}
                  </td>

                  {/* Edit / Quick Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectDateForEdit(r.date)}
                        title="Load date into entry form above"
                        className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {r.morning && (
                        <button
                          onClick={() => handleDeleteSession(r.morning?.id, 'morning', r.date)}
                          title="Delete Morning Entry"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Sun className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {r.evening && (
                        <button
                          onClick={() => handleDeleteSession(r.evening?.id, 'evening', r.date)}
                          title="Delete Evening Entry"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Moon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
