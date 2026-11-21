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
    return (
      <div className="panel px-5 py-10 text-center text-sm text-ink-400">
        Charts show up after the first day of milk is saved.
      </div>
    );
  }

  return (
    <div className="panel space-y-5 p-5">
      <div className="border-b border-ink-100 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <BarChart3 className="h-4 w-4 text-forest-700" />
          Collection & revenue
        </h3>
        <p className="text-xs text-ink-400">Recent morning vs evening litres and daily amount.</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">Litres trend</span>
            <span className="text-[11px] font-medium text-ink-400">Litres</span>
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
        <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">Daily amount</span>
            <span className="text-[11px] font-medium text-ink-400">Rupees</span>
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
                  fill="#18492f"
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
