import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Application, InternshipDuration } from '../types';

interface AcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onConfirm: (duration: InternshipDuration, joiningDate: string) => Promise<void>;
}

export const AcceptModal: React.FC<AcceptModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
}) => {
  const [duration, setDuration] = useState<InternshipDuration>('2 months');
  // Default to 14 days from today
  const defaultJoiningDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };
  const [joiningDate, setJoiningDate] = useState<string>(defaultJoiningDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!joiningDate) {
      setError('Please select a valid joining date.');
      return;
    }

    if (joiningDate < todayStr) {
      setError('Joining date cannot be set in the past.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(duration, joiningDate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize acceptance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Accept Candidate</h3>
              <p className="text-xs text-slate-500">Generate offer letter & trigger onboarding email</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Candidate Summary */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
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
              <span className="font-semibold text-blue-700">{application.internshipRole}</span>
            </div>
          </div>

          {/* Internship Duration (Section 11.2: 1 month, 2 months, 3 months) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-500" />
              Internship Duration *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1 month', '2 months', '3 months'] as InternshipDuration[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    duration === d
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 font-semibold ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Joining Date (Section 11.2: Valid date not in past) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-500" />
              Joining Date *
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400">Must not be in the past.</p>
          </div>

          {/* Action Explanations */}
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
            <p className="font-semibold">Automated actions upon confirmation:</p>
            <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
              <li>Application status will be atomically locked to <strong>Accepted</strong>.</li>
              <li>Official PDF offer letter with "HR Support and Co-Founder" signature will be generated.</li>
              <li>Candidate will receive the formal acceptance email with PDF attachment.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating & Dispatching...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Confirm Acceptance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
