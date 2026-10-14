import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Calendar, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const EmployeeProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI
      .getEmployeeStats()
      .then((res) => {
        if (res.data?.success) setStats(res.data.stats);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your authenticated identity, department membership, and workload summary
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white font-bold text-3xl flex items-center justify-center shadow-md">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="mt-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 capitalize">
                {user?.role || 'Employee'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {user?.department || 'Operations'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[11px] text-slate-400">Email Address</p>
              <p className="text-xs font-semibold text-slate-900">{user?.email}</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[11px] text-slate-400">Department</p>
              <p className="text-xs font-semibold text-slate-900">{user?.department}</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[11px] text-slate-400">Security Clearance</p>
              <p className="text-xs font-semibold text-slate-900">Standard Employee Access</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[11px] text-slate-400">Session Type</p>
              <p className="text-xs font-semibold text-slate-900">JWT Token Authenticated</p>
            </div>
          </div>
        </div>

        {/* Performance Metric Box */}
        {stats && (
          <div className="mt-6 p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-900">Workload Completion</p>
              <p className="text-[11px] text-brand-700 mt-0.5">
                {stats.completed} of {stats.totalAssigned} assigned tasks delivered
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-brand-700">
                {stats.completionRate}%
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};