import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  Activity,
  Server,
  Clock,
  RefreshCw,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import clsx from 'clsx';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [poolStatus, setPoolStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, poolRes] = await Promise.all([
        api.get('/usage/stats'),
        api.get('/keys/status')
      ]);
      setStats(statsRes.data);
      setPoolStatus(poolRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time gateway usage and pool status</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={clsx("w-5 h-5", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests (24h)"
          value={stats?.requests24h.toLocaleString() || '0'}
          icon={Activity}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate24h || 0}%`}
          icon={CheckCircle2}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
        />
        <StatCard
          title="Avg Latency"
          value={`${stats?.avgLatencyMs || 0}ms`}
          icon={Clock}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          borderColor="border-purple-500/20"
        />
        <StatCard
          title="Auto-Retries (24h)"
          value={stats?.totalRetries24h.toLocaleString() || '0'}
          icon={RefreshCw}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          borderColor="border-amber-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gateway Activity</h3>
              <p className="text-2xl font-black text-white mt-1">
                {stats?.requests24h.toLocaleString()} <span className="text-sm font-medium text-slate-500 uppercase tracking-normal">Requests / 24h</span>
              </p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-500/80">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-500/80">Failed</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 pt-8">
            <div className="h-[300px] w-full">
              {stats?.requestsPerHour && stats.requestsPerHour.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.requestsPerHour}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
                    <XAxis
                      dataKey="hour"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                      name="Successful"
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFailed)"
                      name="Failed (429/Err)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pool Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-400" />
              Pool Status
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-sm font-medium text-slate-300">Active Keys</span>
                </div>
                <span className="text-lg font-bold text-white">{poolStatus?.active || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <span className="text-sm font-medium text-slate-300">Cooling Down (429)</span>
                </div>
                <span className="text-lg font-bold text-white">{poolStatus?.coolingDown || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-sm font-medium text-slate-300">Disabled</span>
                </div>
                <span className="text-lg font-bold text-white">{poolStatus?.disabled || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Models */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-400" />
              Top Models
            </h3>
            <div className="space-y-3">
              {stats?.topModels && stats.topModels.length > 0 ? (
                stats.topModels.map((m: any, i: number) => (
                  <div key={m.model} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 truncate pr-4">{i + 1}. {m.model}</span>
                    <span className="text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md">{m.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No model data yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md bg-opacity-90">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1.5">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-slate-400">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function StatCard({ title, value, icon: Icon, color, bgColor, borderColor }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
      <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 -mr-10 -mt-10", bgColor)} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className={clsx("p-2 rounded-xl border", bgColor, borderColor)}>
          <Icon className={clsx("w-5 h-5", color)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white relative z-10">{value}</p>
    </div>
  );
}
