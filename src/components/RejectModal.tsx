import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { Application } from '../types';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onConfirm: () => Promise<void>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize rejection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Reject Application</h3>
              <p className="text-xs text-slate-500">Atomic status transition to Rejected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Candidate:</span>
              <span className="font-semibold text-slate-900">{application.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Application Reference:</span>
              <span className="font-mono text-slate-800">{application.applicationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="font-semibold text-slate-800">{application.internshipRole}</span>
            </div>
          </div>

          {/* Template preview as mandated by PRD Section 13.4 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Configured Demonstration Rejection Template Preview:
            </label>
            <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200 text-[11px] text-slate-700 font-mono space-y-2 leading-relaxed">
              <div className="text-slate-500 font-sans font-semibold">
                Subject: Update on Your Internship Application — Company Tech
              </div>
              <p>Dear {application.fullName},</p>
              <p>
                Thank you for applying for the {application.internshipRole} internship at Company Tech.
              </p>
              <p>
                We appreciate the time and effort you invested in your application. After reviewing your application, we regret to inform you that we are unable to proceed with your application at this time.
              </p>
              <p>
                Thank you for your interest in Company Tech. We wish you the best in your academic and professional journey.
              </p>
              <p className="pt-1">
                Regards,<br />
                <strong>HR Support and Co-Founder</strong><br />
                Company Tech
              </p>
            </div>
            <p className="text-[10px] text-slate-400">
              * Note: Centralized demonstration rejection template. Once committed, status is locked.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Decision...
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
