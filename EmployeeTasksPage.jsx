import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { taskAPI } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import toast from 'react-hot-toast';

export const EmployeeTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals / Status updates
  const [viewingTask, setViewingTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchMyTasks = useCallback(
    async (pageNumber = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page: pageNumber,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
        };
        const res = await taskAPI.getTasks(params);
        if (res.data?.success) {
          setTasks(res.data.tasks);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter, priorityFilter]
  );

  useEffect(() => {
    fetchMyTasks(1);
  }, [fetchMyTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await taskAPI.updateTaskStatus(taskId, newStatus);
      if (res.data?.success) {
        toast.success(`Task status updated to "${newStatus}"`);
        if (res.data.emailStatus?.sent) {
          toast.success('Admin was notified via email', { icon: '📧' });
        }
        // Update local state without full reload
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Assigned Tasks
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track deliverables assigned specifically to your account and keep managers informed
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in your tasks..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Filtered view</span>
            <button
              onClick={handleResetFilters}
              className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Task Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : tasks.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No tasks found"
              description="You have no tasks matching the specified criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Task</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Update Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'Completed';

                  return (
                    <tr
                      key={task._id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Task Title & Description */}
                      <td className="py-3.5 px-5 max-w-sm">
                        <p className="font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>

                      {/* Status Update Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            disabled={updatingTaskId === task._id}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition disabled:opacity-50"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.dueDate ? (
                          <div
                            className={`flex items-center gap-1.5 ${
                              isOverdue ? 'text-rose-600 font-medium' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-rose-50 border border-rose-200 rounded">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingTask(task)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="View task details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          pagination={pagination}
          onPageChange={(page) => fetchMyTasks(page)}
        />
      </div>

      <TaskDetailsModal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
      />
    </div>
  );
};