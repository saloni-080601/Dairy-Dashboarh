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
    <div className="panel">
      <div className="flex flex-col justify-between gap-4 border-b border-ink-100 p-4 sm:p-5 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span>Collection history</span>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
              {filteredRecords.length} days
            </span>
          </h3>
          <p className="text-xs text-ink-400">Filter by date, then edit or export.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
            <input
              type="text"
              placeholder="YYYY-MM"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-40 rounded-lg border border-ink-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15 sm:w-48"
            />
          </div>

          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value as any)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 outline-none"
          >
            <option value="all">All sessions</option>
            <option value="both">Both AM & PM</option>
            <option value="morning_only">Morning only</option>
            <option value="evening_only">Evening only</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="btn-secondary py-1.5 text-xs"
            title="Toggle date sort order"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-ink-500" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          <button onClick={handleExportCSV} className="btn-secondary py-1.5 text-xs">
            <Download className="h-3.5 w-3.5 text-ink-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="data-table min-w-[920px] text-xs">
          <thead>
            <tr>
              <th>Date</th>
              <th>Morning</th>
              <th>AM rate</th>
              <th className="text-right">AM amount</th>
              <th>Evening</th>
              <th>PM rate</th>
              <th className="text-right">PM amount</th>
              <th className="text-right">Total L</th>
              <th className="text-right">Day total</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-ink-400">
                  <Layers className="mx-auto mb-1 h-6 w-6 opacity-50" />
                  No matching records.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.date} className="hover:bg-ink-50/70">
                  <td className="whitespace-nowrap font-semibold text-ink-900">{r.date}</td>
                  <td className="whitespace-nowrap">
                    {r.morning ? (
                      <div>
                        <span className="font-semibold text-ink-900">{r.morning.quantity} L</span>
                        <span className="block text-[10px] text-ink-400">Fat {r.morning.fat}% · CLR {r.morning.clr}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="whitespace-nowrap font-mono">{r.morning ? `₹${r.morning.rate_per_liter.toFixed(2)}` : '—'}</td>
                  <td className="whitespace-nowrap text-right font-mono">{r.morning ? `₹${r.morning.amount.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="whitespace-nowrap">
                    {r.evening ? (
                      <div>
                        <span className="font-semibold text-ink-900">{r.evening.quantity} L</span>
                        <span className="block text-[10px] text-ink-400">Fat {r.evening.fat}% · CLR {r.evening.clr}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="whitespace-nowrap font-mono">{r.evening ? `₹${r.evening.rate_per_liter.toFixed(2)}` : '—'}</td>
                  <td className="whitespace-nowrap text-right font-mono">{r.evening ? `₹${r.evening.amount.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="whitespace-nowrap text-right font-mono font-semibold">{r.totalQuantity} L</td>
                  <td className="whitespace-nowrap text-right font-mono font-semibold text-forest-800">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectDateForEdit(r.date)}
                        title="Open this date in the collection form"
                        className="rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-forest-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {r.morning && (
                        <button
                          onClick={() => handleDeleteSession(r.morning?.id, 'morning', r.date)}
                          title="Delete morning entry"
                          className="rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                        >
                          <Sun className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.evening && (
                        <button
                          onClick={() => handleDeleteSession(r.evening?.id, 'evening', r.date)}
                          title="Delete evening entry"
                          className="rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
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
