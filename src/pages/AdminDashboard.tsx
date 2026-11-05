import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileText,
  Mail,
  RefreshCw,
  ArrowUpDown,
  ExternalLink,
  Send,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import { Application, DashboardStats, INTERNSHIP_ROLES } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading, user, firebaseUser, refreshVerificationStatus, resendVerificationEmail } =
    useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    screening: 0,
    interviewScheduled: 0,
    interviewCompleted: 0,
    accepted: 0,
    rejected: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Test Email state
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.getAdminApplications({
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
      });
      setStats(data.stats);
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;
    setTestSending(true);
    setTestFeedback(null);
    try {
      await API.sendTestEmail(testRecipient);
      setTestFeedback(`Test verification email dispatched to ${testRecipient}.`);
    } catch (err) {
      setTestFeedback(err instanceof Error ? err.message : 'Failed to dispatch test email.');
    } finally {
      setTestSending(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    setVerificationStatus(null);
    try {
      const sent = await resendVerificationEmail();
      setVerificationStatus(
        sent
          ? 'Verification email sent. Please check your inbox and then refresh your verification status.'
          : 'Unable to send a verification email right now.'
      );
    } catch (err) {
      setVerificationStatus(err instanceof Error ? err.message : 'Failed to send verification email.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    setVerificationLoading(true);
    setVerificationStatus(null);
    try {
      const verified = await refreshVerificationStatus();
      setVerificationStatus(
        verified
          ? 'Your email is now verified. You can continue with admin actions.'
          : 'Your email is still not verified. Please check your inbox and try again.'
      );
    } catch (err) {
      setVerificationStatus(err instanceof Error ? err.message : 'Unable to refresh verification status.');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const needsVerification = !!firebaseUser && !firebaseUser.emailVerified;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Building2 size={14} />
            <span>Company Tech • Administration Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Internship Applications Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.email}</strong> ({user?.role})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTestEmailOpen(!testEmailOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Send size={13} className="text-blue-600" />
            Transactional Provider Test
          </button>
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {needsVerification && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">Email verification required</p>
              <p className="text-sm text-amber-800">
                Please verify the Firebase email for {firebaseUser?.email || 'your account'} before the backend admin routes will accept your session.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verificationLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  <Send size={12} />
                  {verificationLoading ? 'Processing...' : 'Resend verification email'}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshVerification}
                  disabled={verificationLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw size={12} className={verificationLoading ? 'animate-spin' : ''} />
                  Refresh verification status
                </button>
              </div>
            </div>
          </div>
          {verificationStatus && (
            <p className="ml-7 text-xs text-amber-800 font-medium">{verificationStatus}</p>
          )}
        </div>
      )}

      {/* Test Email Drawer if toggled */}
      {testEmailOpen && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900 flex items-center gap-1.5">
              <Mail size={14} className="text-blue-600" />
              Verify Transactional Email Provider (Resend / SMTP)
            </span>
            <button
              onClick={() => setTestEmailOpen(false)}
              className="text-blue-700 hover:text-blue-900"
            >
              Close
            </button>
          </div>
          <p className="text-blue-800 text-[11px]">
            Send an instant test email to verify your configured transactional email API key and sender identity:
          </p>
          <form onSubmit={handleSendTestEmail} className="flex gap-2 max-w-md">
            <input
              type="email"
              required
              placeholder="e.g. your-email@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs w-full focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={testSending}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 disabled:opacity-50"
            >
              {testSending ? 'Sending...' : 'Send Test'}
            </button>
          </form>
          {testFeedback && (
            <p className="text-[11px] font-medium text-blue-900 pt-1">{testFeedback}</p>
          )}
        </div>
      )}

      {/* Dashboard Statistics Cards (PRD Section 10.1: calculated from records) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Users size={15} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</div>
          <span className="text-[11px] text-slate-400">All registered candidate records</span>
        </div>

        {/* Pending */}
        <div className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-800">{stats.pending}</div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting decision</span>
        </div>

        {/* Accepted */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Accepted</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{stats.accepted}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Offer letters issued</span>
        </div>

        {/* Rejected */}
        <div className="bg-white p-5 rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle size={15} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-800">{stats.rejected}</div>
          <span className="text-[11px] text-rose-600 font-medium">Rejection notices sent</span>
        </div>
      </div>

      {/* Filter and Search Bar (PRD Section 10.3 & 10.4) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'pending', label: 'Pending' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 grow max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, candidate, email, college..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Role Filter Dropdown */}
          <label htmlFor="application-role-filter" className="flex items-center gap-2 self-start md:self-auto">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Filter by role</span>
            <select
              id="application-role-filter"
              aria-label="Filter applications by internship role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden font-medium text-slate-700"
            >
              <option value="all">All 12 Roles</option>
              {INTERNSHIP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Applications Table (PRD Section 10.2) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Querying Firestore records...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText size={32} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No Applications Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No application records match your current filter or search criteria.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setRoleFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">College / Year</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app.applicationId} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {app.applicationId}
                    </td>

                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.fullName}</div>
                      <div className="text-[11px] text-slate-400">{app.email}</div>
                    </td>

                    {/* College & Year */}
                    <td className="py-3.5 px-4">
                      <div className="truncate max-w-xs">{app.college}</div>
                      <div className="text-[11px] text-slate-400">
                        {app.pursuingYear} • <span className="font-medium text-slate-600">{app.experienceLevel}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {app.internshipRole}
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(app.submittedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/applications/${app.applicationId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Review
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {applications.length} application records</span>
          <span className="text-[11px] text-slate-400">Company Tech Real-time Synchronization</span>
        </div>
      </div>
    </div>
  );
};
