import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  PlusCircle,
  TrendingUp,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { dashboardAPI, taskAPI } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SkeletonStatCard } from '../../components/SkeletonLoader';
import { TaskModal } from '../../components/TaskModal';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import toast from 'react-hot-toast';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardAPI.getAdminStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to global task-created events
    const handleTaskCreated = () => fetchDashboardData();
    window.addEventListener('taskflow:task-created', handleTaskCreated);
    return () => window.removeEventListener('taskflow:task-created', handleTaskCreated);
  }, []);

  const handleCreateTask = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await taskAPI.createTask(formData);
      if (res.data?.success) {
        toast.success('Task successfully created!');
        if (res.data.emailStatus?.sent) {
          toast.success('Notification email sent to employee', { icon: '📧' });
        }
        setIsCreateOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-xl border border-slate-200 animate-pulse" />
          <div className="h-72 bg-white rounded-xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 rounded-2xl border border-rose-200 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-900">Failed to load live metrics</h3>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, charts, recentTasks } = data || { stats: {}, charts: {}, recentTasks: [] };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry and task orchestration across all company departments
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          colorClass="text-brand-600"
          bgClass="bg-brand-50"
          subtext="Active pipeline"
        />
        <StatCard
          title="Not Started"
          value={stats.notStarted}
          icon={Clock}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
          subtext="Pending kickoff"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={TrendingUp}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          subtext="Under execution"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          subtext="Finished tasks"
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon={Flame}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
          subtext="Urgent attention"
        />
        <StatCard
          title="Employees"
          value={stats.totalEmployees}
          icon={Users}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          subtext={`${stats.activeEmployees} active now`}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-400">Current workflow breakdown</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(charts.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} tasks`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Priority Distribution</h3>
              <p className="text-xs text-slate-400">Allocation across urgency tiers</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.priorityDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} tasks`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(charts.priorityDistribution || []).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Workloads Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Workloads */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Staff Workload Overview</h3>
            <p className="text-xs text-slate-400 mb-4">Task distribution per team member</p>
            <div className="space-y-3">
              {(charts.employeeWorkloads || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No assignments recorded</p>
              ) : (
                (charts.employeeWorkloads || []).map((emp, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-900">{emp.fullName}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {emp.completed}/{emp.total} completed
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${emp.total > 0 ? (emp.completed / emp.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Updated Tasks</h3>
              <p className="text-xs text-slate-400">Latest pipeline modifications</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks available</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                      {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-600 transition">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Assigned to {task.assignedTo?.name || 'Unassigned'} &bull;{' '}
                        {new Date(task.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isSubmitting}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
};