import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Layers,
  Sliders,
  RotateCcw,
  Loader2,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SchedulePage() {
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Planner Settings Form
  const [settings, setSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    horizonDays: 7,
    dailyCapacityMinutes: 180,
    preferredSessionMinutes: 45,
  });

  // Fetch current persisted plan
  const fetchCurrentPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCurrentPlan();
      if (res && res.success && res.plan) {
        setPlan(res.plan);
        if (res.plan.settings) {
          setSettings({
            startDate: res.plan.settings.startDate
              ? res.plan.settings.startDate.split('T')[0]
              : new Date().toISOString().split('T')[0],
            horizonDays: res.plan.settings.horizonDays || 7,
            dailyCapacityMinutes: res.plan.settings.dailyCapacityMinutes || 180,
            preferredSessionMinutes: res.plan.settings.preferredSessionMinutes || 45,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load study plan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentPlan();
  }, [fetchCurrentPlan]);

  // Handle plan generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setSuccessMessage('');

    try {
      const payload = {
        startDate: settings.startDate,
        horizonDays: parseInt(settings.horizonDays, 10),
        dailyCapacityMinutes: parseInt(settings.dailyCapacityMinutes, 10),
        preferredSessionMinutes: parseInt(settings.preferredSessionMinutes, 10),
      };

      const res = await api.generatePlan(payload);
      if (res && res.success && res.plan) {
        setPlan(res.plan);
        setSuccessMessage('Optimized study schedule generated and persisted in MongoDB Atlas.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate study schedule.');
    } finally {
      setGenerating(false);
    }
  };

  const formatHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <CalendarDays className="h-7 w-7 text-brand-400" />
            Automatic Study Planner
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Deterministic interval scheduler balancing workload capacity, deadlines, and session blocks for <span className="text-slate-200 font-medium">{user?.name}</span>.
          </p>
        </div>
      </div>

      {/* Generator Configuration Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Schedule Configuration Parameters</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Algorithm: Greedy Capacity-Bounded Scheduler
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              required
              value={settings.startDate}
              onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Planning Horizon (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={settings.horizonDays}
              onChange={(e) => setSettings({ ...settings, horizonDays: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Daily Capacity (Minutes)
            </label>
            <input
              type="number"
              min="30"
              max="720"
              step="15"
              required
              value={settings.dailyCapacityMinutes}
              onChange={(e) => setSettings({ ...settings, dailyCapacityMinutes: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              {formatHours(settings.dailyCapacityMinutes)} available per day
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Session Block (Minutes)
            </label>
            <input
              type="number"
              min="15"
              max="180"
              step="15"
              required
              value={settings.preferredSessionMinutes}
              onChange={(e) => setSettings({ ...settings, preferredSessionMinutes: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Chunk length per focus block
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              Uses your real, pending MongoDB assignments and priority scores.
            </span>
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-950/40 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Optimizing Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Study Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="text-xs text-emerald-200">{successMessage}</div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs text-rose-200 flex-1">{error}</div>
        </div>
      )}

      {/* Warnings & Conflict Banner */}
      {plan && plan.warnings && plan.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Scheduling Conflicts & Workload Notices ({plan.warnings.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-200/90">
            {plan.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Unscheduled Tasks Section */}
      {plan && plan.unscheduled && plan.unscheduled.length > 0 && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Unscheduled Workload (Exceeded Daily Capacity)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.unscheduled.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-rose-500/30 bg-[#090d16]/80 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {item.remainingMinutes}m unscheduled
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats Cards */}
      {plan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4">
            <span className="text-xs text-slate-400">Total Study Time</span>
            <div className="mt-1 text-xl font-bold text-white">
              {formatHours(plan.totalStudyMinutesScheduled || 0)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Allocated across {plan.sessions?.length || 0} focus sessions
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4">
            <span className="text-xs text-slate-400">Assignments Scheduled</span>
            <div className="mt-1 text-xl font-bold text-white">
              {plan.totalAssignmentsScheduled || 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Unique coursework projects covered</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4">
            <span className="text-xs text-slate-400">Planning Horizon</span>
            <div className="mt-1 text-xl font-bold text-white">
              {plan.settings?.horizonDays || 7} Days
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {formatHours(plan.settings?.dailyCapacityMinutes || 180)} / day limit
            </p>
          </div>
        </div>
      )}

      {/* Daily Schedule Breakdown */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-slate-800 bg-[#0f172a]/40 p-4 animate-pulse" />
          ))}
        </div>
      ) : plan && plan.days && plan.days.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" /> Day-by-Day Focus Schedule
          </h3>

          <div className="space-y-4">
            {plan.days.map((day) => {
              const dayDateFormatted = new Date(day.date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              const usedMins = day.usedMinutes || 0;
              const capMins = day.capacityMinutes || plan.settings?.dailyCapacityMinutes || 180;
              const percent = Math.min(100, Math.round((usedMins / capMins) * 100));

              return (
                <div
                  key={day.dateString}
                  className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center font-bold text-xs text-brand-300">
                        {new Date(day.date).getDate()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{dayDateFormatted}</h4>
                        <p className="text-[11px] text-slate-400">
                          {day.sessions?.length || 0} session{day.sessions?.length === 1 ? '' : 's'} scheduled
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-[#090d16] rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 100
                              ? 'bg-rose-500'
                              : percent >= 75
                              ? 'bg-amber-500'
                              : 'bg-brand-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-300 min-w-[70px] text-right">
                        {usedMins}m / {capMins}m
                      </span>
                    </div>
                  </div>

                  {/* Sessions within this day */}
                  {day.sessions && day.sessions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {day.sessions.map((session, sIdx) => (
                        <div
                          key={sIdx}
                          className="rounded-lg border border-slate-800/90 bg-[#090d16]/90 p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                                {session.subject}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <Clock className="h-3 w-3" />
                                {session.durationMinutes} mins
                              </span>
                            </div>
                            <h5 className="text-xs font-semibold text-white line-clamp-2">
                              {session.title}
                            </h5>
                          </div>
                          <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Block #{session.order || sIdx + 1}</span>
                            <span>Focus Session</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      Rest Day / Free Capacity — No study sessions needed for this date.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/40 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Study Schedule Generated Yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            Configure your available daily capacity above and click "Generate Study Schedule" to automatically calculate focus sessions based on assignment priority.
          </p>
        </div>
      )}
    </div>
  );
}
