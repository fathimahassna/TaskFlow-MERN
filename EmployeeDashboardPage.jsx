import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { dashboardAPI, taskAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SkeletonStatCard } from '../../components/SkeletonLoader';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import toast from 'react-hot-toast';

export const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardAPI.getEmployeeStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load employee metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await taskAPI.updateTaskStatus(taskId, newStatus);
      if (res.data?.success) {
        toast.success(`Task moved to "${newStatus}"`);
        if (res.data.emailStatus?.sent) {
          toast.success('Admin alerted via email', { icon: '📧' });
        }
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const { stats, upcomingDeadlines = [], recentTasks = [] } = data || {
    stats: {},
    upcomingDeadlines: [],
    recentTasks: [],
  };

  return (
    <div className="space-y-8">
      {/* Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{user?.department || 'Staff Member'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Colleague'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
            You currently have <span className="font-bold underline">{stats.pendingInProgress || 0} active tasks</span> awaiting execution. Maintain momentum and mark completed deliverables to notify management.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => navigate('/employee/tasks')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-700 text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition"
            >
              <span>View All My Tasks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient background blur shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <StatCard
          title="Assigned Tasks"
          value={stats.totalAssigned || 0}
          icon={CheckSquare}
          colorClass="text-brand-600"
          bgClass="bg-brand-50"
          subtext="Total workload"
        />
        <StatCard
          title="Not Started"
          value={stats.notStarted || 0}
          icon={Clock}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
          subtext="In queue"
        />
        <StatCard
          title="In Progress"
          value={stats.pendingInProgress || 0}
          icon={TrendingUp}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          subtext="Underway"
        />
        <StatCard
          title="Completed"
          value={stats.completed || 0}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          subtext="Successfully done"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue || 0}
          icon={AlertTriangle}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
          subtext="Past deadline"
        />
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Overall Completion Velocity
          </span>
          <span className="text-sm font-bold text-slate-900">
            {stats.completionRate || 0}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className="bg-gradient-to-r from-brand-600 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${stats.completionRate || 0}%` }}
          />
        </div>
      </div>

      {/* Grid: Upcoming Deadlines & Recent Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
              <p className="text-xs text-slate-400">Scheduled delivery milestones</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming deadlines</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due:{' '}
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <select
                      value={task.status}
                      disabled={updatingTaskId === task._id}
                      onChange={(e) => handleQuickStatusChange(task._id, e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Assigned</h3>
              <p className="text-xs text-slate-400">Latest responsibilities</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks assigned yet</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-600 transition">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
};