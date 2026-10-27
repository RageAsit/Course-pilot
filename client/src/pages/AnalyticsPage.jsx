import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  ArrowRight,
  BookOpen,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
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
  const rawPriorityDistribution = analytics?.priorityDistribution || [];
  const upcomingDeadlines = analytics?.upcomingDeadlines || {};
  const planMetrics = analytics?.planMetrics || {};

  // Palette-adjusted priority distribution
  const priorityColorMap = {
    'Critical (75-100)': '#B94A3E', // Terracotta
    'High (50-74)': '#C87A3E',     // Ochre
    'Moderate (25-49)': '#B78A65', // Caramel
    'Low (0-24)': '#68745B',       // Olive
  };

  const priorityDistribution = rawPriorityDistribution.map((p) => ({
    ...p,
    fill: priorityColorMap[p.name] || p.fill || '#68745B',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#302C27] sm:text-3xl flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-[#68745B]" />
            Productivity Analytics
          </h2>
          <p className="mt-1 text-xs text-[#777064]">
            Academic metrics, workload distribution, and schedule capacity for{' '}
            <span className="text-[#302C27] font-medium">{user?.name}</span>.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DED5C7] bg-[#FFFCF6] hover:bg-[#EDE5D8] text-[#777064] text-xs font-semibold transition-all shadow-paper active:scale-[0.98] disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-[#E8BDB7] bg-[#FBEBE8] p-4 flex items-start gap-3 shadow-paper">
          <AlertTriangle className="h-4 w-4 text-[#B94A3E] mt-0.5 shrink-0" />
          <div className="text-xs text-[#B94A3E] flex-1">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="text-xs font-medium text-[#B94A3E] hover:underline"
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
              className="h-28 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 animate-pulse shadow-paper"
            />
          ))}
        </div>
      )}

      {/* Top Metric Cards */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Completion Rate */}
          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 shadow-paper flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#777064]">Completion Rate</span>
              <div className="h-7 w-7 rounded-lg bg-[#EEF3EE] border border-[#C0D1C2] flex items-center justify-center text-[#4E6B50]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#302C27]">{overview.completionRate || 0}%</div>
              <div className="w-full bg-[#EDE5D8] rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-[#4E6B50] h-full rounded-full transition-all duration-300"
                  style={{ width: `${overview.completionRate || 0}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#777064]">
                {overview.completedAssignments || 0} completed of {overview.totalAssignments || 0} tasks
              </p>
            </div>
          </div>

          {/* Card 2: Remaining Effort */}
          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 shadow-paper flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#777064]">Active Workload</span>
              <div className="h-7 w-7 rounded-lg bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#302C27]">
                {formatHours(overview.totalRemainingMinutes)}
              </div>
              <p className="mt-2 text-[11px] text-[#777064]">
                Focus time across {overview.pendingAssignments || 0} active assignments
              </p>
            </div>
          </div>

          {/* Card 3: Overdue & Imminent Tasks */}
          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 shadow-paper flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#777064]">Urgent Attention</span>
              <div
                className={`h-7 w-7 rounded-lg border flex items-center justify-center ${
                  overview.overdueCount > 0
                    ? 'bg-[#FBEBE8] border-[#E8BDB7] text-[#B94A3E]'
                    : 'bg-[#EDE5D8] border-[#DED5C7] text-[#777064]'
                }`}
              >
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#302C27]">{overview.overdueCount || 0}</span>
                <span className="text-xs text-[#B94A3E] font-medium">Overdue</span>
              </div>
              <p className="mt-2 text-[11px] text-[#777064]">
                {upcomingDeadlines.dueToday || 0} task{upcomingDeadlines.dueToday === 1 ? '' : 's'} due within 24h
              </p>
            </div>
          </div>

          {/* Card 4: Study Plan Scheduled Hours */}
          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 shadow-paper flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#777064]">Study Plan Scheduled</span>
              <div className="h-7 w-7 rounded-lg bg-[#F9F3EC] border border-[#DFCEBD] flex items-center justify-center text-[#B78A65]">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-serif font-bold text-[#302C27]">
                {formatHours(planMetrics.totalScheduledMinutes || 0)}
              </div>
              <p className="mt-2 text-[11px] text-[#777064]">
                {planMetrics.hasActivePlan
                  ? `Allocated across ${planMetrics.scheduledSessionsCount || 0} focus sessions`
                  : 'No active schedule generated'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Remaining Workload by Course */}
          <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-6 shadow-paper space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#68745B]" />
                <h3 className="text-sm font-serif font-semibold text-[#302C27]">Remaining Workload by Course</h3>
              </div>
              <span className="text-[11px] font-mono text-[#777064]">Minutes</span>
            </div>

            {workloadBySubject.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadBySubject}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D5" />
                    <XAxis
                      dataKey="subject"
                      stroke="#777064"
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#777064" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFCF6',
                        borderColor: '#DED5C7',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#302C27',
                        boxShadow: '0 4px 16px rgba(48, 44, 39, 0.08)',
                      }}
                      formatter={(val) => [`${val} mins (${formatHours(val)})`, 'Remaining Work']}
                    />
                    <Bar dataKey="remainingMinutes" fill="#68745B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#9A9285]">
                <BookOpen className="h-8 w-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">No active coursework found to chart.</p>
              </div>
            )}
          </div>

          {/* Chart 2: Priority Distribution */}
          <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-6 shadow-paper space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#B78A65]" />
                <h3 className="text-sm font-serif font-semibold text-[#302C27]">Priority Distribution</h3>
              </div>
              <span className="text-[11px] font-mono text-[#777064]">Active Tasks</span>
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
                        backgroundColor: '#FFFCF6',
                        borderColor: '#DED5C7',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#302C27',
                        boxShadow: '0 4px 16px rgba(48, 44, 39, 0.08)',
                      }}
                      formatter={(val, name) => [`${val} assignment(s)`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-[#777064]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#9A9285]">
                <CheckCircle2 className="h-8 w-8 mb-2 stroke-[1.5] text-[#4E6B50]" />
                <p className="text-xs">All coursework completed or queue empty.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Capacity Utilization Section */}
      {!loading && analytics && (
        <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-6 shadow-paper space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#EAE2D5]">
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#302C27] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#B78A65]" /> Daily Study Schedule Utilization
              </h3>
              <p className="text-[11px] text-[#777064] mt-0.5">
                Focus minutes scheduled against your daily capacity limit.
              </p>
            </div>

            <Link
              to="/schedule"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF6EE] text-[#68745B] border border-[#C5CDC0] hover:bg-[#EEF2EC] text-xs font-semibold transition-colors self-start sm:self-auto shadow-xs"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE2D5" />
                    <XAxis
                      dataKey="dateString"
                      stroke="#777064"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#777064" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFCF6',
                        borderColor: '#DED5C7',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#302C27',
                        boxShadow: '0 4px 16px rgba(48, 44, 39, 0.08)',
                      }}
                      formatter={(val, name, item) => [
                        `${val} mins (${item.payload.utilizationRate}% of ${item.payload.capacityMinutes}m cap)`,
                        'Scheduled',
                      ]}
                    />
                    <Bar dataKey="usedMinutes" fill="#B78A65" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Conflict / Warning alert if any */}
              {planMetrics.warningsCount > 0 && (
                <div className="p-3.5 rounded-xl border border-[#E7CCA8] bg-[#FBF2E9] flex items-center justify-between text-xs text-[#C87A3E]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#C87A3E] shrink-0" />
                    <span>
                      Planner detected {planMetrics.warningsCount} scheduling notice(s) or capacity limit(s).
                    </span>
                  </div>
                  <Link
                    to="/schedule"
                    className="font-semibold text-[#C87A3E] hover:underline shrink-0 ml-2"
                  >
                    View Schedule Warnings
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[#9A9285]">
              <Calendar className="mx-auto h-8 w-8 text-[#9A9285] mb-2 stroke-[1.5]" />
              <h4 className="text-xs font-serif font-semibold text-[#302C27]">No Study Schedule Generated Yet</h4>
              <p className="text-[11px] text-[#777064] mt-1 max-w-sm mx-auto">
                Generate an automatic study schedule to track your daily capacity utilization and focus session progress.
              </p>
              <div className="mt-4">
                <Link
                  to="/schedule"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white text-xs font-semibold transition-all shadow-paper active:scale-[0.98]"
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
