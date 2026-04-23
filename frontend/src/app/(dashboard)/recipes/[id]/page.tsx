'use client';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '@/lib/api';
import { Badge, CostBadge, Button, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit2, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e'];

function fmt(n: number) {
  return `฿${n.toFixed(2)}`;
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', params.id],
    queryFn: () => recipesApi.get(params.id),
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!recipe) return <p className="text-slate-500">Recipe not found.</p>;

  const r = recipe as any;
  const pieData = r.ingredients
    .filter((ri: any) => ri.cost > 0)
    .map((ri: any) => ({
      name: ri.ingredient?.name || ri.masterRecipe?.name || 'Unknown',
      value: +ri.cost.toFixed(4),
    }));

  const marginClass = r.grossProfitMargin >= 60 ? 'text-green-600' : r.grossProfitMargin >= 40 ? 'text-yellow-600' : 'text-red-500';
  const costClass = r.foodCostPercent <= 30 ? 'text-green-600' : r.foodCostPercent <= 40 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{r.name}</h1>
            <Badge variant="gray">{r.code}</Badge>
            {r.category && <Badge variant="blue">{r.category}</Badge>}
          </div>
          {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
        </div>
        <Button onClick={() => router.push(`/recipes/${r.id}/edit`)} variant="secondary">
          <Edit2 size={15} /> Edit Recipe
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Selling Price</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(r.sellingPrice)}</p>
          <p className="text-xs text-slate-400 mt-0.5">per {r.servingUnit}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Total Cost</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{fmt(r.totalCost)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Ingredients: {fmt(r.totalIngredientCost)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Food Cost %</p>
          <p className={`text-2xl font-bold mt-1 ${costClass}`}>{fmtPct(r.foodCostPercent)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Target: ≤ 30%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-medium">Gross Margin</p>
          <p className={`text-2xl font-bold mt-1 ${marginClass}`}>{fmtPct(r.grossProfitMargin)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Profit: {fmt(r.grossProfit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredient Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Ingredient Cost Breakdown</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Ingredient</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Qty</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Cost/g</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Line Cost</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {r.ingredients.map((ri: any) => {
                const pct = r.totalIngredientCost > 0 ? (ri.cost / r.totalIngredientCost) * 100 : 0;
                const name = ri.ingredient?.name || ri.masterRecipe?.name || '—';
                const costPerG = ri.ingredient?.actualCostPerGram || ri.masterRecipe?.costPerGram || 0;
                return (
                  <tr key={ri.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{name}</p>
                      {ri.ingredient?.brand && <p className="text-xs text-slate-400">{ri.ingredient.brand}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-slate-600">{ri.quantity}{ri.unit}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">฿{costPerG.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-800">฿{ri.cost.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300">
                <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Ingredient Total</td>
                <td className="px-4 py-3 text-right text-sm font-bold font-mono text-slate-900">{fmt(r.totalIngredientCost)}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-500">100%</td>
              </tr>
              {(r.laborCostPercent > 0 || r.overheadPercent > 0) && (
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-4 py-2 text-xs text-slate-500">
                    + Labor ({r.laborCostPercent}%) + Overhead ({r.overheadPercent}%)
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-500 font-mono">
                    +{fmt(r.totalCost - r.totalIngredientCost)}
                  </td>
                  <td />
                </tr>
              )}
              <tr className="bg-orange-50 border-t border-orange-200">
                <td colSpan={3} className="px-4 py-3 text-sm font-bold text-orange-800">Total Cost</td>
                <td className="px-4 py-3 text-right text-sm font-bold font-mono text-orange-700">{fmt(r.totalCost)}</td>
                <td className="px-4 py-3 text-right"><CostBadge percent={r.foodCostPercent} /></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Cost Pie Chart */}
          {pieData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-3">Cost Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `฿${v}`} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Nutrition */}
          {r.totalCalories && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-3">Nutrition per Serving</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Calories', value: `${Math.round(r.totalCalories)} kcal`, color: 'text-orange-600' },
                  { label: 'Protein', value: r.totalProtein ? `${r.totalProtein.toFixed(1)}g` : '—', color: 'text-blue-600' },
                  { label: 'Fat', value: r.totalFat ? `${r.totalFat.toFixed(1)}g` : '—', color: 'text-yellow-600' },
                  { label: 'Carbs', value: r.totalCarbs ? `${r.totalCarbs.toFixed(1)}g` : '—', color: 'text-green-600' },
                ].map((n) => (
                  <div key={n.label} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                    <p className={`text-lg font-bold ${n.color}`}>{n.value}</p>
                    <p className="text-xs text-slate-500">{n.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
            <h2 className="text-sm font-bold mb-4 text-slate-300">Profitability Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Selling Price', value: fmt(r.sellingPrice), highlight: false },
                { label: 'Total Cost', value: `(${fmt(r.totalCost)})`, highlight: false },
                { label: 'Gross Profit', value: fmt(r.grossProfit), highlight: true },
              ].map((row) => (
                <div key={row.label} className={`flex justify-between items-center ${row.highlight ? 'border-t border-slate-700 pt-3' : ''}`}>
                  <span className="text-sm text-slate-400">{row.label}</span>
                  <span className={`text-sm font-bold font-mono ${row.highlight ? 'text-green-400 text-base' : 'text-white'}`}>{row.value}</span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <div className="text-center">
                  <p className={`text-xl font-bold ${r.grossProfitMargin >= 60 ? 'text-green-400' : r.grossProfitMargin >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtPct(r.grossProfitMargin)}
                  </p>
                  <p className="text-xs text-slate-500">Gross Margin</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-bold ${r.foodCostPercent <= 30 ? 'text-green-400' : r.foodCostPercent <= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtPct(r.foodCostPercent)}
                  </p>
                  <p className="text-xs text-slate-500">Food Cost %</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {r.instructions && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <ChefHat size={16} /> Preparation Instructions
          </h2>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{r.instructions}</pre>
        </div>
      )}
    </div>
  );
}
