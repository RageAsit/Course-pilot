import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Database,
  Server,
  ShieldCheck,
  Clock,
  Terminal,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api
      .checkHealth()
      .then((data) => {
        if (isMounted) {
          setHealthData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const phases = [
    {
      num: 'Phase 1',
      title: 'Foundation & Architecture',
      status: 'Current',
      desc: 'Monorepo layout, Express backend, React Vite client, Tailwind CSS, health monitoring, and documentation.',
      badge: 'Active',
      badgeColor: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    },
    {
      num: 'Phase 2',
      title: 'Authentication & Security',
      status: 'Upcoming',
      desc: 'JWT with HttpOnly cookies, bcrypt hashing, User model, and registration/login endpoints.',
      badge: 'Planned',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      num: 'Phase 3',
      title: 'Assignments & Prioritization',
      status: 'Upcoming',
      desc: 'Assignment CRUD, validation schemas, and the deterministic scoring algorithm.',
      badge: 'Planned',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      num: 'Phase 4',
      title: 'Study Schedule Generator',
      status: 'Upcoming',
      desc: 'Dynamic schedule generation, study block allocation, and conflict detection.',
      badge: 'Planned',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      num: 'Phase 5',
      title: 'Analytics & Deployment',
      status: 'Upcoming',
      desc: 'Recharts visual analytics, end-to-end testing, Vercel frontend, and Render backend deployment.',
      badge: 'Planned',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Academic Command Center
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          CoursePilot engineering foundation, system readiness, and architectural verification.
        </p>
      </div>

      {/* Backend & Environment Status Card */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/60 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">System Verification</h3>
              <p className="text-xs text-slate-400">Live Express API and MongoDB Atlas health checks</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {import.meta.env.VITE_API_URL || 'http://localhost:5000'}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* API Status */}
          <div className="rounded-lg border border-slate-800 bg-[#0b111e] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Express API</span>
              <Server className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {loading ? (
                <span className="text-xs text-slate-500">Checking...</span>
              ) : healthData ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">Operational</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-sm font-semibold text-rose-400">Unreachable</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {healthData?.service || 'backend service'}
            </p>
          </div>

          {/* Database Status */}
          <div className="rounded-lg border border-slate-800 bg-[#0b111e] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">MongoDB Atlas</span>
              <Database className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {loading ? (
                <span className="text-xs text-slate-500">Checking...</span>
              ) : healthData?.database?.ready ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">Disconnected</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              State: {healthData?.database?.status || 'awaiting URI'}
            </p>
          </div>

          {/* Environment */}
          <div className="rounded-lg border border-slate-800 bg-[#0b111e] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Environment</span>
              <Terminal className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-200">
              {healthData?.environment || 'development'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Runtime: Node.js {typeof window !== 'undefined' ? '' : ''}</p>
          </div>

          {/* Server Uptime */}
          <div className="rounded-lg border border-slate-800 bg-[#0b111e] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">API Uptime</span>
              <Clock className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-200">
              {healthData ? `${healthData.uptime}s` : '—'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Since last server boot</p>
          </div>
        </div>

        {/* Database setup notice if disconnected */}
        {!loading && healthData && !healthData.database.ready && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-200">Database Persistence Setup:</span>{' '}
              MongoDB connection string has not been configured in <code className="text-amber-100 bg-amber-950/40 px-1 py-0.5 rounded font-mono">server/.env</code>.
              Health endpoint correctly reports disconnected state. Database endpoints will be activated in Phase 2.
            </div>
          </div>
        )}

        {/* API connection error notice */}
        {!loading && error && (
          <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
            <div className="text-xs text-rose-200/90 leading-relaxed">
              <span className="font-semibold text-rose-200">Backend Unreachable:</span> {error}.
              Ensure the server is running locally via <code className="text-rose-100 bg-rose-950/40 px-1 py-0.5 rounded font-mono">npm run dev:server</code>.
            </div>
          </div>
        )}
      </div>

      {/* Production Project Roadmap */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-400" /> Implementation Roadmap
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.num}
              className={`rounded-xl border p-5 transition-all ${
                phase.status === 'Current'
                  ? 'border-brand-500/40 bg-[#10182b] shadow-lg shadow-brand-950/40'
                  : 'border-slate-800/80 bg-[#0f172a]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-medium text-brand-400">{phase.num}</span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${phase.badgeColor}`}
                >
                  {phase.badge}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">{phase.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Workspaces Zero State */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f172a]/40 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700/60">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">No Assignments Configured Yet</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          In keeping with the project specification, fake statistics and mock numbers have been omitted.
          Real assignment tracking, deadline scoring, and study schedule generation will be activated in Phase 2 and Phase 3.
        </p>
      </div>
    </div>
  );
}
