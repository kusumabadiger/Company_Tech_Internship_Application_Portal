import React from 'react';
import { Clock, CheckCircle2, XCircle, Search, ClipboardCheck, CalendarClock } from 'lucide-react';
import { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  switch (status) {
    case 'Pending':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}
        >
          <Clock size={iconSizes} className="text-amber-600 animate-pulse" />
          Pending Review
        </span>
      );
    case 'Screening':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-violet-50 text-violet-800 border border-violet-200/80 ${sizeClasses}`}
        >
          <Search size={iconSizes} className="text-violet-600" />
          Screening
        </span>
      );
    case 'Interview Scheduled':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-200/80 ${sizeClasses}`}
        >
          <CalendarClock size={iconSizes} className="text-blue-600" />
          Interview Scheduled
        </span>
      );
    case 'Interview Completed':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-sky-50 text-sky-800 border border-sky-200/80 ${sizeClasses}`}
        >
          <ClipboardCheck size={iconSizes} className="text-sky-600" />
          Interview Completed
        </span>
      );
    case 'Accepted':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSizes} className="text-emerald-600" />
          Accepted
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 ${sizeClasses}`}
        >
          <XCircle size={iconSizes} className="text-rose-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
