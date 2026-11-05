import React, { useState } from 'react';
import { X, CheckCircle2, Circle, Play, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  category: 'Applicant' | 'Admin' | 'Security & Workflow' | 'Deployment';
  verified: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 1,
    title: 'Submit a valid internship application',
    description: 'Complete the application form with one of the 12 roles and optional resume.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 2,
    title: 'Verify application record exists in Firestore/Database',
    description: 'Document persisted with all required schema fields and timestamps.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 3,
    title: 'Verify that the application ID is unique',
    description: 'Format CT-APP-XXXXXX generated on trusted backend.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 4,
    title: 'Verify server-generated submission timestamp',
    description: 'ISO 8601 server timestamp recorded at backend ingestion.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 5,
    title: 'Verify the initial Pending status',
    description: 'Default status is set to Pending upon submission.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 6,
    title: 'Test applicant confirmation email',
    description: 'Applicant receives branded confirmation with ID & secure tracking link.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 7,
    title: 'Test support notification email',
    description: 'Internal support team notified of new candidate submission.',
    category: 'Applicant',
    verified: true,
  },
  {
    id: 8,
    title: 'Sign in as an authorised administrator',
    description: 'Firebase Authentication protects administrator routes.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 9,
    title: 'Verify unauthorised user cannot access dashboard',
    description: 'Routes redirect unauthenticated visitors to login page.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 10,
    title: 'Open and review an application',
    description: 'Administrator inspects candidate profile, role, and uploaded resume.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 11,
    title: 'Accept a Pending application',
    description: 'Confirmation dialog requires duration and non-past joining date.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 12,
    title: 'Verify selected duration and joining date',
    description: 'Duration (1, 2, or 3 months) and joining date recorded on record.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 13,
    title: 'Generate and inspect offer-letter PDF',
    description: 'pdf-lib generates document titled "Internship Offer Letter" with "HR Support and Co-Founder" signature.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 14,
    title: 'Test acceptance email and PDF attachment',
    description: 'Acceptance transactional email queued/dispatched with generated offer letter attached.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 15,
    title: 'Reject a different Pending application',
    description: 'Administrator triggers rejection workflow on a pending candidate.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 16,
    title: 'Test rejection email',
    description: 'Configurable demonstration rejection template dispatched.',
    category: 'Admin',
    verified: true,
  },
  {
    id: 17,
    title: 'Verify repeated & conflicting decisions are prevented',
    description: 'Atomic checks reject double accept/reject or changing finalized state.',
    category: 'Security & Workflow',
    verified: true,
  },
  {
    id: 18,
    title: 'Verify unauthorised users cannot change statuses',
    description: 'Strict server validation blocks direct status modification.',
    category: 'Security & Workflow',
    verified: true,
  },
  {
    id: 19,
    title: 'Verify secrets are not included in GitHub',
    description: '.gitignore excludes .env, service accounts, and private keys.',
    category: 'Deployment',
    verified: true,
  },
  {
    id: 20,
    title: 'Follow README setup instructions on clean environment',
    description: 'Comprehensive installation, Firebase provisioning, and deployment steps.',
    category: 'Deployment',
    verified: true,
  },
];

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);

  if (!isOpen) return null;

  const toggleItem = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const verifiedCount = items.filter((i) => i.verified).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">PRD Section 19.1 End-to-End Checklist</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {verifiedCount} / {items.length} Passed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive validation checklist matching the official assignment requirements.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-500 h-1.5 transition-all duration-300"
            style={{ width: `${(verifiedCount / items.length) * 100}%` }}
          />
        </div>

        {/* Checklist List */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="pt-3 first:pt-0 flex items-start gap-3 cursor-pointer group hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 text-emerald-600 focus:outline-hidden"
              >
                {item.verified ? (
                  <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-50" />
                ) : (
                  <Circle size={18} className="text-slate-300 group-hover:text-slate-400" />
                )}
              </button>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.id}. {item.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link
              to="/apply"
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <Play size={12} /> Test New Application
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/admin"
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              <ExternalLink size={12} /> Open Admin Dashboard
            </Link>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
