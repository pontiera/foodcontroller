'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { UtensilsCrossed } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    organizationName: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data: any = await authApi.register(form);
      setAuth({ ...data, role: 'OWNER' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const Field = ({ label, k, type = 'text', placeholder = '' }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input type={type} required={k !== 'phone'} value={(form as any)[k]} onChange={f(k)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 leading-none">Food Controller</p>
              <p className="text-xs text-slate-500">Restaurant Management</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-6">Set up your restaurant management system</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 mb-2">
              <p className="text-xs font-bold text-orange-700 mb-2">🏪 Restaurant</p>
              <Field label="Restaurant Name *" k="organizationName" placeholder="The Golden Wok" />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-3">👤 Owner Account</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name *" k="firstName" placeholder="Somchai" />
                <Field label="Last Name *" k="lastName" placeholder="Jaidee" />
              </div>
              <div className="mt-3 space-y-3">
                <Field label="Email *" k="email" type="email" placeholder="owner@restaurant.com" />
                <Field label="Password *" k="password" type="password" placeholder="Min. 8 characters" />
                <Field label="Phone" k="phone" placeholder="081-234-5678" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating account...' : 'Create Account & Get Started'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <a href="/auth/login" className="text-orange-500 hover:text-orange-600 font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
