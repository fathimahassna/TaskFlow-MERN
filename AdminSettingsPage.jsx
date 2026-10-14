import React, { useState, useEffect } from 'react';
import {
  Server,
  Mail,
  ShieldCheck,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { systemAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminSettingsPage = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await systemAPI.getStatus();
      if (res.data?.success) {
        setStatus(res.data);
      }
    } catch (err) {
      toast.error('Failed to query system status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Diagnostics & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Infrastructure telemetry, database health, and SMTP notification status
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Database Diagnostic Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">MongoDB Persistence</h3>
              <p className="text-xs text-slate-400">Database connection engine</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Connection State:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {status?.database?.state || 'connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Mode:</span>
              <span className="font-medium text-slate-900">
                {status?.database?.mode || 'In-Memory MongoDB'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Host Address:</span>
              <span className="font-mono text-[11px] text-slate-600">
                {status?.database?.host || '127.0.0.1'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dual support active: To connect to MongoDB Atlas, add your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">MONGODB_URI</code> to backend <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env</code>.
          </p>
        </div>

        {/* SMTP Notification Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              status?.smtp?.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nodemailer Dispatcher</h3>
              <p className="text-xs text-slate-400">Email notification pipeline</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">SMTP Configured:</span>
              <span className={`font-semibold ${status?.smtp?.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {status?.smtp?.configured ? 'Active' : 'Unset (Fallback Active)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Host:</span>
              <span className="font-medium text-slate-900">{status?.smtp?.host || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transport Status:</span>
              <span className="text-slate-700 font-medium">{status?.smtp?.message}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            When SMTP credentials are not set, all email dispatches are logged smoothly without interrupting task creation or status transitions.
          </p>
        </div>
      </div>

      {/* Assessment Specifications & Credentials */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">Default Assessment Credentials</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase font-semibold">
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Email Address</th>
                <th className="py-2 px-3">Password</th>
                <th className="py-2 px-3">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 font-semibold text-brand-700">Admin</td>
                <td className="py-2 px-3 font-mono">admin@taskflow.com</td>
                <td className="py-2 px-3 font-mono">Admin@123</td>
                <td className="py-2 px-3 text-slate-500">Executive Leadership</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-700">Employee</td>
                <td className="py-2 px-3 font-mono">alex.morgan@taskflow.com</td>
                <td className="py-2 px-3 font-mono">Employee@123</td>
                <td className="py-2 px-3 text-slate-500">Product Engineering</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-700">Employee</td>
                <td className="py-2 px-3 font-mono">sarah.connor@taskflow.com</td>
                <td className="py-2 px-3 font-mono">Employee@123</td>
                <td className="py-2 px-3 text-slate-500">Design & UX</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-700">Employee</td>
                <td className="py-2 px-3 font-mono">david.kim@taskflow.com</td>
                <td className="py-2 px-3 font-mono">Employee@123</td>
                <td className="py-2 px-3 text-slate-500">Quality Assurance</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};