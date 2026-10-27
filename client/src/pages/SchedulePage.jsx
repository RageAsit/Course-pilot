import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#302C27] sm:text-3xl flex items-center gap-2.5">
            <CalendarDays className="h-7 w-7 text-[#68745B]" />
            Automatic Study Planner
          </h2>
          <p className="mt-1 text-xs text-[#777064]">
            Deterministic capacity scheduler balancing coursework, deadlines, and study blocks for <span className="text-[#302C27] font-medium">{user?.name}</span>.
          </p>
        </div>
      </div>

      {/* Generator Configuration Card */}
      <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-6 shadow-paper">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5] mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#68745B]" />
            <h3 className="text-sm font-serif font-semibold text-[#302C27]">Schedule Parameters</h3>
          </div>
          <span className="text-[11px] font-mono text-[#777064] bg-[#EDE5D8] px-2 py-0.5 rounded border border-[#DED5C7]">
            Algorithm: Greedy Capacity-Bounded
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#302C27] mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              required
              value={settings.startDate}
              onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
              className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#302C27] mb-1.5">
              Planning Horizon (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={settings.horizonDays}
              onChange={(e) => setSettings({ ...settings, horizonDays: e.target.value })}
              className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#302C27] mb-1.5">
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
              className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
            />
            <p className="mt-1 text-[10px] text-[#777064]">
              {formatHours(settings.dailyCapacityMinutes)} available per day
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#302C27] mb-1.5">
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
              className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
            />
            <p className="mt-1 text-[10px] text-[#777064]">
              Chunk length per focus session
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-3 border-t border-[#EAE2D5]">
            <span className="text-xs text-[#777064]">
              Calculates sessions from your real pending assignments and priority scores.
            </span>
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white font-semibold text-xs transition-all shadow-paper active:scale-[0.98] disabled:opacity-60"
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
        <div className="rounded-xl border border-[#C0D1C2] bg-[#EEF3EE] p-4 flex items-center gap-3 shadow-paper">
          <CheckCircle2 className="h-4 w-4 text-[#4E6B50] shrink-0" />
          <div className="text-xs text-[#4E6B50] font-medium">{successMessage}</div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-[#E8BDB7] bg-[#FBEBE8] p-4 flex items-start gap-3 shadow-paper">
          <AlertTriangle className="h-4 w-4 text-[#B94A3E] mt-0.5 shrink-0" />
          <div className="text-xs text-[#B94A3E] flex-1">{error}</div>
        </div>
      )}

      {/* Warnings & Conflict Banner */}
      {plan && plan.warnings && plan.warnings.length > 0 && (
        <div className="rounded-xl border border-[#E7CCA8] bg-[#FBF2E9] p-4 space-y-2 shadow-paper">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C87A3E]">
            <ShieldAlert className="h-4 w-4 text-[#C87A3E]" />
            <span>Scheduling Conflicts & Workload Notices ({plan.warnings.length})</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-[#777064]">
            {plan.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Unscheduled Tasks Section */}
      {plan && plan.unscheduled && plan.unscheduled.length > 0 && (
        <div className="rounded-xl border border-[#E8BDB7] bg-[#FDF6F5] p-4 space-y-3 shadow-paper">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B94A3E]">
            <AlertTriangle className="h-4 w-4 text-[#B94A3E]" />
            <span>Unscheduled Workload (Exceeded Daily Capacity)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.unscheduled.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-[#E8BDB7] bg-[#FFFCF6] p-3 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#302C27]">{item.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FBEBE8] text-[#B94A3E] border border-[#E8BDB7]">
                    {item.remainingMinutes}m unscheduled
                  </span>
                </div>
                <p className="text-[11px] text-[#777064]">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats Cards */}
      {plan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 shadow-paper">
            <span className="text-xs text-[#777064] font-medium">Total Study Time</span>
            <div className="mt-1 text-2xl font-serif font-bold text-[#302C27]">
              {formatHours(plan.totalStudyMinutesScheduled || 0)}
            </div>
            <p className="mt-1 text-[11px] text-[#777064]">
              Allocated across {plan.sessions?.length || 0} focus sessions
            </p>
          </div>

          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 shadow-paper">
            <span className="text-xs text-[#777064] font-medium">Assignments Scheduled</span>
            <div className="mt-1 text-2xl font-serif font-bold text-[#302C27]">
              {plan.totalAssignmentsScheduled || 0}
            </div>
            <p className="mt-1 text-[11px] text-[#777064]">Unique coursework projects covered</p>
          </div>

          <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 shadow-paper">
            <span className="text-xs text-[#777064] font-medium">Planning Horizon</span>
            <div className="mt-1 text-2xl font-serif font-bold text-[#302C27]">
              {plan.settings?.horizonDays || 7} Days
            </div>
            <p className="mt-1 text-[11px] text-[#777064]">
              {formatHours(plan.settings?.dailyCapacityMinutes || 180)} / day limit
            </p>
          </div>
        </div>
      )}

      {/* Daily Schedule Breakdown */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 animate-pulse shadow-paper" />
          ))}
        </div>
      ) : plan && plan.days && plan.days.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-semibold text-[#302C27] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#68745B]" /> Day-by-Day Focus Schedule
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
                  className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 space-y-3 shadow-paper"
                >
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#EAE2D5]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center font-bold text-xs text-[#68745B]">
                        {new Date(day.date).getDate()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#302C27]">{dayDateFormatted}</h4>
                        <p className="text-[11px] text-[#777064]">
                          {day.sessions?.length || 0} session{day.sessions?.length === 1 ? '' : 's'} scheduled
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-[#EDE5D8] rounded-full h-2 border border-[#DED5C7] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent >= 100
                              ? 'bg-[#B94A3E]'
                              : percent >= 75
                              ? 'bg-[#C87A3E]'
                              : 'bg-[#68745B]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium text-[#777064] min-w-[70px] text-right">
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
                          className="rounded-lg border border-[#EAE2D5] bg-[#FAF6EE] p-3.5 flex flex-col justify-between hover:border-[#DED5C7] transition-all shadow-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F9F3EC] text-[#B78A65] border border-[#DFCEBD]">
                                {session.subject}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4E6B50]">
                                <Clock className="h-3 w-3" />
                                {session.durationMinutes} mins
                              </span>
                            </div>
                            <h5 className="text-xs font-semibold text-[#302C27] line-clamp-2">
                              {session.title}
                            </h5>
                          </div>
                          <div className="mt-3 text-[10px] text-[#777064] flex items-center justify-between">
                            <span>Block #{session.order || sIdx + 1}</span>
                            <span>Focus Session</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-[#777064]">
                      Rest Day / Free Capacity — No study sessions required for this date.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-12 text-center shadow-paper">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] mb-3 shadow-xs">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-serif font-semibold text-[#302C27]">No Study Schedule Generated Yet</h3>
          <p className="mt-1 text-xs text-[#777064] max-w-md mx-auto">
            Configure your available daily capacity above and click "Generate Study Schedule" to automatically calculate focus sessions based on assignment priority.
          </p>
        </div>
      )}
    </div>
  );
}
