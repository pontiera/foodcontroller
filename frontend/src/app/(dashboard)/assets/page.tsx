'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi, suppliersApi } from '@/lib/api';
import { PageHeader, DataTable, Badge, Button, Input, Modal, SearchBar, EmptyState, StatCard } from '@/components/ui';
import { Plus, Edit2, Trash2, Wrench } from 'lucide-react';

const DEPARTMENTS = ['Kitchen', 'Service', 'Bar', 'Management', 'General'];
const CONDITIONS: Record<string, { label: string; variant: any }> = {
  EXCELLENT: { label: 'Excellent', variant: 'green' },
  GOOD: { label: 'Good', variant: 'blue' },
  FAIR: { label: 'Fair', variant: 'yellow' },
  POOR: { label: 'Poor', variant: 'red' },
  RETIRED: { label: 'Retired', variant: 'gray' },
};

function fmt(n: number) { return `฿${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`; }

export default function AssetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', { search, department }],
    queryFn: () => assetsApi.list({ search: search || undefined, department: department || undefined }),
  });

  const { data: summary } = useQuery({ queryKey: ['assets-summary'], queryFn: assetsApi.summary });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers-list'], queryFn: suppliersApi.list });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); qc.invalidateQueries({ queryKey: ['assets-summary'] }); setDeleteId(null); },
  });

  const list = Array.isArray(assets) ? assets as any[] : [];
  const s = summary as any;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets & Equipment"
        description="Track all restaurant equipment and their values"
        action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Add Asset</Button>}
      />

      {/* Summary Cards */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Asset Value" value={fmt(s.totalValue)} icon={Wrench} iconColor="text-purple-500" />
          <StatCard title="Total Items" value={`${s.totalItems} units`} icon={Wrench} iconColor="text-blue-500" />
          <StatCard title="Asset Records" value={s.assetCount} icon={Wrench} iconColor="text-orange-500" />
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-500 font-medium mb-3">By Department</p>
            <div className="space-y-1.5">
              {Object.entries(s.byDepartment || {}).map(([dept, val]: any) => (
                <div key={dept} className="flex justify-between text-xs">
                  <span className="text-slate-600">{dept}</span>
                  <span className="font-medium text-slate-800">{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search assets..." /></div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-400">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <DataTable headers={['Code', 'Name', 'Brand', 'Department', 'Qty', 'Unit Price', 'Total Value', 'Condition', 'Purchased', 'Actions']} loading={isLoading}>
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={10}><EmptyState icon={Wrench} title="No assets yet" description="Track your kitchen equipment and furnishings" action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Add Asset</Button>} /></td></tr>
        ) : list.map((a: any) => {
          const cond = CONDITIONS[a.condition] || CONDITIONS.GOOD;
          return (
            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-xs font-mono text-slate-500">{a.code}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{a.name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{a.brand || '—'}</td>
              <td className="px-4 py-3"><Badge variant="blue">{a.department || '—'}</Badge></td>
              <td className="px-4 py-3 text-sm text-slate-700">{a.quantity} {a.unit}</td>
              <td className="px-4 py-3 text-sm font-mono text-slate-700">{fmt(a.pricePerUnit)}</td>
              <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{fmt(a.totalValue)}</td>
              <td className="px-4 py-3"><Badge variant={cond.variant}>{cond.label}</Badge></td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('en-GB') : '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(a); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Asset' : 'New Asset'} width="max-w-xl">
        <AssetForm suppliers={Array.isArray(suppliers) ? suppliers as any[] : []} initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['assets'] }); qc.invalidateQueries({ queryKey: ['assets-summary'] }); }}
          onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Asset">
        <p className="text-sm text-slate-600 mb-5">Delete this asset permanently?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AssetForm({ suppliers, initial, onSuccess, onCancel }: { suppliers: any[]; initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    supplierId: initial?.supplierId || '', code: initial?.code || '',
    name: initial?.name || '', brand: initial?.brand || '', skuCode: initial?.skuCode || '',
    department: initial?.department || 'Kitchen', quantity: initial?.quantity ?? 1,
    unit: initial?.unit || 'unit', pricePerUnit: initial?.pricePerUnit ?? 0,
    purchaseDate: initial?.purchaseDate ? initial.purchaseDate.slice(0, 10) : '',
    warrantyExpiry: initial?.warrantyExpiry ? initial.warrantyExpiry.slice(0, 10) : '',
    condition: initial?.condition || 'GOOD', notes: initial?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? assetsApi.update(initial.id, data) : assetsApi.create(data),
    onSuccess,
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Code *" value={form.code} onChange={f('code')} placeholder="EQM-001" />
        <Input label="Name *" value={form.name} onChange={f('name')} placeholder="Non-stick Pan 18" />
        <Input label="Brand" value={form.brand} onChange={f('brand')} />
        <Input label="SKU Code" value={form.skuCode} onChange={f('skuCode')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Department</label>
          <select value={form.department} onChange={f('department')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Supplier</label>
          <select value={form.supplierId} onChange={f('supplierId')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">None</option>
            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Input label="Quantity *" type="number" value={form.quantity} onChange={f('quantity')} />
        <Input label="Unit" value={form.unit} onChange={f('unit')} placeholder="unit" />
        <Input label="Price per Unit (฿) *" type="number" value={form.pricePerUnit} onChange={f('pricePerUnit')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Condition</label>
          <select value={form.condition} onChange={f('condition')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            {Object.entries(CONDITIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={f('purchaseDate')} />
        <Input label="Warranty Expiry" type="date" value={form.warrantyExpiry} onChange={f('warrantyExpiry')} />
      </div>

      {/* Total Value Preview */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-500">Total Asset Value</p>
        <p className="text-lg font-bold text-slate-900 font-mono">฿{(+form.quantity * +form.pricePerUnit).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => mutation.mutate({ ...form, quantity: +form.quantity, pricePerUnit: +form.pricePerUnit })} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
