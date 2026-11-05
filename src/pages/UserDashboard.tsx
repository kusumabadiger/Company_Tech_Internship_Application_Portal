import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Clock3, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import { UserApplicationHistoryEntry } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const UserDashboard: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [applications, setApplications] = useState<UserApplicationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApplications(await API.getMyApplications());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your application history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_45%)] px-6 py-8 sm:px-9 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Candidate portal</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back</h1>
            <p className="mt-3 text-sm text-slate-300">{firebaseUser?.email || 'Your internship applications in one place.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/internships" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400">
                Explore internships <ArrowRight size={15} />
              </Link>
              <Link to="/track" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                Track an application
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Your history</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Internship applications</h2>
            </div>
            {!loading && !error && (
              <span className="text-sm text-slate-500">{applications.length} {applications.length === 1 ? 'application' : 'applications'}</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
              <RefreshCw size={16} className="animate-spin" /> Loading your application history…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              <p>{error}</p>
              <button type="button" onClick={() => void loadApplications()} className="mt-3 font-semibold underline underline-offset-2">Try again</button>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <BriefcaseBusiness size={28} className="mx-auto text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">No applications yet</h3>
              <p className="mt-1 text-sm text-slate-500">Your submitted internship applications will appear here.</p>
              <Link to="/internships" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                Browse opportunities <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <article key={application.applicationId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">{application.internshipRole}</h3>
                        <p className="mt-1 font-mono text-xs text-slate-500">{application.applicationId}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={12} /> Applied {new Date(application.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <StatusBadge status={application.status} size="sm" />
                      {application.trackingToken ? (
                        <Link
                          to={`/track?id=${encodeURIComponent(application.applicationId)}&token=${encodeURIComponent(application.trackingToken)}`}
                          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          View progress <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Tracking details unavailable</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
