export type ExperienceLevel = 'Fresher' | 'Experienced';

export type InternshipDuration = '1 month' | '2 months' | '3 months';

export type ApplicationStatus =
  | 'Pending'
  | 'Screening'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Accepted'
  | 'Rejected';

export type EmailType =
  | 'applicant_confirmation'
  | 'support_notification'
  | 'status_update'
  | 'interview_invite'
  | 'acceptance_offer'
  | 'rejection_notice';

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed';

export type OfferLetterStatus = 'pending' | 'processing' | 'generated' | 'failed';

export interface StatusHistoryEvent {
  id: string;
  status: ApplicationStatus;
  label: string;
  note?: string | null;
  changedAt: string;
  changedBy?: string | null;
}

export interface InterviewRecord {
  id: string;
  interviewType: 'Phone Screen' | 'Technical Interview' | 'HR Interview' | 'Panel Interview';
  scheduledAt: string;
  durationMinutes: number;
  mode: 'Online' | 'On-site' | 'Hybrid';
  location?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export const INTERNSHIP_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Intern',
  'Social Media Manager',
  'Content Writer',
  'Business Development Intern',
  'Community Manager',
  'HR Intern',
] as const;

export type InternshipRole = (typeof INTERNSHIP_ROLES)[number];

export const PURSUING_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate / Postgraduate',
] as const;

export type PursuingYear = (typeof PURSUING_YEARS)[number];

export interface EmailJob {
  jobId: string;
  applicationId: string;
  emailType: EmailType;
  recipient: string;
  status: EmailStatus;
  attemptCount: number;
  providerMessageId?: string;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export interface Application {
  applicationId: string;
  fullName: string;
  email: string;
  college: string;
  pursuingYear: PursuingYear;
  experienceLevel: ExperienceLevel;
  internshipRole: InternshipRole;
  resumePath?: string | null;
  resumeName?: string | null;
  resumeBase64?: string | null; // For local/embedded preview
  submittedAt: string;
  status: ApplicationStatus;
  statusHistory?: StatusHistoryEvent[];
  interviews?: InterviewRecord[];
  decisionAt?: string | null;
  decisionBy?: string | null;
  internshipDuration?: InternshipDuration | null;
  joiningDate?: string | null;
  offerLetterPath?: string | null;
  offerLetterGenerationStatus?: OfferLetterStatus;
  offerLetterGeneratedAt?: string | null;
  trackingToken?: string; // Only returned on initial creation or secure retrieval
  trackingTokenHash?: string;
  schemaVersion?: number;
  emailJobs?: EmailJob[];
}

export interface DashboardStats {
  total: number;
  pending: number;
  screening: number;
  interviewScheduled: number;
  interviewCompleted: number;
  accepted: number;
  rejected: number;
}

export interface TrackingResult {
  applicationId: string;
  internshipRole: InternshipRole;
  fullName: string;
  submissionDate: string;
  status: ApplicationStatus;
  statusHistory?: StatusHistoryEvent[];
  interviews?: InterviewRecord[];
  decisionDate?: string | null;
  joiningDate?: string | null;
  internshipDuration?: InternshipDuration | null;
  offerLetterAvailable: boolean;
  offerLetterUrl?: string;
}

export interface UserApplicationHistoryEntry {
  applicationId: string;
  internshipRole: InternshipRole;
  status: ApplicationStatus;
  submittedAt: string;
  trackingToken: string | null;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin' | 'superadmin';
}
