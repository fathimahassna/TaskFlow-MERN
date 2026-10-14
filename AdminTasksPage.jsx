import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { taskAPI, employeeAPI } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { TaskModal } from '../../components/TaskModal';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';

export const AdminTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load employee dropdown options
  useEffect(() => {
    employeeAPI
      .getDropdown()
      .then((res) => {
        if (res.data?.success) {
          setEmployees(res.data.employees);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchTasks = useCallback(
    async (pageNumber = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page: pageNumber,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
          assignedTo: assignedFilter,
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
    [debouncedSearch, statusFilter, priorityFilter, assignedFilter]
  );

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedFilter('all');
  };

  // Create Task
  const handleCreateTask = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await taskAPI.createTask(data);
      if (res.data?.success) {
        toast.success('Task created successfully');
        if (res.data.emailStatus?.sent) {
          toast.success('Assignment email sent to employee', { icon: '📧' });
        }
        setIsCreateOpen(false);
        fetchTasks(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Task
  const handleUpdateTask = async (data) => {
    if (!editingTask) return;
    setIsSubmitting(true);
    try {
      const res = await taskAPI.updateTask(editingTask._id, data);
      if (res.data?.success) {
        toast.success('Task updated successfully');
        setEditingTask(null);
        fetchTasks(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setIsSubmitting(true);
    try {
      const res = await taskAPI.deleteTask(deletingTaskId);
      if (res.data?.success) {
        toast.success('Task removed');
        setDeletingTaskId(null);
        fetchTasks(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Task Orchestration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company task deliverables, assign responsibilities, and monitor completion
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, details, employee..."
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

          {/* Assignee Filter */}
          <div>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(search || statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Filters applied</span>
            <button
              onClick={handleResetFilters}
              className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Task Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : tasks.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No tasks match criteria"
              description="Try modifying search keywords or removing active filter parameters."
              actionText="Create New Task"
              onAction={() => setIsCreateOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Task Details</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
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
                      {/* Title & Preview */}
                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      </td>

                      {/* Assigned Employee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-[11px]">
                            {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 leading-tight">
                              {task.assignedTo?.name || 'Unassigned'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {task.assignedTo?.department || 'Staff'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={task.status} />
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

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingTask(task)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTaskId(task._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(page) => fetchTasks(page)}
        />
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isSubmitting}
      />

      <TaskModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        task={editingTask}
        isLoading={isSubmitting}
      />

      <TaskDetailsModal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTaskId)}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be reverted and will delete associated alert history."
        confirmText="Delete Task"
        isLoading={isSubmitting}
        isDanger={true}
      />
    </div>
  );
};