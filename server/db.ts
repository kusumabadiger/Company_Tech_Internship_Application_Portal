import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ApplicationRecord, EmailJobRecord, ApplicationStatus } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

// Initialize Cloud Firestore connection
let firestoreDb: any = null;
try {
  const envConfig = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID,
  };

  const config = Object.values(envConfig).some((value) => !!value)
    ? envConfig
    : JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  firestoreDb = getFirestore(app, config.firestoreDatabaseId);
  console.log('[Company Tech DB] Connected to Cloud Firestore database:', config.firestoreDatabaseId);
} catch (e) {
  console.warn('[Company Tech DB] Cloud Firestore initialization deferred:', e);
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synchronized with disk and Firestore
let applicationsCache: Map<string, ApplicationRecord> = new Map();

/**
 * Hash a high-entropy tracking token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generate a unique application ID in format CT-APP-XXXXXX
 */
export function generateApplicationId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CT-APP-${rand}`;
}

/**
 * Generate a secure tracking token (32 hex characters)
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Initial seed data to demonstrate all statuses and roles realistically
 */
function getInitialSeedData(): ApplicationRecord[] {
  const baseTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const token1 = 'ct_track_demo_01_a9f4e2b1c8d7';
  const token2 = 'ct_track_demo_02_e4b1c8d7a9f4';
  const token3 = 'ct_track_demo_03_c8d7a9f4e4b1';

  return [
    {
      applicationId: 'CT-APP-849201',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@example.edu',
      college: 'National Institute of Technology, Surathkal',
      pursuingYear: '3rd Year',
      experienceLevel: 'Fresher',
      internshipRole: 'Frontend Developer',
      submittedAt: baseTime,
      status: 'Screening',
      statusHistory: [
        {
          id: 'evt_seed_01',
          status: 'Pending',
          label: 'Application Submitted',
          note: 'Application created and confirmation email sent.',
          changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'system',
        },
        {
          id: 'evt_seed_02',
          status: 'Screening',
          label: 'Under Screening',
          note: 'Admissions team is reviewing the profile and resume.',
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
      ],
      interviews: [
        {
          id: 'int_seed_01',
          interviewType: 'Phone Screen',
          scheduledAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 30,
          mode: 'Online',
          location: 'Google Meet',
          interviewerName: 'Priya Nair',
          notes: 'Brief intro to responsibilities and project background.',
          status: 'Scheduled',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      trackingToken: token1,
      trackingTokenHash: hashToken(token1),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_01',
          applicationId: 'CT-APP-849201',
          emailType: 'applicant_confirmation',
          recipient: 'aarav.sharma@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_01',
          createdAt: baseTime,
        },
        {
          jobId: 'job_seed_02',
          applicationId: 'CT-APP-849201',
          emailType: 'support_notification',
          recipient: 'hr-support@companytech.internal',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_02',
          createdAt: baseTime,
        },
      ],
    },
    {
      applicationId: 'CT-APP-731940',
      fullName: 'Priya Venkatesh',
      email: 'priya.venkatesh@example.edu',
      college: 'Birla Institute of Technology and Science, Pilani',
      pursuingYear: '4th Year',
      experienceLevel: 'Experienced',
      internshipRole: 'Backend Developer',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Accepted',
      statusHistory: [
        {
          id: 'evt_seed_03',
          status: 'Pending',
          label: 'Application Submitted',
          note: 'Submitted for internship evaluation.',
          changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'system',
        },
        {
          id: 'evt_seed_04',
          status: 'Screening',
          label: 'Profile Reviewed',
          note: 'Resume and experience profile reviewed by the hiring team.',
          changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
        {
          id: 'evt_seed_05',
          status: 'Interview Scheduled',
          label: 'Interview Booking',
          note: 'Booked an interview with the engineering panel.',
          changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
        {
          id: 'evt_seed_06',
          status: 'Interview Completed',
          label: 'Interview Completed',
          note: 'Technical interview completed and feedback was positive.',
          changedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
        {
          id: 'evt_seed_07',
          status: 'Accepted',
          label: 'Offer Extended',
          note: 'Candidate accepted into the backend development internship.',
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
      ],
      interviews: [
        {
          id: 'int_seed_02',
          interviewType: 'Technical Interview',
          scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 45,
          mode: 'Online',
          location: 'Zoom',
          interviewerName: 'Aman Singh',
          notes: 'System design and API debug assessment.',
          status: 'Completed',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      decisionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      decisionBy: 'admin_usr_root',
      internshipDuration: '2 months',
      joiningDate: '2026-11-15',
      offerLetterPath: 'offer-letters/CT-APP-731940/offer-letter.pdf',
      offerLetterGenerationStatus: 'generated',
      offerLetterGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      trackingToken: token2,
      trackingTokenHash: hashToken(token2),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_03',
          applicationId: 'CT-APP-731940',
          emailType: 'applicant_confirmation',
          recipient: 'priya.venkatesh@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_03',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          jobId: 'job_seed_04',
          applicationId: 'CT-APP-731940',
          emailType: 'acceptance_offer',
          recipient: 'priya.venkatesh@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_04',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      applicationId: 'CT-APP-620485',
      fullName: 'Rohan Mehta',
      email: 'rohan.mehta@example.edu',
      college: 'Delhi Technological University',
      pursuingYear: '2nd Year',
      experienceLevel: 'Fresher',
      internshipRole: 'AI/ML Engineer',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Rejected',
      statusHistory: [
        {
          id: 'evt_seed_08',
          status: 'Pending',
          label: 'Application Submitted',
          note: 'Application created and ticketed in the review queue.',
          changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'system',
        },
        {
          id: 'evt_seed_09',
          status: 'Screening',
          label: 'Initial Review',
          note: 'Profile screened for role fit and academic alignment.',
          changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
        {
          id: 'evt_seed_10',
          status: 'Rejected',
          label: 'Application Closed',
          note: 'Application was not selected for the current cycle.',
          changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          changedBy: 'admin_usr_root',
        },
      ],
      decisionAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      decisionBy: 'admin_usr_root',
      trackingToken: token3,
      trackingTokenHash: hashToken(token3),
      schemaVersion: 1,
      emailJobs: [
        {
          jobId: 'job_seed_05',
          applicationId: 'CT-APP-620485',
          emailType: 'applicant_confirmation',
          recipient: 'rohan.mehta@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_05',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          jobId: 'job_seed_06',
          applicationId: 'CT-APP-620485',
          emailType: 'rejection_notice',
          recipient: 'rohan.mehta@example.edu',
          status: 'delivered',
          attemptCount: 1,
          providerMessageId: 'msg_ct_seed_06',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];
}

/**
 * Load store from disk or seed
 */
function loadStore(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data: ApplicationRecord[] = JSON.parse(raw);
      applicationsCache.clear();
      for (const item of data) {
        applicationsCache.set(item.applicationId, item);
      }
      return;
    }
  } catch (err) {
    console.warn('Failed reading persistent store file, initializing seed:', err);
  }

  // Seed default data
  const seeds = getInitialSeedData();
  applicationsCache.clear();
  for (const s of seeds) {
    applicationsCache.set(s.applicationId, s);
  }
  saveStore();
}

/**
 * Save store to disk
 */
function saveStore(): void {
  try {
    const list = Array.from(applicationsCache.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing data to disk:', err);
  }
}

// Initial load
loadStore();

export const DB = {
  getAll(): ApplicationRecord[] {
    return Array.from(applicationsCache.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  getById(id: string): ApplicationRecord | null {
    return applicationsCache.get(id) || null;
  },

  getByToken(applicationId: string, token: string): ApplicationRecord | null {
    const app = applicationsCache.get(applicationId);
    if (!app) return null;

    const hashedInput = hashToken(token);
    if (app.trackingTokenHash && app.trackingTokenHash === hashedInput) {
      return app;
    }
    // Also support exact match if raw token matches
    if (app.trackingToken && app.trackingToken === token.trim()) {
      return app;
    }
    return null;
  },

  save(app: ApplicationRecord): void {
    if (!app.statusHistory || app.statusHistory.length === 0) {
      app.statusHistory = [
        {
          id: `evt_${app.applicationId}_${Date.now()}`,
          status: app.status,
          label: app.status === 'Pending' ? 'Application Submitted' : app.status,
          note: app.status === 'Pending' ? 'Application was successfully registered in the hiring pipeline.' : undefined,
          changedAt: app.submittedAt,
          changedBy: 'system',
        },
      ];
    }
    if (!app.interviews) {
      app.interviews = [];
    }

    applicationsCache.set(app.applicationId, app);
    saveStore();

    // Persist application document directly to Cloud Firestore
    if (firestoreDb) {
      const firestoreDoc = {
        applicationId: app.applicationId,
        fullName: app.fullName,
        email: app.email,
        college: app.college,
        pursuingYear: app.pursuingYear,
        experienceLevel: app.experienceLevel,
        internshipRole: app.internshipRole,
        status: app.status,
        submittedAt: app.submittedAt,
        statusHistory: app.statusHistory,
        interviews: app.interviews,
        resumeName: app.resumeName || null,
        resumePath: app.resumePath || null,
        schemaVersion: app.schemaVersion || 1,
        trackingTokenHash: app.trackingTokenHash || null,
      };

      setDoc(doc(firestoreDb, 'applications', app.applicationId), firestoreDoc)
        .then(() => {
          console.log(`[Cloud Firestore] Persisted application: ${app.applicationId}`);
        })
        .catch((err: any) => {
          console.warn(`[Cloud Firestore] Notice on save: ${err.message}`);
        });
    }
  },

  /**
   * Concurrency-safe decision reservation
   */
  makeDecision(
    applicationId: string,
    targetStatus: 'Accepted' | 'Rejected',
    adminUid: string,
    extra?: {
      internshipDuration?: '1 month' | '2 months' | '3 months';
      joiningDate?: string;
      offerLetterBase64?: string;
    }
  ): { success: boolean; error?: string; app?: ApplicationRecord } {
    const current = applicationsCache.get(applicationId);
    if (!current) {
      return { success: false, error: 'Application record not found' };
    }

    if (current.status !== 'Pending' && current.status !== 'Screening' && current.status !== 'Interview Scheduled' && current.status !== 'Interview Completed') {
      return {
        success: false,
        error: `Conflicting decision: Application is already marked as ${current.status}. Status cannot be overridden.`,
      };
    }

    current.status = targetStatus;
    current.decisionAt = new Date().toISOString();
    current.decisionBy = adminUid;
    if (!current.statusHistory) current.statusHistory = [];
    current.statusHistory.push({
      id: `evt_${applicationId}_${Date.now()}`,
      status: targetStatus,
      label: targetStatus === 'Accepted' ? 'Offer Extended' : 'Application Closed',
      note: targetStatus === 'Accepted' ? 'Candidate was accepted and an offer was generated.' : 'Candidate was rejected for the current cycle.',
      changedAt: current.decisionAt,
      changedBy: adminUid,
    });

    if (targetStatus === 'Accepted' && extra) {
      current.internshipDuration = extra.internshipDuration || '1 month';
      current.joiningDate = extra.joiningDate || '';
      current.offerLetterGenerationStatus = 'generated';
      current.offerLetterGeneratedAt = new Date().toISOString();
      current.offerLetterPath = `offer-letters/${applicationId}/offer-letter.pdf`;
      if (extra.offerLetterBase64) {
        current.offerLetterBase64 = extra.offerLetterBase64;
      }
    }

    applicationsCache.set(applicationId, current);
    saveStore();

    // Sync updated status and decision to Cloud Firestore
    if (firestoreDb) {
      const decisionDoc: Record<string, any> = {
        status: targetStatus,
        decisionAt: current.decisionAt,
        decisionBy: current.decisionBy,
        statusHistory: current.statusHistory,
      };
      if (targetStatus === 'Accepted' && extra) {
        decisionDoc.internshipDuration = current.internshipDuration;
        decisionDoc.joiningDate = current.joiningDate;
        decisionDoc.offerLetterGenerationStatus = current.offerLetterGenerationStatus;
        decisionDoc.offerLetterGeneratedAt = current.offerLetterGeneratedAt;
        decisionDoc.offerLetterPath = current.offerLetterPath;
      }
      setDoc(doc(firestoreDb, 'applications', applicationId), decisionDoc, { merge: true })
        .then(() => {
          console.log(`[Cloud Firestore] Synced decision for ${applicationId} (${targetStatus})`);
        })
        .catch((err: any) => {
          console.warn(`[Cloud Firestore] Notice on decision sync: ${err.message}`);
        });
    }

    return { success: true, app: current };
  },

  updateStatus(
    applicationId: string,
    nextStatus: ApplicationStatus,
    changedBy: string,
    note?: string | null
  ): { success: boolean; error?: string; app?: ApplicationRecord } {
    const current = applicationsCache.get(applicationId);
    if (!current) {
      return { success: false, error: 'Application record not found' };
    }

    current.status = nextStatus;
    if (!current.statusHistory) current.statusHistory = [];
    const timestamp = new Date().toISOString();
    current.statusHistory.push({
      id: `evt_${applicationId}_${timestamp}`,
      status: nextStatus,
      label: nextStatus,
      note: note || undefined,
      changedAt: timestamp,
      changedBy,
    });

    if (nextStatus === 'Accepted' || nextStatus === 'Rejected') {
      current.decisionAt = timestamp;
      current.decisionBy = changedBy;
    }

    applicationsCache.set(applicationId, current);
    saveStore();

    return { success: true, app: current };
  },

  scheduleInterview(
    applicationId: string,
    interview: {
      interviewType: 'Phone Screen' | 'Technical Interview' | 'HR Interview' | 'Panel Interview';
      scheduledAt: string;
      durationMinutes: number;
      mode: 'Online' | 'On-site' | 'Hybrid';
      location?: string | null;
      interviewerName?: string | null;
      notes?: string | null;
    },
    changedBy: string
  ): { success: boolean; error?: string; app?: ApplicationRecord } {
    const current = applicationsCache.get(applicationId);
    if (!current) {
      return { success: false, error: 'Application record not found' };
    }

    const record = {
      id: `int_${applicationId}_${Date.now()}`,
      ...interview,
      status: 'Scheduled' as const,
      createdAt: new Date().toISOString(),
    };

    current.interviews = current.interviews || [];
    current.interviews.push(record);
    current.status = 'Interview Scheduled';
    current.statusHistory = current.statusHistory || [];
    current.statusHistory.push({
      id: `evt_${applicationId}_${Date.now()}`,
      status: 'Interview Scheduled',
      label: 'Interview Scheduled',
      note: `Interview scheduled for ${new Date(interview.scheduledAt).toLocaleString()} with ${interview.interviewerName || 'the hiring team'}.`,
      changedAt: new Date().toISOString(),
      changedBy,
    });

    applicationsCache.set(applicationId, current);
    saveStore();
    return { success: true, app: current };
  },

  addEmailJob(job: EmailJobRecord): void {
    const app = applicationsCache.get(job.applicationId);
    if (!app) return;
    if (!app.emailJobs) {
      app.emailJobs = [];
    }
    // Check if job exists
    const idx = app.emailJobs.findIndex((j) => j.jobId === job.jobId);
    if (idx >= 0) {
      app.emailJobs[idx] = job;
    } else {
      app.emailJobs.push(job);
    }
    saveStore();

    // Persist email processing record to Cloud Firestore
    if (firestoreDb) {
      setDoc(
        doc(firestoreDb, 'emailJobs', job.jobId),
        {
          jobId: job.jobId,
          applicationId: job.applicationId,
          emailType: job.emailType,
          recipient: job.recipient,
          status: job.status,
          attemptCount: job.attemptCount,
          providerMessageId: job.providerMessageId || null,
          createdAt: job.createdAt,
          lastAttemptAt: job.lastAttemptAt || null,
          errorMessage: job.errorMessage || null,
        },
        { merge: true }
      ).catch((err: any) => {
        console.warn(`[Cloud Firestore] Email job sync notice: ${err.message}`);
      });
    }
  },

  getStats(): { total: number; pending: number; screening: number; interviewScheduled: number; interviewCompleted: number; accepted: number; rejected: number } {
    let pending = 0;
    let screening = 0;
    let interviewScheduled = 0;
    let interviewCompleted = 0;
    let accepted = 0;
    let rejected = 0;

    for (const app of applicationsCache.values()) {
      if (app.status === 'Pending') pending++;
      else if (app.status === 'Screening') screening++;
      else if (app.status === 'Interview Scheduled') interviewScheduled++;
      else if (app.status === 'Interview Completed') interviewCompleted++;
      else if (app.status === 'Accepted') accepted++;
      else if (app.status === 'Rejected') rejected++;
    }

    return {
      total: applicationsCache.size,
      pending,
      screening,
      interviewScheduled,
      interviewCompleted,
      accepted,
      rejected,
    };
  },
};
