'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialsApi } from '@/lib/api';
import { PageHeader, StatCard, Button, Input, Modal, LoadingSpinner } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Edit2 } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);
}

export default function FinancialsPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showForm, setShowForm] = useState(false);
  const [editingMonth, setEditingMonth] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['financials-year', year],
    queryFn: () => financialsApi.byYear(year),
  });

  const d = data as any;
  const records = d?.records || [];
  const totals = d?.totals || {};

  const chartData = records.map((r: any) => ({
    month: MONTHS[r.month - 1],
    Revenue: r.revenue,
    'Food Cost': r.foodCost,
    'Labor Cost': r.laborCost,
    'Net Profit': r.netProfit,
    'Gross Margin %': +r.grossMargin.toFixed(1),
    'Net Margin %': +r.netMargin.toFixed(1),
  }));

  const openEdit = (r?: any) => {
    setEditingMonth(r || null);
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & Loss"
        description="Monthly financial performance overview"
        action={
          <div className="flex gap-2">
            <select value={year} onChange={(e) => setYear(+e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-400">
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y}>{y}</option>)}
            </select>
            <Button onClick={() => openEdit()}><Edit2 size={15} /> Add / Edit Month</Button>
          </div>
        }
      />

      {/* Year Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`${year} Revenue`} value={fmt(totals.revenue || 0)} icon={TrendingUp} iconColor="text-green-500" />
        <StatCard title={`${year} Food Cost`} value={fmt(totals.foodCost || 0)} icon={TrendingDown} iconColor="text-red-400" subtitle={totals.revenue > 0 ? `${((totals.foodCost / totals.revenue) * 100).toFixed(1)}% of revenue` : ''} />
        <StatCard title={`${year} Labor Cost`} value={fmt(totals.laborCost || 0)} icon={TrendingDown} iconColor="text-blue-400" />
        <StatCard title={`${year} Net Profit`} value={fmt(totals.netProfit || 0)} icon={TrendingUp} iconColor={totals.netProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
      </div>

      {/* Revenue vs Cost Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Monthly Revenue & Costs</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Food Cost" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Labor Cost" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data for {year}. Click "Add / Edit Month" to add records.</div>
        )}
      </div>

      {/* Margin Trend */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Margin Trend (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Gross Margin %" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Net Margin %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Month', 'Revenue', 'Food Cost', 'Labor', 'Rent', 'Gross Profit', 'Net Profit', 'Gross %', 'Net %', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-400">No records for {year}</td></tr>
              ) : records.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{MONTHS[r.month - 1]}</td>
                  <td className="px-4 py-3 text-sm font-mono text-green-700">{fmt(r.revenue)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-orange-600">{fmt(r.foodCost)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{fmt(r.laborCost)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{fmt(r.rent)}</td>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-slate-800">{fmt(r.grossProfit)}</td>
                  <td className={`px-4 py-3 text-sm font-mono font-bold ${r.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(r.netProfit)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{r.grossMargin.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-sm font-medium ${r.netMargin >= 10 ? 'text-green-600' : r.netMargin >= 0 ? 'text-yellow-600' : 'text-red-500'}`}>{r.netMargin.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* P&L Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingMonth(null); }} title={editingMonth ? `Edit ${MONTHS[editingMonth.month - 1]} ${year}` : 'Add Financial Record'} width="max-w-lg">
        <PLForm year={year} initial={editingMonth} onSuccess={() => { setShowForm(false); setEditingMonth(null); qc.invalidateQueries({ queryKey: ['financials-year', year] }); }} onCancel={() => { setShowForm(false); setEditingMonth(null); }} />
      </Modal>
    </div>
  );
}

function PLForm({ year, initial, onSuccess, onCancel }: { year: number; initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const currentMonth = new Date().getMonth() + 1;
  const [form, setForm] = useState({
    month: initial?.month ?? currentMonth,
    year,
    revenue: initial?.revenue ?? 0,
    otherIncome: initial?.otherIncome ?? 0,
    foodCost: initial?.foodCost ?? 0,
    beverageCost: initial?.beverageCost ?? 0,
    laborCost: initial?.laborCost ?? 0,
    rent: initial?.rent ?? 0,
    utilities: initial?.utilities ?? 0,
    marketing: initial?.marketing ?? 0,
    maintenance: initial?.maintenance ?? 0,
    depreciation: initial?.depreciation ?? 0,
    otherExpenses: initial?.otherExpenses ?? 0,
    notes: initial?.notes ?? '',
  });

  const mutation = useMutation({ mutationFn: (data: any) => financialsApi.upsert(data), onSuccess });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const n = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: +e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Month</label>
          <select value={form.month} onChange={f('month')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <Input label="Year" type="number" value={form.year} onChange={n('year')} readOnly />
      </div>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Revenue</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revenue (฿)" type="number" value={form.revenue} onChange={n('revenue')} />
        <Input label="Other Income (฿)" type="number" value={form.otherIncome} onChange={n('otherIncome')} />
      </div>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cost of Goods Sold</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Food Cost (฿)" type="number" value={form.foodCost} onChange={n('foodCost')} />
        <Input label="Beverage Cost (฿)" type="number" value={form.beverageCost} onChange={n('beverageCost')} />
      </div>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Operating Expenses</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Labor Cost (฿)" type="number" value={form.laborCost} onChange={n('laborCost')} />
        <Input label="Rent (฿)" type="number" value={form.rent} onChange={n('rent')} />
        <Input label="Utilities (฿)" type="number" value={form.utilities} onChange={n('utilities')} />
        <Input label="Marketing (฿)" type="number" value={form.marketing} onChange={n('marketing')} />
        <Input label="Maintenance (฿)" type="number" value={form.maintenance} onChange={n('maintenance')} />
        <Input label="Depreciation (฿)" type="number" value={form.depreciation} onChange={n('depreciation')} />
        <Input label="Other Expenses (฿)" type="number" value={form.otherExpenses} onChange={n('otherExpenses')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Record'}
        </Button>
      </div>
    </div>
  );
}
