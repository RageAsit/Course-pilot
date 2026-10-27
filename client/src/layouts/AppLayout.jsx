import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Server,
  Database,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

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
    // Poll health status periodically
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, active: true },
    { name: 'Assignments', to: '#', icon: CheckSquare, phase: 'Phase 3' },
    { name: 'Schedule', to: '#', icon: Calendar, phase: 'Phase 4' },
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
                P1
              </span>
            </h1>
            <p className="text-xs text-slate-400">Academic Planning SaaS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
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

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <p>CoursePilot Engineering Project</p>
          <p className="text-slate-400">Phase 1: Architecture & Foundation</p>
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
              <span className="text-slate-200 font-medium">Foundation Shell</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm shadow-brand-900/30"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#0c1220] px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.name} className="py-2 text-sm text-slate-300">
                {item.name} {item.phase && <span className="text-xs text-slate-500">({item.phase})</span>}
              </div>
            ))}
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
