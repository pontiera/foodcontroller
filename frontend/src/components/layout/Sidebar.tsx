'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, BookOpen,
  Wrench, FileText, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, TrendingUp, Users, ChefHat, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/financials',     label: 'P & L',          icon: TrendingUp },
  { href: '/suppliers',      label: 'Suppliers',       icon: ShoppingCart },
  { href: '/ingredients',    label: 'Ingredients',    icon: ChefHat },
  { href: '/recipes',        label: 'Recipes',         icon: UtensilsCrossed },
  { href: '/master-recipes', label: 'Master Recipes', icon: BookOpen },
  { href: '/sop',            label: 'S.O.P.',          icon: FileText },
  { href: '/analytics',      label: 'Menu Analytics', icon: BarChart3 },
  { href: '/assets',         label: 'Assets',          icon: Wrench },
  { href: '/settings',       label: 'Settings',        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const NavItem = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          active
            ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-slate-200', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">Food Controller</p>
            <p className="text-xs text-slate-500 truncate">{organization?.name}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => <NavItem key={item.href} item={item} />)}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className={clsx('flex items-center gap-3 px-2 py-2 rounded-lg', !collapsed && 'mb-1')}>
          <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 text-xs font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-800">
              <X size={18} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div
        className={clsx(
          'hidden md:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </>
  );
}
