'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api';
import { PageHeader, DataTable, Badge, Button, Input, Modal, SearchBar, EmptyState } from '@/components/ui';
import { Plus, Edit2, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.list({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteId(null); },
  });

  const list = Array.isArray(suppliers) ? suppliers as any[] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suppliers"
        description="Manage your ingredient & equipment suppliers"
        action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> New Supplier</Button>}
      />

      <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." /></div>

      <DataTable headers={['Code', 'Company Name', 'Contact', 'Phone', 'Credit Days', 'Ingredients', 'Actions']} loading={isLoading}>
        {list.length === 0 && !isLoading ? (
          <tr><td colSpan={7}><EmptyState icon={ShoppingCart} title="No suppliers yet" description="Add suppliers to track where your ingredients come from" action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Add Supplier</Button>} /></td></tr>
        ) : list.map((s: any) => (
          <tr key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/suppliers/${s.id}`)}>
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.code}</td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{s.name}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{s.contactName || '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-500">{s.mobile || s.officePhone || '—'}</td>
            <td className="px-4 py-3"><Badge variant="blue">{s.creditDays} days</Badge></td>
            <td className="px-4 py-3 text-sm text-slate-600">{s._count?.ingredients ?? 0} items</td>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                <button onClick={() => router.push(`/suppliers/${s.id}`)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500"><Eye size={14} /></button>
                <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-500"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Supplier' : 'New Supplier'} width="max-w-xl">
        <SupplierForm initial={editing} onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['suppliers'] }); }} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Supplier">
        <p className="text-sm text-slate-600 mb-5">Delete this supplier? Ingredients linked to them will remain but lose the supplier reference.</p>
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

function SupplierForm({ initial, onSuccess, onCancel }: { initial?: any; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    code: initial?.code || '', name: initial?.name || '', taxId: initial?.taxId || '',
    address: initial?.address || '', creditDays: initial?.creditDays ?? 30,
    contactName: initial?.contactName || '', mobile: initial?.mobile || '',
    officePhone: initial?.officePhone || '', email: initial?.email || '',
    bankName: initial?.bankName || '', bankAccount: initial?.bankAccount || '',
    bankBranch: initial?.bankBranch || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => initial ? suppliersApi.update(initial.id, data) : suppliersApi.create(data),
    onSuccess,
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Supplier Code *" value={form.code} onChange={f('code')} placeholder="SUP001" />
        <Input label="Company Name *" value={form.name} onChange={f('name')} placeholder="Company Ltd." />
        <Input label="Tax ID" value={form.taxId} onChange={f('taxId')} placeholder="0105560123456" />
        <Input label="Credit Days" type="number" value={form.creditDays} onChange={f('creditDays')} />
      </div>
      <Input label="Address" value={form.address} onChange={f('address')} placeholder="123 Road, Bangkok" />
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide pt-1">Contact Details</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Contact Name" value={form.contactName} onChange={f('contactName')} />
        <Input label="Mobile" value={form.mobile} onChange={f('mobile')} />
        <Input label="Office Phone" value={form.officePhone} onChange={f('officePhone')} />
        <Input label="Email" type="email" value={form.email} onChange={f('email')} />
      </div>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide pt-1">Bank Details</p>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Bank" value={form.bankName} onChange={f('bankName')} />
        <Input label="Account No." value={form.bankAccount} onChange={f('bankAccount')} />
        <Input label="Branch" value={form.bankBranch} onChange={f('bankBranch')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => mutation.mutate({ ...form, creditDays: +form.creditDays })} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
