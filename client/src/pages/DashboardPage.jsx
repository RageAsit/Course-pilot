import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  Trash2,
  Edit3,
  Loader2,
  X,
  Search,
  BookOpen,
  Filter,
  Check,
  RotateCcw,
  Zap,
  Flame,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'assignments' | 'priorities'
  const [viewMode, setViewMode] = useState('assignments');
  const [priorities, setPriorities] = useState([]);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [priorityError, setPriorityError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [subjectQuery, setSubjectQuery] = useState('');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    estimatedMinutes: 60,
    remainingMinutes: 60,
    importance: 3,
  });

  // Fetch priority-ranked assignments
  const fetchPriorities = useCallback(async () => {
    try {
      setLoadingPriorities(true);
      setPriorityError(null);
      const res = await api.getPriorities();
      if (res && res.success) {
        setPriorities(res.assignments || []);
      }
    } catch (err) {
      setPriorityError(err.message || 'Failed to load priority calculations.');
    } finally {
      setLoadingPriorities(false);
    }
  }, []);

  // Fetch assignments from MongoDB
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (subjectQuery.trim()) {
        params.subject = subjectQuery.trim();
      }

      const res = await api.getAssignments(params);
      if (res && res.success) {
        setAssignments(res.assignments || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, subjectQuery]);

  useEffect(() => {
    fetchAssignments();
    fetchPriorities();
  }, [fetchAssignments, fetchPriorities]);

  // Lookup map for fast priority score retrieval by assignment ID
  const priorityMap = useMemo(() => {
    const map = {};
    priorities.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [priorities]);

  // Open modal for new assignment
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError('');
    // Default dueDate to tomorrow at 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setFormData({
      title: '',
      subject: '',
      description: '',
      dueDate: dateStr,
      estimatedMinutes: 60,
      remainingMinutes: 60,
      importance: 3,
    });
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (assignment) => {
    setEditingId(assignment.id);
    setFormError('');
    const dateStr = assignment.dueDate ? assignment.dueDate.split('T')[0] : '';
    setFormData({
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description || '',
      dueDate: dateStr,
      estimatedMinutes: assignment.estimatedMinutes,
      remainingMinutes: assignment.remainingMinutes,
      importance: assignment.importance,
    });
    setModalOpen(true);
  };

  // Handle form submission
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Assignment title is required.');
      return;
    }
    if (!formData.subject.trim()) {
      setFormError('Subject is required.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due date is required.');
      return;
    }
    const est = parseInt(formData.estimatedMinutes, 10);
    const rem = parseInt(formData.remainingMinutes, 10);

    if (isNaN(est) || est <= 0) {
      setFormError('Estimated time must be at least 1 minute.');
      return;
    }
    if (isNaN(rem) || rem < 0) {
      setFormError('Remaining time cannot be negative.');
      return;
    }
    if (rem > est) {
      setFormError('Remaining time cannot exceed estimated time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        estimatedMinutes: est,
        remainingMinutes: rem,
        importance: parseInt(formData.importance, 10),
      };

      if (editingId) {
        await api.updateAssignment(editingId, payload);
      } else {
        await api.createAssignment(payload);
      }

      setModalOpen(false);
      await fetchAssignments();
      await fetchPriorities();
    } catch (err) {
      setFormError(err.message || 'Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle complete / reopen
  const handleToggleStatus = async (assignment) => {
    try {
      if (assignment.status === 'completed') {
        await api.reopenAssignment(assignment.id);
      } else {
        await api.completeAssignment(assignment.id);
      }
      await fetchAssignments();
      await fetchPriorities();
    } catch (err) {
      alert(err.message || 'Failed to update assignment status.');
    }
  };

  // Delete assignment
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await api.deleteAssignment(id);
      await fetchAssignments();
      await fetchPriorities();
    } catch (err) {
      alert(err.message || 'Failed to delete assignment.');
    }
  };

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Assignments & Tasks
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Authenticated workspace for <span className="text-slate-200 font-medium">{user?.name}</span>. Data persists in MongoDB Atlas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-4 backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status & Priority Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#090d16] border border-slate-800/80">
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'assignments' && statusFilter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('pending');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'assignments' && statusFilter === 'pending'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'assignments' && statusFilter === 'completed'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => {
              setViewMode('priorities');
              fetchPriorities();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'priorities'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Priority Queue ({priorities.length})</span>
          </button>
        </div>

        {/* Search by subject */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by subject (e.g. CS101)..."
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#090d16]/90 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRIORITY QUEUE VIEW (PHASE 3 DETERMINISTIC ENGINE)            */}
      {/* ============================================================== */}
      {viewMode === 'priorities' && (
        <div className="space-y-4">
          {/* Priority Engine Info Banner */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-200">
                  Phase 3 Priority Engine (0–100 Deterministic Scoring)
                </h4>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Calculated from: Urgency (40%), Importance (30%), Effort (20%), and Overdue Status (10%). Completed tasks are excluded.
                </p>
              </div>
            </div>
            <Link
              to="/schedule"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors shrink-0 shadow-sm"
            >
              <span>Generate Study Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Priority calculation error */}
          {priorityError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">
              {priorityError}
            </div>
          )}

          {/* Loading state */}
          {loadingPriorities && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-slate-800 bg-[#0f172a]/40 p-4 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty priorities state */}
          {!loadingPriorities && priorities.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/40 p-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">No Active Tasks in Priority Queue</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All your assignments are completed or no assignments exist. Create a pending assignment to see its real-time priority score.
              </p>
            </div>
          )}

          {/* Ranked List */}
          {!loadingPriorities && priorities.length > 0 && (
            <div className="space-y-3">
              {priorities.map((item, index) => {
                const exp = item.priorityExplanation || {};
                const isOverdue = exp.isOverdue;
                const score = item.priorityScore || 0;

                const scoreBadgeClass =
                  score >= 75
                    ? 'text-rose-300 border-rose-500/40 bg-rose-500/15'
                    : score >= 50
                    ? 'text-amber-300 border-amber-500/40 bg-amber-500/15'
                    : 'text-brand-300 border-brand-500/40 bg-brand-500/15';

                const dueDateFormatted = new Date(item.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4.5 bg-[#0f172a]/80 transition-all ${
                      isOverdue ? 'border-rose-500/40 shadow-sm shadow-rose-950/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#090d16] border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                              {item.subject}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <Flame className="h-3 w-3" /> Overdue
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white mt-1">{item.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-slate-400 hidden sm:block">
                          <div>Due: {dueDateFormatted}</div>
                          <div>{item.remainingMinutes}m remaining</div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${scoreBadgeClass} text-center min-w-[70px]`}>
                          <span className="text-[10px] text-slate-400 block font-normal uppercase">Priority</span>
                          {score}/100
                        </div>
                      </div>
                    </div>

                    {/* Natural language reason explanation */}
                    <div className="mt-3 text-xs text-slate-300 bg-[#090d16]/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-slate-400 font-semibold">Priority Driver: </span>
                        <span>{exp.summary || 'Computed from urgency, importance, and remaining effort.'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Mark completed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                          title="Edit assignment"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 4 Factor Breakdown Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px]">
                      <div className="bg-[#090d16] p-2 rounded border border-slate-800/60">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Urgency</span>
                          <span className="font-mono">{exp.urgencyScore || 0}/40</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${((exp.urgencyScore || 0) / 40) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#090d16] p-2 rounded border border-slate-800/60">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Importance</span>
                          <span className="font-mono">{exp.importanceScore || 0}/30</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${((exp.importanceScore || 0) / 30) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#090d16] p-2 rounded border border-slate-800/60">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Effort</span>
                          <span className="font-mono">{exp.effortScore || 0}/20</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${((exp.effortScore || 0) / 20) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#090d16] p-2 rounded border border-slate-800/60">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Overdue</span>
                          <span className="font-mono">{exp.overdueBonus || 0}/10</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${((exp.overdueBonus || 0) / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STANDARD ASSIGNMENT LIST VIEW                                 */}
      {/* ============================================================== */}
      {viewMode === 'assignments' && (
        <>
          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="text-xs text-rose-200 flex-1">{error}</div>
              <button
                onClick={fetchAssignments}
                className="text-xs font-medium text-rose-300 hover:text-rose-100 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                    <div className="h-5 w-48 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && assignments.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/40 p-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No assignments found</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {statusFilter !== 'all' || subjectQuery
                  ? 'No assignments match your current filters. Try resetting the filter.'
                  : 'Your workspace is clear. Create your first assignment to begin tracking coursework.'}
              </p>
              <div className="mt-5">
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Assignment</span>
                </button>
              </div>
            </div>
          )}

          {/* Assignment List Grid */}
          {!loading && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => {
                const isCompleted = assignment.status === 'completed';
                const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const pri = priorityMap[assignment.id];
                const isOverdue = pri?.priorityExplanation?.isOverdue;

                // Importance color coding
                const importanceColors = {
                  1: 'bg-slate-500/10 text-slate-400 border-slate-700',
                  2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  3: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  4: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  5: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                };

                return (
                  <div
                    key={assignment.id}
                    className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
                      isCompleted
                        ? 'border-slate-800/60 bg-[#0b111e]/40 opacity-75'
                        : isOverdue
                        ? 'border-rose-500/30 bg-[#0f172a]/80 shadow-sm'
                        : 'border-slate-800 bg-[#0f172a]/70 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Card Header: Subject, Status Toggle, Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 truncate">
                            {assignment.subject}
                          </span>
                          {isOverdue && !isCompleted && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(assignment)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit assignment"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id, assignment.title)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Toggle */}
                      <div className="flex items-start gap-2.5 mt-2">
                        <button
                          onClick={() => handleToggleStatus(assignment)}
                          className="mt-0.5 text-slate-400 hover:text-brand-400 transition-colors shrink-0"
                          title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                        <h3
                          className={`text-sm font-semibold text-white leading-snug break-words ${
                            isCompleted ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {assignment.title}
                        </h3>
                      </div>

                      {/* Description if present */}
                      {assignment.description && (
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2 pl-6">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Metadata */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5" title="Due Date">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{dueDateFormatted}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1" title="Remaining / Estimated minutes">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {assignment.remainingMinutes}m / {assignment.estimatedMinutes}m
                          </span>
                        </div>

                        {pri && !isCompleted && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              pri.priorityScore >= 75
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : pri.priorityScore >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                            }`}
                            title={`Priority Score: ${pri.priorityScore}/100. ${pri.priorityExplanation?.summary}`}
                          >
                            Score {pri.priorityScore}
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            importanceColors[assignment.importance] || importanceColors[3]
                          }`}
                          title={`Importance level: ${assignment.importance} of 5`}
                        >
                          P{assignment.importance}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Creation & Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">
                {editingId ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Lab 3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS450"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimated Time (mins) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.estimatedMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setFormData({
                        ...formData,
                        estimatedMinutes: val,
                        // If creating and remaining hasn't been modified or equals previous estimated, update remaining too
                        remainingMinutes: !editingId ? val : formData.remainingMinutes,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Remaining Time (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.estimatedMinutes}
                    value={formData.remainingMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remainingMinutes: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Importance (1-5)
                  </label>
                  <select
                    value={formData.importance}
                    onChange={(e) =>
                      setFormData({ ...formData, importance: parseInt(e.target.value, 10) })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value={1}>1 - Low Priority</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - High Importance</option>
                    <option value={5}>5 - Critical / Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional assignment details, rubric requirements, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-[#090d16] px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Save Changes' : 'Create Assignment'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
