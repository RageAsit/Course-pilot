import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const fetchHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth({ loading: false, data, error: null });
    } catch (err) {
      setHealth({
        loading: false,
        data: null,
        error: err.message || 'Backend unreachable',
      });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Study Planner', to: '/schedule', icon: Calendar },
    { name: 'Analytics', to: '#', icon: BarChart3, phase: 'Phase 5' },
  ];

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-800/80 bg-[#0c1220]/95 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              CoursePilot
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                P3
              </span>
            </h1>
            <p className="text-xs text-slate-400">Academic Planning SaaS</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-3 mt-4 p-3 rounded-xl border border-slate-800/80 bg-[#0f172a]/80 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs uppercase">
              {user.name ? user.name.charAt(0) : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.phase) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                    {item.phase}
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="h-4 w-4 text-brand-400" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Connectivity Diagnostics */}
        <div className="p-4 mx-3 mb-4 rounded-xl border border-slate-800 bg-[#0f172a]/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="h-3 w-3" /> System Health
            </span>
            <button
              onClick={fetchHealth}
              title="Refresh health status"
              className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Backend API */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Express API</span>
              {health.loading ? (
                <span className="text-slate-500">Connecting...</span>
              ) : health.data ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <AlertCircle className="h-3 w-3" /> Offline
                </span>
              )}
            </div>

            {/* Database */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">MongoDB Atlas</span>
              {health.loading ? (
                <span className="text-slate-500">Checking...</span>
              ) : health.data?.database?.ready ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-amber-400 font-medium"
                  title="Configure MONGODB_URI in server/.env to enable persistence"
                >
                  <AlertCircle className="h-3 w-3" /> Disconnected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer with sign out */}
        <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Phase 3: Priority & Planner</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/60"
            title="Sign out of CoursePilot"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0c1220]/70 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>CoursePilot</span>
              <span>/</span>
              <span className="text-slate-200 font-medium">Academic Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-slate-100">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#0c1220] px-4 py-3 space-y-2">
            {user && (
              <div className="pb-2 border-b border-slate-800 text-xs">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-slate-400">{user.email}</p>
              </div>
            )}
            {navItems.map((item) =>
              item.phase ? (
                <div key={item.name} className="py-1.5 text-sm text-slate-500">
                  {item.name} <span className="text-xs text-slate-600">({item.phase})</span>
                </div>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm text-slate-300 hover:text-white"
                >
                  {item.name}
                </NavLink>
              )
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-sm text-rose-400 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
