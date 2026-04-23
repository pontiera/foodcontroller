'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ingredientsApi } from '@/lib/api';
import { PageHeader, DataTable, Badge, Button, Input, Modal, SearchBar, EmptyState } from '@/components/ui';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';

// Master recipes API (inline since not in main api.ts)
const masterRecipesApi = {
  list: (params?: any) => api.get('/master-recipes', { params }),
  get: (id: string) => api.get(`/master-recipes/${id}`),
  create: (data: any) => api.post('/master-recipes', data),
  update: (id: string, data: any) => api.put(`/master-recipes/${id}`, data),
  delete: (id: string) => api.delete(`/master-recipes/${id}`),
};

export default function MasterRecipesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: masterRecipes = [], isLoading } = useQuery({
    queryKey: ['master-recipes', search],
    queryFn: () => masterRecipesApi.list({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterRecipesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-recipes'] }); setDeleteId(null); },
  });

  const list = Array.isArray(masterRecipes) ? masterRecipes as any[] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Recipes"
        description="Prep recipes and sauces used as ingredients in main recipes"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New Master Recipe
          </Button>
        }
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Master Recipes</strong> are pre-prepared sauces, stocks, marinades or mise-en-place items.
          Once created, you can use them as ingredients in your main recipes — their cost will be auto-calculated.
        </p>
      </div>

      <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search master recipes..." /></div>

      <DataTable headers={['Code', 'Name', 'Category', 'Yield', 'Total Cost', 'Cost/g', 'Actions']} loading={isLoading}>
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={7}>
            <EmptyState icon={BookOpen} title="No master recipes yet"
              description="Create stocks, sauces, and prep items to reuse across main recipes"
              action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Create Master Recipe</Button>} />
          </td></tr>
        ) : list.map((mr: any) => (
          <tr key={mr.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{mr.code}</td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{mr.name}</td>
            <td className="px-4 py-3"><Badge variant="blue">{mr.category || '—'}</Badge></td>
            <td className="px-4 py-3 text-sm text-slate-600">{mr.yield}{mr.yieldUnit}</td>
            <td className="px-4 py-3 text-sm font-mono text-slate-700">฿{mr.totalCost?.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm font-mono font-semibold text-orange-600">฿{mr.costPerGram?.toFixed(4)}/g</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <button onClick={() => { setEditing(mr); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(mr.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Master Recipe' : 'New Master Recipe'} width="max-w-2xl">
        <MasterRecipeForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['master-recipes'] }); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Master Recipe">
        <p className="text-sm text-slate-600 mb-5">Delete this master recipe? Main recipes using it may need cost recalculation.</p>
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

const MR_CATEGORIES = ['Stock', 'Sauce', 'Marinade', 'Paste', 'Dough', 'Garnish', 'Prep', 'Other'];

function MasterRecipeForm({ initial, onSuccess, onCancel }: { initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    code: initial?.code || '',
    name: initial?.name || '',
    category: initial?.category || '',
    yield: initial?.yield || 1000,
    yieldUnit: initial?.yieldUnit || 'g',
    description: initial?.description || '',
    instructions: initial?.instructions || '',
  });
  const [lines, setLines] = useState<{ ingredientId: string; quantity: number; unit: string }[]>(
    initial?.ingredients?.map((ri: any) => ({ ingredientId: ri.ingredientId || '', quantity: ri.quantity || 0, unit: ri.unit || 'g' })) || [{ ingredientId: '', quantity: 0, unit: 'g' }]
  );

  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients-list'], queryFn: () => ingredientsApi.list() });
  const ingList = Array.isArray(ingredients) ? ingredients as any[] : [];

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? masterRecipesApi.update(initial.id, data) : masterRecipesApi.create(data),
    onSuccess,
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Code *" value={form.code} onChange={f('code')} placeholder="SAUCE-001" />
        <Input label="Name *" value={form.name} onChange={f('name')} placeholder="White Stock" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Category</label>
          <select value={form.category} onChange={f('category')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">Select category</option>
            {MR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Input label="Yield *" type="number" value={form.yield} onChange={f('yield')} />
          <div className="flex flex-col gap-1 w-24">
            <label className="text-xs font-semibold text-slate-600">Unit</label>
            <select value={form.yieldUnit} onChange={f('yieldUnit')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none">
              {['g', 'ml', 'kg', 'l', 'portion'].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
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
                {ingList.map((ing: any) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
              </select>
              <input type="number" placeholder="Qty" value={line.quantity || ''}
                onChange={(e) => { const nl = [...lines]; nl[i].quantity = +e.target.value; setLines(nl); }}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400" />
              <span className="text-xs text-slate-400">g</span>
              <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Instructions (optional)</label>
        <textarea value={form.instructions} onChange={f('instructions')} rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400 resize-y"
          placeholder="Step-by-step preparation..." />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => mutation.mutate({ ...form, yield: +form.yield, ingredients: lines.filter((l) => l.ingredientId && l.quantity > 0) })} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
