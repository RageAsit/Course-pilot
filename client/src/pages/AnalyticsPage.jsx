import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  PieChart as PieIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalytics();
      if (res && res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load productivity analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatHours = (mins) => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const overview = analytics?.overview || {};
  const workloadBySubject = analytics?.workloadBySubject || [];
  const priorityDistribution = analytics?.priorityDistribution || [];
  const upcomingDeadlines = analytics?.upcomingDeadlines || {};
  const planMetrics = analytics?.planMetrics || {};
  const completionHistory = analytics?.completionHistory || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-brand-400" />
            Productivity Analytics
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Real academic metrics, workload distribution, and schedule capacity for{' '}
            <span className="text-slate-200 font-medium">{user?.name}</span>.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs text-rose-200 flex-1">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="text-xs font-medium text-rose-300 hover:text-rose-100 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-800 bg-[#0f172a]/40 p-4 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Top Metric Cards */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Completion Rate */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/80 p-5 backdrop-blur-sm flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Completion Rate</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">{overview.completionRate || 0}%</div>
              <div className="w-full bg-[#090d16] rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${overview.completionRate || 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {overview.completedAssignments || 0} completed of {overview.totalAssignments || 0} total tasks
              </p>
            </div>
          </div>

          {/* Card 2: Remaining Effort */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/80 p-5 backdrop-blur-sm flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Workload</span>
              <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">
                {formatHours(overview.totalRemainingMinutes)}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Estimated focus time across {overview.pendingAssignments || 0} active assignments
              </p>
            </div>
          </div>

          {/* Card 3: Overdue & Imminent Tasks */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/80 p-5 backdrop-blur-sm flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Urgent Attention</span>
              <div
                className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                  overview.overdueCount > 0
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{overview.overdueCount || 0}</span>
                <span className="text-xs text-rose-400 font-medium">Overdue</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {upcomingDeadlines.dueToday || 0} task{upcomingDeadlines.dueToday === 1 ? '' : 's'} due in the next 24 hours
              </p>
            </div>
          </div>

          {/* Card 4: Study Plan Scheduled Hours */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/80 p-5 backdrop-blur-sm flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Study Plan Scheduled</span>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">
                {formatHours(planMetrics.totalScheduledMinutes || 0)}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {planMetrics.hasActivePlan
                  ? `Allocated across ${planMetrics.scheduledSessionsCount || 0} focus sessions`
                  : 'No active study schedule generated'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Remaining Workload by Course */}
          <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-white">Remaining Workload by Course</h3>
              </div>
              <span className="text-[11px] text-slate-400">Focus Minutes</span>
            </div>

            {workloadBySubject.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadBySubject}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="subject"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val) => [`${val} mins (${formatHours(val)})`, 'Remaining Work']}
                    />
                    <Bar dataKey="remainingMinutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <BookOpen className="h-8 w-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">No active coursework found to chart.</p>
              </div>
            )}
          </div>

          {/* Chart 2: Priority Distribution */}
          <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Priority Distribution</h3>
              </div>
              <span className="text-[11px] text-slate-400">Active Tasks</span>
            </div>

            {priorityDistribution.some((p) => p.count > 0) ? (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val, name) => [`${val} assignment(s)`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <CheckCircle2 className="h-8 w-8 mb-2 stroke-[1.5] text-emerald-400" />
                <p className="text-xs">All coursework completed or queue empty.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Capacity Utilization & Timeline Section */}
      {!loading && analytics && (
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" /> Daily Study Schedule Utilization
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Focus minutes scheduled against your daily capacity limit.
              </p>
            </div>

            <Link
              to="/schedule"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600/30 text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              <span>Manage Planner</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {planMetrics.hasActivePlan && planMetrics.dailyUtilization.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={planMetrics.dailyUtilization}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="dateString"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val, name, item) => [
                        `${val} mins (${item.payload.utilizationRate}% of ${item.payload.capacityMinutes}m cap)`,
                        'Scheduled',
                      ]}
                    />
                    <Bar dataKey="usedMinutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Conflict / Warning alert if any */}
              {planMetrics.warningsCount > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      Planner detected {planMetrics.warningsCount} scheduling notice(s) or capacity limit(s).
                    </span>
                  </div>
                  <Link
                    to="/schedule"
                    className="font-semibold text-amber-300 hover:text-white underline shrink-0 ml-2"
                  >
                    View Schedule Warnings
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="mx-auto h-8 w-8 text-slate-500 mb-2 stroke-[1.5]" />
              <h4 className="text-xs font-semibold text-slate-200">No Study Schedule Generated Yet</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Generate an automatic study schedule to track your daily capacity utilization and focus session progress.
              </p>
              <div className="mt-4">
                <Link
                  to="/schedule"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Configure Study Plan</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
