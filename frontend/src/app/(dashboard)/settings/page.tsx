'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi, usersApi } from '@/lib/api';
import { PageHeader, Button, Input, Badge, Modal, LoadingSpinner } from '@/components/ui';
import { Settings, Users, Building2, Lock, UserPlus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

type Tab = 'organization' | 'users' | 'profile' | 'password';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('organization');
  const { user } = useAuthStore();

  const tabs: { key: Tab; label: string; icon: React.ElementType; roles?: string[] }[] = [
    { key: 'organization', label: 'Organization', icon: Building2, roles: ['OWNER', 'ADMIN'] },
    { key: 'users', label: 'Team Members', icon: Users, roles: ['OWNER', 'ADMIN'] },
    { key: 'profile', label: 'My Profile', icon: Settings },
    { key: 'password', label: 'Password', icon: Lock },
  ];

  const visibleTabs = tabs.filter((t) => !t.roles || t.roles.includes(user?.role || ''));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your organization, team, and account preferences" />

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {tab === 'organization' && <OrgSettings />}
        {tab === 'users' && <TeamSettings />}
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'password' && <PasswordSettings />}
      </div>
    </div>
  );
}

// ── Organization Settings ─────────────────────────────────
function OrgSettings() {
  const qc = useQueryClient();
  const { data: org, isLoading } = useQuery({ queryKey: ['organization'], queryFn: organizationApi.get });
  const o = org as any;

  const [form, setForm] = useState<any>(null);

  if (isLoading) return <LoadingSpinner />;
  if (!form && o) setTimeout(() => setForm({ name: o.name, type: o.type || '', taxId: o.taxId || '', address: o.address || '', phone: o.phone || '', mobile: o.mobile || '', email: o.email || '', website: o.website || '', currency: o.currency || 'THB', language: o.language || 'en' }), 0);

  const mutation = useMutation({
    mutationFn: (data: any) => organizationApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  });

  if (!form) return <LoadingSpinner />;

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-base font-bold text-slate-800">Restaurant Information</h2>
        <p className="text-sm text-slate-500">Update your restaurant details and contact info</p>
      </div>

      <div className="space-y-4">
        <Input label="Restaurant Name" value={form.name || ''} onChange={f('name')} />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Type</label>
            <select value={form.type || ''} onChange={f('type')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
              <option value="">Select type</option>
              {['restaurant', 'cafe', 'bar', 'bakery', 'food truck', 'catering'].map((t) => (
                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <Input label="Tax ID" value={form.taxId || ''} onChange={f('taxId')} />
        </div>
        <Input label="Address" value={form.address || ''} onChange={f('address')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" value={form.phone || ''} onChange={f('phone')} />
          <Input label="Mobile" value={form.mobile || ''} onChange={f('mobile')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" value={form.email || ''} onChange={f('email')} />
          <Input label="Website" value={form.website || ''} onChange={f('website')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Currency</label>
            <select value={form.currency} onChange={f('currency')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
              {['THB', 'USD', 'EUR', 'GBP', 'SGD'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Language</label>
            <select value={form.language} onChange={f('language')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
              <option value="en">English</option>
              <option value="th">ภาษาไทย</option>
            </select>
          </div>
        </div>
      </div>

      <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
      {mutation.isSuccess && <p className="text-sm text-green-600">✓ Changes saved successfully</p>}
    </div>
  );
}

// ── Team Members ──────────────────────────────────────────
function TeamSettings() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'STAFF', position: '' });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members'],
    queryFn: organizationApi.members,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: any) => organizationApi.invite(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-members'] }); setShowInvite(false); setInviteForm({ email: '', role: 'STAFF', position: '' }); },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => organizationApi.removeMember(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-members'] }),
  });

  const list = Array.isArray(members) ? members as any[] : [];

  const ROLE_BADGE: Record<string, any> = {
    OWNER: 'orange', ADMIN: 'red', MANAGER: 'blue', STAFF: 'gray',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Team Members</h2>
          <p className="text-sm text-slate-500">{list.length} member(s) in your organization</p>
        </div>
        <Button onClick={() => setShowInvite(true)}><UserPlus size={15} /> Invite Member</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {list.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 text-sm font-bold">
                  {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.user.firstName} {m.user.lastName}</p>
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                  {m.position && <p className="text-xs text-slate-400">{m.position}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={ROLE_BADGE[m.role] || 'gray'}>{m.role}</Badge>
                {m.user.emailVerified
                  ? <Badge variant="green">Verified</Badge>
                  : <Badge variant="yellow">Pending</Badge>}
                {m.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMutation.mutate(m.userId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input label="Email Address" type="email" value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            placeholder="colleague@restaurant.com" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Role</label>
            <select value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400">
              <option value="STAFF">Staff — Read + limited create</option>
              <option value="MANAGER">Manager — Full data management</option>
              <option value="ADMIN">Admin — Full access + user management</option>
            </select>
          </div>
          <Input label="Position (optional)" value={inviteForm.position}
            onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
            placeholder="Head Chef, Restaurant Manager..." />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">The user must already have an account. They will be added to your organization immediately.</p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={() => inviteMutation.mutate(inviteForm)} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
          {inviteMutation.isError && <p className="text-sm text-red-500">User not found. Make sure they have an account first.</p>}
        </div>
      </Modal>
    </div>
  );
}

// ── Profile Settings ──────────────────────────────────────
function ProfileSettings() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h2 className="text-base font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Update your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 text-xl font-bold">
          {form.firstName?.[0]}{form.lastName?.[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{user?.email}</p>
          <Badge variant="orange">{user?.role}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={form.firstName} onChange={f('firstName')} />
        <Input label="Last Name" value={form.lastName} onChange={f('lastName')} />
      </div>
      <Input label="Phone" value={form.phone} onChange={f('phone')} placeholder="081-234-5678" />

      <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save Profile'}
      </Button>
      {mutation.isSuccess && <p className="text-sm text-green-600">✓ Profile updated</p>}
    </div>
  );
}

// ── Password Settings ─────────────────────────────────────
function PasswordSettings() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => usersApi.changePassword(data),
    onSuccess: () => { setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setError(''); },
    onError: (err: any) => setError(err?.message || 'Failed to change password'),
  });

  const handleSubmit = () => {
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    mutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h2 className="text-base font-bold text-slate-800">Change Password</h2>
        <p className="text-sm text-slate-500">Use a strong password of at least 8 characters</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {mutation.isSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">✓ Password changed successfully</div>}

      <Input label="Current Password" type="password" value={form.currentPassword} onChange={f('currentPassword')} />
      <Input label="New Password" type="password" value={form.newPassword} onChange={f('newPassword')} />
      <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={f('confirmPassword')} />

      <Button onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? 'Changing...' : 'Change Password'}
      </Button>
    </div>
  );
}
