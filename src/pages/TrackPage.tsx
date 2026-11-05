import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShieldCheck, Download, AlertCircle, CheckCircle2, Clock, Calendar, ArrowLeft, Building2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { API } from '../services/api';
import { TrackingResult } from '../types';

export const TrackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get('id') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-verify if id and token are both in query params (e.g. from confirmation link or email)
  useEffect(() => {
    const queryId = searchParams.get('id');
    const queryToken = searchParams.get('token');
    if (queryId && queryToken) {
      setApplicationId(queryId);
      setToken(queryToken);
      performLookup(queryId, queryToken);
    }
  }, [searchParams]);

  const performLookup = async (idToLook: string, tokenToLook: string) => {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await API.trackApplication(idToLook.trim(), tokenToLook.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve application status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim() || !token.trim()) {
      setError('Please provide both your Application ID and Secret Tracking Token.');
      return;
    }
    performLookup(applicationId, token);
  };

  const timelineEntries = result
    ? [...(result.statusHistory?.length
        ? result.statusHistory
        : [{
            id: 'default-status',
            status: result.status,
            label: result.status,
            note: 'Most recent application status',
            changedAt: result.submissionDate,
          }])]
        .sort((a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt))
    : [];
  if (result && timelineEntries[timelineEntries.length - 1]?.status !== result.status) {
    timelineEntries.push({
      id: 'current-status',
      status: result.status,
      label: result.status,
      note: 'Current application stage',
      changedAt: result.decisionDate || timelineEntries[timelineEntries.length - 1]?.changedAt || result.submissionDate,
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto mb-2 shadow-xs">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Application Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify your current internship evaluation state securely using your Application Reference ID and Secret Tracking Token.
        </p>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Application Reference ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CT-APP-849201"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Secret Tracking Token *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 32-character token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Per security standards, guessing an Application ID alone will not disclose records.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Check Status
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Lookup Failed:</span> {error}
            </div>
          </div>
        )}
      </div>

      {/* Verified Status Dossier */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900 text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
                <Building2 size={13} />
                <span>Company Tech • Verified Status</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">{result.fullName}</h2>
              <div className="text-xs text-slate-300 mt-1">
                Target Role: <strong className="text-white">{result.internshipRole}</strong>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              <StatusBadge status={result.status} size="lg" />
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Application ID:</span>
                <span className="font-mono font-bold text-slate-800">{result.applicationId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submission Date:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(result.submissionDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current State:</span>
                <span className="font-semibold text-slate-800">{result.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Decision Date:</span>
                <span className="text-slate-800">
                  {result.decisionDate
                    ? new Date(result.decisionDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Under Review'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <Clock size={13} />
                Application Progress Timeline
              </div>
              <div className="space-y-3">
                {timelineEntries.map((entry, index) => (
                  <div key={entry.id || `${entry.status}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${index === timelineEntries.length - 1 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                      {index < timelineEntries.length - 1 && (
                        <div className="mt-1 h-full w-px bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-800">{entry.label || entry.status}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(entry.changedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {entry.note && <p className="mt-1 text-[11px] text-slate-600">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.interviews && result.interviews.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  <Calendar size={13} />
                  Interview Scheduling
                </div>
                <div className="space-y-3">
                  {result.interviews.map((interview) => (
                    <div key={interview.id} className="rounded-lg border border-blue-100 bg-white p-3 text-xs text-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800">{interview.interviewType}</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {interview.status}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div><span className="text-slate-400 block">Scheduled At</span><strong>{new Date(interview.scheduledAt).toLocaleString()}</strong></div>
                        <div><span className="text-slate-400 block">Mode</span><strong>{interview.mode}</strong></div>
                        <div><span className="text-slate-400 block">Duration</span><strong>{interview.durationMinutes} minutes</strong></div>
                        <div><span className="text-slate-400 block">Interviewer</span><strong>{interview.interviewerName || 'Hiring team'}</strong></div>
                      </div>
                      {interview.location && <p className="mt-2 text-[11px] text-slate-600">Location: {interview.location}</p>}
                      {interview.notes && <p className="mt-2 text-[11px] text-slate-600">Notes: {interview.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If Accepted: Show Duration, Joining Date, and Download Offer Letter Button */}
            {result.status === 'Accepted' && (
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Offer Extended — Welcome to Company Tech!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-950">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2.5">
                    <Clock size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">Internship Duration:</span>
                      <strong className="text-emerald-900">{result.internshipDuration}</strong>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2.5">
                    <Calendar size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">Joining Date:</span>
                      <strong className="text-emerald-900">{result.joiningDate}</strong>
                    </div>
                  </div>
                </div>

                {result.offerLetterAvailable && (
                  <div className="pt-2">
                    <a
                      href={result.offerLetterUrl || `/api/admin/applications/${result.applicationId}/offer-letter?token=${encodeURIComponent(token)}`}
                      download={`Company-Tech-Offer-Letter-${result.applicationId}.pdf`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                    >
                      <Download size={14} />
                      Download Official Offer Letter (PDF)
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* If Pending */}
            {result.status === 'Pending' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold">Application Under Evaluation</span>
                  <p className="text-amber-800 leading-relaxed">
                    Our admissions committee is currently evaluating candidates for the {result.internshipRole} cohort. You will receive an automated transactional notification when a decision has been finalized.
                  </p>
                </div>
              </div>
            )}

            {/* If Rejected */}
            {result.status === 'Rejected' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>
                  Thank you for applying for the <strong>{result.internshipRole}</strong> internship at Company Tech. After careful evaluation of all submissions, we are unable to advance your application for this cohort.
                </p>
                <p className="text-slate-500 text-[11px]">
                  We sincerely appreciate your interest in Company Tech and encourage you to explore future cohort openings.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
