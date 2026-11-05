import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Clock, Send, Eye } from 'lucide-react';
import { EmailJob, EmailStatus } from '../types';
import { API } from '../services/api';
import { EmailPreviewModal } from './EmailPreviewModal';

interface EmailJobTimelineProps {
  jobs: EmailJob[];
  applicationId?: string;
  onJobUpdated?: () => void;
}

export const EmailJobTimeline: React.FC<EmailJobTimelineProps> = ({
  jobs,
  applicationId,
  onJobUpdated,
}) => {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<{ applicationId: string; emailType: string } | null>(
    null
  );

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    setFeedback(null);
    try {
      const res = await API.retryEmailJob(jobId);
      setFeedback(res.message);
      if (onJobUpdated) onJobUpdated();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const statusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Delivered
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <Send size={12} className="text-blue-600" />
            Sent to Provider
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertCircle size={12} className="text-rose-600" />
            Failed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            <RefreshCw size={12} className="text-indigo-600 animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Clock size={12} className="text-amber-600" />
            Pending Queue
          </span>
        );
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'applicant_confirmation':
        return 'Applicant Submission Confirmation';
      case 'support_notification':
        return 'Support Team New Application Alert';
      case 'acceptance_offer':
        return 'Internship Offer Letter & Acceptance Notice';
      case 'rejection_notice':
        return 'Application Status Update (Rejection)';
      case 'interview_invite':
        return 'Scheduled Interview Invitation';
      default:
        return type;
    }
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        No transactional email records logged yet for this candidate.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="p-2.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
          {feedback}
        </div>
      )}

      <div className="space-y-2.5">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                  <Mail size={13} />
                </div>
                <div>
                  <span className="font-semibold text-slate-900">{getTypeName(job.emailType)}</span>
                  <div className="text-[11px] text-slate-500">To: {job.recipient}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {statusBadge(job.status)}

                <button
                  onClick={() =>
                    setPreviewJob({
                      applicationId: applicationId || job.applicationId,
                      emailType: job.emailType,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                  title="Inspect rendered email template"
                >
                  <Eye size={11} />
                  Preview
                </button>

                {job.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(job.jobId)}
                    disabled={retryingId === job.jobId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={retryingId === job.jobId ? 'animate-spin' : ''} />
                    Retry
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Job ID:</span>
                <span className="font-mono text-slate-700 truncate block">{job.jobId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Attempts:</span>
                <span className="font-semibold text-slate-700">{job.attemptCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Provider Ref:</span>
                <span className="font-mono text-slate-700 truncate block">
                  {job.providerMessageId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp:</span>
                <span className="text-slate-700 truncate block">
                  {new Date(job.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {job.errorMessage && (
              <div className="mt-2 p-2 bg-rose-50 text-rose-700 rounded border border-rose-100 text-[11px]">
                <strong>Error:</strong> {job.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>

      {previewJob && (
        <EmailPreviewModal
          isOpen={!!previewJob}
          onClose={() => setPreviewJob(null)}
          applicationId={previewJob.applicationId}
          emailType={previewJob.emailType}
        />
      )}
    </div>
  );
};
