import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { TaskModal } from '../components/TaskModal';
import { taskAPI } from '../services/api';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const handleCreateTask = async (data) => {
    setIsSubmittingTask(true);
    try {
      const res = await taskAPI.createTask(data);
      if (res.data?.success) {
        toast.success('Task created and assigned successfully!');
        if (res.data.emailStatus?.sent) {
          toast.success('Notification email sent to employee', { icon: '📧' });
        } else if (res.data.emailStatus?.message) {
          toast(res.data.emailStatus.message, { icon: 'ℹ️' });
        }
        setIsCreateTaskOpen(false);
        // Dispatch custom event to tell pages to reload tasks
        window.dispatchEvent(new Event('taskflow:task-created'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '13px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
          },
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
      />

      {/* Main App Body */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Create Task Modal */}
      <TaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isSubmittingTask}
      />
    </div>
  );
};