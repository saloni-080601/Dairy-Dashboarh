import React, { useState } from 'react';
import { useDairy } from '../context/DairyContext';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  Code2
} from 'lucide-react';

interface SupabaseConfigModalProps {
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ onClose }) => {
  const { isSupabaseConnected, refreshData, syncDataToSupabase } = useDairy();

  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState<string>(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState<string>(currentConfig.anonKey || '');
  const [activeTab, setActiveTab] = useState<'connection' | 'sql'>('connection');

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSaveAndConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      alert('Please provide Supabase URL and Anon Key.');
      return;
    }
    saveStoredSupabaseConfig(url.trim(), anonKey.trim());
    await refreshData();
    setTestResult({ success: true, message: 'Configuration saved! Connected to Supabase.' });
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect from Supabase and use local demo storage?')) {
      clearStoredSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      await refreshData();
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await syncDataToSupabase();
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus(`Successfully uploaded ${res.count} records to Supabase!`);
    } else {
      setSyncStatus(`Sync failed: ${res.message}`);
    }
  };

  const sqlSchemaText = `-- DAIRY MANAGEMENT DASHBOARD SCHEMA
CREATE TABLE IF NOT EXISTS public.milk_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    session VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
    fat NUMERIC(4, 2) NOT NULL,
    clr NUMERIC(4, 2) NOT NULL,
    snf NUMERIC(4, 2) NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL,
    rate_per_liter NUMERIC(8, 2) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    milk_type VARCHAR(20) DEFAULT 'cow',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_date_session UNIQUE (entry_date, session)
);

-- Agar table pehle se bani hui hai to ye line chala dein:
ALTER TABLE IF EXISTS public.milk_entries ADD COLUMN IF NOT EXISTS milk_type VARCHAR(20) DEFAULT 'cow';

CREATE TABLE IF NOT EXISTS public.rate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(50) NOT NULL DEFAULT 'default',
    formula_mode VARCHAR(30) NOT NULL DEFAULT 'fat_snf',
    base_fat_rate NUMERIC(6, 2) NOT NULL DEFAULT 6.50,
    base_snf_rate NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
    standard_fat NUMERIC(4, 2) NOT NULL DEFAULT 4.0,
    standard_clr NUMERIC(4, 2) NOT NULL DEFAULT 28.0,
    standard_rate NUMERIC(6, 2) NOT NULL DEFAULT 42.40,
    min_rate NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
    dairy_name VARCHAR(100) DEFAULT 'Gokul Dairy Collection Center',
    center_code VARCHAR(50) DEFAULT 'CTR-001',
    farmer_name VARCHAR(100) DEFAULT 'Kisan Milk Producer',
    phone VARCHAR(20) DEFAULT '+91 98765 43210',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.milk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous all access on milk_entries"
    ON public.milk_entries FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous all access on rate_settings"
    ON public.rate_settings FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Supabase Backend & PostgreSQL Setup
              </h3>
              <p className="text-xs text-slate-500">
                Connect your cloud Supabase database or copy the SQL schema
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab('connection')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'connection'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Connection & API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>SQL Schema Script</span>
          </button>
        </div>

        {/* Tab 1: Connection Config */}
        {activeTab === 'connection' && (
          <div className="p-6 space-y-5">

            {/* Current Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isSupabaseConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSupabaseConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="text-xs font-bold">
                    {isSupabaseConnected ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode Active'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {isSupabaseConnected
                      ? 'Entries are synchronized in real-time with your cloud Supabase database.'
                      : 'Data is safely stored in your browser. Enter your Supabase credentials below to connect cloud storage.'}
                  </p>
                </div>
              </div>

              {isSupabaseConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-red-600 border border-red-200 hover:bg-red-50"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Supabase URL and Key inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Find in Supabase Dashboard → Settings → API → Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Find in Supabase Dashboard → Settings → API → Project API Keys (anon public)
                </p>
              </div>
            </div>

            {/* Test result display */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {syncStatus && (
              <div className="p-3 rounded-xl text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
                {syncStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin text-sky-600' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {isSupabaseConnected && (
                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncing}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1.5 transition-colors"
                    title="Upload local offline entries to Supabase"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{isSyncing ? 'Syncing...' : 'Upload Local Data'}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
                >
                  Save & Connect
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: SQL Schema Script */}
        {activeTab === 'sql' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Quick Setup in 2 Minutes:</p>
                <p className="text-[11px] text-slate-500">
                  Run schema.sql first, then supabase/seed_rate_charts.sql in the Supabase SQL Editor to load the cow and buffalo charts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
              <pre>{sqlSchemaText}</pre>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Also saved in your project at</span>
              <code className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                supabase/schema.sql
              </code>
            </p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              Rate chart seed data is in <code className="font-bold">supabase/seed_rate_charts.sql</code>. Run it after this schema script to create and populate the chart table.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
