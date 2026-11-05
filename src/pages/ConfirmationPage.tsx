import React, { useEffect, useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Mail, Search, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const state = location.state as {
    applicationId?: string;
    trackingToken?: string;
    internshipRole?: string;
    status?: string;
    submittedAt?: string;
    fullName?: string;
    email?: string;
  } | null;

  useEffect(() => {
    if (state?.applicationId) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if confetti fails
      }
    }
  }, [state?.applicationId]);

  if (!state?.applicationId) {
    return <Navigate to="/apply" replace />;
  }

  const {
    applicationId = 'CT-APP-DEMO',
    trackingToken = 'CT-TOKEN-DEMO',
    internshipRole = 'Frontend Developer',
    status = 'Pending',
    submittedAt = new Date().toISOString(),
    fullName = 'Applicant',
    email = '',
  } = state;

  const copyToClipboard = (text: string, isToken: boolean) => {
    navigator.clipboard.writeText(text);
    if (isToken) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const trackingUrl = `/track?id=${encodeURIComponent(applicationId)}&token=${encodeURIComponent(trackingToken)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
            Application Registered Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Thank You, {fullName}!</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-md mx-auto">
            Your application for the <strong>{internshipRole}</strong> internship at Company Tech has been securely persisted in Cloud Firestore.
          </p>
        </div>

        {/* Particulars Card */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Reference Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Application Reference ID */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Application Reference ID
              </span>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold font-mono text-slate-900">{applicationId}</span>
                <button
                  onClick={() => copyToClipboard(applicationId, false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                  title="Copy Application ID"
                >
                  {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Initial Evaluation State
              </span>
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-sm">
                <Clock size={16} className="text-amber-600 animate-pulse" />
                <span>{status} Review</span>
              </div>
            </div>
          </div>

          {/* Secure Tracking Token (Section 15) */}
          <div className="bg-blue-50/60 border border-blue-200/80 p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>Your Secure Tracking Token</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Per Company Tech security standards, application status cannot be checked by guessing an ID alone. Keep this token private to verify your status:
            </p>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-200 font-mono text-xs text-slate-800">
              <span className="truncate mr-2">{trackingToken}</span>
              <button
                onClick={() => copyToClipboard(trackingToken, true)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-sans font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                {copiedToken ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedToken ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Next Steps Explanation */}
          <div className="space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Mail size={16} className="text-slate-700" />
              What Happens Next?
            </h3>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              <li>
                <strong>Automated Confirmation Email:</strong> An acknowledgement message has been queued for delivery to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">{email}</code>.
              </li>
              <li>
                <strong>Review by Admissions Team:</strong> The HR Support and Admissions team at Company Tech will review your submission and qualifications.
              </li>
              <li>
                <strong>Decision & Offer Letter:</strong> If accepted, you will receive an official PDF offer letter signed by HR Support and Co-Founder via email and in your candidate tracking portal.
              </li>
            </ol>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
            >
              Return to Homepage
            </Link>

            <Link
              to={trackingUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Search size={14} />
              Open Secure Status Tracker
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
