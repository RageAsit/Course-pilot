import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  Edit3,
  Loader2,
  X,
  Search,
  BookOpen,
  Zap,
  Flame,
  ArrowRight,
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

  // Deadline & Conflict Awareness
  const now = new Date();
  const overdueAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'pending' && new Date(a.dueDate) < now),
    [assignments, now]
  );
  const dueSoonAssignments = useMemo(
    () =>
      assignments.filter((a) => {
        if (a.status !== 'pending') return false;
        const due = new Date(a.dueDate);
        const diffHours = (due - now) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 24;
      }),
    [assignments, now]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#302C27] sm:text-3xl">
            Assignments & Coursework
          </h2>
          <p className="mt-1 text-xs text-[#777064]">
            Academic workspace for <span className="text-[#302C27] font-medium">{user?.name}</span>. Data synchronizes live with MongoDB Atlas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white font-semibold text-xs transition-all shadow-paper active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Immediate Deadline & Conflict Alert Banner */}
      {(overdueAssignments.length > 0 || dueSoonAssignments.length > 0) && (
        <div className="rounded-xl border border-[#E8BDB7] bg-[#FDF6F5] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-paper">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#FBEBE8] border border-[#E8BDB7] text-[#B94A3E] shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-[#302C27]">Action Required</h4>
                {overdueAssignments.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FBEBE8] text-[#B94A3E] border border-[#E8BDB7] flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {overdueAssignments.length} Overdue
                  </span>
                )}
                {dueSoonAssignments.length > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FBF2E9] text-[#C87A3E] border border-[#E7CCA8] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dueSoonAssignments.length} Due within 24h
                  </span>
                )}
              </div>
              <p className="text-xs text-[#777064] mt-1">
                {overdueAssignments.length > 0
                  ? `You have ${overdueAssignments.length} overdue task(s) needing immediate attention or rescheduling.`
                  : `You have ${dueSoonAssignments.length} assignment(s) due today. Review study schedules to prevent missed deadlines.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setViewMode('priorities');
                fetchPriorities();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#FFFCF6] hover:bg-[#FBEBE8] text-[#B94A3E] border border-[#E8BDB7] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 text-[#B94A3E]" />
              <span>Inspect Priorities</span>
            </button>
            <Link
              to="/schedule"
              className="px-3 py-1.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-paper active:scale-[0.98]"
            >
              <span>Auto-Plan Study</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-3 shadow-paper flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status & Priority Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#EDE5D8] border border-[#DED5C7]">
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'assignments' && statusFilter === 'all'
                ? 'bg-[#FFFCF6] text-[#302C27] font-semibold shadow-paper'
                : 'text-[#777064] hover:text-[#302C27]'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('pending');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'assignments' && statusFilter === 'pending'
                ? 'bg-[#FFFCF6] text-[#302C27] font-semibold shadow-paper'
                : 'text-[#777064] hover:text-[#302C27]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => {
              setViewMode('assignments');
              setStatusFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'assignments' && statusFilter === 'completed'
                ? 'bg-[#FFFCF6] text-[#302C27] font-semibold shadow-paper'
                : 'text-[#777064] hover:text-[#302C27]'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => {
              setViewMode('priorities');
              fetchPriorities();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'priorities'
                ? 'bg-[#F9F3EC] text-[#B78A65] border border-[#DFCEBD] shadow-paper'
                : 'text-[#B78A65] hover:bg-[#F9F3EC]'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-[#B78A65]" />
            <span>Priority Queue ({priorities.length})</span>
          </button>
        </div>

        {/* Search by subject */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-[#9A9285] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter by subject (e.g. CS101)..."
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] pl-8 pr-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRIORITY QUEUE VIEW (DETERMINISTIC 40/30/20/10 ENGINE)         */}
      {/* ============================================================== */}
      {viewMode === 'priorities' && (
        <div className="space-y-4 animate-fade-in">
          {/* Priority Engine Info Banner */}
          <div className="rounded-xl border border-[#DFCEBD] bg-[#FAF6F1] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-paper">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-[#B78A65] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#302C27]">
                  Deterministic Priority Engine (0–100 Scale)
                </h4>
                <p className="text-[11px] text-[#777064] mt-0.5">
                  Calculated from: Urgency (40%), Importance (30%), Effort (20%), and Overdue Status (10%). Completed tasks are excluded.
                </p>
              </div>
            </div>
            <Link
              to="/schedule"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white text-xs font-semibold transition-colors shrink-0 shadow-paper active:scale-[0.98]"
            >
              <span>Generate Study Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Priority calculation error */}
          {priorityError && (
            <div className="rounded-xl border border-[#E8BDB7] bg-[#FBEBE8] p-4 text-xs text-[#B94A3E]">
              {priorityError}
            </div>
          )}

          {/* Loading state */}
          {loadingPriorities && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-4 animate-pulse shadow-paper"
                />
              ))}
            </div>
          )}

          {/* Empty priorities state */}
          {!loadingPriorities && priorities.length === 0 && (
            <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-12 text-center shadow-paper">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#4E6B50] mb-2" />
              <h3 className="text-sm font-serif font-semibold text-[#302C27]">No Active Tasks in Priority Queue</h3>
              <p className="text-xs text-[#777064] mt-1 max-w-sm mx-auto">
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
                    ? 'text-[#B94A3E] border-[#E8BDB7] bg-[#FBEBE8]'
                    : score >= 50
                    ? 'text-[#C87A3E] border-[#E7CCA8] bg-[#FBF2E9]'
                    : 'text-[#68745B] border-[#C5CDC0] bg-[#EEF2EC]';

                const dueDateFormatted = new Date(item.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4.5 bg-[#FFFCF6] shadow-paper transition-all hover:shadow-paper-elevated ${
                      isOverdue ? 'border-[#E8BDB7] bg-[#FDF6F5]' : 'border-[#DED5C7] hover:border-[#C9BEAD]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE2D5]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#EDE5D8] border border-[#DED5C7] flex items-center justify-center font-bold text-xs text-[#777064]">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F9F3EC] text-[#B78A65] border border-[#DFCEBD]">
                              {item.subject}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FBEBE8] text-[#B94A3E] border border-[#E8BDB7] flex items-center gap-1">
                                <Flame className="h-3 w-3" /> Overdue
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-[#302C27] mt-1">{item.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-[#777064] hidden sm:block">
                          <div>Due: {dueDateFormatted}</div>
                          <div>{item.remainingMinutes}m remaining</div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${scoreBadgeClass} text-center min-w-[70px] shadow-xs`}>
                          <span className="text-[10px] text-[#777064] block font-normal uppercase tracking-wider">Priority</span>
                          {score}/100
                        </div>
                      </div>
                    </div>

                    {/* Natural language reason explanation */}
                    <div className="mt-3 text-xs text-[#302C27] bg-[#FAF6EE] p-2.5 rounded-lg border border-[#EAE2D5] flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[#777064] font-semibold">Priority Driver: </span>
                        <span>{exp.summary || 'Computed from urgency, importance, and remaining effort.'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="p-1 rounded text-[#777064] hover:text-[#4E6B50] transition-colors"
                          title="Mark completed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded text-[#777064] hover:text-[#302C27] transition-colors"
                          title="Edit assignment"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 4 Factor Breakdown Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px]">
                      <div className="bg-[#FAF6EE] p-2 rounded border border-[#EAE2D5]">
                        <div className="flex justify-between text-[#777064] mb-1">
                          <span>Urgency</span>
                          <span className="font-mono text-[#302C27]">{exp.urgencyScore || 0}/40</span>
                        </div>
                        <div className="w-full bg-[#EDE5D8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#68745B] h-full rounded-full transition-all duration-300"
                            style={{ width: `${((exp.urgencyScore || 0) / 40) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#FAF6EE] p-2 rounded border border-[#EAE2D5]">
                        <div className="flex justify-between text-[#777064] mb-1">
                          <span>Importance</span>
                          <span className="font-mono text-[#302C27]">{exp.importanceScore || 0}/30</span>
                        </div>
                        <div className="w-full bg-[#EDE5D8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#B78A65] h-full rounded-full transition-all duration-300"
                            style={{ width: `${((exp.importanceScore || 0) / 30) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#FAF6EE] p-2 rounded border border-[#EAE2D5]">
                        <div className="flex justify-between text-[#777064] mb-1">
                          <span>Effort</span>
                          <span className="font-mono text-[#302C27]">{exp.effortScore || 0}/20</span>
                        </div>
                        <div className="w-full bg-[#EDE5D8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#CDB795] h-full rounded-full transition-all duration-300"
                            style={{ width: `${((exp.effortScore || 0) / 20) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#FAF6EE] p-2 rounded border border-[#EAE2D5]">
                        <div className="flex justify-between text-[#777064] mb-1">
                          <span>Overdue</span>
                          <span className="font-mono text-[#302C27]">{exp.overdueBonus || 0}/10</span>
                        </div>
                        <div className="w-full bg-[#EDE5D8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#B94A3E] h-full rounded-full transition-all duration-300"
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
        <div className="animate-fade-in">
          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-[#E8BDB7] bg-[#FBEBE8] p-4 flex items-start gap-3 shadow-paper">
              <AlertTriangle className="h-4 w-4 text-[#B94A3E] mt-0.5 shrink-0" />
              <div className="text-xs text-[#B94A3E] flex-1">{error}</div>
              <button
                onClick={fetchAssignments}
                className="text-xs font-medium text-[#B94A3E] hover:underline"
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
                  className="h-40 rounded-xl border border-[#DED5C7] bg-[#FFFCF6] p-5 animate-pulse flex flex-col justify-between shadow-paper"
                >
                  <div className="space-y-2.5">
                    <div className="h-4 w-24 bg-[#EDE5D8] rounded" />
                    <div className="h-5 w-48 bg-[#EDE5D8] rounded" />
                  </div>
                  <div className="h-4 w-32 bg-[#EDE5D8] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && assignments.length === 0 && (
            <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-12 text-center shadow-paper">
              <div className="mx-auto h-12 w-12 rounded-xl bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] mb-3 shadow-xs">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#302C27]">No assignments found</h3>
              <p className="mt-1 text-xs text-[#777064] max-w-sm mx-auto">
                {statusFilter !== 'all' || subjectQuery
                  ? 'No assignments match your current filters. Try resetting the filter.'
                  : 'Your workspace is clear. Create your first assignment to begin tracking coursework.'}
              </p>
              <div className="mt-5">
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white text-xs font-semibold transition-all shadow-paper active:scale-[0.98]"
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
                  1: 'bg-[#EDE5D8] text-[#777064] border-[#DED5C7]',
                  2: 'bg-[#EEF2EC] text-[#68745B] border-[#C5CDC0]',
                  3: 'bg-[#EEF3EE] text-[#4E6B50] border-[#C0D1C2]',
                  4: 'bg-[#FBF2E9] text-[#C87A3E] border-[#E7CCA8]',
                  5: 'bg-[#FBEBE8] text-[#B94A3E] border-[#E8BDB7]',
                };

                return (
                  <div
                    key={assignment.id}
                    className={`rounded-xl border p-5 transition-all duration-150 flex flex-col justify-between shadow-paper hover:shadow-paper-elevated ${
                      isCompleted
                        ? 'border-[#EAE2D5] bg-[#F7F3EB]/60 opacity-80'
                        : isOverdue
                        ? 'border-[#E8BDB7] bg-[#FDF8F5]'
                        : 'border-[#DED5C7] bg-[#FFFCF6] hover:border-[#C9BEAD]'
                    }`}
                  >
                    <div>
                      {/* Card Header: Subject, Status Toggle, Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#F9F3EC] text-[#B78A65] border border-[#DFCEBD] truncate">
                            {assignment.subject}
                          </span>
                          {isOverdue && !isCompleted && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FBEBE8] text-[#B94A3E] border border-[#E8BDB7] flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(assignment)}
                            className="p-1.5 rounded-md text-[#777064] hover:text-[#302C27] hover:bg-[#EDE5D8] transition-colors"
                            title="Edit assignment"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id, assignment.title)}
                            className="p-1.5 rounded-md text-[#777064] hover:text-[#B94A3E] hover:bg-[#FBEBE8] transition-colors"
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
                          className="mt-0.5 text-[#9A9285] hover:text-[#4E6B50] transition-colors shrink-0"
                          title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-[#4E6B50]" />
                          ) : (
                            <Circle className="h-4 w-4 text-[#C2BAAC] hover:text-[#68745B]" />
                          )}
                        </button>
                        <h3
                          className={`text-sm font-semibold text-[#302C27] leading-snug break-words ${
                            isCompleted ? 'line-through text-[#9A9285]' : ''
                          }`}
                        >
                          {assignment.title}
                        </h3>
                      </div>

                      {/* Description if present */}
                      {assignment.description && (
                        <p className="mt-2 text-xs text-[#777064] line-clamp-2 pl-6">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Metadata */}
                    <div className="mt-4 pt-3 border-t border-[#EAE2D5] flex items-center justify-between text-xs text-[#777064]">
                      <div className="flex items-center gap-1.5" title="Due Date">
                        <Calendar className="h-3.5 w-3.5 text-[#9A9285]" />
                        <span>{dueDateFormatted}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1" title="Remaining / Estimated minutes">
                          <Clock className="h-3.5 w-3.5 text-[#9A9285]" />
                          <span>
                            {assignment.remainingMinutes}m / {assignment.estimatedMinutes}m
                          </span>
                        </div>

                        {pri && !isCompleted && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-xs ${
                              pri.priorityScore >= 75
                                ? 'bg-[#FBEBE8] text-[#B94A3E] border-[#E8BDB7]'
                                : pri.priorityScore >= 50
                                ? 'bg-[#FBF2E9] text-[#C87A3E] border-[#E7CCA8]'
                                : 'bg-[#EEF2EC] text-[#68745B] border-[#C5CDC0]'
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
        </div>
      )}

      {/* Creation & Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#302C27]/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-6 shadow-paper-modal relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5]">
              <h3 className="text-base font-serif font-bold text-[#302C27]">
                {editingId ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#777064] hover:text-[#302C27] hover:bg-[#EDE5D8] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-[#E8BDB7] bg-[#FBEBE8] p-3 text-xs text-[#B94A3E]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#302C27] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Lab 3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#302C27] mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS450"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302C27] mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#302C27] mb-1">
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
                        remainingMinutes: !editingId ? val : formData.remainingMinutes,
                      });
                    }}
                    className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302C27] mb-1">
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
                    className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302C27] mb-1">
                    Importance (1-5)
                  </label>
                  <select
                    value={formData.importance}
                    onChange={(e) =>
                      setFormData({ ...formData, importance: parseInt(e.target.value, 10) })
                    }
                    className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
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
                <label className="block text-xs font-medium text-[#302C27] mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional assignment details, rubric requirements, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] px-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors resize-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#777064] hover:text-[#302C27] hover:bg-[#EDE5D8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white font-semibold text-xs transition-all shadow-paper active:scale-[0.98] disabled:opacity-60"
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
