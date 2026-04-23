'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi, ingredientsApi } from '@/lib/api';
import {
  PageHeader, DataTable, Badge, CostBadge, Button, Input, Select,
  Modal, SearchBar, LoadingSpinner, EmptyState,
} from '@/components/ui';
import { Plus, Edit2, Trash2, Eye, ChefHat, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Appetizer', 'Soup', 'Salad', 'Main Course', 'Side', 'Dessert', 'Drink'];

function fmt(n: number, currency = 'THB') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

export default function RecipesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', { search, category }],
    queryFn: () => recipesApi.list({ search: search || undefined, category: category || undefined }),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: () => ingredientsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); setDeleteId(null); },
  });

  const list = Array.isArray(recipes) ? recipes as any[] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recipes"
        description="Manage menu items with automatic cost calculation"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Recipe
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search recipes..." /></div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-400"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <DataTable
        headers={['Code', 'Name', 'Category', 'Selling Price', 'Food Cost', 'Food Cost %', 'Gross Margin', 'Calories', 'Actions']}
        loading={isLoading}
      >
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={9}>
            <EmptyState icon={ChefHat} title="No recipes yet" description="Create your first recipe to start tracking food costs" action={<Button onClick={() => setShowCreate(true)}><Plus size={14} /> Create Recipe</Button>} />
          </td></tr>
        ) : list.map((r: any) => (
          <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/recipes/${r.id}`)}>
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.code}</td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{r.name}</td>
            <td className="px-4 py-3">
              <Badge variant={
                r.category === 'Main Course' ? 'blue' : r.category === 'Soup' ? 'orange' :
                r.category === 'Dessert' ? 'yellow' : r.category === 'Drink' ? 'green' : 'gray'
              }>{r.category || '—'}</Badge>
            </td>
            <td className="px-4 py-3 text-sm font-mono font-medium text-slate-800">{fmt(r.sellingPrice)}</td>
            <td className="px-4 py-3 text-sm font-mono text-slate-600">{fmt(r.totalCost)}</td>
            <td className="px-4 py-3"><CostBadge percent={r.foodCostPercent} /></td>
            <td className="px-4 py-3">
              <span className={r.grossProfitMargin >= 60 ? 'text-green-600 font-semibold text-sm' : r.grossProfitMargin >= 40 ? 'text-yellow-600 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                {r.grossProfitMargin.toFixed(1)}%
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-slate-500">{r.totalCalories ? `${Math.round(r.totalCalories)} kcal` : '—'}</td>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <button onClick={() => router.push(`/recipes/${r.id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"><Eye size={14} /></button>
                <button onClick={() => router.push(`/recipes/${r.id}/edit`)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Recipe" width="max-w-2xl">
        <RecipeForm ingredients={ingredients as any[]} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['recipes'] }); }} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Recipe">
        <p className="text-sm text-slate-600 mb-5">Are you sure you want to delete this recipe? This action cannot be undone.</p>
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

// ── Recipe Form ───────────────────────────────────────────
function RecipeForm({ ingredients, onSuccess, onCancel, initial }: {
  ingredients: any[]; onSuccess: () => void; onCancel: () => void; initial?: any;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: initial?.code || '',
    name: initial?.name || '',
    category: initial?.category || '',
    sellingPrice: initial?.sellingPrice || 0,
    laborCostPercent: initial?.laborCostPercent || 10,
    overheadPercent: initial?.overheadPercent || 15,
    instructions: initial?.instructions || '',
  });
  const [lines, setLines] = useState<{ ingredientId: string; quantity: number; unit: string }[]>(
    initial?.ingredients?.map((ri: any) => ({ ingredientId: ri.ingredientId, quantity: ri.quantity, unit: ri.unit || 'g' })) || [{ ingredientId: '', quantity: 0, unit: 'g' }]
  );
  const [preview, setPreview] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? recipesApi.update(initial.id, data) : recipesApi.create(data),
    onSuccess,
  });

  const handlePreview = async () => {
    setCalculating(true);
    try {
      const res = await recipesApi.costPreview({
        ingredients: lines.filter((l) => l.ingredientId && l.quantity > 0),
        sellingPrice: +form.sellingPrice,
        laborCostPercent: +form.laborCostPercent,
        overheadPercent: +form.overheadPercent,
      });
      setPreview(res);
    } finally { setCalculating(false); }
  };

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      sellingPrice: +form.sellingPrice,
      laborCostPercent: +form.laborCostPercent,
      overheadPercent: +form.overheadPercent,
      ingredients: lines.filter((l) => l.ingredientId && l.quantity > 0),
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Recipe Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MAIN-001" />
        <Input label="Recipe Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Green Curry Chicken" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Selling Price (฿) *" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} />
        <Input label="Labor Cost %" type="number" value={form.laborCostPercent} onChange={(e) => setForm({ ...form, laborCostPercent: +e.target.value })} />
        <Input label="Overhead %" type="number" value={form.overheadPercent} onChange={(e) => setForm({ ...form, overheadPercent: +e.target.value })} />
      </div>

      {/* Ingredient Lines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Ingredients</p>
          <Button size="sm" variant="secondary" onClick={() => setLines([...lines, { ingredientId: '', quantity: 0, unit: 'g' }])}>
            <Plus size={12} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select value={line.ingredientId} onChange={(e) => { const nl = [...lines]; nl[i].ingredientId = e.target.value; setLines(nl); }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
                <option value="">Select ingredient</option>
                {ingredients.map((ing: any) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.brand || ing.code})</option>
                ))}
              </select>
              <input type="number" placeholder="Qty" value={line.quantity || ''}
                onChange={(e) => { const nl = [...lines]; nl[i].quantity = +e.target.value; setLines(nl); }}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400" />
              <select value={line.unit} onChange={(e) => { const nl = [...lines]; nl[i].unit = e.target.value; setLines(nl); }}
                className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-sm bg-white focus:outline-none">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
              <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Preview */}
      {preview && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cost Preview</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-lg font-bold text-slate-900">฿{preview.totalCost?.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Total Cost</p>
            </div>
            <div className={`rounded-lg p-3 border ${preview.foodCostPercent <= 30 ? 'bg-green-50 border-green-200' : preview.foodCostPercent <= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-lg font-bold ${preview.foodCostPercent <= 30 ? 'text-green-700' : preview.foodCostPercent <= 40 ? 'text-yellow-700' : 'text-red-700'}`}>{preview.foodCostPercent?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Food Cost %</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-lg font-bold text-slate-900">{preview.grossProfitMargin?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Gross Margin</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between pt-2">
        <Button variant="secondary" onClick={handlePreview} disabled={calculating}>
          {calculating ? 'Calculating...' : '🧮 Preview Cost'}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : initial ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </div>
      </div>
    </div>
  );
}
