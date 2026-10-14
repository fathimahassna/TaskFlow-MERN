import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Power,
  Eye,
  X,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { employeeAPI } from '../../services/api';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonTable } from '../../components/SkeletonLoader';
import { EmployeeModal } from '../../components/EmployeeModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import toast from 'react-hot-toast';

export const AdminEmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [inspectEmployee, setInspectEmployee] = useState(null);
  const [togglingEmployee, setTogglingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchEmployees = useCallback(
    async (pageNumber = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page: pageNumber,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter,
        };
        const res = await employeeAPI.getEmployees(params);
        if (res.data?.success) {
          setEmployees(res.data.employees);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch employees');
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter]
  );

  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  // Create Employee
  const handleCreateEmployee = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await employeeAPI.createEmployee(formData);
      if (res.data?.success) {
        toast.success('Employee account created successfully');
        setIsAddOpen(false);
        fetchEmployees(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Employee
  const handleUpdateEmployee = async (formData) => {
    if (!editingEmployee) return;
    setIsSubmitting(true);
    try {
      const res = await employeeAPI.updateEmployee(editingEmployee.id, formData);
      if (res.data?.success) {
        toast.success('Employee details updated');
        setEditingEmployee(null);
        fetchEmployees(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async () => {
    if (!togglingEmployee) return;
    setIsSubmitting(true);
    try {
      const res = await employeeAPI.toggleStatus(
        togglingEmployee.id,
        !togglingEmployee.isActive
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setTogglingEmployee(null);
        fetchEmployees(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View details
  const handleInspect = async (emp) => {
    try {
      const res = await employeeAPI.getEmployeeById(emp.id);
      if (res.data?.success) {
        setInspectEmployee(res.data);
      }
    } catch (err) {
      toast.error('Failed to load employee details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff & Employee Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee credentials, portal permissions, and workload assignments
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
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

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : employees.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No employees found"
              description="No employee accounts match the query or filter parameters."
              actionText="Add Employee"
              onAction={() => setIsAddOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Tasks Assigned</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Name & Email */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight group-hover:text-brand-600 transition">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {emp.department}
                    </td>

                    {/* Assigned Tasks */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {emp.totalTasks} tasks
                      </span>
                    </td>

                    {/* Completed */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {emp.completedTasks} done
                      </span>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setTogglingEmployee(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                          emp.isActive
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleInspect(emp)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="View task details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTogglingEmployee(emp)}
                          className={`p-1.5 rounded-lg transition ${
                            emp.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(page) => fetchEmployees(page)}
        />
      </div>

      {/* Add Employee Modal */}
      <EmployeeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreateEmployee}
        isLoading={isSubmitting}
      />

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        onSubmit={handleUpdateEmployee}
        employee={editingEmployee}
        isLoading={isSubmitting}
      />

      {/* Toggle Account Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(togglingEmployee)}
        onClose={() => setTogglingEmployee(null)}
        onConfirm={handleToggleStatus}
        title={togglingEmployee?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={
          togglingEmployee?.isActive
            ? `Deactivating ${togglingEmployee?.name} will prevent them from signing in to the TaskFlow employee portal.`
            : `Activating ${togglingEmployee?.name} will restore their login access.`
        }
        confirmText={togglingEmployee?.isActive ? 'Deactivate' : 'Activate'}
        isDanger={togglingEmployee?.isActive}
        isLoading={isSubmitting}
      />

      {/* Inspect Employee Details Modal */}
      {inspectEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {inspectEmployee.employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {inspectEmployee.employee.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectEmployee.employee.email} &bull; {inspectEmployee.employee.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 py-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <p className="text-lg font-bold text-slate-900">{inspectEmployee.stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-blue-500">In Progress</span>
                <p className="text-lg font-bold text-blue-700">{inspectEmployee.stats.inProgress}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-500">Completed</span>
                <p className="text-lg font-bold text-emerald-700">{inspectEmployee.stats.completed}</p>
              </div>
            </div>

            {/* Assigned Tasks List */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Assigned Tasks ({inspectEmployee.tasks.length})
            </h4>
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {inspectEmployee.tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No tasks assigned yet</p>
              ) : (
                inspectEmployee.tasks.map((t) => (
                  <div
                    key={t._id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="overflow-hidden mr-2">
                      <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">
                        Priority: {t.priority}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectEmployee(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};