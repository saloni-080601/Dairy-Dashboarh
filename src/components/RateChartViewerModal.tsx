import React, { useEffect, useState } from 'react';
import {
  DEFAULT_COW_RATE_CHART,
  DEFAULT_BUFFALO_RATE_CHART,
  getStoredCowChart,
  saveStoredCowChart,
  getStoredBuffaloChart,
  saveStoredBuffaloChart
} from '../lib/rateChartData';
import { Table, X, Save, RotateCcw, Check, Info } from 'lucide-react';
import { fetchRateCharts, saveRateCharts } from '../lib/supabase';

interface RateChartViewerModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export const RateChartViewerModal: React.FC<RateChartViewerModalProps> = ({ onClose, onSaved }) => {
  const [activeTab, setActiveTab] = useState<'cow' | 'buffalo'>('cow');
  const [cowChart, setCowChart] = useState(getStoredCowChart());
  const [buffaloChart, setBuffaloChart] = useState(getStoredBuffaloChart());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chartMessage, setChartMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetchRateCharts().then(({ charts, error }) => {
      if (!active) return;
      setCowChart(charts.cow);
      setBuffaloChart(charts.buffalo);
      if (error) setChartMessage(`Showing saved device data. Supabase: ${error}`);
    });
    return () => { active = false; };
  }, []);

  const clrRows = [25, 26, 27, 28, 29, 30];

  // Cow Fats: 3.2 to 5.5
  const cowFats: string[] = [];
  for (let f = 3.2; f <= 5.55; f += 0.1) {
    cowFats.push(f.toFixed(1));
  }

  // Buffalo Fats: 8.0 to 10.0
  const buffaloFats: string[] = [];
  for (let f = 8.0; f <= 10.05; f += 0.1) {
    buffaloFats.push(f.toFixed(1));
  }

  const handleCellChange = (
    type: 'cow' | 'buffalo',
    clr: number,
    fat: string,
    valStr: string
  ) => {
    const val = parseFloat(valStr) || 0;
    if (type === 'cow') {
      setCowChart(prev => ({
        ...prev,
        [clr]: {
          ...(prev[clr] || {}),
          [fat]: val
        }
      }));
    } else {
      setBuffaloChart(prev => ({
        ...prev,
        [clr]: {
          ...(prev[clr] || {}),
          [fat]: val
        }
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setChartMessage('');
    saveStoredCowChart(cowChart);
    saveStoredBuffaloChart(buffaloChart);
    const result = await saveRateCharts({ cow: cowChart, buffalo: buffaloChart });
    setIsSaving(false);
    if (!result.success) {
      setChartMessage(result.error || 'Supabase save failed. Chart was saved on this device.');
      return;
    }
    setSaveSuccess(true);
    onSaved?.();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset the chart to the official default rates?')) {
      setCowChart(DEFAULT_COW_RATE_CHART);
      setBuffaloChart(DEFAULT_BUFFALO_RATE_CHART);
      saveStoredCowChart(DEFAULT_COW_RATE_CHART);
      saveStoredBuffaloChart(DEFAULT_BUFFALO_RATE_CHART);
      const result = await saveRateCharts({ cow: DEFAULT_COW_RATE_CHART, buffalo: DEFAULT_BUFFALO_RATE_CHART });
      if (!result.success) {
        setChartMessage(result.error || 'Defaults saved on this device, but Supabase could not be updated.');
        return;
      }
      if (onSaved) onSaved();
      alert('Default Rate Chart restored successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>Milk rate chart (cow and buffalo)</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Formula
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Formula: SNF = (CLR/4) + (0.2 × Fat) + 0.7 | Fat (1 decimal), CLR (25-30)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              title="Reset to initial values"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-colors"
            >
              {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Chart'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Animal Selector Tabs */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('cow')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cow'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Cow rate chart (fat 3.2 – 5.5)</span>
            </button>

            <button
              onClick={() => setActiveTab('buffalo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'buffalo'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Buffalo rate chart (fat 8.0 – 10.0)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5 text-sky-600" />
            <span>Click any cell to change its rate.</span>
          </div>
        </div>

        {/* Matrix Table Container */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          {chartMessage && <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{chartMessage}</p>}
          <div className="border border-slate-300 rounded-xl bg-white overflow-x-auto shadow-xs">
            {activeTab === 'cow' ? (
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-amber-100/70 text-amber-950 font-bold sticky top-0 border-b border-amber-300">
                  <tr>
                    <th className="p-2 border-r border-amber-200 bg-amber-200/80 sticky left-0 z-10 text-left">
                      CLR \ Fat
                    </th>
                    {cowFats.map(f => (
                      <th key={f} className="p-2 min-w-[58px] border-r border-amber-200 font-extrabold text-[11px]">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {clrRows.map(clr => (
                    <tr key={clr} className="hover:bg-amber-50/50">
                      <td className="p-2 font-bold bg-slate-100 border-r border-slate-300 sticky left-0 z-10 text-left text-slate-800">
                        CLR {clr}
                      </td>
                      {cowFats.map(fat => {
                        const val = cowChart[clr]?.[fat] ?? 0;
                        return (
                          <td key={fat} className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              step="0.01"
                              value={val}
                              onChange={(e) => handleCellChange('cow', clr, fat, e.target.value)}
                              className="w-full text-center bg-transparent py-1 px-0.5 font-semibold text-slate-900 rounded hover:bg-sky-50 focus:bg-sky-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-blue-100/70 text-blue-950 font-bold sticky top-0 border-b border-blue-300">
                  <tr>
                    <th className="p-2 border-r border-blue-200 bg-blue-200/80 sticky left-0 z-10 text-left">
                      CLR \ Fat
                    </th>
                    {buffaloFats.map(f => (
                      <th key={f} className="p-2 min-w-[62px] border-r border-blue-200 font-extrabold text-[11px]">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {clrRows.map(clr => (
                    <tr key={clr} className="hover:bg-blue-50/50">
                      <td className="p-2 font-bold bg-slate-100 border-r border-slate-300 sticky left-0 z-10 text-left text-slate-800">
                        CLR {clr}
                      </td>
                      {buffaloFats.map(fat => {
                        const val = buffaloChart[clr]?.[fat] ?? 0;
                        return (
                          <td key={fat} className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              step="0.01"
                              value={val}
                              onChange={(e) => handleCellChange('buffalo', clr, fat, e.target.value)}
                              className="w-full text-center bg-transparent py-1 px-0.5 font-semibold text-slate-900 rounded hover:bg-sky-50 focus:bg-sky-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 shrink-0">
          <p>
            • Chart changes automatically apply to all real-time rate calculations across the dashboard.
          </p>
          <button
            onClick={onClose}
            className="mt-2 sm:mt-0 px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
