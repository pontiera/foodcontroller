'use client';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '@/lib/api';
import { PageHeader, Badge, LoadingSpinner, CostBadge, EmptyState } from '@/components/ui';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CLASSIFICATION_COLORS: Record<string, string> = {
  Star:      '#10b981',
  Plowhorse: '#3b82f6',
  Puzzle:    '#f59e0b',
  Dog:       '#94a3b8',
};

const CLASSIFICATION_DESC: Record<string, string> = {
  Star:      'High margin + high popularity. Promote these!',
  Plowhorse: 'Low margin but popular. Reduce cost or adjust price.',
  Puzzle:    'High margin but low popularity. Improve marketing.',
  Dog:       'Low margin + low popularity. Consider removing.',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['recipe-analytics'],
    queryFn: recipesApi.analytics,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;

  const d = data as any;
  if (!d || !d.menuEngineering?.length) {
    return (
      <div className="space-y-5">
        <PageHeader title="Menu Analytics" description="Menu engineering matrix and food cost analysis" />
        <EmptyState icon={BarChart3} title="No recipe data yet" description="Create recipes with selling prices to see analytics" />
      </div>
    );
  }

  const byCategory = Object.entries(d.byCategory || {}).map(([name, val]: any) => ({
    name,
    count: val.count,
    avgMargin: +(val.avgMargin / val.count).toFixed(1),
    avgFoodCost: +(val.avgFoodCost / val.count).toFixed(1),
  }));

  const scatterData = d.menuEngineering.map((r: any) => ({
    ...r,
    x: +r.foodCostPercent.toFixed(1),
    y: +r.grossProfitMargin.toFixed(1),
  }));

  const classificationCounts = d.menuEngineering.reduce((acc: any, r: any) => {
    acc[r.classification] = (acc[r.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Analytics" description="Menu engineering matrix — classify and optimize your menu" />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Total Recipes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{d.totalRecipes}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Avg Food Cost %</p>
          <p className={`text-2xl font-bold mt-1 ${d.avgFoodCostPercent <= 30 ? 'text-green-600' : d.avgFoodCostPercent <= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
            {d.avgFoodCostPercent.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Avg Gross Margin</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{d.avgGrossMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Stars / Plowhorses</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {(classificationCounts['Star'] || 0)} / {(classificationCounts['Plowhorse'] || 0)}
          </p>
        </div>
      </div>

      {/* Classification Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Star', 'Plowhorse', 'Puzzle', 'Dog'].map((cls) => (
          <div key={cls} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: CLASSIFICATION_COLORS[cls] }} />
              <p className="text-sm font-bold text-slate-800">{cls}s</p>
              <Badge variant={cls === 'Star' ? 'green' : cls === 'Plowhorse' ? 'blue' : cls === 'Puzzle' ? 'yellow' : 'gray'}>
                {classificationCounts[cls] || 0}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{CLASSIFICATION_DESC[cls]}</p>
          </div>
        ))}
      </div>

      {/* Scatter Plot: Food Cost % vs Gross Margin */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Menu Engineering Matrix</h2>
        <p className="text-xs text-slate-500 mb-4">X-axis: Food Cost % · Y-axis: Gross Margin %</p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="x" type="number" name="Food Cost %"
              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              label={{ value: 'Food Cost %', position: 'bottom', fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              dataKey="y" type="number" name="Gross Margin %"
              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              label={{ value: 'Gross Margin %', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const r = payload[0]?.payload;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
                    <p className="font-bold text-slate-800 mb-1">{r.name}</p>
                    <p className="text-slate-500">{r.category}</p>
                    <p className="text-slate-700">Selling Price: {fmt(r.sellingPrice)}</p>
                    <p className="text-orange-600">Food Cost: {r.x}%</p>
                    <p className="text-green-600">Gross Margin: {r.y}%</p>
                    <div className="mt-1">
                      <Badge variant={r.classification === 'Star' ? 'green' : r.classification === 'Plowhorse' ? 'blue' : r.classification === 'Puzzle' ? 'yellow' : 'gray'}>
                        {r.classification}
                      </Badge>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={scatterData} name="Recipes">
              {scatterData.map((r: any, i: number) => (
                <Cell key={i} fill={CLASSIFICATION_COLORS[r.classification] || '#94a3b8'} opacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex gap-4 justify-center mt-2">
          {Object.entries(CLASSIFICATION_COLORS).map(([cls, color]) => (
            <div key={cls} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {cls}
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance Bar Chart */}
      {byCategory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Performance by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="avgMargin" name="Avg Gross Margin %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgFoodCost" name="Avg Food Cost %" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full Recipe Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">All Recipes — Ranked by Gross Margin</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Rank', 'Recipe', 'Category', 'Price', 'Cost', 'Food Cost %', 'Gross Margin', 'Class'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...d.menuEngineering]
                .sort((a: any, b: any) => b.grossProfitMargin - a.grossProfitMargin)
                .map((r: any, i: number) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-400">#{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{r.category}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmt(r.sellingPrice)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{fmt(r.totalCost)}</td>
                    <td className="px-4 py-3"><CostBadge percent={r.foodCostPercent} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 min-w-[60px]">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(r.grossProfitMargin, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 w-12 text-right">{r.grossProfitMargin.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.classification === 'Star' ? 'green' : r.classification === 'Plowhorse' ? 'blue' : r.classification === 'Puzzle' ? 'yellow' : 'gray'}>
                        {r.classification}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
