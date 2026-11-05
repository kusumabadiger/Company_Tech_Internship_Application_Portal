import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Mail,
  Send,
  User,
  GraduationCap,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import { Application, InternshipDuration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AcceptModal } from '../components/AcceptModal';
import { RejectModal } from '../components/RejectModal';
import { EmailJobTimeline } from '../components/EmailJobTimeline';

export const AdminDetailView: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { firebaseUser, isAdmin, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [offerEmailSending, setOfferEmailSending] = useState(false);
  const [resumePreviewError, setResumePreviewError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewType: 'Phone Screen',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    durationMinutes: '30',
    mode: 'Online',
    location: '',
    interviewerName: '',
    notes: '',
  });
  const [interviewLoading, setInterviewLoading] = useState(false);

  const fetchApplication = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await API.getAdminApplicationDetail(applicationId);
      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!firebaseUser) {
      setError('Your admin session is no longer active. Please sign in again.');
      return;
    }

    if (!firebaseUser.emailVerified) {
      setError('Your admin email must be verified before opening application details.');
      return;
    }

    if (!isAdmin) {
      setError('This account is not authorized to access the admin application details.');
      return;
    }

    if (applicationId) {
      fetchApplication();
    }
  }, [authLoading, firebaseUser, isAdmin, applicationId]);

  const handleAcceptConfirm = async (duration: InternshipDuration, joiningDate: string) => {
    if (!applicationId) return;
    setActionFeedback(null);
    const res = await API.acceptApplication(applicationId, { duration, joiningDate });
    setActionFeedback(res.message);
    setApplication(res.application);
  };

  const handleRejectConfirm = async () => {
    if (!applicationId) return;
    setActionFeedback(null);
    const res = await API.rejectApplication(applicationId);
    setActionFeedback(res.message);
    setApplication(res.application);
  };

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!applicationId) return;
    setStatusUpdateLoading(true);
    setActionFeedback(null);
    try {
      const res = await API.updateApplicationStatus(applicationId, { status: nextStatus, note: statusNote || undefined });
      setActionFeedback(res.message);
      setApplication(res.application);
      setStatusNote('');
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Failed to update the application stage.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;
    setInterviewLoading(true);
    setActionFeedback(null);
    try {
      const res = await API.scheduleInterview(applicationId, {
        interviewType: interviewForm.interviewType as 'Phone Screen' | 'Technical Interview' | 'HR Interview' | 'Panel Interview',
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        durationMinutes: Number(interviewForm.durationMinutes) || 30,
        mode: interviewForm.mode as 'Online' | 'On-site' | 'Hybrid',
        location: interviewForm.location || null,
        interviewerName: interviewForm.interviewerName || null,
        notes: interviewForm.notes || null,
      });
      setActionFeedback(res.message);
      setApplication(res.application);
      setInterviewForm({
        interviewType: 'Phone Screen',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        durationMinutes: '30',
        mode: 'Online',
        location: '',
        interviewerName: '',
        notes: '',
      });
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Failed to schedule the interview.');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    if (!applicationId) return;
    setPdfDownloadError(null);
    setPdfDownloading(true);

    try {
      await API.downloadAdminOfferLetter(applicationId);
    } catch (err) {
      setPdfDownloadError(err instanceof Error ? err.message : 'Failed to download the offer letter PDF.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleSendOfferLetter = async () => {
    if (!applicationId) return;
    setActionFeedback(null);
    setOfferEmailSending(true);
    try {
      const result = await API.sendOfferLetter(applicationId);
      setActionFeedback(result.message);
      setApplication(result.application);
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Failed to send the offer letter email.');
    } finally {
      setOfferEmailSending(false);
    }
  };

  const handleInspectResume = async () => {
    if (!applicationId) return;
    setResumePreviewError(null);

    // Open synchronously from the click so browsers do not treat it as a popup.
    // Do not pass `noopener` to window.open here: browsers then return null even
    // when they opened the tab, which makes the workflow report a false block.
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setResumePreviewError('Pop-up blocking is enabled. Please allow pop-ups for this site and click Inspect Resume again.');
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.title = 'Loading resume…';

    try {
      const blob = await API.getAdminResumeBlob(applicationId);
      if (!blob.type.toLowerCase().includes('application/pdf')) {
        const fileName = application?.resumeName || 'Applicant_Resume';
        const isWordDocument = /\.(docx?|rtf)$/i.test(fileName) || /wordprocessingml|msword|application\/rtf/i.test(blob.type);
        if (isWordDocument) {
          previewWindow.close();
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          return;
        }
        throw new Error('The server did not return a supported resume document. Please check the uploaded file and try again.');
      }

      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.replace(objectUrl);
      previewWindow.focus();
      // Keep the blob URL alive for as long as this page is open so the PDF
      // viewer can load it even on slower machines or large resumes.
      window.addEventListener('pagehide', () => URL.revokeObjectURL(objectUrl), { once: true });
    } catch (err) {
      previewWindow.close();
      setResumePreviewError(
        err instanceof Error
          ? err.message
          : 'Failed to open the resume. Please verify that an uploaded PDF is available and you are authorized to inspect it.'
      );
    }
  };

  if (!authLoading && (!firebaseUser || !isAdmin)) {
    return <Navigate to="/admin/login" replace state={{ message: 'Please sign in with an authorized Company Tech admin account.' }} />;
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading candidate profile...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle size={32} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Application Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested application could not be retrieved.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isPending = application.status === 'Pending';
  const latestRejectionEmail = [...(application.emailJobs || [])]
    .filter((job) => job.emailType === 'rejection_notice')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const rejectionEmailStatus = latestRejectionEmail?.status === 'failed'
    ? `Rejection email failed: ${latestRejectionEmail.errorMessage || 'Email provider failed.'} Use Retry in the dispatch logs after fixing the email provider.`
    : latestRejectionEmail?.status === 'sent' || latestRejectionEmail?.status === 'delivered'
      ? 'The email provider accepted the rejection notice for delivery.'
      : 'Rejection email delivery has not been confirmed.';
  const actionFeedbackFailed = /failed|not sent|not emailed|error/i.test(actionFeedback || '');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Applications List
        </Link>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${actionFeedbackFailed ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          <div className="flex items-center gap-2">
            {actionFeedbackFailed
              ? <AlertCircle size={16} className="text-rose-600" />
              : <CheckCircle2 size={16} className="text-emerald-600" />}
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className={`text-xs font-semibold ${actionFeedbackFailed ? 'text-rose-700 hover:text-rose-900' : 'text-emerald-700 hover:text-emerald-900'}`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-blue-400 font-bold border border-slate-700">
                {application.applicationId}
              </span>
              <span className="text-xs text-slate-400">
                Submitted on {new Date(application.submittedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{application.fullName}</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Applying for: <strong className="text-white">{application.internshipRole}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <StatusBadge status={application.status} size="lg" />

            {/* Decision Controls (Enabled only if status is Pending) */}
            {isPending ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAcceptModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Accept Candidate
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Decision Finalized
              </div>
            )}
          </div>
        </div>

        {/* Candidate Detail Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Identity & Contact */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <User size={14} /> Candidate Identity
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-800">{application.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <span className="font-mono text-slate-800">{application.email}</span>
                </div>
              </div>
            </div>

            {/* Academic Particulars */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <GraduationCap size={14} /> Academic Background
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Institution</span>
                  <span className="font-semibold text-slate-800">{application.college}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Year of Study</span>
                  <span className="text-slate-800 font-medium">{application.pursuingYear}</span>
                </div>
              </div>
            </div>

            {/* Professional Background */}
            <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-500">
                <Briefcase size={14} /> Experience & Role
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Experience Level</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    {application.experienceLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Role</span>
                  <span className="font-semibold text-slate-800">{application.internshipRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Inspection Section (PRD Section 10.7) */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Uploaded Resume / CV
            </h3>
            {application.resumeBase64 || application.resumePath ? (
              <>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {application.resumeName || 'Applicant_Resume.pdf'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Private document stored securely. Click to inspect or download.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleInspectResume}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                  >
                    <Download size={13} />
                    Inspect Resume
                  </button>
                </div>
                {resumePreviewError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                    {resumePreviewError}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                Candidate did not submit an optional resume with this application.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Application Progress Timeline</h3>
              <span className="text-[10px] text-slate-500">Current stage: {application.status}</span>
            </div>
            <div className="space-y-3">
              {(application.statusHistory && application.statusHistory.length > 0 ? application.statusHistory : [{
                id: 'default-status',
                status: application.status,
                label: application.status,
                note: 'Current application status',
                changedAt: application.submittedAt,
              }]).map((entry, index) => (
                <div key={entry.id || `${entry.status}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    {index < ((application.statusHistory && application.statusHistory.length > 0 ? application.statusHistory : [{ status: application.status }]).length - 1) && (
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

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Controls</h3>
              <StatusBadge status={application.status} size="sm" />
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Status note</label>
                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional update note for this applicant"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleStatusUpdate('Screening')} disabled={statusUpdateLoading} className="px-3 py-2 text-[11px] font-semibold text-white bg-violet-600 rounded-lg disabled:opacity-60">Mark Screening</button>
                <button type="button" onClick={() => handleStatusUpdate('Interview Scheduled')} disabled={statusUpdateLoading} className="px-3 py-2 text-[11px] font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-60">Advance to Interview</button>
                <button type="button" onClick={() => handleStatusUpdate('Interview Completed')} disabled={statusUpdateLoading} className="px-3 py-2 text-[11px] font-semibold text-white bg-sky-600 rounded-lg disabled:opacity-60">Mark Interviewed</button>
              </div>
            </div>
          </div>

          <form onSubmit={handleScheduleInterview} className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">Interview Scheduling</h3>
              <span className="text-[10px] text-blue-700">Admin scheduling</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Interview Type</label>
                <select value={interviewForm.interviewType} onChange={(e) => setInterviewForm((prev) => ({ ...prev, interviewType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                  <option>Phone Screen</option>
                  <option>Technical Interview</option>
                  <option>HR Interview</option>
                  <option>Panel Interview</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Schedule Date & Time</label>
                <input type="datetime-local" value={interviewForm.scheduledAt} onChange={(e) => setInterviewForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Mode</label>
                <select value={interviewForm.mode} onChange={(e) => setInterviewForm((prev) => ({ ...prev, mode: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                  <option>Online</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Duration (minutes)</label>
                <input type="number" min={15} step={15} value={interviewForm.durationMinutes} onChange={(e) => setInterviewForm((prev) => ({ ...prev, durationMinutes: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Interviewer Name</label>
                <input value={interviewForm.interviewerName} onChange={(e) => setInterviewForm((prev) => ({ ...prev, interviewerName: e.target.value }))} placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Location / Link</label>
                <input value={interviewForm.location} onChange={(e) => setInterviewForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Zoom, Google Meet, or office" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Interview Notes</label>
              <textarea value={interviewForm.notes} onChange={(e) => setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Candidate guidance, evaluation criteria, or logistics" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={interviewLoading} className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-60">
                {interviewLoading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </form>

          {application.interviews && application.interviews.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scheduled Interviews</h3>
              <div className="space-y-3">
                {application.interviews.map((interview) => (
                  <div key={interview.id} className="rounded-lg border border-slate-200 p-3 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">{interview.interviewType}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{interview.status}</span>
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

          {/* Decision Record Box (If Accepted or Rejected) */}
          {application.status === 'Accepted' && (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Accepted Internship Offer Details</span>
                </div>
                <span className="text-[11px] text-emerald-700">
                  Decided: {application.decisionAt ? new Date(application.decisionAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <strong className="text-slate-800 text-sm">{application.internshipDuration}</strong>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Joining Date</span>
                  <strong className="text-slate-800 text-sm">{application.joiningDate}</strong>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block">Offer Letter Status</span>
                  <strong className="text-emerald-700 text-sm capitalize">
                    {application.offerLetterGenerationStatus || 'Generated'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-emerald-800">
                  Real PDF offer letter created with "HR Support and Co-Founder" signature.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendOfferLetter}
                    disabled={offerEmailSending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send size={13} />
                    {offerEmailSending ? 'Sending Offer...' : 'Send Offer Letter'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOfferLetter}
                    disabled={pdfDownloading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Download size={13} />
                    {pdfDownloading ? 'Preparing PDF...' : 'Download Offer Letter (PDF)'}
                  </button>
                </div>
              </div>
              {pdfDownloadError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  {pdfDownloadError}
                </div>
              )}
            </div>
          )}

          {application.status === 'Rejected' && (
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <XCircle size={16} className="text-rose-600" />
                <span>Application Rejected</span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Rejection recorded at{' '}
                {application.decisionAt ? new Date(application.decisionAt).toLocaleString() : 'N/A'}. {rejectionEmailStatus}
              </p>
            </div>
          )}

          {/* Email Processing Records Timeline (PRD Section 8.3 & 14.4) */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail size={14} className="text-slate-500" />
                Transactional Email Dispatch Logs
              </h3>
              <button
                onClick={fetchApplication}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw size={11} /> Refresh Logs
              </button>
            </div>
            <EmailJobTimeline
              jobs={application.emailJobs || []}
              applicationId={application.applicationId}
              onJobUpdated={fetchApplication}
            />
          </div>
        </div>
      </div>

      {/* Acceptance Modal */}
      <AcceptModal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        application={application}
        onConfirm={handleAcceptConfirm}
      />

      {/* Rejection Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        application={application}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};
