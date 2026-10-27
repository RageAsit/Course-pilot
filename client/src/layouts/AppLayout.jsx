import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Server,
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
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F0E7] text-[#302C27] font-sans antialiased">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-[#DED5C7] bg-[#EDE5D8]/80 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#DED5C7]/80 bg-[#EDE5D8]">
          <div className="h-9 w-9 rounded-lg bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold tracking-tight text-[#302C27] flex items-center gap-2">
              CoursePilot
              <span className="text-[10px] font-sans font-medium uppercase px-1.5 py-0.5 rounded bg-[#EEF2EC] text-[#68745B] border border-[#C5CDC0]">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-[#777064]">Academic Workspace</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-3 mt-4 p-3 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] shadow-paper flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#F9F3EC] text-[#B78A65] border border-[#DFCEBD] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user.name ? user.name.charAt(0) : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#302C27] truncate">{user.name}</p>
              <p className="text-[11px] text-[#777064] truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#FFFCF6] text-[#302C27] border border-[#DED5C7] shadow-paper font-semibold translate-x-0.5'
                      : 'text-[#777064] hover:text-[#302C27] hover:bg-[#F5EFE4]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-[#68745B]' : 'text-[#777064]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Diagnostics */}
        <div className="p-3.5 mx-3 mb-3 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] shadow-paper">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#777064] flex items-center gap-1.5 uppercase tracking-wider">
              <Server className="h-3 w-3 text-[#68745B]" /> System Health
            </span>
            <button
              onClick={fetchHealth}
              title="Refresh health status"
              className="text-[10px] text-[#68745B] hover:text-[#56614A] font-medium transition-colors"
            >
              Check
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Express API */}
            <div className="flex items-center justify-between py-0.5 border-b border-[#EAE2D5]">
              <span className="text-[#777064]">Express API</span>
              {health.loading ? (
                <span className="text-[#9A9285]">Checking...</span>
              ) : health.data ? (
                <span className="flex items-center gap-1 text-[#4E6B50] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4E6B50]"></span> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#B94A3E] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B94A3E]"></span> Offline
                </span>
              )}
            </div>

            {/* MongoDB Atlas */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#777064]">MongoDB Atlas</span>
              {health.loading ? (
                <span className="text-[#9A9285]">Checking...</span>
              ) : health.data?.database?.ready ? (
                <span className="flex items-center gap-1 text-[#4E6B50] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4E6B50]"></span> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#C87A3E] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C87A3E]"></span> Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer with sign out */}
        <div className="px-4 py-3 border-t border-[#DED5C7] flex items-center justify-between bg-[#EDE5D8]">
          <span className="text-[11px] text-[#777064] font-medium">CoursePilot</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-[#777064] hover:text-[#B94A3E] transition-colors px-2 py-1 rounded-md hover:bg-[#F5EFE4]"
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
        <header className="h-16 border-b border-[#DED5C7] bg-[#FFFCF6]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-paper">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#777064] hover:text-[#302C27] hover:bg-[#EDE5D8] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#777064]">
              <span className="font-serif font-medium text-[#302C27]">CoursePilot</span>
              <span>/</span>
              <span className="text-[#777064]">Academic Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-[#302C27]">{user.name}</p>
                  <p className="text-[11px] text-[#777064]">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DED5C7] bg-[#FFFCF6] text-[#777064] hover:text-[#B94A3E] hover:border-[#E8BDB7] hover:bg-[#FBEBE8] transition-all shadow-paper active:scale-[0.98]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#777064] hover:text-[#302C27] hover:bg-[#EDE5D8] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white transition-all shadow-paper active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#DED5C7] bg-[#EDE5D8] px-4 py-3 space-y-2 animate-fade-down shadow-paper">
            {user && (
              <div className="pb-2 border-b border-[#DED5C7] text-xs">
                <p className="font-semibold text-[#302C27]">{user.name}</p>
                <p className="text-[#777064]">{user.email}</p>
              </div>
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#FFFCF6] text-[#302C27] font-semibold border border-[#DED5C7]'
                      : 'text-[#777064] hover:text-[#302C27] hover:bg-[#F5EFE4]'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 px-3 text-xs font-medium text-[#B94A3E] hover:bg-[#FBEBE8] rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
