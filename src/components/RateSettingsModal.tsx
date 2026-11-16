import React, { useState } from 'react';
import { useDairy } from '../context/DairyContext';
import { RateSettings, FormulaMode } from '../types/dairy';
import { calculateSNF, calculateMilkRate } from '../lib/calculations';
import { Sliders, X, Save, Calculator } from 'lucide-react';

interface RateSettingsModalProps {
  onClose: () => void;
}

export const RateSettingsModal: React.FC<RateSettingsModalProps> = ({ onClose }) => {
  const { rateSettings, updateSettings } = useDairy();

  const [formData, setFormData] = useState<RateSettings>({ ...rateSettings });
  const [testFat, setTestFat] = useState<number>(4.2);
  const [testClr, setTestClr] = useState<number>(28.0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const testSnf = calculateSNF(testFat, testClr);
  const testRate = calculateMilkRate(testFat, testClr, formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
    onClose();
  };

  const handleApplyPreset = (type: 'cow' | 'buffalo') => {
    if (type === 'cow') {
      setFormData(prev => ({
        ...prev,
        base_fat_rate: 6.50,
        base_snf_rate: 2.00,
        standard_fat: 4.0,
        standard_clr: 28.0,
        standard_rate: 42.00,
        min_rate: 28.00
      }));
      setTestFat(4.0);
      setTestClr(28.0);
    } else {
      setFormData(prev => ({
        ...prev,
        base_fat_rate: 8.00,
        base_snf_rate: 2.20,
        standard_fat: 6.5,
        standard_clr: 29.0,
        standard_rate: 65.00,
        min_rate: 35.00
      }));
      setTestFat(6.5);
      setTestClr(29.0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Milk Rate & Dairy Pricing Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure Fat & CLR/SNF calculation formulas and center details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Preset Buttons */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Quick Pricing Presets:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('cow')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-800 shadow-2xs transition-all"
              >
                🐄 Cow Milk Standard
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('buffalo')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-800 shadow-2xs transition-all"
              >
                🐃 Buffalo Milk Standard
              </button>
            </div>
          </div>

          {/* Pricing Formula Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Rate Calculation Formula Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'fat_snf', label: 'Fat + SNF (Standard)', desc: '(Fat × FatRate) + (SNF × SnfRate)' },
                { id: 'fat_only', label: 'Fat Based Scaled', desc: 'Reference Rate scaled by Fat %' },
                { id: 'base_differential', label: 'Step Differential', desc: 'Standard Rate ± Step Diff' },
              ].map(f => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFormData({ ...formData, formula_mode: f.id as FormulaMode })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.formula_mode === f.id
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{f.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Rate Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Fat Multiplier (₹/Fat)
              </label>
              <input
                type="number"
                step="0.05"
                value={formData.base_fat_rate}
                onChange={e => setFormData({ ...formData, base_fat_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base SNF Multiplier (₹/SNF)
              </label>
              <input
                type="number"
                step="0.05"
                value={formData.base_snf_rate}
                onChange={e => setFormData({ ...formData, base_snf_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Floor Rate (₹/Ltr)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.min_rate}
                onChange={e => setFormData({ ...formData, min_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Live Simulator Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-sky-600" />
                Live Rate Calculator Preview
              </span>
              <span className="text-xs font-bold text-sky-950">
                Calculated Rate: <span className="text-emerald-700 text-sm">₹{testRate.toFixed(2)}/L</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-600 font-medium">Test Fat: {testFat}%</span>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.1"
                  value={testFat}
                  onChange={e => setTestFat(parseFloat(e.target.value))}
                  className="w-full h-1 bg-sky-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-medium">Test CLR: {testClr}</span>
                <input
                  type="range"
                  min="24.0"
                  max="34.0"
                  step="0.5"
                  value={testClr}
                  onChange={e => setTestClr(parseFloat(e.target.value))}
                  className="w-full h-1 bg-sky-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 text-center bg-white/80 p-1.5 rounded-lg border border-sky-200">
                <span className="text-[10px] text-slate-500 block">Calculated SNF</span>
                <span className="text-xs font-bold text-slate-800">{testSnf}%</span>
              </div>
            </div>
          </div>

          {/* Dairy & Center Metadata */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Center & Letterhead Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dairy Name / Society
                </label>
                <input
                  type="text"
                  value={formData.dairy_name}
                  onChange={e => setFormData({ ...formData, dairy_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Center Code
                </label>
                <input
                  type="text"
                  value={formData.center_code}
                  onChange={e => setFormData({ ...formData, center_code: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Farmer / Producer Name
                </label>
                <input
                  type="text"
                  value={formData.farmer_name}
                  onChange={e => setFormData({ ...formData, farmer_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
