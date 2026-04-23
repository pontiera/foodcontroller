'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientsApi, suppliersApi } from '@/lib/api';
import { PageHeader, DataTable, Badge, Button, Input, Select, Modal, SearchBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { Plus, Edit2, Trash2, ChefHat, X } from 'lucide-react';

const FOOD_CATEGORIES = ['Protein', 'Seafood', 'Vegetable', 'Herb', 'Seasoning', 'Grain', 'Dairy', 'Dairy Alt', 'Fat', 'Paste', 'Sauce', 'Other'];

function fmt(n: number) { return `฿${n.toFixed(4)}`; }

export default function IngredientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients', { search, supplierId }],
    queryFn: () => ingredientsApi.list({ search: search || undefined, supplierId: supplierId || undefined }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ingredientsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); setDeleteId(null); },
  });

  const list = Array.isArray(ingredients) ? ingredients as any[] : [];
  const supplierList = Array.isArray(suppliers) ? suppliers as any[] : [];

  const openEdit = (ing: any) => { setEditing(ing); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ingredients"
        description="Raw materials with automatic cost-per-gram calculation"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New Ingredient
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search ingredients..." /></div>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-400">
          <option value="">All Suppliers</option>
          {supplierList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <DataTable
        headers={['Code', 'Name', 'Brand', 'Category', 'Supplier', 'Purchase', 'Price/kg', 'Loss %', 'Actual Cost/g', 'Actions']}
        loading={isLoading}
      >
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={10}>
            <EmptyState icon={ChefHat} title="No ingredients yet" description="Add ingredients and their costs to build accurate recipes" action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Add Ingredient</Button>} />
          </td></tr>
        ) : list.map((ing: any) => (
          <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{ing.code}</td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{ing.name}</td>
            <td className="px-4 py-3 text-sm text-slate-500">{ing.brand || '—'}</td>
            <td className="px-4 py-3">
              <Badge variant={ing.foodCategory === 'Protein' ? 'blue' : ing.foodCategory === 'Seafood' ? 'green' : ing.foodCategory === 'Herb' ? 'green' : 'gray'}>
                {ing.foodCategory || '—'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{ing.supplier?.name || '—'}</td>
            <td className="px-4 py-3 text-xs text-slate-600">
              {ing.purchaseWeight}{ing.purchaseUnit} @ ฿{ing.purchasePrice}
            </td>
            <td className="px-4 py-3 text-sm font-mono text-slate-700">฿{ing.pricePerKg.toFixed(2)}</td>
            <td className="px-4 py-3">
              {ing.lossPercentage > 0
                ? <Badge variant="yellow">{ing.lossPercentage}%</Badge>
                : <span className="text-slate-400 text-xs">—</span>}
            </td>
            <td className="px-4 py-3 text-sm font-mono font-semibold text-orange-600">
              {fmt(ing.actualCostPerGram)}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(ing)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(ing.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Form Modal */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Ingredient' : 'New Ingredient'} width="max-w-2xl">
        <IngredientForm suppliers={supplierList} initial={editing} onSuccess={() => { closeForm(); qc.invalidateQueries({ queryKey: ['ingredients'] }); }} onCancel={closeForm} />
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Ingredient">
        <p className="text-sm text-slate-600 mb-5">Delete this ingredient? Any recipes using it will need cost recalculation.</p>
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

// ── Ingredient Form ───────────────────────────────────────
function IngredientForm({ suppliers, initial, onSuccess, onCancel }: {
  suppliers: any[]; initial?: any; onSuccess: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    supplierId: initial?.supplierId || '',
    code: initial?.code || '',
    name: initial?.name || '',
    brand: initial?.brand || '',
    foodCategory: initial?.foodCategory || '',
    purchaseWeight: initial?.purchaseWeight || '',
    purchaseUnit: initial?.purchaseUnit || 'g',
    purchasePrice: initial?.purchasePrice || '',
    lossPercentage: initial?.lossPercentage ?? 0,
    caloriesPer100g: initial?.caloriesPer100g || '',
    proteinPer100g: initial?.proteinPer100g || '',
    fatPer100g: initial?.fatPer100g || '',
    carbsPer100g: initial?.carbsPer100g || '',
  });

  const [preview, setPreview] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? ingredientsApi.update(initial.id, data) : ingredientsApi.create(data),
    onSuccess,
  });

  const computePreview = () => {
    const w = +form.purchaseWeight;
    const p = +form.purchasePrice;
    const loss = +form.lossPercentage;
    if (!w || !p) return;
    const pricePerKg = (p / w) * 1000;
    const actualCostPerKg = pricePerKg * (1 + loss / 100);
    const actualCostPerGram = actualCostPerKg / 1000;
    setPreview({ pricePerKg, actualCostPerKg, actualCostPerGram });
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [k]: e.target.value });
    setPreview(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Supplier</label>
          <select value={form.supplierId} onChange={f('supplierId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">Select supplier</option>
            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Input label="Code *" value={form.code} onChange={f('code')} placeholder="ING001" />
        <Input label="Name *" value={form.name} onChange={f('name')} placeholder="Chicken Breast" />
        <Input label="Brand" value={form.brand} onChange={f('brand')} placeholder="CPF" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Category</label>
          <select value={form.foodCategory} onChange={f('foodCategory')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">Select category</option>
            {FOOD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Purchase Details (for cost calculation)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Weight per unit *" type="number" value={form.purchaseWeight} onChange={f('purchaseWeight')} placeholder="1000" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Unit</label>
              <select value={form.purchaseUnit} onChange={f('purchaseUnit')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none">
                {['g', 'kg', 'ml', 'l', 'piece'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <Input label="Price per unit (฿) *" type="number" value={form.purchasePrice} onChange={f('purchasePrice')} placeholder="85" />
          </div>
        </div>
        <Input label="Loss / Waste %" type="number" value={form.lossPercentage} onChange={f('lossPercentage')} placeholder="5" />
      </div>

      {/* Nutrition (optional) */}
      <details className="group">
        <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700">▸ Nutrition per 100g (optional)</summary>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <Input label="Calories (kcal)" type="number" value={form.caloriesPer100g} onChange={f('caloriesPer100g')} />
          <Input label="Protein (g)" type="number" value={form.proteinPer100g} onChange={f('proteinPer100g')} />
          <Input label="Fat (g)" type="number" value={form.fatPer100g} onChange={f('fatPer100g')} />
          <Input label="Carbs (g)" type="number" value={form.carbsPer100g} onChange={f('carbsPer100g')} />
        </div>
      </details>

      {/* Cost Preview */}
      {preview && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-bold text-orange-800 mb-2">💡 Cost Calculation Preview</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-base font-bold text-slate-800">฿{preview.pricePerKg.toFixed(2)}</p><p className="text-xs text-slate-500">Price / kg</p></div>
            <div><p className="text-base font-bold text-slate-800">฿{preview.actualCostPerKg.toFixed(2)}</p><p className="text-xs text-slate-500">Actual Cost / kg (inc. loss)</p></div>
            <div><p className="text-base font-bold text-orange-600">฿{preview.actualCostPerGram.toFixed(4)}</p><p className="text-xs text-slate-500">Actual Cost / g</p></div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between pt-2">
        <Button variant="secondary" onClick={computePreview}>🧮 Preview Cost</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => mutation.mutate({ ...form, purchaseWeight: +form.purchaseWeight, purchasePrice: +form.purchasePrice, lossPercentage: +form.lossPercentage })} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
