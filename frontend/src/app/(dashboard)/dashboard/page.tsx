'use client';
import { useQuery } from '@tanstack/react-query';
import { financialsApi, recipesApi } from '@/lib/api';
import { StatCard, LoadingSpinner, DataTable, Badge, CostBadge } from '@/components/ui';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, ShoppingCart, UtensilsCrossed, Package, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#f97316','#3b82f6','#10b981','#8b5cf6','#f59e0b'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { organization } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: financialsApi.dashboard,
  });

  const { data: recipeAnalytics } = useQuery({
    queryKey: ['recipe-analytics'],
    queryFn: recipesApi.analytics,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;

  const d = dashboard as any;
  const ra = recipeAnalytics as any;

  const currentMonth = d?.currentMonth?.data;
  const prevMonth = d?.prevMonth?.data;
  const yearData = d?.yearData;
  const counts = d?.counts;

  // Chart data
  const chartData = (yearData?.records || []).map((r: any) => ({
    month: MONTHS[r.month - 1],
    Revenue: r.revenue,
    'Net Profit': r.netProfit,
    'Food Cost': r.foodCost,
    'Labor Cost': r.laborCost,
  }));

  // Food cost breakdown pie
  const pieData = currentMonth ? [
    { name: 'Food Cost', value: currentMonth.foodCost },
    { name: 'Labor', value: currentMonth.laborCost },
    { name: 'Rent', value: currentMonth.rent },
    { name: 'Utilities', value: currentMonth.utilities },
    { name: 'Other', value: currentMonth.otherExpenses + currentMonth.marketing + currentMonth.maintenance },
  ] : [];

  const revenueChange = d?.revenueChange ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {organization?.name} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (This Month)"
          value={fmt(currentMonth?.revenue ?? 0)}
          icon={TrendingUp}
          iconColor="text-green-500"
          change={revenueChange}
          trend={revenueChange >= 0 ? 'up' : 'down'}
          subtitle={`Net profit: ${fmt(currentMonth?.netProfit ?? 0)}`}
        />
        <StatCard
          title="Food Cost %"
          value={currentMonth?.revenue > 0
            ? `${((currentMonth.foodCost / currentMonth.revenue) * 100).toFixed(1)}%`
            : '—'}
          icon={ShoppingCart}
          iconColor="text-orange-500"
          subtitle={`${fmt(currentMonth?.foodCost ?? 0)} total`}
        />
        <StatCard
          title="Gross Margin"
          value={currentMonth?.grossMargin ? `${currentMonth.grossMargin.toFixed(1)}%` : '—'}
          icon={TrendingUp}
          iconColor="text-blue-500"
          subtitle={`${fmt(currentMonth?.grossProfit ?? 0)} gross profit`}
        />
        <StatCard
          title="Total Recipes"
          value={counts?.recipes ?? 0}
          icon={UtensilsCrossed}
          iconColor="text-purple-500"
          subtitle={`${counts?.ingredients ?? 0} ingredients · ${counts?.suppliers ?? 0} suppliers`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue & Profit Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Revenue & Profit Trend</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                <Area type="monotone" dataKey="Net Profit" stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No financial data yet</div>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Cost Breakdown</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Cost Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Monthly Cost Structure</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Food Cost" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Labor Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Menu Engineering Snapshot */}
      {ra?.menuEngineering && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Top Recipes — Food Cost Overview</h2>
          <DataTable headers={['Recipe', 'Category', 'Selling Price', 'Food Cost %', 'Gross Margin', 'Classification']}>
            {ra.menuEngineering.slice(0, 8).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.category}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmt(r.sellingPrice)}</td>
                <td className="px-4 py-3"><CostBadge percent={r.foodCostPercent} /></td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.grossProfitMargin.toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <Badge variant={r.classification === 'Star' ? 'green' : r.classification === 'Plowhorse' ? 'blue' : r.classification === 'Puzzle' ? 'yellow' : 'gray'}>
                    {r.classification}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
