'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sopApi } from '@/lib/api';
import { PageHeader, DataTable, Badge, Button, Input, Modal, SearchBar, EmptyState } from '@/components/ui';
import { Plus, Edit2, Trash2, FileText, Eye } from 'lucide-react';

export default function SopPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sop', search],
    queryFn: () => sopApi.list({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sopApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); setDeleteId(null); },
  });

  const list = Array.isArray(sops) ? sops as any[] : [];

  const openView = async (sop: any) => {
    const full = await sopApi.get(sop.id);
    setViewing(full);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="S.O.P. Documents"
        description="Standard Operating Procedures for recipe preparation and kitchen workflow"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New SOP
          </Button>
        }
      />

      <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search SOPs..." /></div>

      <DataTable headers={['Code', 'Title', 'Category', 'Version', 'Last Updated', 'Actions']} loading={isLoading}>
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={6}>
            <EmptyState
              icon={FileText}
              title="No SOP documents yet"
              description="Create step-by-step procedures for consistent food preparation"
              action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Create SOP</Button>}
            />
          </td></tr>
        ) : list.map((sop: any) => (
          <tr key={sop.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{sop.code}</td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{sop.title}</td>
            <td className="px-4 py-3">
              <Badge variant="blue">{sop.category || 'General'}</Badge>
            </td>
            <td className="px-4 py-3">
              <Badge variant="gray">v{sop.version}</Badge>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {new Date(sop.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <button onClick={() => openView(sop)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"><Eye size={14} /></button>
                <button onClick={() => { setEditing(sop); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(sop.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit SOP' : 'New SOP Document'} width="max-w-2xl">
        <SopForm
          initial={editing}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['sop'] }); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>

      {/* View Modal */}
      {viewing && (
        <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing.title} width="max-w-3xl">
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Badge variant="gray">Code: {viewing.code}</Badge>
              <Badge variant="blue">{viewing.category || 'General'}</Badge>
              <Badge variant="gray">v{viewing.version}</Badge>
              {viewing.recipes?.length > 0 && (
                <Badge variant="green">Used in {viewing.recipes.length} recipe(s)</Badge>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {viewing.content}
              </pre>
            </div>
            {viewing.recipes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Linked Recipes</p>
                <div className="flex gap-2 flex-wrap">
                  {viewing.recipes.map((r: any) => (
                    <Badge key={r.id} variant="orange">{r.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete SOP Document">
        <p className="text-sm text-slate-600 mb-5">Delete this SOP document? Recipes linked to it will lose the SOP reference.</p>
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

const SOP_CATEGORIES = ['Soup', 'Appetizer', 'Main Course', 'Salad', 'Dessert', 'Drink', 'Preparation', 'Cleaning', 'Safety', 'Other'];

function SopForm({ initial, onSuccess, onCancel }: { initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    code: initial?.code || '',
    title: initial?.title || '',
    category: initial?.category || '',
    version: initial?.version || '1.0',
    content: initial?.content || `# Dish Name - SOP

## Ingredients Preparation
1. Step one...
2. Step two...

## Cooking Process
1. Step one...
2. Step two...

## Plating
- Presentation notes...

## Quality Standards
- Color / texture / temperature requirements...

## Food Safety
- Temperature checks, storage instructions...`,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? sopApi.update(initial.id, data) : sopApi.create(data),
    onSuccess,
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Input label="Code *" value={form.code} onChange={f('code')} placeholder="SOP-001" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Category</label>
          <select value={form.category} onChange={f('category')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
            <option value="">Select category</option>
            {SOP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Version" value={form.version} onChange={f('version')} placeholder="1.0" />
      </div>
      <Input label="Title *" value={form.title} onChange={f('title')} placeholder="Tom Yum Soup - Standard Operating Procedure" />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Content (Markdown supported)</label>
        <textarea
          value={form.content}
          onChange={f('content')}
          rows={16}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white text-slate-900 font-mono focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-y"
          placeholder="Write step-by-step instructions..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update SOP' : 'Create SOP'}
        </Button>
      </div>
    </div>
  );
}
