import React, { useState, useEffect } from 'react';
import { CheckCircle2, Award, Eye, Calendar } from 'lucide-react';
import { taskAPI } from '../../services/api';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { SkeletonTable } from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

export const EmployeeCompletedTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchCompleted = async () => {
      setIsLoading(true);
      try {
        const res = await taskAPI.getTasks({ status: 'Completed', limit: 50 });
        if (res.data?.success) {
          setTasks(res.data.tasks);
        }
      } catch (err) {
        toast.error('Failed to load completed tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  return (
    <div className="space-y-6">
      {/* Celebration Banner */}
      <div className="bg-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2 backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Achievement Showcase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Completed Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            You have successfully finalized {tasks.length} tasks. Every completed deliverable is archived here with its audit timestamps.
          </p>
        </div>
        <div className="hidden sm:flex w-24 h-24 rounded-full bg-white/10 items-center justify-center text-emerald-200">
          <CheckCircle2 className="w-12 h-12" />
        </div>
      </div>

      {/* Completed Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : tasks.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={CheckCircle2}
              title="No completed tasks yet"
              description="Tasks you mark as Completed in your task list will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Task Details</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Completed On</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-5 max-w-md">
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(task.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaskDetailsModal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
};