import React, { useMemo } from 'react';
import { useDairy } from '../context/DairyContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const { dailyRecords } = useDairy();

  // Take the most recent 10 to 14 days and sort chronologically for charts
  const chartData = useMemo(() => {
    return [...dailyRecords]
      .slice(0, 12)
      .reverse()
      .map(r => ({
        date: r.date.substring(5), // MM-DD for clean axis labels
        fullDate: r.date,
        MorningLtr: r.morning?.quantity || 0,
        EveningLtr: r.evening?.quantity || 0,
        TotalLtr: r.totalQuantity,
        MorningAmount: r.morning?.amount || 0,
        EveningAmount: r.evening?.amount || 0,
        TotalAmount: r.totalAmount,
        AvgFat: r.avgFat,
        AvgSnf: r.avgSnf,
        AvgRate: r.avgRate
      }));
  }, [dailyRecords]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-600" />
            <span>Collection & Revenue Analytics</span>
          </h3>
          <p className="text-xs text-slate-500">
            Trends across the recent collection cycles (Morning vs Evening Litres & Daily Revenue)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Milk Quantity Trend (Morning vs Evening) */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Milk Litres Trend (Morning vs Evening)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Litres</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="eveningGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => [`${value} Litres`, name === 'MorningLtr' ? 'Morning' : 'Evening']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="MorningLtr"
                  name="Morning (AM)"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#morningGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="EveningLtr"
                  name="Evening (PM)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#eveningGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Amount & Rate Trend */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Daily Total Amount (₹)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Rupees</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Daily Total']}
                />
                <Bar
                  dataKey="TotalAmount"
                  name="Daily Total Amount (₹)"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
