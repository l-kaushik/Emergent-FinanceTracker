import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, RefreshCw, FileText, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Recurring', href: '/recurring', icon: RefreshCw },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-slate-900 border-r border-slate-800">
        <div className="flex flex-col flex-1">
          <div className="p-6 border-b border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-white">FinanceTracker</h1>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-4 mb-3">
              <p className="text-sm text-slate-400">Logged in as</p>
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">FinanceTracker</h1>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600 hover:text-slate-900"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-white" data-testid="mobile-menu">
          <div className="pt-20 pb-20 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
            <div className="bg-slate-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-slate-600">Logged in as</p>
              <p className="text-slate-900 font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
